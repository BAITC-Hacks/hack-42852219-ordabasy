"""Framework-independent model: original data + decisions = reproducible result.

AI adapters consume these results and never supply costs, effects or scores.
"""

from collections import Counter
from collections.abc import Mapping
from copy import deepcopy
import json
from math import fsum
from pathlib import Path


DATASET_VERSION = "astana-synthetic-v1"
BUDGET = 100
DECISION_COUNT = 5
MAX_PER_CATEGORY = 2
HORIZON_QUARTERS = 8
CRITICAL_THRESHOLD = 40

CATEGORIES = (
    {"id": "transport", "name": "Транспорт"},
    {"id": "ecology", "name": "Экология"},
    {"id": "social", "name": "Социальная инфраструктура"},
    {"id": "safety", "name": "Безопасность"},
    {"id": "services", "name": "Городские сервисы"},
)
INDICATORS = (
    {"id": "T1", "label": "Разгрузка дорог", "category": "transport", "weight": 0.10},
    {"id": "T2", "label": "Доступность общественного транспорта", "category": "transport", "weight": 0.10},
    {"id": "E1", "label": "Озеленение", "category": "ecology", "weight": 0.09},
    {"id": "E2", "label": "Качество воздуха", "category": "ecology", "weight": 0.11},
    {"id": "S1", "label": "Школы и детсады", "category": "social", "weight": 0.11},
    {"id": "S2", "label": "Поликлиники и первичная медпомощь", "category": "social", "weight": 0.11},
    {"id": "B1", "label": "Безопасность улиц", "category": "safety", "weight": 0.09},
    {"id": "B2", "label": "Безопасность дорожного движения", "category": "safety", "weight": 0.09},
    {"id": "C1", "label": "Надёжность ЖКХ", "category": "services", "weight": 0.10},
    {"id": "C2", "label": "Скорость решения обращений жителей", "category": "services", "weight": 0.10},
)
SYNERGIES = (
    {"id": "M1_M2", "initiatives": ["M1", "M2"], "targetInitiative": "M1", "effects": {"T1": 2}},
    {"id": "M10_M12", "initiatives": ["M10", "M12"], "targetInitiative": "M10", "effects": {"B1": 2}},
    {"id": "M5_M6", "initiatives": ["M5", "M6"], "targetInitiative": "M5", "effects": {"E2": 2}},
)
INCOMPATIBILITIES = (
    {"initiatives": ["M1", "M3"], "scope": "global", "message": "M1 и M3 нельзя выбирать вместе: либо автобусные полосы, либо ЛРТ, независимо от районов."},
    {"initiatives": ["M4", "M7"], "scope": "sameDistrict", "message": "Парк и школа конфликтуют за участок: M4 и M7 нельзя выбирать в одном районе."},
    {"initiatives": ["M5", "M13"], "scope": "sameDistrict", "message": "M5 и M13 дублируют программу: их нельзя выбирать в одном районе."},
)


class ValidationError(ValueError):
    """A rejected scenario, with structured errors suitable for an API response."""

    def __init__(self, validation: dict):
        self.validation = deepcopy(validation)
        self.errors = self.validation["errors"]
        super().__init__(" ".join(error["message"] for error in self.errors))


