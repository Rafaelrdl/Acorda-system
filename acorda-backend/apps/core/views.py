"""
Core API views for file handling and utilities.
"""
import uuid

from django.db import IntegrityError
from django.http import FileResponse
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import PDFFile

# Maximum PDF upload size: 20 MB
MAX_PDF_SIZE = 20 * 1024 * 1024
PDF_MAGIC = b'%PDF-'


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

        # Validate file size
        if file.size > MAX_PDF_SIZE:
            return Response(
                {'detail': f'Arquivo muito grande. Máximo permitido: {MAX_PDF_SIZE // (1024*1024)} MB.'},
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

        existing = PDFFile.objects.filter(document_id=document_uuid, user=request.user).first()
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
