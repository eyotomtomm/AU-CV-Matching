from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from ..auth import get_current_user
from ..database import get_db
from ..models import Job, MatchResult
from ..services import ReportService

router = APIRouter(prefix="/reports", tags=["reports"], dependencies=[Depends(get_current_user)])


@router.get("/{job_id}/longlist/docx")
def download_longlist_report(job_id: int, db: Session = Depends(get_db)):
    """Download longlist report as DOCX"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    report_service = ReportService(db)
    buffer = report_service.generate_longlist_report(job_id)

    filename = f"longlist_report_{job.reference_number or job_id}_{job.title.replace(' ', '_')}.docx"

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/{job_id}/longlist/xlsx")
def download_longlist_excel(job_id: int, db: Session = Depends(get_db)):
    """Download candidate rankings as Excel"""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    report_service = ReportService(db)
    buffer = report_service.generate_excel_report(job_id)

    filename = f"candidate_rankings_{job.reference_number or job_id}_{job.title.replace(' ', '_')}.xlsx"

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/candidate/{result_id}/docx")
def download_candidate_report(result_id: int, db: Session = Depends(get_db)):
    """Download detailed candidate evaluation report as DOCX"""
    result = db.query(MatchResult).filter(MatchResult.id == result_id).first()
    if not result:
        raise HTTPException(status_code=404, detail="Match result not found")

    report_service = ReportService(db)
    buffer = report_service.generate_candidate_report(result)

    candidate_name = result.candidate.full_name.replace(" ", "_")
    filename = f"evaluation_report_{candidate_name}.docx"

    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
