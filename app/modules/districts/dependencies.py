from functools import lru_cache

from app.core.config import get_settings
from app.modules.districts.repository import DistrictRepository
from app.modules.districts.service import DistrictService


@lru_cache
def get_district_repository() -> DistrictRepository:
    return DistrictRepository(get_settings().data_dir / "districts.json")


def get_district_service() -> DistrictService:
    return DistrictService(get_district_repository())

