import json
from pathlib import Path

from app.modules.initiatives.schemas import Initiative


class InitiativeRepository:
    """Read-only repository backed by a local JSON file."""

    def __init__(self, data_file: Path) -> None:
        self._data_file = data_file
        self._cache: tuple[Initiative, ...] | None = None

    def list_all(self) -> list[Initiative]:
        return list(self._load())

    def get_many(self, initiative_ids: list[str]) -> list[Initiative]:
        initiatives_by_id = {item.id: item for item in self._load()}
        return [
            initiatives_by_id[initiative_id]
            for initiative_id in initiative_ids
            if initiative_id in initiatives_by_id
        ]

    def _load(self) -> tuple[Initiative, ...]:
        if self._cache is None:
            with self._data_file.open(encoding="utf-8") as file:
                raw_data = json.load(file)
            self._cache = tuple(Initiative.model_validate(item) for item in raw_data)
        return self._cache
