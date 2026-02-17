from typing import List, Dict, Any
from sqlalchemy.orm import Session
from datetime import datetime, date

from ..models import Job, Candidate, MatchResult
from .claude_service import ClaudeService

# African Union least represented member states (this can be configured)
LEAST_REPRESENTED_COUNTRIES = [
    "Botswana", "Cabo Verde", "Central African Republic", "Chad",
    "Comoros", "Djibouti", "Equatorial Guinea", "Eritrea", "Eswatini",
    "Gabon", "Gambia", "Guinea-Bissau", "Lesotho", "Liberia", "Libya",
    "Madagascar", "Malawi", "Mauritania", "Mauritius", "Mozambique",
    "Namibia", "Niger", "Sao Tome and Principe", "Seychelles",
    "Sierra Leone", "Somalia", "South Sudan", "Togo"
]


class MatchingService:
    """Service to orchestrate the CV matching process"""

    def __init__(self, db: Session):
        self.db = db
        self.claude_service = ClaudeService()

    async def process_job_description(self, job: Job) -> Job:
        """Extract criteria from job description using Claude"""
        criteria = await self.claude_service.extract_job_criteria(
            job.raw_jd_text,
            job.title
        )

        job.education_criteria = criteria.get("education_criteria", [])
        job.experience_criteria = criteria.get("experience_criteria", [])

        # Set cutoff based on grade level
        if job.grade_level.value in ["P5", "P6", "D1", "D2"]:
            job.min_pass_mark = 70
        else:
            job.min_pass_mark = 60

        job.status = "active"
        self.db.commit()
        self.db.refresh(job)

        return job

    async def process_candidate_cv(self, candidate: Candidate) -> Candidate:
        """Parse candidate CV using Claude"""
        if not candidate.cv_raw_text:
            raise ValueError("CV text not available")

        parsed_data = await self.claude_service.parse_cv(candidate.cv_raw_text)

        # Update candidate with parsed data
        personal_info = parsed_data.get("personal_info", {})
        candidate.full_name = personal_info.get("full_name", candidate.full_name)
        candidate.email = personal_info.get("email")
        candidate.phone = personal_info.get("phone")

        # Gender
        gender_str = personal_info.get("gender", "not_specified").lower()
        if gender_str == "male":
            candidate.gender = "male"
        elif gender_str == "female":
            candidate.gender = "female"
        else:
            candidate.gender = "not_specified"

        # Date of birth
        dob_str = personal_info.get("date_of_birth")
        if dob_str and dob_str != "null":
            try:
                candidate.date_of_birth = datetime.strptime(dob_str, "%Y-%m-%d").date()
            except ValueError:
                pass

        candidate.nationality = personal_info.get("nationality")
        candidate.country_of_residence = personal_info.get("country_of_residence")

        # Check if least represented country
        if candidate.nationality:
            candidate.is_least_represented_country = (
                candidate.nationality in LEAST_REPRESENTED_COUNTRIES
            )

        # Disability
        candidate.has_disability = parsed_data.get("disability_mentioned", False)
        candidate.disability_details = parsed_data.get("disability_details")

        # Structured data
        candidate.education = parsed_data.get("education", [])
        candidate.experience = parsed_data.get("experience", [])
        candidate.skills = parsed_data.get("skills", {})
        candidate.certifications = parsed_data.get("certifications", [])
        candidate.parsed_cv_data = parsed_data

        self.db.commit()
        self.db.refresh(candidate)

        return candidate

    async def match_candidate_to_job(self, candidate: Candidate, job: Job) -> MatchResult:
        """Match a single candidate to a job"""
        # Get matching scores from Claude
        match_data = await self.claude_service.match_cv_to_job(
            cv_data=candidate.parsed_cv_data,
            education_criteria=job.education_criteria,
            experience_criteria=job.experience_criteria,
            job_title=job.title
        )

        # Create or update match result
        match_result = self.db.query(MatchResult).filter(
            MatchResult.candidate_id == candidate.id,
            MatchResult.job_id == job.id
        ).first()

        if not match_result:
            match_result = MatchResult(
                job_id=job.id,
                candidate_id=candidate.id
            )
            self.db.add(match_result)

        # Education scores
        match_result.education_scores = match_data.get("education_scores", {})
        match_result.education_total = match_data.get("education_total", 0)

        # Experience scores
        match_result.experience_scores = match_data.get("experience_scores", {})
        match_result.experience_total = match_data.get("experience_total", 0)

        # Base score
        match_result.base_score = match_data.get("base_score", 0)

        # Calculate bonuses
        # Female bonus
        if candidate.gender == "female":
            match_result.bonus_female = 5
        else:
            match_result.bonus_female = 0

        # Age bonus (35 or under)
        if candidate.date_of_birth:
            age = self._calculate_age(candidate.date_of_birth)
            if age and age <= 35:
                match_result.bonus_age = 5
            else:
                match_result.bonus_age = 0
        else:
            match_result.bonus_age = 0

        # Least represented country bonus
        if candidate.is_least_represented_country:
            match_result.bonus_least_represented = 5
        else:
            match_result.bonus_least_represented = 0

        # Inclusion/disability bonus
        if candidate.has_disability:
            match_result.bonus_inclusion = 5
        else:
            match_result.bonus_inclusion = 0

        # Calculate totals
        match_result.calculate_final_score()

        # Check if passes cutoff
        match_result.passes_cutoff = match_result.base_score >= job.min_pass_mark

        # AI analysis
        match_result.overall_reasoning = match_data.get("overall_reasoning", "")
        match_result.strengths = match_data.get("strengths", [])
        match_result.weaknesses = match_data.get("weaknesses", [])
        match_result.flags = match_data.get("flags", [])
        match_result.recommendations = match_data.get("recommendations", "")

        self.db.commit()
        self.db.refresh(match_result)

        return match_result

    async def process_all_candidates(self, job_id: int) -> List[MatchResult]:
        """Process and match all candidates for a job"""
        job = self.db.query(Job).filter(Job.id == job_id).first()
        if not job:
            raise ValueError("Job not found")

        candidates = self.db.query(Candidate).filter(Candidate.job_id == job_id).all()

        results = []
        for candidate in candidates:
            # Parse CV if not already parsed
            if not candidate.parsed_cv_data:
                await self.process_candidate_cv(candidate)

            # Match to job
            result = await self.match_candidate_to_job(candidate, job)
            results.append(result)

        # Rank candidates
        self._rank_candidates(job_id)

        # Update job status
        job.status = "screening"
        job.screening_completed_at = datetime.utcnow()
        self.db.commit()

        return results

    def _rank_candidates(self, job_id: int):
        """Rank candidates by final score"""
        results = self.db.query(MatchResult).filter(
            MatchResult.job_id == job_id
        ).order_by(MatchResult.final_score.desc()).all()

        for i, result in enumerate(results, 1):
            result.rank = i
            result.is_in_longlist = i <= 20  # Top 20

        self.db.commit()

    def _calculate_age(self, dob: date) -> int:
        """Calculate age from date of birth"""
        today = date.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))

    def get_longlist(self, job_id: int, limit: int = 20) -> List[MatchResult]:
        """Get top candidates for a job"""
        return self.db.query(MatchResult).filter(
            MatchResult.job_id == job_id
        ).order_by(MatchResult.final_score.desc()).limit(limit).all()

    def get_statistics(self, job_id: int) -> Dict[str, Any]:
        """Get statistics for a job screening"""
        results = self.db.query(MatchResult).filter(
            MatchResult.job_id == job_id
        ).all()

        candidates = self.db.query(Candidate).filter(
            Candidate.job_id == job_id
        ).all()

        total = len(results)
        if total == 0:
            return {"total_candidates": 0}

        passing = sum(1 for r in results if r.passes_cutoff)
        females = sum(1 for c in candidates if c.gender == "female")
        males = sum(1 for c in candidates if c.gender == "male")
        least_rep = sum(1 for c in candidates if c.is_least_represented_country)

        scores = [r.final_score for r in results]

        return {
            "total_candidates": total,
            "passing_cutoff": passing,
            "failing_cutoff": total - passing,
            "gender_distribution": {
                "female": females,
                "male": males,
                "other": total - females - males
            },
            "least_represented_countries": least_rep,
            "score_statistics": {
                "average": sum(scores) / total,
                "highest": max(scores),
                "lowest": min(scores)
            },
            "longlist_count": sum(1 for r in results if r.is_in_longlist)
        }
