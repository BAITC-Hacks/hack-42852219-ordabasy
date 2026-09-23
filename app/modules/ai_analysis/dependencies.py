from functools import lru_cache

from app.modules.ai_analysis.repository import AnalysisReferenceRepository
from app.modules.ai_analysis.service import AIAnalysisService
from app.modules.simulations.dependencies import get_simulation_service


@lru_cache
def get_analysis_reference_repository() -> AnalysisReferenceRepository:
    return AnalysisReferenceRepository()


def get_ai_analysis_service() -> AIAnalysisService:
    return AIAnalysisService(
        get_simulation_service(),
        get_analysis_reference_repository(),
    )

