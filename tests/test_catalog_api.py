from fastapi.testclient import TestClient


def test_health(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "AstanaInnovation",
        "version": "0.1.0",
    }


def test_list_and_get_districts(client: TestClient) -> None:
    list_response = client.get("/api/v1/districts")
    district_response = client.get("/api/v1/districts/esil")

    assert list_response.status_code == 200
    assert len(list_response.json()) == 6
    assert district_response.status_code == 200
    assert district_response.json()["name"] == "Есіл"


def test_unknown_district_uses_central_error_format(client: TestClient) -> None:
    response = client.get("/api/v1/districts/unknown")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"


def test_list_initiatives(client: TestClient) -> None:
    response = client.get("/api/v1/initiatives")

    assert response.status_code == 200
    assert len(response.json()) == 10


def test_cors_allows_nextjs_origin(client: TestClient) -> None:
    response = client.options(
        "/api/v1/health",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:3000"


def test_unknown_route_uses_central_error_format(client: TestClient) -> None:
    response = client.get("/api/v1/not-a-route")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "not_found"
