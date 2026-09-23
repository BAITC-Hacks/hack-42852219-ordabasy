from functools import lru_cache

from app.core.config import get_settings
from app.modules.health.repository import HealthRepository
from app.modules.health.service import HealthService


@lru_cache
def get_health_repository() -> HealthRepository:
    data_dir = get_settings().data_dir
    return HealthRepository(
        (data_dir / "districts.json", data_dir / "initiatives.json")
    )


def get_health_service() -> HealthService:
    return HealthService(get_health_repository(), get_settings().app_name)

