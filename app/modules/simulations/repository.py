from app.modules.districts.repository import DistrictRepository
from app.modules.districts.schemas import District
from app.modules.initiatives.repository import InitiativeRepository
from app.modules.initiatives.schemas import Initiative


class SimulationRepository:
    """Provides the reference data needed by the simulation engine."""

    def __init__(
        self,
        district_repository: DistrictRepository,
        initiative_repository: InitiativeRepository,
    ) -> None:
        self._district_repository = district_repository
        self._initiative_repository = initiative_repository

    def get_districts(self) -> list[District]:
        return self._district_repository.list_all()

    def get_all_initiatives(self) -> list[Initiative]:
        return self._initiative_repository.list_all()

    def get_initiatives(self, initiative_ids: list[str]) -> list[Initiative]:
        return self._initiative_repository.get_many(initiative_ids)
