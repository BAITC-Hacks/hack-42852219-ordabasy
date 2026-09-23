from pydantic import BaseModel, ConfigDict, Field


class InitiativeImpacts(BaseModel):
    model_config = ConfigDict(frozen=True)

    mobility: float = Field(ge=-100, le=100)
    environment: float = Field(ge=-100, le=100)
    health: float = Field(ge=-100, le=100)
    safety: float = Field(ge=-100, le=100)
    economy: float = Field(ge=-100, le=100)


class Initiative(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str
    name: str
    description: str
    cost: int = Field(ge=0)
    impacts: InitiativeImpacts
    incompatible_with: list[str] = Field(default_factory=list)

