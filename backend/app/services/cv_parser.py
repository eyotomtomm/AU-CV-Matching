import os
from PyPDF2 import PdfReader
import docx2txt
from docx import Document
import tempfile


class CVParser:
    """Extract text from CV files (PDF, DOCX, DOC)"""

    @staticmethod
    def extract_text_from_pdf(file_path: str) -> str:
        """Extract text from PDF file"""
        try:
            reader = PdfReader(file_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
            return text.strip()
        except Exception as e:
            raise Exception(f"Error parsing PDF: {str(e)}")

    @staticmethod
    def extract_text_from_docx(file_path: str) -> str:
        """Extract text from DOCX file"""
        try:
            text = docx2txt.process(file_path)
            return text.strip()
        except Exception as e:
            raise Exception(f"Error parsing DOCX: {str(e)}")

    @staticmethod
    def extract_text(file_path: str) -> str:
        """Extract text from file based on extension"""
        _, ext = os.path.splitext(file_path)
        ext = ext.lower()

        if ext == ".pdf":
            return CVParser.extract_text_from_pdf(file_path)
        elif ext in [".docx", ".doc"]:
            return CVParser.extract_text_from_docx(file_path)
        else:
            raise ValueError(f"Unsupported file format: {ext}")

    @staticmethod
    async def extract_text_from_upload(file_content: bytes, filename: str) -> str:
        """Extract text from uploaded file"""
        _, ext = os.path.splitext(filename)
        ext = ext.lower()

        # Save to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(file_content)
            tmp_path = tmp.name

        try:
            text = CVParser.extract_text(tmp_path)
            return text
        finally:
            # Clean up temp file
            os.unlink(tmp_path)
