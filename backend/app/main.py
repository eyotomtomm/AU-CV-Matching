from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import engine, Base
from .routes import jobs_router, candidates_router, reports_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables on startup
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="African Union CV Matching System",
    description="""
    AI-supported CV matching tool for the African Union Commission.

    This system helps the Talent Acquisition Unit within HRMD to:
    - Parse and extract structured data from CVs
    - Match qualifications, experience, and skills with job requirements
    - Generate relevance scores for each candidate
    - Flag potential mismatches or missing qualifications
    - Generate detailed evaluation reports

    ## Scoring System
    - **Education (30%)**: Degree level, field of study, certifications
    - **Experience (70%)**: 7 key requirements extracted from job description

    ## Bonus Points
    - Female candidates: +5
    - Age ≤ 35: +5
    - Least Represented Country: +5
    - Inclusion/Disability: +5

    ## Cutoff Scores
    - P5 and above: 70%
    - P4 and below: 60%
    """,
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(jobs_router, prefix="/api")
app.include_router(candidates_router, prefix="/api")
app.include_router(reports_router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": "African Union CV Matching System API",
        "version": "1.0.0",
        "documentation": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
