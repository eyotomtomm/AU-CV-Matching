from sqlalchemy import Column, Integer, String, Text, DateTime, JSON, Float, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class MatchResult(Base):
    __tablename__ = "match_results"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(Integer, ForeignKey("jobs.id"), nullable=False)
    candidate_id = Column(Integer, ForeignKey("candidates.id"), nullable=False, unique=True)

    # Education Scores (30% weight, 3 criteria)
    education_scores = Column(JSON, default=dict)
    # Structure: {
    #   "degree_level": {"score": 10, "max": 10, "reasoning": "..."},
    #   "field_of_study": {"score": 10, "max": 10, "reasoning": "..."},
    #   "certifications": {"score": 10, "max": 10, "reasoning": "..."}
    # }
    education_total = Column(Float, default=0)  # Out of 30

    # Experience Scores (70% weight, 7 criteria)
    experience_scores = Column(JSON, default=dict)
    # Structure: {
    #   "criterion_1": {"score": 10, "max": 10, "reasoning": "..."},
    #   ... (7 criteria)
    # }
    experience_total = Column(Float, default=0)  # Out of 70

    # Base Score (before bonuses)
    base_score = Column(Float, default=0)  # Out of 100

    # Bonus Points
    bonus_female = Column(Integer, default=0)  # +5 if female
    bonus_age = Column(Integer, default=0)  # +5 if age <= 35
    bonus_least_represented = Column(Integer, default=0)  # +5 if from least represented country
    bonus_inclusion = Column(Integer, default=0)  # +5 if has disability
    total_bonus = Column(Integer, default=0)  # Sum of all bonuses (max 20)

    # Final Score
    final_score = Column(Float, default=0)  # base_score + total_bonus

    # Ranking
    rank = Column(Integer, nullable=True)  # Position in the longlist
    is_in_longlist = Column(Boolean, default=False)  # Top 20
    passes_cutoff = Column(Boolean, default=False)  # Meets minimum score

    # AI Analysis
    overall_reasoning = Column(Text)  # Detailed explanation of the score
    strengths = Column(JSON, default=list)  # List of candidate strengths
    weaknesses = Column(JSON, default=list)  # List of gaps/missing qualifications
    recommendations = Column(Text)  # AI recommendations

    # Flags
    flags = Column(JSON, default=list)  # Potential issues flagged by AI
    # E.g., ["Missing required certification", "Experience gap 2018-2020"]

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    job = relationship("Job", back_populates="match_results")
    candidate = relationship("Candidate", back_populates="match_result")

    def calculate_total_bonus(self):
        """Calculate total bonus points"""
        self.total_bonus = (
            self.bonus_female +
            self.bonus_age +
            self.bonus_least_represented +
            self.bonus_inclusion
        )
        return self.total_bonus

    def calculate_final_score(self):
        """Calculate final score including bonuses"""
        self.base_score = self.education_total + self.experience_total
        self.calculate_total_bonus()
        self.final_score = self.base_score + self.total_bonus
        return self.final_score
