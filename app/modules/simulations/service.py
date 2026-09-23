from collections import Counter

from app.core.exceptions import SimulationValidationError
from app.modules.districts.schemas import District
from app.modules.initiatives.schemas import Initiative
from app.modules.simulations.repository import SimulationRepository
from app.modules.simulations.schemas import (
    ScoreBreakdown,
    SimulationRequest,
    SimulationResult,
    SimulationValidation,
)

METRICS = ("mobility", "environment", "health", "safety", "economy")
SCORE_WEIGHTS = {
    "mobility": 0.25,
    "environment": 0.20,
    "health": 0.20,
    "safety": 0.20,
    "economy": 0.15,
}


class SimulationService:
    def __init__(
        self,
        repository: SimulationRepository,
        *,
        budget: int,
        required_initiatives: int,
    ) -> None:
        self._repository = repository
        self._budget = budget
        self._required_initiatives = required_initiatives

    def validate(self, request: SimulationRequest) -> SimulationValidation:
        ids = request.initiative_ids
        all_initiatives = {item.id: item for item in self._repository.get_all_initiatives()}
        errors: list[str] = []

        if len(ids) != self._required_initiatives:
            errors.append(
                f"Exactly {self._required_initiatives} initiatives must be selected"
            )

        duplicates = sorted(item_id for item_id, count in Counter(ids).items() if count > 1)
        if duplicates:
            errors.append(f"Initiatives cannot be repeated: {', '.join(duplicates)}")

        unknown_ids = sorted(set(ids) - set(all_initiatives))
        if unknown_ids:
            errors.append(f"Unknown initiatives: {', '.join(unknown_ids)}")

        selected = [all_initiatives[item_id] for item_id in ids if item_id in all_initiatives]
        total_cost = sum(item.cost for item in selected)
        if total_cost > self._budget:
            errors.append(
                f"Budget exceeded by {total_cost - self._budget} points "
                f"(limit: {self._budget})"
            )

        errors.extend(self._find_incompatibilities(selected))
        return SimulationValidation(
            valid=not errors,
            total_cost=total_cost,
            remaining_budget=self._budget - total_cost,
            errors=errors,
        )

    def calculate(self, request: SimulationRequest) -> SimulationResult:
        validation = self.validate(request)
        if not validation.valid:
            raise SimulationValidationError(validation.errors)

        districts = self._repository.get_districts()
        initiatives = self._repository.get_initiatives(request.initiative_ids)
        baseline_values = self._population_weighted_baseline(districts)
        projected_values = {
            metric: self._clamp(
                baseline_values[metric]
                + sum(getattr(item.impacts, metric) for item in initiatives)
            )
            for metric in METRICS
        }
        baseline_score = self._quality_of_life_score(baseline_values)
        score = self._quality_of_life_score(projected_values)

        return SimulationResult(
            initiative_ids=request.initiative_ids,
            total_cost=validation.total_cost,
            remaining_budget=validation.remaining_budget,
            baseline_score=baseline_score,
            score=score,
            score_change=round(score - baseline_score, 2),
            baseline=ScoreBreakdown(**baseline_values),
            projected=ScoreBreakdown(**projected_values),
        )

    @staticmethod
    def _find_incompatibilities(initiatives: list[Initiative]) -> list[str]:
        selected_ids = {item.id for item in initiatives}
        incompatible_pairs: set[tuple[str, str]] = set()
        for item in initiatives:
            for incompatible_id in item.incompatible_with:
                if incompatible_id in selected_ids:
                    incompatible_pairs.add(tuple(sorted((item.id, incompatible_id))))
        return [
            f"Incompatible initiatives: {first} and {second}"
            for first, second in sorted(incompatible_pairs)
        ]

    @staticmethod
    def _population_weighted_baseline(districts: list[District]) -> dict[str, float]:
        total_population = sum(district.population for district in districts)
        return {
            metric: round(
                sum(
                    district.population * getattr(district.indicators, metric)
                    for district in districts
                )
                / total_population,
                2,
            )
            for metric in METRICS
        }

    @staticmethod
    def _quality_of_life_score(values: dict[str, float]) -> float:
        return round(sum(values[metric] * SCORE_WEIGHTS[metric] for metric in METRICS), 2)

    @staticmethod
    def _clamp(value: float) -> float:
        return round(max(0.0, min(100.0, value)), 2)
