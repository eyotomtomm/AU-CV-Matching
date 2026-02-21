from pydantic import BaseModel, EmailStr
from typing import List, Dict, Any, Optional
from datetime import datetime, date
from enum import Enum


# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class UserResponse(BaseModel):
    id: int
    username: str
    email: Optional[str]
    full_name: Optional[str]
    is_active: bool
    is_admin: bool

    class Config:
        from_attributes = True


# Extract Schemas
class ExtractRequest(BaseModel):
    raw_jd_text: str


class ExtractResponse(BaseModel):
    title: Optional[str] = None
    reference_number: Optional[str] = None
    grade_level: Optional[str] = None
    department: Optional[str] = None
    duty_station: Optional[str] = None
    education_criteria: List[Dict[str, Any]] = []
    experience_criteria: List[Dict[str, Any]] = []


class GradeLevel(str, Enum):
    P1 = "P1"
    P2 = "P2"
    P3 = "P3"
    P4 = "P4"
    P5 = "P5"
    P6 = "P6"
    D1 = "D1"
    D2 = "D2"


class JobStatus(str, Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    SCREENING = "screening"
    COMPLETED = "completed"
    ARCHIVED = "archived"


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"
    NOT_SPECIFIED = "not_specified"


# Job Schemas
class JobCreate(BaseModel):
    title: str
    reference_number: Optional[str] = None
    department: Optional[str] = None
    directorate: Optional[str] = "Human Resources Management Directorate"
    duty_station: Optional[str] = None
    grade_level: GradeLevel
    description: Optional[str] = None
    raw_jd_text: str
    education_criteria: Optional[List[Dict[str, Any]]] = None
    experience_criteria: Optional[List[Dict[str, Any]]] = None


class JobUpdate(BaseModel):
    title: Optional[str] = None
    reference_number: Optional[str] = None
    department: Optional[str] = None
    duty_station: Optional[str] = None
    grade_level: Optional[GradeLevel] = None
    description: Optional[str] = None
    status: Optional[JobStatus] = None


class JobResponse(BaseModel):
    id: int
    title: str
    reference_number: Optional[str]
    department: Optional[str]
    directorate: Optional[str]
    duty_station: Optional[str]
    grade_level: GradeLevel
    description: Optional[str]
    education_criteria: List[Dict[str, Any]]
    experience_criteria: List[Dict[str, Any]]
    min_pass_mark: int
    status: JobStatus
    created_at: datetime
    updated_at: datetime
    screening_completed_at: Optional[datetime]

    class Config:
        from_attributes = True


class JobListResponse(BaseModel):
    id: int
    title: str
    reference_number: Optional[str]
    grade_level: GradeLevel
    status: JobStatus
    created_at: datetime
    candidate_count: Optional[int] = 0

    class Config:
        from_attributes = True


# Candidate Schemas
class CandidateCreate(BaseModel):
    full_name: str
    email: Optional[str] = None


class CandidateResponse(BaseModel):
    id: int
    job_id: int
    full_name: str
    email: Optional[str]
    phone: Optional[str]
    gender: Optional[Gender]
    date_of_birth: Optional[date]
    nationality: Optional[str]
    is_least_represented_country: bool
    has_disability: bool
    cv_filename: Optional[str]
    education: List[Dict[str, Any]]
    experience: List[Dict[str, Any]]
    skills: Any
    certifications: List[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


# Match Result Schemas
class MatchResultResponse(BaseModel):
    id: int
    job_id: int
    candidate_id: int
    candidate_name: Optional[str] = None
    candidate_gender: Optional[str] = None
    candidate_nationality: Optional[str] = None

    education_scores: Dict[str, Any]
    education_total: float
    experience_scores: Dict[str, Any]
    experience_total: float
    base_score: float

    bonus_female: int
    bonus_age: int
    bonus_least_represented: int
    bonus_inclusion: int
    total_bonus: int

    final_score: float
    rank: Optional[int]
    is_in_longlist: bool
    passes_cutoff: bool

    overall_reasoning: Optional[str]
    strengths: List[str]
    weaknesses: List[str]
    flags: List[str]
    recommendations: Optional[str]

    created_at: datetime

    class Config:
        from_attributes = True


class StatisticsResponse(BaseModel):
    total_candidates: int
    passing_cutoff: Optional[int] = 0
    failing_cutoff: Optional[int] = 0
    gender_distribution: Optional[Dict[str, int]] = None
    least_represented_countries: Optional[int] = 0
    score_statistics: Optional[Dict[str, float]] = None
    longlist_count: Optional[int] = 0


class ProcessJobResponse(BaseModel):
    message: str
    job_id: int
    education_criteria_count: int
    experience_criteria_count: int


class ProcessCandidatesResponse(BaseModel):
    message: str
    job_id: int
    candidates_processed: int
    longlist_count: int
