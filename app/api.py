from fastapi import APIRouter

from app.modules.ai_analysis.router import router as ai_analysis_router
from app.modules.districts.router import router as districts_router
from app.modules.health.router import router as health_router
from app.modules.initiatives.router import router as initiatives_router
from app.modules.simulations.router import router as simulations_router

api_router = APIRouter()
api_router.include_router(districts_router)
api_router.include_router(initiatives_router)
api_router.include_router(simulations_router)
api_router.include_router(ai_analysis_router)
api_router.include_router(health_router)

