from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Boolean, Date, ForeignKey, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base


class Gender(str, enum.Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    NOT_SPECIFIED = "not_specified"


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)

    # Personal Information (extracted from CV)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255))
    phone = Column(String(50))
    gender = Column(Enum(Gender), default=Gender.NOT_SPECIFIED)
    date_of_birth = Column(Date, nullable=True)
    nationality = Column(String(100))
    country_of_residence = Column(String(100))

    # Diversity & Inclusion
    is_least_represented_country = Column(Boolean, default=False)
    has_disability = Column(Boolean, default=False)
    disability_details = Column(Text, nullable=True)

    # CV Data
    cv_filename = Column(String(255))
    cv_file_path = Column(String(500))
    cv_raw_text = Column(Text)  # Extracted text from CV

    # Parsed CV Data (stored as JSON)
    education = Column(JSON, default=list)  # List of education entries
    experience = Column(JSON, default=list)  # List of work experiences
    skills = Column(JSON, default=list)
    certifications = Column(JSON, default=list)
    languages = Column(JSON, default=list)

    # Full parsed data from Claude
    parsed_cv_data = Column(JSON, default=dict)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    job = relationship("Job", back_populates="candidates")
    match_result = relationship("MatchResult", back_populates="candidate", uselist=False)

    @property
    def age(self):
        """Calculate age from date of birth"""
        if not self.date_of_birth:
            return None
        today = datetime.today().date()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )
