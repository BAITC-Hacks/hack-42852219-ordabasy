from fastapi.testclient import TestClient

from app.core.config import get_settings


def test_application_serves_frontend(client: TestClient) -> None:
    response = client.get("/")
    assert response.status_code == 200
    assert "text/html" in response.headers["content-type"]
    assert "Аким" in response.text
    assert "/static/" in response.text


def test_public_configuration_contains_only_allowlisted_fields(client: TestClient, monkeypatch) -> None:
    monkeypatch.setenv("OPENAI_API_KEY", "secret-test-never-public")
    monkeypatch.setenv("APP_ANALYSIS_MODE", "remote")
    monkeypatch.setenv("APP_PUBLIC_API_BASE_URL", "/api")
    get_settings.cache_clear()
    try:
        response = client.get("/api/config")
        assert response.status_code == 200
        assert response.json() == {"apiBaseUrl": "/api", "analysisMode": "remote"}
        assert "secret-test-never-public" not in response.text
    finally:
        get_settings.cache_clear()


def test_api_health_available_without_openai_key(client: TestClient, monkeypatch) -> None:
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    assert client.get("/api/health").json()["status"] == "ok"


def test_static_mount_does_not_expose_server_files(client: TestClient) -> None:
    assert client.get("/static/.env").status_code == 404
    assert client.get("/static/../app/core/config.py").status_code == 404


def test_separate_frontend_origin_is_allowed(client: TestClient) -> None:
    response = client.options("/api/simulate", headers={
        "Origin": "http://localhost:5173",
        "Access-Control-Request-Method": "POST",
        "Access-Control-Request-Headers": "content-type",
    })
    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_unlisted_origin_is_not_allowed(client: TestClient) -> None:
    response = client.options("/api/simulate", headers={
        "Origin": "https://unrelated.example",
        "Access-Control-Request-Method": "POST",
    })
    assert "access-control-allow-origin" not in response.headers
