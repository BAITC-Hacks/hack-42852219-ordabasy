from functools import lru_cache

from app.core.config import get_settings
from app.modules.initiatives.repository import InitiativeRepository
from app.modules.initiatives.service import InitiativeService


@lru_cache
def get_initiative_repository() -> InitiativeRepository:
    return InitiativeRepository(get_settings().data_dir / "initiatives.json")


def get_initiative_service() -> InitiativeService:
    return InitiativeService(get_initiative_repository())

