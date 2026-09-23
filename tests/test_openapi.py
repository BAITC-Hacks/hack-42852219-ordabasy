from fastapi.testclient import TestClient


def test_required_paths_are_documented(client: TestClient) -> None:
    paths = client.get("/openapi.json").json()["paths"]

    assert {
        "/api/bootstrap",
        "/api/simulate",
        "/api/analysis",
        "/api/validate",
        "/api/config",
        "/api/health",
        "/api/v1/districts",
        "/api/v1/districts/{district_id}",
        "/api/v1/initiatives",
        "/api/v1/simulations/validate",
        "/api/v1/simulations/calculate",
        "/api/v1/ai-analysis",
        "/api/v1/health",
    }.issubset(paths)
