from app.core.config import get_settings
from app.modules.districts.dependencies import get_district_repository
from app.modules.initiatives.dependencies import get_initiative_repository
from app.modules.simulations.repository import SimulationRepository
from app.modules.simulations.service import SimulationService


def get_simulation_repository() -> SimulationRepository:
    return SimulationRepository(
        get_district_repository(),
        get_initiative_repository(),
    )


def get_simulation_service() -> SimulationService:
    settings = get_settings()
    return SimulationService(
        get_simulation_repository(),
        budget=settings.simulation_budget,
        required_initiatives=settings.required_initiatives,
    )

