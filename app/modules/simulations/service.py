"""Application adapter around the pure domain engine (no duplicated formula)."""

from app.core.exceptions import SimulationValidationError
from app.domain import SimulationEngine, ValidationError
from app.modules.simulations.schemas import (
    BootstrapResponse, ScenarioRequest, SimulationRequest,
    SimulationResult, SimulationValidation,
)

# Retained for imports in the teammate's legacy module.
METRICS = ("mobility", "environment", "health", "safety", "economy")


class SimulationService:
    def __init__(self, engine: SimulationEngine) -> None:
        self._engine = engine

    def bootstrap(self) -> BootstrapResponse:
        return BootstrapResponse.model_validate(self._engine.bootstrap())

    def validate(self, request: ScenarioRequest, *, final: bool = False) -> SimulationValidation:
        return SimulationValidation.model_validate(self._engine.validate(
            [item.model_dump() for item in request.decisions], final=final,
        ))

    def calculate(self, request: ScenarioRequest | SimulationRequest) -> SimulationResult:
        if isinstance(request, SimulationRequest):
            raise SimulationValidationError([{
                "code": "legacy_request",
                "message": "Передайте decisions с initiativeId и districtId через /api/simulate.",
            }])
        try:
            result = self._engine.simulate(
                [item.model_dump() for item in request.decisions],
                scenario_version=request.scenarioVersion,
            )
        except ValidationError as exc:
            raise SimulationValidationError(exc.errors) from exc
        return SimulationResult.model_validate(result)

    def analysis_context(self, request: ScenarioRequest) -> dict:
        """Recalculate trusted facts before AI; never accept client-supplied scores."""
        return self.calculate(request).model_dump()
