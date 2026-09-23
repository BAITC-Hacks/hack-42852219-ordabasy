from app.core.config import get_settings
from app.modules.analysis.service import AnalysisService


def get_analysis_service() -> AnalysisService:
    settings = get_settings()
    return AnalysisService(
        api_key=settings.openai_api_key,
        model=settings.openai_model,
        timeout=settings.openai_timeout_seconds,
    )
