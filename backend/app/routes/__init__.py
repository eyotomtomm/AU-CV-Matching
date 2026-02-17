from .jobs import router as jobs_router
from .candidates import router as candidates_router
from .reports import router as reports_router

__all__ = ["jobs_router", "candidates_router", "reports_router"]
