from pydantic import BaseModel, ConfigDict, Field


class DistrictIndicators(BaseModel):
    model_config = ConfigDict(frozen=True)

    mobility: float = Field(ge=0, le=100)
    environment: float = Field(ge=0, le=100)
    health: float = Field(ge=0, le=100)
    safety: float = Field(ge=0, le=100)
    economy: float = Field(ge=0, le=100)


class District(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str
    name: str
    population: int = Field(gt=0)
    area_km2: float = Field(gt=0)
    indicators: DistrictIndicators

