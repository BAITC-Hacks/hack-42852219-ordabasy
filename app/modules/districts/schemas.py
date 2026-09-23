from pydantic import BaseModel, ConfigDict, Field


class DistrictIndicators(BaseModel):
    model_config = ConfigDict(frozen=True)

    T1: float = Field(ge=0, le=100)
    T2: float = Field(ge=0, le=100)
    E1: float = Field(ge=0, le=100)
    E2: float = Field(ge=0, le=100)
    S1: float = Field(ge=0, le=100)
    S2: float = Field(ge=0, le=100)
    B1: float = Field(ge=0, le=100)
    B2: float = Field(ge=0, le=100)
    C1: float = Field(ge=0, le=100)
    C2: float = Field(ge=0, le=100)


class District(BaseModel):
    model_config = ConfigDict(frozen=True)

    id: str
    name: str
    populationShare: float = Field(gt=0, le=1)
    profile: str
    indicators: DistrictIndicators
