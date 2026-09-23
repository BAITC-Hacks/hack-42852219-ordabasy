from pathlib import Path


class HealthRepository:
    def __init__(self, required_files: tuple[Path, ...]) -> None:
        self._required_files = required_files

    def data_files_available(self) -> bool:
        return all(path.is_file() for path in self._required_files)

