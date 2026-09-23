from app.modules.initiatives.repository import InitiativeRepository
from app.modules.initiatives.schemas import Initiative


class InitiativeService:
    def __init__(self, repository: InitiativeRepository) -> None:
        self._repository = repository

    def list_initiatives(self) -> list[Initiative]:
        return self._repository.list_all()
