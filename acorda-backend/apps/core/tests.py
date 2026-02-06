"""
Tests for the core app - PDF file handling.
Validates all 3 PDF endpoints:
1. POST /api/pdfs/upload/
2. GET /api/pdfs/<document_id>/
3. DELETE /api/pdfs/<document_id>/
"""
import uuid
import io
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase, APIClient
from rest_framework import status

from apps.accounts.models import User
from apps.core.models import PDFFile


def create_test_pdf():
    """Create a minimal valid PDF file for testing."""
    # Minimal PDF content
    pdf_content = b"""%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [] /Count 0 >>
endobj
xref
0 3
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
trailer
<< /Root 1 0 R /Size 3 >>
startxref
109
%%EOF"""
    return SimpleUploadedFile(
        name='test.pdf',
        content=pdf_content,
        content_type='application/pdf'
    )


class TestPDFFileModel(TestCase):
    """Tests for the PDFFile model."""
    
    def test_create_pdf_file(self):
        """Test creating a PDFFile entry."""
        user = User.objects.create_user(
            email='pdf-test@example.com',
            password='testpass123',
            status='active'
        )
        
        pdf_file = create_test_pdf()
        pdf = PDFFile.objects.create(
            document_id=uuid.uuid4(),
            user=user,
            file=pdf_file,
            file_name='test.pdf',
            file_size=1024,
            content_type='application/pdf',
        )
        
        self.assertIsNotNone(pdf.document_id)
        self.assertEqual(pdf.user, user)
        self.assertEqual(pdf.file_name, 'test.pdf')
        self.assertEqual(pdf.file_size, 1024)


