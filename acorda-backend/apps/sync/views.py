"""
Views for sync app - offline sync support.
"""
import time
import datetime as _dt

from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from .serializers import (
    ENTITY_SERIALIZERS,
    ENTITY_MODELS,
    SyncPullSerializer,
)

def parse_since_param(value):
    if value is None or value == "":
        return 0

    try:
        return int(value)
    except (TypeError, ValueError):
        pass

    try:
        return int(float(value))
    except (TypeError, ValueError):
        pass

    dt = parse_datetime(str(value))
    if not dt:
        return 0

    if timezone.is_naive(dt):
        dt = timezone.make_aware(dt, _dt.timezone.utc)

    return int(dt.timestamp() * 1000)


class SyncPushView(APIView):
    """
    Push local changes to server.
    Uses last-write-wins strategy for conflict resolution.
    """
    
    permission_classes = [IsAuthenticated]
    
    @transaction.atomic
    def post(self, request):
        """
        Receive changes from client and apply them.
        
        Request body:
        {
            "changes": {
                "tasks": [...],
                "habits": [...],
                ...
            }
        }
        """
        changes = request.data.get('changes', {})
        results = {}
        current_time = int(time.time() * 1000)
        
        for entity_type, items in changes.items():
            if entity_type not in ENTITY_MODELS:
                continue
            
            model = ENTITY_MODELS[entity_type]
            serializer_class = ENTITY_SERIALIZERS[entity_type]
            
            created = 0
            updated = 0
            deleted = 0
            errors = []
            
            for item_data in items:
                try:
                    item_id = item_data.get('id')
                    item_updated_at = item_data.get('updated_at', 0)
                    item_deleted_at = item_data.get('deleted_at')

                    # Ensure timestamps exist to avoid serializer errors
                    if not item_data.get('created_at'):
                        item_data['created_at'] = item_updated_at or current_time
                    if not item_data.get('updated_at'):
                        item_data['updated_at'] = item_deleted_at or item_data['created_at']
                        item_updated_at = item_data['updated_at']
                    
                    # Try to find existing item
                    try:
                        existing = model.objects.get(id=item_id, user=request.user)
                        
                        # Last-write-wins: only update if client version is newer
                        if existing.updated_at < item_updated_at:
                            if item_deleted_at:
                                # Soft delete
                                existing.deleted_at = item_deleted_at
                                existing.updated_at = item_updated_at
                                existing.sync_version = current_time
                                existing.save()
                                deleted += 1
                            else:
                                # Update
                                serializer = serializer_class(existing, data=item_data, partial=True)
                                if serializer.is_valid():
                                    obj = serializer.save()
                                    obj.sync_version = current_time
                                    obj.save(update_fields=['sync_version'])
                                    updated += 1
                                else:
                                    errors.append({'id': item_id, 'errors': serializer.errors})
                        # else: server version is newer, ignore client change
                        
                    except model.DoesNotExist:
                        # Create new item
                        if not item_deleted_at:  # Don't create deleted items
                            item_data['user'] = request.user.id
                            serializer = serializer_class(data=item_data)
                            if serializer.is_valid():
                                obj = serializer.save(user=request.user, sync_version=current_time)
                                created += 1
                            else:
                                errors.append({'id': item_id, 'errors': serializer.errors})
                                
                except Exception as e:
                    errors.append({'id': item_data.get('id'), 'error': str(e)})
            
            results[entity_type] = {
                'created': created,
                'updated': updated,
                'deleted': deleted,
                'errors': errors,
            }
        
        # Determine overall success – False if any entity had errors
        has_errors = any(
            len(r.get('errors', [])) > 0 for r in results.values()
        )

        return Response({
            'success': not has_errors,
            'sync_version': current_time,
            'results': results,
        })


class SyncPullView(APIView):
    """
    Pull server changes to client.
    Returns all items updated since the given timestamp.
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """
        Get changes since timestamp.
        
        Query params:
        - since: timestamp (default: 0 = get all)
        - entities: comma-separated list of entity types (default: all)
        """
        since = parse_since_param(request.query_params.get('since', 0))
        entities_param = request.query_params.get('entities', '')
        
        if entities_param:
            entity_types = [e.strip() for e in entities_param.split(',')]
            entity_types = [e for e in entity_types if e in ENTITY_MODELS]
        else:
            entity_types = list(ENTITY_MODELS.keys())
        
        current_time = int(time.time() * 1000)
        changes = {}
        
        for entity_type in entity_types:
            model = ENTITY_MODELS[entity_type]
            serializer_class = ENTITY_SERIALIZERS[entity_type]
            
            # Get items updated since timestamp (including soft-deleted)
            queryset = model.objects.filter(
                user=request.user,
                sync_version__gt=since
            )
            
            serializer = serializer_class(queryset, many=True)
            changes[entity_type] = serializer.data
        
        return Response({
            'success': True,
            'sync_version': current_time,
            'since': since,
            'changes': changes,
        })


class SyncFullView(APIView):
    """
    Full sync - get all user data.
    Used for initial load or full refresh.
    """
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get all user data."""
        current_time = int(time.time() * 1000)
        data = {}
        
        for entity_type, model in ENTITY_MODELS.items():
            serializer_class = ENTITY_SERIALIZERS[entity_type]
            
            # Get all non-deleted items
            queryset = model.objects.filter(
                user=request.user,
                deleted_at__isnull=True
            )
            
            serializer = serializer_class(queryset, many=True)
            data[entity_type] = serializer.data
        
        return Response({
            'success': True,
            'sync_version': current_time,
            'data': data,
        })


class SyncStatusView(APIView):
    """Get sync status and server time."""
    
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        current_time = int(time.time() * 1000)
        
        # Get counts per entity type
        counts = {}
        for entity_type, model in ENTITY_MODELS.items():
            counts[entity_type] = model.objects.filter(
                user=request.user,
                deleted_at__isnull=True
            ).count()
        
        return Response({
            'success': True,
            'server_time': current_time,
            'counts': counts,
        })
