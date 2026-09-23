from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.main import app
from app.modules.analysis.dependencies import get_analysis_service
from app.modules.analysis.service import AnalysisService
from tests.test_simulations_api import REFERENCE

VALID_DRAFT = {
    "summary": (
        "Score вырос с 52.55768 до 56.54307 (+3.99). Использовано 95 из 100, "
        "остаток 5."
    ),
    "strengths": ["Снят критический показатель в районе Нура."],
    "risks": ["Минимальный балл по району остаётся ниже среднего."],
    "tradeoffs": ["Бюджет израсходован почти полностью — остаток 5."],
    "recommendations": ["Рассмотрите меры для района с наименьшим баллом."],
}

INVALID_DRAFT = {**VALID_DRAFT, "summary": VALID_DRAFT["summary"] + " Ожидаемый эффект: -47.3."}


def _install_analysis_service(monkeypatch, responses: list[dict]) -> list[dict]:
    calls: list[dict] = []
    responses_iter = iter(responses)

    def fake_call_openai(**kwargs):
        calls.append(kwargs)
        return next(responses_iter)

    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("APP_ANALYSIS_MODE", "remote")
    get_settings.cache_clear()

    def override() -> AnalysisService:
        return AnalysisService(
            api_key="test-key", model="gpt-4o-mini", timeout=5.0, call_openai=fake_call_openai
        )

    app.dependency_overrides[get_analysis_service] = override
    return calls


def _clear_overrides() -> None:
    app.dependency_overrides.pop(get_analysis_service, None)
    get_settings.cache_clear()


def test_analysis_returns_ai_explanation_with_trusted_scenario_version(
    client: TestClient, monkeypatch
) -> None:
    calls = _install_analysis_service(monkeypatch, [VALID_DRAFT])
    try:
        response = client.post("/api/analysis", json=REFERENCE)
        assert response.status_code == 200, response.text
        body = response.json()
        assert body["scenarioVersion"] == "reference-v1"
        assert body["summary"] == VALID_DRAFT["summary"]
        assert body["strengths"] == VALID_DRAFT["strengths"]
        assert len(calls) == 1
    finally:
        _clear_overrides()


def test_analysis_retries_once_when_a_number_is_not_in_evidence(
    client: TestClient, monkeypatch
) -> None:
    calls = _install_analysis_service(monkeypatch, [INVALID_DRAFT, VALID_DRAFT])
    try:
        response = client.post("/api/analysis", json=REFERENCE)
        assert response.status_code == 200, response.text
        assert response.json()["summary"] == VALID_DRAFT["summary"]
        assert len(calls) == 2
        assert "отсутствующие в evidence" in calls[1]["user_content"]
    finally:
        _clear_overrides()


def test_analysis_rejected_when_numbers_stay_unsupported_after_retry(
    client: TestClient, monkeypatch
) -> None:
    calls = _install_analysis_service(monkeypatch, [INVALID_DRAFT, INVALID_DRAFT])
    try:
        response = client.post("/api/analysis", json=REFERENCE)
        assert response.status_code == 502
        assert response.json()["error"]["code"] == "analysis_unavailable"
        assert len(calls) == 2
    finally:
        _clear_overrides()


def test_analysis_disabled_by_config_returns_404(client: TestClient, monkeypatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("APP_ANALYSIS_MODE", "disabled")
    get_settings.cache_clear()
    try:
        assert client.post("/api/analysis", json=REFERENCE).status_code == 404
    finally:
        get_settings.cache_clear()
