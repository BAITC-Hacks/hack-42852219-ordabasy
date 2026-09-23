"""Public simulator and AI handoff contracts. Values are never rounded here."""

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

from app.modules.districts.schemas import District
from app.modules.initiatives.schemas import Initiative


class Decision(BaseModel):
    model_config = ConfigDict(extra="forbid")
    initiativeId: str = Field(min_length=1, max_length=80, strict=True)
    districtId: str | None = Field(default=None, min_length=1, max_length=80, strict=True)


class ScenarioRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    scenarioVersion: str = Field(default="1", min_length=1, max_length=100, strict=True)
    decisions: list[Decision] = Field(max_length=50)


class ValidationRequest(ScenarioRequest):
    final: bool = False


class SimulationRequest(BaseModel):
    """Legacy import preserved for the untouched teammate AI module."""
    model_config = ConfigDict(extra="forbid")
    initiative_ids: list[str]


class Budget(BaseModel):
    limit: int
    spent: int
    remaining: int


class ValidationIssue(BaseModel):
    model_config = ConfigDict(extra="allow")
    code: str
    message: str


class SimulationValidation(BaseModel):
    valid: bool
    complete: bool
    errors: list[ValidationIssue]
    budget: Budget
    counts: dict[str, int]


class CriticalIndicator(BaseModel):
    districtId: str
    indicator: str
    value: float


class DistrictSnapshot(District):
    profile: str = ""
    score: float
    categories: dict[str, float]


class Snapshot(BaseModel):
    score: float
    averageScore: float
    minimumScore: float
    weakestDistrictId: str
    criticalCount: int
    criticalIndicators: list[CriticalIndicator]
    districts: list[DistrictSnapshot]


class FormulaComponents(BaseModel):
    averageScore: float
    minimumScore: float
    criticalCount: int
    weightedAverage: float
    weightedMinimum: float
    penalty: float


class ScoreBreakdown(BaseModel):
    before: FormulaComponents
    after: FormulaComponents


class MeasureEffect(BaseModel):
    model_config = ConfigDict(extra="allow")
    initiativeId: str
    districtId: str | None
    name: str
    scope: Literal["district", "city"]
    lag: int
    factor: float
    targets: list[str]
    fullEffects: dict[str, float]
    realizedEffects: dict[str, float]


class ActiveSynergy(BaseModel):
    model_config = ConfigDict(extra="allow")
    id: str
    initiatives: list[str]
    targetInitiative: str
    districtId: str
    effects: dict[str, float]


class SimulationResult(BaseModel):
    model_config = ConfigDict(extra="allow")
    scenarioVersion: str
    datasetVersion: str
    decisions: list[dict[str, Any]]
    budget: Budget
    baseline: Snapshot
    result: Snapshot
    scoreChange: float
    scoreBreakdown: ScoreBreakdown
    effects: list[MeasureEffect]
    synergies: list[ActiveSynergy]


class BootstrapResponse(BaseModel):
    datasetVersion: str
    districts: list[District]
    initiatives: list[Initiative]
    indicators: list[dict[str, Any]]
    categories: list[dict[str, Any]]
    rules: dict[str, Any]
    baseline: Snapshot


class AnalysisResponse(BaseModel):
    """Shared output contract; the teammate registers the OpenAI handler."""
    model_config = ConfigDict(extra="forbid")
    scenarioVersion: str
    summary: str
    strengths: list[str]
    risks: list[str]
    tradeoffs: list[str]
    recommendations: list[str]
