from typing import Annotated

from fastapi import APIRouter, Depends

from app.modules.ai_analysis.dependencies import get_ai_analysis_service
from app.modules.ai_analysis.schemas import AIAnalysisRequest, AIAnalysisResponse
from app.modules.ai_analysis.service import AIAnalysisService

router = APIRouter(prefix="/ai-analysis", tags=["ai-analysis"])
AIAnalysisServiceDep = Annotated[AIAnalysisService, Depends(get_ai_analysis_service)]


@router.post("", response_model=AIAnalysisResponse, summary="Analyze simulation results")
def analyze_simulation(
    request: AIAnalysisRequest, service: AIAnalysisServiceDep
) -> AIAnalysisResponse:
    return service.analyze(request)

