import json
from pathlib import Path

from app.modules.districts.schemas import District


class DistrictRepository:
    """Read-only repository backed by a local JSON file."""

    def __init__(self, data_file: Path) -> None:
        self._data_file = data_file
        self._cache: tuple[District, ...] | None = None

    def list_all(self) -> list[District]:
        return list(self._load())

    def get_by_id(self, district_id: str) -> District | None:
        return next(
            (district for district in self._load() if district.id == district_id),
            None,
        )

    def _load(self) -> tuple[District, ...]:
        if self._cache is None:
            with self._data_file.open(encoding="utf-8") as file:
                raw_data = json.load(file)
            self._cache = tuple(District.model_validate(item) for item in raw_data)
        return self._cache
