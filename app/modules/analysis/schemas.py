from pydantic import BaseModel, ConfigDict

# JSON schema handed to OpenAI Structured Outputs. Mirrors AnalysisDraft below;
# scenarioVersion is intentionally excluded — the backend stamps it from the
# trusted evidence, never from the model.
RESPONSE_JSON_SCHEMA: dict = {
    "type": "object",
    "additionalProperties": False,
    "properties": {
        "summary": {"type": "string"},
        "strengths": {"type": "array", "items": {"type": "string"}},
        "risks": {"type": "array", "items": {"type": "string"}},
        "tradeoffs": {"type": "array", "items": {"type": "string"}},
        "recommendations": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["summary", "strengths", "risks", "tradeoffs", "recommendations"],
}


class AnalysisDraft(BaseModel):
    """The model's structured output before the trusted scenarioVersion is attached."""
    model_config = ConfigDict(extra="forbid")
    summary: str
    strengths: list[str]
    risks: list[str]
    tradeoffs: list[str]
    recommendations: list[str]
