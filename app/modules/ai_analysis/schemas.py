from pydantic import BaseModel, ConfigDict


class AIAnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    initiative_ids: list[str]


class AIAnalysisResponse(BaseModel):
    analysis: str
    strengths: list[str]
    risks: list[str]
    recommendations: list[str]