class SimulationEngine:
    """Load canonical data once and produce independent JSON-compatible results."""

    def __init__(self, data_dir: str | Path | None = None):
        data_path = Path(data_dir) if data_dir is not None else Path(__file__).resolve().parents[1] / "data"
        self._districts = json.loads((data_path / "districts.json").read_text(encoding="utf-8"))
        self._initiatives = json.loads((data_path / "initiatives.json").read_text(encoding="utf-8"))
        self._district_index = {district["id"]: district for district in self._districts}
        self._initiative_index = {initiative["id"]: initiative for initiative in self._initiatives}

    def bootstrap(self) -> dict:
        return {
            "datasetVersion": DATASET_VERSION,
            "districts": deepcopy(self._districts),
            "initiatives": deepcopy(self._initiatives),
            "indicators": deepcopy(list(INDICATORS)),
            "categories": deepcopy(list(CATEGORIES)),
            "rules": {
                "budget": BUDGET,
                "decisionCount": DECISION_COUNT,
                "maxPerCategory": MAX_PER_CATEGORY,
                "horizonQuarters": HORIZON_QUARTERS,
                "criticalThreshold": CRITICAL_THRESHOLD,
                "synergies": deepcopy(list(SYNERGIES)),
                "incompatibilities": deepcopy(list(INCOMPATIBILITIES)),
            },
            "baseline": self._snapshot(self._original_values()),
        }

    def validate(self, decisions: list[dict], final: bool = False) -> dict:
        """Validate a draft, or require all five decisions when final is true.

        Extra fields (such as client-supplied cost) never participate in the
        model. A city measure must have districtId absent or null.
        """
        errors = []
        if not isinstance(decisions, list):
            errors.append({"code": "invalid_decisions", "message": "Решения должны быть списком мероприятий."})
            decisions = []
        if len(decisions) > DECISION_COUNT:
            errors.append({"code": "too_many_decisions", "message": "Можно выбрать не более 5 решений."})
        elif final and len(decisions) != DECISION_COUNT:
            errors.append({"code": "incomplete_scenario", "message": "Для запуска выберите ровно 5 решений."})

        selected = {}
        counts = Counter({category["id"]: 0 for category in CATEGORIES})
        spent = 0
        for index, decision in enumerate(decisions):
            if not isinstance(decision, Mapping):
                errors.append({"code": "invalid_decision", "message": f"Решение {index + 1} должно содержать ID мероприятия и район."})
                continue
            initiative_id = decision.get("initiativeId")
            initiative = self._initiative_index.get(initiative_id) if isinstance(initiative_id, str) else None
            if initiative is None:
                errors.append({"code": "unknown_initiative", "message": f"В решении {index + 1} указано неизвестное мероприятие."})
                continue
            spent += initiative["cost"]
            counts[initiative["category"]] += 1
            if initiative_id in selected:
                errors.append({"code": "duplicate_initiative", "message": f"Мероприятие {initiative_id} уже выбрано. Повторы запрещены.", "initiativeIds": [initiative_id]})
            else:
                selected[initiative_id] = decision
            district_id = decision.get("districtId")
            if initiative["scope"] == "district":
                if district_id is None or district_id == "":
                    errors.append({"code": "district_required", "message": f"Для мероприятия {initiative_id} выберите район.", "initiativeIds": [initiative_id]})
                elif not isinstance(district_id, str) or district_id not in self._district_index:
                    errors.append({"code": "unknown_district", "message": f"Для мероприятия {initiative_id} указан неизвестный район.", "initiativeIds": [initiative_id]})
            elif district_id is not None:
                errors.append({"code": "city_district_forbidden", "message": f"Мероприятие {initiative_id} действует на весь город; район указывать не нужно.", "initiativeIds": [initiative_id]})

        if spent > BUDGET:
            errors.append({"code": "budget_exceeded", "message": f"Не хватает {spent - BUDGET} единиц бюджета. Лимит — {BUDGET}."})
        for category in CATEGORIES:
            if counts[category["id"]] > MAX_PER_CATEGORY:
                errors.append({"code": "category_limit", "message": f"В направлении «{category['name']}» можно выбрать не больше 2 мер.", "category": category["id"]})
        for conflict in INCOMPATIBILITIES:
            first, second = conflict["initiatives"]
            if first not in selected or second not in selected:
                continue
            district_id = selected[first].get("districtId")
            same_district = isinstance(district_id, str) and district_id in self._district_index and district_id == selected[second].get("districtId")
            if conflict["scope"] == "global" or same_district:
                error = {"code": "incompatible_initiatives", "message": conflict["message"], "initiativeIds": [first, second]}
                if conflict["scope"] == "sameDistrict":
                    error["districtId"] = district_id
                    error["message"] += f" Район: {self._district_index[district_id]['name']}."
                errors.append(error)

        return {
            "valid": not errors,
            "complete": not errors and len(decisions) == DECISION_COUNT,
            "errors": errors,
            "budget": {"limit": BUDGET, "spent": spent, "remaining": BUDGET - spent},
            "counts": dict(counts),
        }

    def simulate(self, decisions: list[dict], scenario_version: str = "1") -> dict:
        validation = self.validate(decisions, final=True)
        if not validation["valid"]:
            raise ValidationError(validation)

        # Canonical order makes results independent of selection order.
        ordered = sorted(decisions, key=lambda item: int(item["initiativeId"][1:]))
        selected = {item["initiativeId"]: item for item in ordered}
        deltas = {district["id"]: {indicator["id"]: [] for indicator in INDICATORS} for district in self._districts}
        effects = []
        enriched_decisions = []
        for decision in ordered:
            initiative = self._initiative_index[decision["initiativeId"]]
            district_id = decision.get("districtId")
            targets = list(self._district_index) if initiative["scope"] == "city" else [district_id]
            factor = (HORIZON_QUARTERS - initiative["lag"]) / HORIZON_QUARTERS
            realized = {key: value * factor for key, value in initiative["effects"].items()}
            for target in targets:
                for indicator, value in realized.items():
                    deltas[target][indicator].append(value)
            effects.append({
                "initiativeId": initiative["id"], "districtId": district_id,
                "scope": initiative["scope"], "name": initiative["name"],
                "lag": initiative["lag"], "factor": factor, "targets": targets,
                "fullEffects": deepcopy(initiative["effects"]), "realizedEffects": realized,
            })
            enriched_decisions.append({
                "initiativeId": initiative["id"], "districtId": district_id,
                "name": initiative["name"], "category": initiative["category"],
                "scope": initiative["scope"], "cost": initiative["cost"],
                "districtName": self._district_index[district_id]["name"] if district_id else "Весь город",
            })

        synergies = []
        for synergy in SYNERGIES:
            if all(initiative_id in selected for initiative_id in synergy["initiatives"]):
                district_id = selected[synergy["targetInitiative"]]["districtId"]
                for indicator, value in synergy["effects"].items():
                    deltas[district_id][indicator].append(value)
                synergies.append({**deepcopy(synergy), "districtId": district_id})

        original = self._original_values()
        # Clip once, after ALL positive and negative contributions and bonuses.
        final_values = {
            district_id: {
                indicator: min(100, max(0, fsum([value, *deltas[district_id][indicator]])))
                for indicator, value in values.items()
            }
            for district_id, values in original.items()
        }
        baseline = self._snapshot(original)
        result = self._snapshot(final_values)
        return {
            "scenarioVersion": scenario_version,
            "datasetVersion": DATASET_VERSION,
            "decisions": enriched_decisions,
            "budget": validation["budget"],
            "baseline": baseline,
            "result": result,
            "scoreChange": result["score"] - baseline["score"],
            "scoreBreakdown": {"before": self._breakdown(baseline), "after": self._breakdown(result)},
            "effects": effects,
            "synergies": synergies,
        }

    def analysis_context(self, decisions: list[dict], scenario_version: str = "1") -> dict:
        """AI boundary: recompute trusted evidence using this exact model."""
        return self.simulate(decisions, scenario_version=scenario_version)

    def _original_values(self) -> dict:
        return {district["id"]: deepcopy(district["indicators"]) for district in self._districts}

    def _snapshot(self, values_by_district: dict) -> dict:
        districts = []
        critical = []
        for district in self._districts:
            values = values_by_district[district["id"]]
            categories = {}
            for category in CATEGORIES:
                group = [indicator for indicator in INDICATORS if indicator["category"] == category["id"]]
                categories[category["id"]] = fsum(values[indicator["id"]] * indicator["weight"] for indicator in group) / fsum(indicator["weight"] for indicator in group)
            score = fsum(values[indicator["id"]] * indicator["weight"] for indicator in INDICATORS)
            districts.append({
                "id": district["id"], "name": district["name"],
                "populationShare": district["populationShare"],
                "indicators": deepcopy(values), "score": score, "categories": categories,
            })
            critical.extend({"districtId": district["id"], "indicator": indicator["id"], "value": values[indicator["id"]]} for indicator in INDICATORS if values[indicator["id"]] < CRITICAL_THRESHOLD)
        average = fsum(district["score"] * district["populationShare"] for district in districts)
        weakest = min(districts, key=lambda district: district["score"])
        return {
            "score": 0.7 * average + 0.3 * weakest["score"] - len(critical),
            "averageScore": average, "minimumScore": weakest["score"],
            "weakestDistrictId": weakest["id"], "criticalCount": len(critical),
            "criticalIndicators": critical, "districts": districts,
        }

    @staticmethod
    def _breakdown(snapshot: dict) -> dict:
        return {
            "averageScore": snapshot["averageScore"], "minimumScore": snapshot["minimumScore"],
            "criticalCount": snapshot["criticalCount"],
            "weightedAverage": 0.7 * snapshot["averageScore"],
            "weightedMinimum": 0.3 * snapshot["minimumScore"],
            "penalty": snapshot["criticalCount"],
        }
