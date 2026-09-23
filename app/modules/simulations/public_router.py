"""Stable public API used by the frontend and AI integration."""

from typing import Annotated

from fastapi import APIRouter, Depends

from app.core.config import get_settings
from app.modules.simulations.dependencies import get_simulation_service
from app.modules.simulations.schemas import (
    BootstrapResponse, ScenarioRequest, SimulationResult,
    SimulationValidation, ValidationRequest,
)
from app.modules.simulations.service import SimulationService

router = APIRouter(tags=["simulator"])
Service = Annotated[SimulationService, Depends(get_simulation_service)]


@router.get("/config", summary="Public frontend configuration (no credentials)")
def frontend_config() -> dict[str, str]:
    settings = get_settings()
    return {"apiBaseUrl": settings.public_api_base_url, "analysisMode": settings.analysis_mode}


@router.get("/bootstrap", response_model=BootstrapResponse)
def bootstrap(service: Service) -> BootstrapResponse:
    return service.bootstrap()


@router.post("/validate", response_model=SimulationValidation)
def validate(request: ValidationRequest, service: Service) -> SimulationValidation:
    return service.validate(request, final=request.final)


@router.post("/simulate", response_model=SimulationResult)
def simulate(request: ScenarioRequest, service: Service) -> SimulationResult:
    return service.calculate(request)
