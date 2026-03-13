"""
REST views for Google Calendar integration.

Three endpoints:
  POST connect/    – exchange auth code → tokens, activate connection
  POST sync/       – fetch events from Google, upsert into DB
  POST disconnect/  – revoke tokens, deactivate connection, soft-delete events
"""
import time
import logging

from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.models import GoogleCalendarConnection, GoogleCalendarEvent

from .services import (
    GoogleCalendarError,
    exchange_code_for_tokens,
    fetch_and_sync_events,
    revoke_token,
)

logger = logging.getLogger(__name__)


def _now_ms() -> int:
    return int(time.time() * 1000)


def _get_connection(user) -> GoogleCalendarConnection:
    """Get or create the unique GoogleCalendarConnection for a user."""
    conn, _ = GoogleCalendarConnection.objects.get_or_create(
        user=user,
        deleted_at__isnull=True,
        defaults={
            'connected': False,
            'connected_at': 0,
            'disconnected_at': 0,
            'last_sync_at': 0,
            'access_token': '',
            'refresh_token': '',
            'expires_at': 0,
            'created_at': _now_ms(),
            'updated_at': _now_ms(),
        },
    )
    return conn


class GoogleCalendarConnectView(APIView):
    """Exchange auth code for tokens and mark connection as active."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        code = request.data.get('code', '').strip()
        origin = request.data.get('origin', '').strip()

        if not code:
            return Response(
                {'detail': 'O campo "code" é obrigatório.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not origin:
            return Response(
                {'detail': 'O campo "origin" é obrigatório.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            tokens = exchange_code_for_tokens(code, origin)
        except GoogleCalendarError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        conn = _get_connection(request.user)
        now = _now_ms()

        conn.access_token = tokens['access_token']
        if tokens.get('refresh_token'):
            conn.refresh_token = tokens['refresh_token']
        conn.expires_at = now + tokens['expires_in'] * 1000
        conn.connected = True
        conn.connected_at = now
        conn.disconnected_at = 0
        conn.updated_at = now
        conn.sync_version = now
        conn.save(update_fields=[
            'access_token', 'refresh_token', 'expires_at',
            'connected', 'connected_at', 'disconnected_at', 'updated_at',
            'sync_version',
        ])

        return Response({
            'connection_id': str(conn.id),
            'connected': True,
            'connected_at': conn.connected_at,
        }, status=status.HTTP_200_OK)


class GoogleCalendarSyncView(APIView):
    """Fetch events from Google Calendar and upsert into DB."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        conn = _get_connection(request.user)

        if not conn.connected:
            return Response(
                {'detail': 'Google Calendar não está conectado.'},
                status=status.HTTP_409_CONFLICT,
            )

        try:
            result = fetch_and_sync_events(conn)
        except GoogleCalendarError as exc:
            return Response({'detail': str(exc)}, status=status.HTTP_502_BAD_GATEWAY)

        return Response({
            'imported_count': result['imported_count'],
            'deleted_count': result['deleted_count'],
            'last_sync_at': conn.last_sync_at,
        }, status=status.HTTP_200_OK)


class GoogleCalendarDisconnectView(APIView):
    """Revoke tokens, clear credentials, soft-delete events."""

    permission_classes = [IsAuthenticated]

    def post(self, request):
        conn = _get_connection(request.user)

        if not conn.connected:
            return Response(
                {'detail': 'Google Calendar já está desconectado.'},
                status=status.HTTP_409_CONFLICT,
            )

        # Best-effort revocation
        revoke_token(conn)

        now = _now_ms()
        conn.access_token = ''
        conn.refresh_token = ''
        conn.expires_at = 0
        conn.connected = False
        conn.disconnected_at = now
        conn.updated_at = now
        conn.sync_version = now
        conn.save(update_fields=[
            'access_token', 'refresh_token', 'expires_at',
            'connected', 'disconnected_at', 'updated_at',
            'sync_version',
        ])

        # Soft-delete all events for this user
        GoogleCalendarEvent.objects.filter(
            user=request.user,
            deleted_at__isnull=True,
        ).update(deleted_at=now, updated_at=now, sync_version=now)

        return Response({
            'disconnected': True,
            'disconnected_at': now,
        }, status=status.HTTP_200_OK)
