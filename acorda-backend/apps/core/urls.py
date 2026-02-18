"""URL routes for core app."""
from django.urls import path
from .views import PDFUploadView, PDFFileView, HealthCheckView

urlpatterns = [
    path('health/', HealthCheckView.as_view(), name='health-check'),
    path('pdfs/upload/', PDFUploadView.as_view(), name='pdf-upload'),
    path('pdfs/<uuid:document_id>/', PDFFileView.as_view(), name='pdf-file'),
]
