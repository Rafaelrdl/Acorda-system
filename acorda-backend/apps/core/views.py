"""
Core API views for file handling and utilities.
"""
import uuid

from django.db import IntegrityError
from django.db.models import Sum
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PDFFile
from apps.billing.models import Subscription

# Absolute maximum file size (safety net): 50 MB
ABSOLUTE_MAX_PDF_SIZE = 50 * 1024 * 1024
PDF_MAGIC = b'%PDF-'


def _get_user_plan_limits(user):
    """Return PDF limits for the user based on their active subscription.

    Returns a dict with keys: max_count, max_file_bytes, max_total_bytes.
    Raises a tuple (detail_message, http_status) if the user has no active plan.
    """
    subscription = (
        Subscription.objects
        .filter(user=user, status__in=['active', 'past_due'])
        .select_related('plan')
        .order_by('-created_at')
        .first()
    )

    if not subscription or not subscription.plan:
        return None  # No active plan

    plan = subscription.plan
    return {
        'max_count': plan.pdf_max_count,
        'max_file_bytes': (plan.pdf_max_file_mb or 50) * 1024 * 1024,
        'max_total_bytes': (plan.pdf_max_total_mb or 5120) * 1024 * 1024,
        'plan_name': plan.name,
    }


class PDFUploadView(APIView):
    """Upload a PDF file for a given document id."""

    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request):
        document_id = request.data.get('document_id')
        file = request.FILES.get('file')

        if not document_id or not file:
            return Response(
                {'detail': 'document_id e file sao obrigatorios.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            document_uuid = uuid.UUID(str(document_id))
        except ValueError:
            return Response(
                {'detail': 'document_id invalido.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # ── Plan-based limits ───────────────────────────────────
        limits = _get_user_plan_limits(request.user)
        if limits is None:
            return Response(
                {
                    'detail': 'Você precisa de um plano ativo para fazer upload de PDFs. '
                              'Assine um plano em acorda.app.',
                    'error_code': 'no_active_plan',
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        max_file_bytes = min(limits['max_file_bytes'], ABSOLUTE_MAX_PDF_SIZE)

        # Validate per-file size
        if file.size > max_file_bytes:
            max_mb = max_file_bytes // (1024 * 1024)
            return Response(
                {
                    'detail': (
                        f'Arquivo muito grande ({file.size // (1024*1024)} MB). '
                        f'Seu plano ({limits["plan_name"]}) permite até {max_mb} MB por PDF. '
                        f'Remova PDFs antigos ou faça upgrade do plano.'
                    ),
                    'error_code': 'file_too_large',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if file.content_type and file.content_type != 'application/pdf':
            return Response(
                {'detail': 'Apenas arquivos PDF sao aceitos.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Validate PDF magic bytes
        header = file.read(5)
        file.seek(0)
        if header[:len(PDF_MAGIC)] != PDF_MAGIC:
            return Response(
                {'detail': 'Arquivo não é um PDF válido.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Count & total-size limits ───────────────────────────
        existing = PDFFile.objects.filter(document_id=document_uuid, user=request.user).first()
        is_replacement = existing is not None

        if not is_replacement and limits['max_count'] is not None:
            current_count = PDFFile.objects.filter(user=request.user).count()
            if current_count >= limits['max_count']:
                return Response(
                    {
                        'detail': (
                            f'Limite de PDFs atingido ({limits["max_count"]} PDFs no plano '
                            f'{limits["plan_name"]}). Remova PDFs antigos ou faça upgrade.'
                        ),
                        'error_code': 'pdf_count_exceeded',
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Total storage check
        current_total = PDFFile.objects.filter(user=request.user).aggregate(
            total=Sum('file_size')
        )['total'] or 0

        # Subtract existing file size if replacing
        if is_replacement:
            current_total -= existing.file_size or 0

        if current_total + file.size > limits['max_total_bytes']:
            max_total_mb = limits['max_total_bytes'] // (1024 * 1024)
            used_mb = current_total // (1024 * 1024)
            return Response(
                {
                    'detail': (
                        f'Limite de armazenamento atingido. Usado: {used_mb} MB de '
                        f'{max_total_mb} MB (plano {limits["plan_name"]}). '
                        f'Remova PDFs antigos ou faça upgrade.'
                    ),
                    'error_code': 'storage_exceeded',
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ── Perform upload ──────────────────────────────────────
        if existing and existing.file:
            existing.file.delete(save=False)

        pdf_file, _ = PDFFile.objects.update_or_create(
            document_id=document_uuid,
            user=request.user,
            defaults={
                'file': file,
                'file_name': file.name,
                'file_size': file.size,
                'content_type': getattr(file, 'content_type', '') or '',
            }
        )

        return Response({
            'detail': 'Arquivo enviado com sucesso.',
            'document_id': str(pdf_file.document_id),
            'file_name': pdf_file.file_name,
            'file_size': pdf_file.file_size,
        })


class PDFFileView(APIView):
    """Download or delete a PDF file by document id."""

    permission_classes = [IsAuthenticated]

    def get(self, request, document_id):
        pdf_file = get_object_or_404(PDFFile, document_id=document_id, user=request.user)
        response = FileResponse(
            pdf_file.file.open('rb'),
            content_type=pdf_file.content_type or 'application/pdf'
        )
        response['Content-Length'] = str(pdf_file.file_size)
        response['Content-Disposition'] = f'attachment; filename="{pdf_file.file_name}"'
        return response

    def delete(self, request, document_id):
        pdf_file = get_object_or_404(PDFFile, document_id=document_id, user=request.user)
        if pdf_file.file:
            pdf_file.file.delete(save=False)
        pdf_file.delete()
        return Response({'detail': 'Arquivo removido.'})
