from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List

from ..auth import get_current_user
from ..database import get_db
from ..models import Job, Candidate, MatchResult
from ..schemas import (
    JobCreate, JobUpdate, JobResponse, JobListResponse,
    ProcessJobResponse, StatisticsResponse
)
from ..services import MatchingService, CVParser

router = APIRouter(prefix="/jobs", tags=["jobs"], dependencies=[Depends(get_current_user)])


@router.post("/upload-jd")
async def upload_jd_file(file: UploadFile = File(...)):
    """Upload a JD file (PDF, DOC, DOCX) and extract text"""
    import os

    # Validate file type
    allowed_extensions = [".pdf", ".docx", ".doc"]
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
        )

    # Read file content
    content = await file.read()

    # Extract text using CVParser (same logic works for JD files)
    try:
        text = await CVParser.extract_text_from_upload(content, file.filename)
        return {"text": text, "filename": file.filename}
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to extract text: {str(e)}")


@router.post("/", response_model=JobResponse, status_code=status.HTTP_201_CREATED)
async def create_job(job_data: JobCreate, db: Session = Depends(get_db)):
    """Create a new job and extract criteria from job description"""
    # Check if reference number already exists
    if job_data.reference_number:
        existing = db.query(Job).filter(
            Job.reference_number == job_data.reference_number
        ).first()
        if existing:
            raise HTTPException(
                status_code=400,
                detail="Job with this reference number already exists"
            )

    # Create job
    job = Job(
        title=job_data.title,
        reference_number=job_data.reference_number,
        department=job_data.department,
        directorate=job_data.directorate,
        duty_station=job_data.duty_station,
        grade_level=job_data.grade_level,
        description=job_data.description,
        raw_jd_text=job_data.raw_jd_text
    )

    db.add(job)
    db.commit()
    db.refresh(job)

    # Process job description with Claude to extract criteria
    matching_service = MatchingService(db)
    job = await matching_service.process_job_description(job)

    return job


@router.get("/", response_model=List[JobListResponse])
def list_jobs(
    skip: int = 0,
    limit: int = 100,
    status: str = None,
    db: Session = Depends(get_db)
):
    """List all jobs with optional filtering"""
    query = db.query(Job)

    if status:
        query = query.filter(Job.status == status)

    jobs = query.order_by(Job.created_at.desc()).offset(skip).limit(limit).all()

    # Add candidate count to each job
    result = []
    for job in jobs:
        job_dict = {
            "id": job.id,
            "title": job.title,
            "reference_number": job.reference_number,
            "grade_level": job.grade_level,
            "status": job.status,
            "created_at": job.created_at,
            "candidate_count": db.query(Candidate).filter(
                Candidate.job_id == job.id
            ).count()
        }
        result.append(JobListResponse(**job_dict))

    return result


@router.get("/{job_id}", response_model=JobResponse)
def get_job(job_id: int, db: Session = Depends(get_db)):
    """Get job details by ID"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job


@router.put("/{job_id}", response_model=JobResponse)
def update_job(job_id: int, job_data: JobUpdate, db: Session = Depends(get_db)):
    """Update job details"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    update_data = job_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(job, field, value)

    db.commit()
    db.refresh(job)
    return job


@router.delete("/{job_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_job(job_id: int, db: Session = Depends(get_db)):
    """Delete a job and all associated data"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    # Delete associated match results and candidates
    db.query(MatchResult).filter(MatchResult.job_id == job_id).delete()
    db.query(Candidate).filter(Candidate.job_id == job_id).delete()
    db.delete(job)
    db.commit()


@router.post("/{job_id}/process", response_model=ProcessJobResponse)
async def process_job(job_id: int, db: Session = Depends(get_db)):
    """Re-process job description to extract criteria"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    matching_service = MatchingService(db)
    job = await matching_service.process_job_description(job)

    return ProcessJobResponse(
        message="Job processed successfully",
        job_id=job.id,
        education_criteria_count=len(job.education_criteria),
        experience_criteria_count=len(job.experience_criteria)
    )


@router.get("/{job_id}/statistics", response_model=StatisticsResponse)
def get_job_statistics(job_id: int, db: Session = Depends(get_db)):
    """Get screening statistics for a job"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    matching_service = MatchingService(db)
    stats = matching_service.get_statistics(job_id)
    return StatisticsResponse(**stats)


@router.post("/{job_id}/complete")
def complete_screening(job_id: int, db: Session = Depends(get_db)):
    """Mark job screening as completed"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    job.status = "completed"
    db.commit()

    return {"message": "Screening completed", "job_id": job_id}
