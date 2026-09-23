from app.core.exceptions import AppError
from app.modules.health.repository import HealthRepository
from app.modules.health.schemas import HealthResponse


class HealthService:
    def __init__(self, repository: HealthRepository, service_name: str) -> None:
        self._repository = repository
        self._service_name = service_name

    def check(self) -> HealthResponse:
        if not self._repository.data_files_available():
            raise AppError(
                "Required data files are unavailable",
                code="service_unhealthy",
                status_code=503,
            )
        return HealthResponse(status="ok", service=self._service_name, version="0.1.0")