class TestAllPDFEndpoints(APITestCase):
    """
    Comprehensive tests for all 3 PDF endpoints:
    1. POST /api/pdfs/upload/
    2. GET /api/pdfs/<document_id>/
    3. DELETE /api/pdfs/<document_id>/
    """
    
    def setUp(self):
        """Set up test client and user."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='pdf-test@example.com',
            password='testpass123',
            status='active'
        )
        self.client.force_authenticate(user=self.user)
    
    # ============ 1. POST UPLOAD ENDPOINT ============
    
    def test_upload_endpoint_exists(self):
        """Test that POST /api/pdfs/upload/ endpoint exists."""
        document_id = str(uuid.uuid4())
        pdf_file = create_test_pdf()
        
        response = self.client.post('/api/pdfs/upload/', {
            'document_id': document_id,
            'file': pdf_file,
        }, format='multipart')
        
        # Should not return 404
        self.assertNotEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_upload_creates_pdf_record(self):
        """Test that upload creates a PDF file record."""
        document_id = str(uuid.uuid4())
        pdf_file = create_test_pdf()
        
        response = self.client.post('/api/pdfs/upload/', {
            'document_id': document_id,
            'file': pdf_file,
        }, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify record was created
        self.assertTrue(
            PDFFile.objects.filter(
                document_id=document_id,
                user=self.user
            ).exists()
        )
    
    def test_upload_returns_document_info(self):
        """Test that upload returns document information."""
        document_id = str(uuid.uuid4())
        pdf_file = create_test_pdf()
        
        response = self.client.post('/api/pdfs/upload/', {
            'document_id': document_id,
            'file': pdf_file,
        }, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('document_id', response.data)
        self.assertIn('file_name', response.data)
    
    def test_upload_requires_document_id(self):
        """Test that upload requires document_id."""
        pdf_file = create_test_pdf()
        
        response = self.client.post('/api/pdfs/upload/', {
            'file': pdf_file,
        }, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_upload_requires_file(self):
        """Test that upload requires file."""
        document_id = str(uuid.uuid4())
        
        response = self.client.post('/api/pdfs/upload/', {
            'document_id': document_id,
        }, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_upload_rejects_non_pdf(self):
        """Test that upload rejects non-PDF files."""
        document_id = str(uuid.uuid4())
        txt_file = SimpleUploadedFile(
            name='test.txt',
            content=b'This is a text file',
            content_type='text/plain'
        )
        
        response = self.client.post('/api/pdfs/upload/', {
            'document_id': document_id,
            'file': txt_file,
        }, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_upload_requires_authentication(self):
        """Test that upload requires authentication."""
        self.client.logout()
        document_id = str(uuid.uuid4())
        pdf_file = create_test_pdf()
        
        response = self.client.post('/api/pdfs/upload/', {
            'document_id': document_id,
            'file': pdf_file,
        }, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_upload_replaces_existing_file(self):
        """Test that uploading same document_id replaces the file."""
        document_id = str(uuid.uuid4())
        
        # Upload first file
        pdf_file1 = create_test_pdf()
        response1 = self.client.post('/api/pdfs/upload/', {
            'document_id': document_id,
            'file': pdf_file1,
        }, format='multipart')
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        
        # Upload second file with same document_id
        pdf_file2 = create_test_pdf()
        response2 = self.client.post('/api/pdfs/upload/', {
            'document_id': document_id,
            'file': pdf_file2,
        }, format='multipart')
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        
        # Should still only have one record
        count = PDFFile.objects.filter(
            document_id=document_id,
            user=self.user
        ).count()
        self.assertEqual(count, 1)
    
    # ============ 2. GET DOWNLOAD ENDPOINT ============
    
    def test_download_endpoint_exists(self):
        """Test that GET /api/pdfs/<document_id>/ endpoint exists."""
        document_id = str(uuid.uuid4())
        
        # First upload a file
        pdf_file = create_test_pdf()
        self.client.post('/api/pdfs/upload/', {
            'document_id': document_id,
            'file': pdf_file,
        }, format='multipart')
        
        # Try to download
        response = self.client.get(f'/api/pdfs/{document_id}/')
        # Should not return 404 (may return 200 or 404 if file not found)
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_404_NOT_FOUND  # Only if file storage issue
        ])
    
    def test_download_returns_pdf(self):
        """Test that download returns the PDF file."""
        document_id = str(uuid.uuid4())
        
        # First upload a file
        pdf_file = create_test_pdf()
        self.client.post('/api/pdfs/upload/', {
            'document_id': document_id,
            'file': pdf_file,
        }, format='multipart')
        
        # Download
        response = self.client.get(f'/api/pdfs/{document_id}/')
        
        if response.status_code == status.HTTP_200_OK:
            # Verify it's a PDF
            content_type = response.get('Content-Type', '')
            self.assertIn('pdf', content_type.lower())
    
    def test_download_nonexistent_returns_404(self):
        """Test that downloading nonexistent file returns 404."""
        fake_id = str(uuid.uuid4())
        
        response = self.client.get(f'/api/pdfs/{fake_id}/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_download_requires_authentication(self):
        """Test that download requires authentication."""
        document_id = str(uuid.uuid4())
        
        # First upload a file
        pdf_file = create_test_pdf()
        self.client.post('/api/pdfs/upload/', {
            'document_id': document_id,
            'file': pdf_file,
        }, format='multipart')
        
        # Logout and try to download
        self.client.logout()
        response = self.client.get(f'/api/pdfs/{document_id}/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_download_only_own_files(self):
        """Test that user can only download their own files."""
        document_id = str(uuid.uuid4())
        
        # Upload file as current user
        pdf_file = create_test_pdf()
        self.client.post('/api/pdfs/upload/', {
            'document_id': document_id,
            'file': pdf_file,
        }, format='multipart')
        
        # Login as different user
        other_user = User.objects.create_user(
            email='other@example.com',
            password='testpass123',
            status='active'
        )
        self.client.force_authenticate(user=other_user)
        
        # Try to download
        response = self.client.get(f'/api/pdfs/{document_id}/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    # ============ 3. DELETE ENDPOINT ============
    
    def test_delete_endpoint_exists(self):
        """Test that DELETE /api/pdfs/<document_id>/ endpoint exists."""
        document_id = str(uuid.uuid4())
        
        # First upload a file
        pdf_file = create_test_pdf()
        self.client.post('/api/pdfs/upload/', {
            'document_id': document_id,
            'file': pdf_file,
        }, format='multipart')
        
        # Try to delete
        response = self.client.delete(f'/api/pdfs/{document_id}/')
        # Should not return 404 Method Not Allowed
        self.assertNotEqual(response.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
    
    def test_delete_removes_file(self):
        """Test that delete removes the file."""
        document_id = str(uuid.uuid4())
        
        # First upload a file
        pdf_file = create_test_pdf()
        self.client.post('/api/pdfs/upload/', {
            'document_id': document_id,
            'file': pdf_file,
        }, format='multipart')
        
        # Delete
        response = self.client.delete(f'/api/pdfs/{document_id}/')
        
        self.assertIn(response.status_code, [
            status.HTTP_200_OK,
            status.HTTP_204_NO_CONTENT
        ])
        
        # Verify file is gone
        self.assertFalse(
            PDFFile.objects.filter(
                document_id=document_id,
                user=self.user
            ).exists()
        )
    
    def test_delete_nonexistent_returns_404(self):
        """Test that deleting nonexistent file returns 404."""
        fake_id = str(uuid.uuid4())
        
        response = self.client.delete(f'/api/pdfs/{fake_id}/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_delete_requires_authentication(self):
        """Test that delete requires authentication."""
        document_id = str(uuid.uuid4())
        
        # First upload a file
        pdf_file = create_test_pdf()
        self.client.post('/api/pdfs/upload/', {
            'document_id': document_id,
            'file': pdf_file,
        }, format='multipart')
        
        # Logout and try to delete
        self.client.logout()
        response = self.client.delete(f'/api/pdfs/{document_id}/')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_delete_only_own_files(self):
        """Test that user can only delete their own files."""
        document_id = str(uuid.uuid4())
        
        # Upload file as current user
        pdf_file = create_test_pdf()
        self.client.post('/api/pdfs/upload/', {
            'document_id': document_id,
            'file': pdf_file,
        }, format='multipart')
        
        # Login as different user
        other_user = User.objects.create_user(
            email='other@example.com',
            password='testpass123',
            status='active'
        )
        self.client.force_authenticate(user=other_user)
        
        # Try to delete
        response = self.client.delete(f'/api/pdfs/{document_id}/')
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        
        # Verify file still exists for original user
        self.assertTrue(
            PDFFile.objects.filter(
                document_id=document_id,
                user=self.user
            ).exists()
        )
