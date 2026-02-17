import anthropic
import json
from typing import Dict, List, Any
from ..config import get_settings

settings = get_settings()


class ClaudeService:
    """Service for Claude AI API interactions"""

    def __init__(self):
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)
        self.model = "claude-sonnet-4-20250514"

    async def extract_job_criteria(self, job_description: str, job_title: str) -> Dict[str, Any]:
        """
        Extract 10 scoring criteria from job description:
        - 3 Education criteria (30% weight)
        - 7 Experience criteria (70% weight)
        """
        prompt = f"""Analyze this job description for the position of "{job_title}" at the African Union.

Extract exactly 10 scoring criteria that will be used to evaluate candidates:

EDUCATION CRITERIA (3 items, will account for 30% of total score):
1. Required Degree Level - What minimum degree is required? (e.g., Bachelor's, Master's, PhD)
2. Field of Study - What fields/disciplines are required or preferred?
3. Certifications - Any professional certifications, licenses, or additional qualifications required?

EXPERIENCE CRITERIA (7 items, will account for 70% of total score):
Extract the 7 most important experience requirements from the job description. These should be specific, measurable criteria.

JOB DESCRIPTION:
{job_description}

Respond in this exact JSON format:
{{
    "education_criteria": [
        {{
            "id": "degree_level",
            "name": "Degree Level",
            "description": "Description of required degree",
            "required_level": "Masters/Bachelor/PhD",
            "is_mandatory": true
        }},
        {{
            "id": "field_of_study",
            "name": "Field of Study",
            "description": "Required fields of study",
            "required_fields": ["field1", "field2"],
            "is_mandatory": true
        }},
        {{
            "id": "certifications",
            "name": "Certifications",
            "description": "Required or preferred certifications",
            "required_certs": ["cert1"],
            "preferred_certs": ["cert2"],
            "is_mandatory": false
        }}
    ],
    "experience_criteria": [
        {{
            "id": "exp_1",
            "name": "Short name for criterion",
            "description": "Detailed description of the experience requirement",
            "years_required": 5,
            "is_mandatory": true
        }},
        ... (7 total experience criteria)
    ]
}}

Be specific and extract the actual requirements from the job description. If something is not specified, make reasonable assumptions based on the job level and African Union standards."""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}]
        )

        # Parse the JSON response
        response_text = response.content[0].text

        # Extract JSON from response
        try:
            # Try to find JSON in the response
            start = response_text.find('{')
            end = response_text.rfind('}') + 1
            json_str = response_text[start:end]
            return json.loads(json_str)
        except json.JSONDecodeError:
            raise Exception("Failed to parse job criteria from Claude response")

    async def parse_cv(self, cv_text: str) -> Dict[str, Any]:
        """
        Parse CV text and extract structured data
        """
        prompt = f"""Parse this CV/Resume and extract all relevant information.

CV TEXT:
{cv_text}

Extract and return the following information in this exact JSON format:
{{
    "personal_info": {{
        "full_name": "Full name of the candidate",
        "email": "email@example.com",
        "phone": "+1234567890",
        "gender": "male/female/other/not_specified",
        "date_of_birth": "YYYY-MM-DD or null if not found",
        "nationality": "Country of nationality",
        "country_of_residence": "Current country of residence"
    }},
    "education": [
        {{
            "degree": "Degree name (e.g., Master of Science)",
            "degree_level": "PhD/Masters/Bachelor/Diploma/Certificate",
            "field_of_study": "Field/Major",
            "institution": "University/College name",
            "country": "Country where studied",
            "start_year": 2015,
            "end_year": 2017,
            "is_completed": true
        }}
    ],
    "certifications": [
        {{
            "name": "Certification name",
            "issuing_organization": "Organization",
            "year_obtained": 2020,
            "is_valid": true
        }}
    ],
    "experience": [
        {{
            "job_title": "Position title",
            "organization": "Company/Organization name",
            "organization_type": "UN Agency/Government/NGO/Private Sector/etc",
            "location": "City, Country",
            "start_date": "YYYY-MM",
            "end_date": "YYYY-MM or Present",
            "is_current": false,
            "responsibilities": ["Key responsibility 1", "Key responsibility 2"],
            "achievements": ["Achievement 1", "Achievement 2"]
        }}
    ],
    "skills": {{
        "technical": ["skill1", "skill2"],
        "soft_skills": ["skill1", "skill2"],
        "languages": [
            {{"language": "English", "proficiency": "Native/Fluent/Intermediate/Basic"}},
            {{"language": "French", "proficiency": "Fluent"}}
        ]
    }},
    "total_years_experience": 10,
    "has_international_experience": true,
    "has_un_au_experience": true,
    "disability_mentioned": false,
    "disability_details": null
}}

Important notes:
- For gender, look for pronouns, titles (Mr/Ms/Mrs), or explicit mentions. If unclear, use "not_specified"
- For date of birth, look for DOB, birth date, age, or similar. Calculate from age if given.
- Be thorough in extracting all education and experience entries
- Calculate total years of professional experience
- Note if they have UN, AU, or international organization experience"""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}]
        )

        response_text = response.content[0].text

        try:
            start = response_text.find('{')
            end = response_text.rfind('}') + 1
            json_str = response_text[start:end]
            return json.loads(json_str)
        except json.JSONDecodeError:
            raise Exception("Failed to parse CV data from Claude response")

    async def match_cv_to_job(
        self,
        cv_data: Dict[str, Any],
        education_criteria: List[Dict],
        experience_criteria: List[Dict],
        job_title: str
    ) -> Dict[str, Any]:
        """
        Match parsed CV against job criteria and generate scores
        """
        prompt = f"""You are evaluating a candidate for the position of "{job_title}" at the African Union.

CANDIDATE CV DATA:
{json.dumps(cv_data, indent=2)}

EDUCATION CRITERIA (30% of total score, 10 points each criterion, 30 points total):
{json.dumps(education_criteria, indent=2)}

EXPERIENCE CRITERIA (70% of total score, 10 points each criterion, 70 points total):
{json.dumps(experience_criteria, indent=2)}

SCORING INSTRUCTIONS:
1. Score each criterion from 0-10:
   - 10: Exceeds requirements
   - 8-9: Fully meets requirements
   - 6-7: Mostly meets requirements
   - 4-5: Partially meets requirements
   - 2-3: Minimally meets requirements
   - 0-1: Does not meet requirements

2. For Education (30 points total):
   - Degree Level (10 points): Score based on match to required degree
   - Field of Study (10 points): Score based on relevance of field
   - Certifications (10 points): Score based on relevant certifications

3. For Experience (70 points total):
   - Score each of the 7 criteria (10 points each)
   - Consider years of experience, relevance, and quality

Respond in this exact JSON format:
{{
    "education_scores": {{
        "degree_level": {{
            "score": 8,
            "max": 10,
            "reasoning": "Detailed explanation of why this score was given"
        }},
        "field_of_study": {{
            "score": 9,
            "max": 10,
            "reasoning": "Detailed explanation"
        }},
        "certifications": {{
            "score": 6,
            "max": 10,
            "reasoning": "Detailed explanation"
        }}
    }},
    "experience_scores": {{
        "exp_1": {{
            "score": 8,
            "max": 10,
            "reasoning": "Detailed explanation"
        }},
        ... (all 7 experience criteria)
    }},
    "education_total": 23,
    "experience_total": 58,
    "base_score": 81,
    "overall_reasoning": "Comprehensive summary of the candidate's fit for the role, explaining the total score",
    "strengths": ["Strength 1", "Strength 2", "Strength 3"],
    "weaknesses": ["Gap or weakness 1", "Missing qualification 2"],
    "flags": ["Any red flags or concerns"],
    "recommendations": "Recommendations for the hiring committee regarding this candidate"
}}

Be fair, objective, and thorough in your assessment. Provide detailed reasoning for each score."""

        response = self.client.messages.create(
            model=self.model,
            max_tokens=4096,
            messages=[{"role": "user", "content": prompt}]
        )

        response_text = response.content[0].text

        try:
            start = response_text.find('{')
            end = response_text.rfind('}') + 1
            json_str = response_text[start:end]
            return json.loads(json_str)
        except json.JSONDecodeError:
            raise Exception("Failed to parse matching results from Claude response")
