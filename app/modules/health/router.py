from typing import Annotated

from fastapi import APIRouter, Depends

from app.modules.health.dependencies import get_health_service
from app.modules.health.schemas import HealthResponse
from app.modules.health.service import HealthService

router = APIRouter(prefix="/health", tags=["health"])
HealthServiceDep = Annotated[HealthService, Depends(get_health_service)]


@router.get("", response_model=HealthResponse, summary="Check API health")
def health_check(service: HealthServiceDep) -> HealthResponse:
    return service.check()
