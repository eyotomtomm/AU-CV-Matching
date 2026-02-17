# African Union CV Matching System

AI-supported CV matching tool for the African Union Commission's Talent Acquisition Unit within the Human Resources Management Directorate (HRMD).

## Features

- **Job Description Analysis**: Upload job descriptions and automatically extract 10 scoring criteria (3 education + 7 experience)
- **CV Parsing**: Upload multiple CVs (PDF, DOC, DOCX) and parse them using Claude AI
- **AI-Powered Matching**: Match candidates against job requirements with detailed scoring
- **Scoring System**:
  - Education: 30% (Degree level, Field of study, Certifications)
  - Experience: 70% (7 key criteria from JD)
- **Bonus Points**:
  - Female candidates: +5
  - Age ≤ 35 years: +5
  - Least Represented Country: +5
  - Inclusion/Disability: +5
- **Cutoff Scores**:
  - P5 and above: 70% minimum
  - P4 and below: 60% minimum
- **Reports**: Download detailed DOCX and Excel reports
- **Longlist**: Automatic generation of Top 20 candidates for SAIS review

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React + Vite |
| Backend | Python FastAPI |
| Database | PostgreSQL |
| AI | Claude API (Anthropic) |

## Project Structure

```
CV Matching AI/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/           # Page components
│   │   ├── services/        # API service layer
│   │   └── App.jsx
│   └── package.json
│
├── backend/                  # FastAPI backend
│   ├── app/
│   │   ├── models/          # SQLAlchemy models
│   │   ├── routes/          # API routes
│   │   ├── services/        # Business logic
│   │   │   ├── claude_service.py
│   │   │   ├── cv_parser.py
│   │   │   ├── matching_service.py
│   │   │   └── report_service.py
│   │   └── main.py
│   └── requirements.txt
│
└── README.md
```

## Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL
- Claude API key (Anthropic)

### Backend Setup

1. Create a virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file:
```bash
cp .env.example .env
# Edit .env with your credentials
```

4. Run the server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/docs`

### Frontend Setup

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
# Edit VITE_API_URL if needed
```

3. Run the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Connect repo to Vercel
3. Set environment variable: `VITE_API_URL=https://your-backend-url.com/api`
4. Deploy

### Backend (Render/Railway)

1. Push code to GitHub
2. Create new Web Service on Render or Railway
3. Set environment variables:
   - `ANTHROPIC_API_KEY`
   - `DATABASE_URL`
   - `SECRET_KEY`
4. Deploy

### Database (Neon/Supabase)

1. Create free PostgreSQL instance
2. Copy connection string to `DATABASE_URL`

## API Endpoints

### Jobs
- `POST /api/jobs/` - Create job and extract criteria
- `GET /api/jobs/` - List all jobs
- `GET /api/jobs/{id}` - Get job details
- `GET /api/jobs/{id}/statistics` - Get screening statistics

### Candidates
- `POST /api/candidates/{job_id}/upload` - Upload single CV
- `POST /api/candidates/{job_id}/upload-bulk` - Upload multiple CVs
- `POST /api/candidates/{job_id}/process-all` - Process and match all candidates
- `GET /api/candidates/{job_id}/results` - Get match results

### Reports
- `GET /api/reports/{job_id}/longlist/docx` - Download longlist DOCX
- `GET /api/reports/{job_id}/longlist/xlsx` - Download Excel
- `GET /api/reports/candidate/{result_id}/docx` - Download candidate report

## License

Copyright © 2024 African Union Commission. All rights reserved.
