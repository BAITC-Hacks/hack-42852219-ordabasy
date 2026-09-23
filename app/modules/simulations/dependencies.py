from functools import lru_cache

from app.core.config import get_settings
from app.domain import SimulationEngine
from app.modules.districts.dependencies import get_district_repository
from app.modules.initiatives.dependencies import get_initiative_repository
from app.modules.simulations.repository import SimulationRepository
from app.modules.simulations.service import SimulationService


def get_simulation_repository() -> SimulationRepository:
    return SimulationRepository(
        get_district_repository(),
        get_initiative_repository(),
    )


@lru_cache
def get_simulation_engine() -> SimulationEngine:
    return SimulationEngine(data_dir=get_settings().data_dir)


def get_simulation_service() -> SimulationService:
    return SimulationService(get_simulation_engine())
