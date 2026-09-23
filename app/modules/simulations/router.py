from typing import Annotated

from fastapi import APIRouter, Depends

from app.modules.simulations.dependencies import get_simulation_service
from app.modules.simulations.schemas import (
    ScenarioRequest,
    SimulationResult,
    SimulationValidation,
    ValidationRequest,
)
from app.modules.simulations.service import SimulationService

router = APIRouter(prefix="/simulations", tags=["simulations"])
SimulationServiceDep = Annotated[SimulationService, Depends(get_simulation_service)]


@router.post(
    "/validate",
    response_model=SimulationValidation,
    summary="Validate simulation choices",
)
def validate_simulation(
    request: ValidationRequest, service: SimulationServiceDep
) -> SimulationValidation:
    return service.validate(request, final=request.final)


@router.post(
    "/calculate",
    response_model=SimulationResult,
    summary="Calculate the Astana Quality of Life Score",
)
def calculate_simulation(
    request: ScenarioRequest, service: SimulationServiceDep
) -> SimulationResult:
    return service.calculate(request)
