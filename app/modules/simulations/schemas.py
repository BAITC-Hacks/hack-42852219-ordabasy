from pydantic import BaseModel, ConfigDict, Field


class SimulationRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    initiative_ids: list[str] = Field(
        description="Exactly five unique initiative identifiers"
    )


class SimulationValidation(BaseModel):
    valid: bool
    total_cost: int = Field(ge=0)
    remaining_budget: int
    errors: list[str]


class ScoreBreakdown(BaseModel):
    mobility: float = Field(ge=0, le=100)
    environment: float = Field(ge=0, le=100)
    health: float = Field(ge=0, le=100)
    safety: float = Field(ge=0, le=100)
    economy: float = Field(ge=0, le=100)


class SimulationResult(BaseModel):
    initiative_ids: list[str]
    total_cost: int
    remaining_budget: int
    baseline_score: float = Field(ge=0, le=100)
    score: float = Field(ge=0, le=100)
    score_change: float
    baseline: ScoreBreakdown
    projected: ScoreBreakdown

