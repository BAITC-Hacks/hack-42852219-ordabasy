from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class Initiative(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str
    name: str
    description: str
    cost: int = Field(ge=0)
    category: Literal["transport", "ecology", "social", "safety", "services"]
    scope: Literal["district", "city"]
    lag: int = Field(ge=0, le=8)
    effects: dict[str, float]
