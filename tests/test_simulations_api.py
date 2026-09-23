from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.modules.simulations.dependencies import get_simulation_service
from app.modules.simulations.schemas import ScenarioRequest

REFERENCE = {
    "scenarioVersion": "reference-v1",
    "decisions": [
        {"initiativeId": "M7", "districtId": "nura"},
        {"initiativeId": "M8", "districtId": "nura"},
        {"initiativeId": "M10", "districtId": "nura"},
        {"initiativeId": "M12", "districtId": None},
        {"initiativeId": "M5", "districtId": "saryarka"},
    ],
}


def test_bootstrap_has_canonical_dataset_and_exact_baseline(client: TestClient) -> None:
    response = client.get("/api/bootstrap")
    assert response.status_code == 200
    body = response.json()
    assert len(body["districts"]) == 5
    assert len(body["initiatives"]) == 14
    assert len(body["indicators"]) == 10
    assert body["rules"]["budget"] == 100
    assert body["rules"]["decisionCount"] == 5
    assert sum(d["populationShare"] for d in body["districts"]) == pytest.approx(1)
    assert body["baseline"]["score"] == pytest.approx(52.55768)
    assert body["baseline"]["averageScore"] == pytest.approx(56.8624)
    assert body["baseline"]["minimumScore"] == pytest.approx(49.18)
    assert body["baseline"]["weakestDistrictId"] == "nura"
    assert body["baseline"]["criticalCount"] == 2


def test_reference_scenario_matches_published_example(client: TestClient) -> None:
    response = client.post("/api/simulate", json=REFERENCE)
    assert response.status_code == 200, response.text
    body = response.json()
    assert body["scenarioVersion"] == "reference-v1"
    assert body["budget"] == {"limit": 100, "spent": 95, "remaining": 5}
    assert body["result"]["score"] == pytest.approx(56.54307)
    assert body["scoreChange"] == pytest.approx(3.98539)
    assert body["result"]["criticalCount"] == 0
    assert len(body["effects"]) == 5
    assert len(body["synergies"]) == 1
    assert body["synergies"][0]["districtId"] == "nura"
    assert body["synergies"][0]["effects"] == {"B1": 2}
    after = body["scoreBreakdown"]["after"]
    assert after["weightedAverage"] + after["weightedMinimum"] - after["penalty"] == pytest.approx(body["result"]["score"])


def test_drafts_allowed_but_cannot_be_finalized(client: TestClient) -> None:
    payload = {"scenarioVersion": "empty", "decisions": []}
    validation = client.post("/api/validate", json=payload)
    assert validation.status_code == 200
    assert validation.json()["valid"] is True
    assert validation.json()["complete"] is False
    assert validation.json()["budget"]["remaining"] == 100
    final = client.post("/api/simulate", json=payload)
    assert final.status_code == 422
    assert final.json()["error"]["code"] == "simulation_validation_error"
    assert final.json()["error"]["details"]["errors"][0]["message"]


@pytest.mark.parametrize("ids,cost,status", [
    (["M3", "M6", "M7", "M10", "M12"], 100, 200),
    (["M3", "M5", "M8", "M11", "M14"], 101, 422),
])
def test_server_budget_boundaries(client: TestClient, ids, cost, status) -> None:
    decisions = [
        {"initiativeId": item, "districtId": None if item in {"M6", "M12", "M14"} else "nura"}
        for item in ids
    ]
    validation = client.post("/api/validate", json={"decisions": decisions}).json()
    assert validation["budget"]["spent"] == cost
    assert validation["budget"]["remaining"] == 100 - cost
    assert client.post("/api/simulate", json={"decisions": decisions}).status_code == status


@pytest.mark.parametrize("change", [
    "duplicate", "missing_district", "unknown_district", "city_with_district", "unknown_measure", "sixth",
])
def test_server_rejects_invalid_decisions(client: TestClient, change: str) -> None:
    payload = deepcopy(REFERENCE)
    if change == "duplicate":
        payload["decisions"][1] = payload["decisions"][0]
    elif change == "missing_district":
        payload["decisions"][0]["districtId"] = None
    elif change == "unknown_district":
        payload["decisions"][0]["districtId"] = "unknown"
    elif change == "city_with_district":
        payload["decisions"][3]["districtId"] = "nura"
    elif change == "unknown_measure":
        payload["decisions"][0]["initiativeId"] = "fake"
    else:
        payload["decisions"].append({"initiativeId": "M2"})
    response = client.post("/api/simulate", json=payload)
    assert response.status_code == 422
    assert response.json()["error"]["details"]["errors"]


def test_client_cannot_override_cost_effects_score_or_budget(client: TestClient) -> None:
    for extra in [{"budget": 1000}, {"score": 99}, {"result": {"score": 99}}]:
        response = client.post("/api/simulate", json={**REFERENCE, **extra})
        assert response.status_code == 422
    payload = deepcopy(REFERENCE)
    payload["decisions"][0]["cost"] = 0
    assert client.post("/api/simulate", json=payload).status_code == 422


def test_determinism_and_different_target_produce_different_scores(client: TestClient) -> None:
    first = client.post("/api/simulate", json=REFERENCE).json()
    repeated = client.post("/api/simulate", json=REFERENCE).json()
    assert first == repeated
    reordered = {**REFERENCE, "decisions": list(reversed(REFERENCE["decisions"]))}
    assert client.post("/api/simulate", json=reordered).json()["result"] == first["result"]
    other = deepcopy(REFERENCE)
    other["decisions"][0]["districtId"] = "esil"
    assert client.post("/api/simulate", json=other).json()["result"]["score"] != first["result"]["score"]


def test_ai_handoff_reuses_validated_engine_and_keeps_version(client: TestClient) -> None:
    service = get_simulation_service()
    context = service.analysis_context(ScenarioRequest.model_validate(REFERENCE))
    assert context == client.post("/api/simulate", json=REFERENCE).json()
    assert context["scenarioVersion"] == "reference-v1"


def test_ai_unavailable_does_not_prevent_simulation(client: TestClient, monkeypatch) -> None:
    # Simulate no OpenAI key configured, regardless of the developer's local .env.
    monkeypatch.setenv("OPENAI_API_KEY", "")
    monkeypatch.setenv("APP_ANALYSIS_MODE", "disabled")
    get_settings.cache_clear()
    try:
        assert client.post("/api/analysis", json=REFERENCE).status_code == 404
        assert client.post("/api/simulate", json=REFERENCE).status_code == 200
    finally:
        get_settings.cache_clear()


def test_legacy_calculation_route_uses_same_engine(client: TestClient) -> None:
    modern = client.post("/api/simulate", json=REFERENCE)
    legacy = client.post("/api/v1/simulations/calculate", json=REFERENCE)
    assert modern.status_code == legacy.status_code == 200
    assert modern.json() == legacy.json()


def test_old_ai_request_reports_migration_without_crashing(client: TestClient) -> None:
    response = client.post("/api/v1/ai-analysis", json={"initiative_ids": ["M7"]})
    assert response.status_code == 422
    assert response.json()["error"]["details"]["errors"][0]["code"] == "legacy_request"
