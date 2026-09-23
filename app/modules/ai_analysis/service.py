from app.modules.ai_analysis.repository import AnalysisReferenceRepository
from app.modules.ai_analysis.schemas import AIAnalysisRequest, AIAnalysisResponse
from app.modules.simulations.schemas import SimulationRequest
from app.modules.simulations.service import METRICS, SimulationService


class AIAnalysisService:
    """Creates an explainable text summary without affecting Score calculation."""

    def __init__(
        self,
        simulation_service: SimulationService,
        reference_repository: AnalysisReferenceRepository,
    ) -> None:
        self._simulation_service = simulation_service
        self._reference_repository = reference_repository

    def analyze(self, request: AIAnalysisRequest) -> AIAnalysisResponse:
        result = self._simulation_service.calculate(
            SimulationRequest(initiative_ids=request.initiative_ids)
        )
        baseline = result.baseline.model_dump()
        projected = result.projected.model_dump()
        changes = {metric: projected[metric] - baseline[metric] for metric in METRICS}
        strongest_metric = max(METRICS, key=lambda metric: changes[metric])
        weakest_metric = min(METRICS, key=lambda metric: projected[metric])

        strengths = [
            (
                f"Наибольший прирост даёт направление «"
                f"{self._reference_repository.metric_label(strongest_metric)}»: "
                f"{changes[strongest_metric]:+.2f} пункта."
            )
        ]
        improved_metrics = [metric for metric in METRICS if changes[metric] > 0]
        if len(improved_metrics) >= 3:
            strengths.append(
                f"Пакет улучшает {len(improved_metrics)} из {len(METRICS)} направлений."
            )

        risks = [
            (
                f"Самый низкий прогнозный показатель — «"
                f"{self._reference_repository.metric_label(weakest_metric)}» "
                f"({projected[weakest_metric]:.2f})."
            )
        ]
        declining_metrics = [metric for metric in METRICS if changes[metric] < 0]
        risks.extend(
            f"Показатель «{self._reference_repository.metric_label(metric)}» снижается на "
            f"{abs(changes[metric]):.2f} пункта."
            for metric in declining_metrics
        )

        analysis = (
            f"Выбранный пакет повышает Astana Quality of Life Score с "
            f"{result.baseline_score:.2f} до {result.score:.2f} "
            f"({result.score_change:+.2f}). Использовано {result.total_cost} из "
            f"{result.total_cost + result.remaining_budget} "
            f"бюджетных пунктов."
        )
        return AIAnalysisResponse(
            analysis=analysis,
            strengths=strengths,
            risks=risks,
            recommendations=[self._reference_repository.recommendation(weakest_metric)],
        )
