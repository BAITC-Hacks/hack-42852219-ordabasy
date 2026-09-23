from app.core.exceptions import NotFoundError
from app.modules.districts.repository import DistrictRepository
from app.modules.districts.schemas import District


class DistrictService:
    def __init__(self, repository: DistrictRepository) -> None:
        self._repository = repository

    def list_districts(self) -> list[District]:
        return self._repository.list_all()

    def get_district(self, district_id: str) -> District:
        district = self._repository.get_by_id(district_id)
        if district is None:
            raise NotFoundError(
                f"District '{district_id}' was not found",
                details={"district_id": district_id},
            )
        return district
