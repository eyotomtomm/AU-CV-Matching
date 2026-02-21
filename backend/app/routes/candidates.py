from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from typing import List
import os
import shutil
from datetime import datetime

from ..auth import get_current_user
from ..database import get_db
from ..models import Job, Candidate, MatchResult
from ..schemas import (
    CandidateResponse, MatchResultResponse, ProcessCandidatesResponse
)
from ..services import CVParser, MatchingService

router = APIRouter(prefix="/candidates", tags=["candidates"], dependencies=[Depends(get_current_user)])

# Configure upload directory
UPLOAD_DIR = "uploads/cvs"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/{job_id}/upload", status_code=status.HTTP_201_CREATED)
async def upload_cv(
    job_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload a single CV for a job"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

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

    # Extract text from CV
    try:
        cv_text = await CVParser.extract_text_from_upload(content, file.filename)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CV: {str(e)}")

    # Save file
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    safe_filename = f"{job_id}_{timestamp}_{file.filename}"
    file_path = os.path.join(UPLOAD_DIR, safe_filename)

    with open(file_path, "wb") as f:
        f.write(content)

    # Create candidate record
    candidate = Candidate(
        job_id=job_id,
        full_name=file.filename.rsplit(".", 1)[0],  # Use filename as initial name
        cv_filename=file.filename,
        cv_file_path=file_path,
        cv_raw_text=cv_text
    )

    db.add(candidate)
    db.commit()
    db.refresh(candidate)

    return {
        "message": "CV uploaded successfully",
        "candidate_id": candidate.id,
        "filename": file.filename
    }


@router.post("/{job_id}/upload-bulk", status_code=status.HTTP_201_CREATED)
async def upload_cvs_bulk(
    job_id: int,
    files: List[UploadFile] = File(...),
    db: Session = Depends(get_db)
):
    """Upload multiple CVs for a job"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    results = []
    errors = []

    for file in files:
        try:
            # Validate file type
            allowed_extensions = [".pdf", ".docx", ".doc"]
            file_ext = os.path.splitext(file.filename)[1].lower()
            if file_ext not in allowed_extensions:
                errors.append({
                    "filename": file.filename,
                    "error": f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"
                })
                continue

            # Read and parse
            content = await file.read()
            cv_text = await CVParser.extract_text_from_upload(content, file.filename)

            # Save file
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S_%f")
            safe_filename = f"{job_id}_{timestamp}_{file.filename}"
            file_path = os.path.join(UPLOAD_DIR, safe_filename)

            with open(file_path, "wb") as f:
                f.write(content)

            # Create candidate
            candidate = Candidate(
                job_id=job_id,
                full_name=file.filename.rsplit(".", 1)[0],
                cv_filename=file.filename,
                cv_file_path=file_path,
                cv_raw_text=cv_text
            )

            db.add(candidate)
            db.commit()
            db.refresh(candidate)

            results.append({
                "filename": file.filename,
                "candidate_id": candidate.id,
                "status": "success"
            })

        except Exception as e:
            errors.append({
                "filename": file.filename,
                "error": str(e)
            })

    return {
        "message": f"Uploaded {len(results)} CVs successfully",
        "successful": results,
        "errors": errors
    }


@router.post("/{job_id}/process-all", response_model=ProcessCandidatesResponse)
async def process_all_candidates(job_id: int, db: Session = Depends(get_db)):
    """Process and match all candidates for a job"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    if not job.education_criteria or not job.experience_criteria:
        raise HTTPException(
            status_code=400,
            detail="Job criteria not yet extracted. Process the job first."
        )

    candidates = db.query(Candidate).filter(Candidate.job_id == job_id).all()
    if not candidates:
        raise HTTPException(status_code=400, detail="No candidates found for this job")

    matching_service = MatchingService(db)
    results = await matching_service.process_all_candidates(job_id)

    longlist_count = sum(1 for r in results if r.is_in_longlist)

    return ProcessCandidatesResponse(
        message="All candidates processed and matched",
        job_id=job_id,
        candidates_processed=len(results),
        longlist_count=longlist_count
    )


@router.get("/{job_id}/list", response_model=List[CandidateResponse])
def list_candidates(job_id: int, db: Session = Depends(get_db)):
    """List all candidates for a job"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    candidates = db.query(Candidate).filter(Candidate.job_id == job_id).all()
    return candidates


@router.get("/{job_id}/results", response_model=List[MatchResultResponse])
def get_match_results(
    job_id: int,
    limit: int = 100,
    longlist_only: bool = False,
    db: Session = Depends(get_db)
):
    """Get match results for a job, ranked by score"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    query = db.query(MatchResult).filter(MatchResult.job_id == job_id)

    if longlist_only:
        query = query.filter(MatchResult.is_in_longlist == True)

    results = query.order_by(MatchResult.final_score.desc()).limit(limit).all()

    # Add candidate info to response
    response = []
    for result in results:
        candidate = result.candidate
        result_dict = {
            "id": result.id,
            "job_id": result.job_id,
            "candidate_id": result.candidate_id,
            "candidate_name": candidate.full_name,
            "candidate_gender": candidate.gender.value if candidate.gender else None,
            "candidate_nationality": candidate.nationality,
            "education_scores": result.education_scores,
            "education_total": result.education_total,
            "experience_scores": result.experience_scores,
            "experience_total": result.experience_total,
            "base_score": result.base_score,
            "bonus_female": result.bonus_female,
            "bonus_age": result.bonus_age,
            "bonus_least_represented": result.bonus_least_represented,
            "bonus_inclusion": result.bonus_inclusion,
            "total_bonus": result.total_bonus,
            "final_score": result.final_score,
            "rank": result.rank,
            "is_in_longlist": result.is_in_longlist,
            "passes_cutoff": result.passes_cutoff,
            "overall_reasoning": result.overall_reasoning,
            "strengths": result.strengths or [],
            "weaknesses": result.weaknesses or [],
            "flags": result.flags or [],
            "recommendations": result.recommendations,
            "created_at": result.created_at
        }
        response.append(MatchResultResponse(**result_dict))

    return response


@router.get("/result/{result_id}", response_model=MatchResultResponse)
def get_single_result(result_id: int, db: Session = Depends(get_db)):
    """Get a single match result by ID"""
    result = db.query(MatchResult).filter(MatchResult.id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Result not found")

    candidate = result.candidate
    return MatchResultResponse(
        id=result.id,
        job_id=result.job_id,
        candidate_id=result.candidate_id,
        candidate_name=candidate.full_name,
        candidate_gender=candidate.gender.value if candidate.gender else None,
        candidate_nationality=candidate.nationality,
        education_scores=result.education_scores,
        education_total=result.education_total,
        experience_scores=result.experience_scores,
        experience_total=result.experience_total,
        base_score=result.base_score,
        bonus_female=result.bonus_female,
        bonus_age=result.bonus_age,
        bonus_least_represented=result.bonus_least_represented,
        bonus_inclusion=result.bonus_inclusion,
        total_bonus=result.total_bonus,
        final_score=result.final_score,
        rank=result.rank,
        is_in_longlist=result.is_in_longlist,
        passes_cutoff=result.passes_cutoff,
        overall_reasoning=result.overall_reasoning,
        strengths=result.strengths or [],
        weaknesses=result.weaknesses or [],
        flags=result.flags or [],
        recommendations=result.recommendations,
        created_at=result.created_at
    )


@router.delete("/{candidate_id}")
def delete_candidate(candidate_id: int, db: Session = Depends(get_db)):
    """Delete a candidate"""
    candidate = db.query(Candidate).filter(Candidate.id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Delete match result if exists
    db.query(MatchResult).filter(MatchResult.candidate_id == candidate_id).delete()

    # Delete CV file if exists
    if candidate.cv_file_path and os.path.exists(candidate.cv_file_path):
        os.remove(candidate.cv_file_path)

    db.delete(candidate)
    db.commit()

    return {"message": "Candidate deleted"}
