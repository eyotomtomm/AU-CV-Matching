from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum
from ..database import Base


class GradeLevel(str, enum.Enum):
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"
    P4 = "P4"
    P5 = "P5"
    P6 = "P6"
    D1 = "D1"
    D2 = "D2"


class JobStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    SCREENING = "screening"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class Job(Base):
    __tablename__ = "jobs"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    reference_number = Column(String(100), unique=True, index=True)
    department = Column(String(255))
    directorate = Column(String(255), default="Human Resources Management Directorate")
    duty_station = Column(String(255))
    grade_level = Column(Enum(GradeLevel), nullable=False)

    # Job Description
    description = Column(Text)
    raw_jd_text = Column(Text)  # Original JD text

    # Extracted Criteria (stored as JSON)
    # Education criteria (3 items, 30% weight)
    education_criteria = Column(JSON, default=list)
    # Experience criteria (7 items, 70% weight)
    experience_criteria = Column(JSON, default=list)

    # Minimum pass mark based on grade
    min_pass_mark = Column(Integer, default=60)  # 70 for P5+, 60 for P4-

    status = Column(Enum(JobStatus), default=JobStatus.DRAFT)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    screening_completed_at = Column(DateTime, nullable=True)

    # Relationships
    candidates = relationship("Candidate", back_populates="job")
    match_results = relationship("MatchResult", back_populates="job")

    @property
    def cutoff_score(self):
        """Return cutoff score based on grade level"""
        if self.grade_level in [GradeLevel.P5, GradeLevel.P6, GradeLevel.D1, GradeLevel.D2]:
            return 70
        return 60
