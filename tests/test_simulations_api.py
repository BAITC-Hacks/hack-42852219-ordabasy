from fastapi.testclient import TestClient

VALID_SELECTION = [
    "district-clinics",
    "safe-streets",
    "startup-grants",
    "school-air-monitoring",
    "winter-mobility",
]


def test_validate_valid_selection(client: TestClient) -> None:
    response = client.post(
        "/api/v1/simulations/validate",
        json={"initiative_ids": VALID_SELECTION},
    )

    assert response.status_code == 200
    assert response.json() == {
        "valid": True,
        "total_cost": 72,
        "remaining_budget": 28,
        "errors": [],
    }


def test_validate_rejects_duplicates(client: TestClient) -> None:
    response = client.post(
        "/api/v1/simulations/validate",
        json={"initiative_ids": ["safe-streets"] * 5},
    )

    assert response.status_code == 200
    body = response.json()
    assert body["valid"] is False
    assert any("cannot be repeated" in error for error in body["errors"])


def test_validate_rejects_incompatible_items(client: TestClient) -> None:
    response = client.post(
        "/api/v1/simulations/validate",
        json={
            "initiative_ids": [
                "smart-traffic",
                "free-city-parking",
                "bus-electrification",
                "district-clinics",
                "green-corridors",
            ]
        },
    )

    body = response.json()
    assert body["valid"] is False
    assert body["total_cost"] == 98
    assert any("Incompatible initiatives" in error for error in body["errors"])


def test_validate_rejects_over_budget(client: TestClient) -> None:
    response = client.post(
        "/api/v1/simulations/validate",
        json={
            "initiative_ids": [
                "smart-traffic",
                "bus-electrification",
                "green-corridors",
                "district-clinics",
                "safe-streets",
            ]
        },
    )

    body = response.json()
    assert body["valid"] is False
    assert body["total_cost"] == 106
    assert body["remaining_budget"] == -6
    assert any("Budget exceeded" in error for error in body["errors"])


def test_validate_rejects_unknown_initiative(client: TestClient) -> None:
    response = client.post(
        "/api/v1/simulations/validate",
        json={"initiative_ids": [*VALID_SELECTION[:4], "not-real"]},
    )

    assert response.status_code == 200
    assert any("Unknown initiatives" in error for error in response.json()["errors"])


def test_calculation_is_deterministic(client: TestClient) -> None:
    payload = {"initiative_ids": VALID_SELECTION}

    first = client.post("/api/v1/simulations/calculate", json=payload)
    second = client.post("/api/v1/simulations/calculate", json=payload)

    assert first.status_code == 200
    assert first.json() == second.json()
    assert first.json()["score"] > first.json()["baseline_score"]
    assert first.json()["remaining_budget"] == 28


def test_calculate_rejects_invalid_selection(client: TestClient) -> None:
    response = client.post(
        "/api/v1/simulations/calculate",
        json={"initiative_ids": ["safe-streets"]},
    )

    assert response.status_code == 422
    assert response.json()["error"]["code"] == "simulation_validation_error"


def test_ai_analysis_uses_calculated_result(client: TestClient) -> None:
    response = client.post(
        "/api/v1/ai-analysis",
        json={"initiative_ids": VALID_SELECTION},
    )

    assert response.status_code == 200
    body = response.json()
    assert "Astana Quality of Life Score" in body["analysis"]
    assert body["strengths"]
    assert body["risks"]
    assert body["recommendations"]
