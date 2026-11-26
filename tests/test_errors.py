import uuid
from datetime import datetime, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cluster import Cluster
from app.models.project import Project


@pytest.mark.asyncio
async def test_ingest_error_unauthorized(client: AsyncClient):
    """Attempting ingestion without API key returns 401."""
    payload = {"message": "Test unauthorized error"}
    response = await client.post("/api/errors", json=payload)
    assert response.status_code == 401
    assert "Missing API key" in response.json()["detail"]


@pytest.mark.asyncio
async def test_ingest_error_invalid_key(client: AsyncClient):
    """Attempting ingestion with invalid API key returns 401."""
    payload = {"message": "Test invalid key error"}
    response = await client.post(
        "/api/errors",
        json=payload,
        headers={"X-API-Key": "invalid_bogus_key"},
    )
    assert response.status_code == 401
    assert "Invalid API key" in response.json()["detail"]


@pytest.mark.asyncio
async def test_ingest_error_success(client: AsyncClient, test_project: Project):
    """Ingesting valid error creates record and returns 201 with stack_hash."""
    payload = {
        "message": "TypeError: Cannot read properties of undefined (reading 'token')",
        "exception_type": "TypeError",
        "stack_trace": (
            "    at handleAuthCallback (https://app.faultline.io/src/auth.ts:42:15)\n"
            "    at dispatchLoginAction (https://app.faultline.io/src/store.ts:108:5)"
        ),
        "browser": "Chrome 123",
        "os": "macOS 14",
        "url": "https://app.faultline.io/login",
        "user_id": "usr_7721",
        "release": "v1.4.0",
    }

    response = await client.post(
        "/api/errors",
        json=payload,
        headers={"X-API-Key": test_project.api_key},
    )
    assert response.status_code in (201, 202)
    data = response.json()
    assert "id" in data
    assert data["project_id"] == str(test_project.id)
    assert data["message"] == payload["message"]
    assert data["exception_type"] == "TypeError"
    assert data["browser"] == "Chrome 123"
    assert data["stack_hash"] is not None
    assert len(data["stack_hash"]) == 64


@pytest.mark.asyncio
async def test_ingest_error_bearer_auth(client: AsyncClient, test_project: Project):
    """Bearer token authentication in Authorization header is supported."""
    payload = {"message": "Bearer auth test error"}
    response = await client.post(
        "/api/errors",
        json=payload,
        headers={"Authorization": f"Bearer {test_project.api_key}"},
    )
    assert response.status_code in (201, 202)
    assert response.json()["project_id"] == str(test_project.id)


@pytest.mark.asyncio
async def test_ingest_error_validation_failure(client: AsyncClient, test_project: Project):
    """Submitting empty message triggers Pydantic validation 422."""
    payload = {"message": ""}
    response = await client.post(
        "/api/errors",
        json=payload,
        headers={"X-API-Key": test_project.api_key},
    )
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_list_errors_pagination_and_filter(
    client: AsyncClient, test_project: Project, db_session: AsyncSession
):
    """Listing errors supports pagination and cluster_id filtering."""
    # Create cluster
    cluster = Cluster(
        id=uuid.uuid4(),
        project_id=test_project.id,
        title="Cluster 1",
        first_seen=datetime.now(timezone.utc),
        last_seen=datetime.now(timezone.utc),
        error_count=2,
    )
    db_session.add(cluster)
    await db_session.commit()

    # Ingest 3 errors
    for i in range(3):
        res = await client.post(
            "/api/errors",
            json={"message": f"Error item {i}"},
            headers={"X-API-Key": test_project.api_key},
        )
        assert res.status_code in (201, 202)

    # Fetch with limit
    list_res = await client.get("/api/errors?limit=2&offset=0")
    assert list_res.status_code == 200
    items = list_res.json()
    assert len(items) == 2

    # Fetch offset
    offset_res = await client.get("/api/errors?limit=2&offset=2")
    assert offset_res.status_code == 200
    assert len(offset_res.json()) >= 1

    # Filter by cluster_id (which should be empty right now)
    filtered_res = await client.get(f"/api/errors?cluster_id={cluster.id}")
    assert filtered_res.status_code == 200
    assert len(filtered_res.json()) == 0


@pytest.mark.asyncio
async def test_get_similar_errors(client: AsyncClient, test_project: Project):
    """GET /api/errors/{id}/similar returns nearest neighbor errors."""
    # Ingest 2 related errors and 1 unrelated error
    err1 = await client.post(
        "/api/errors",
        json={"message": "Timeout waiting for payment gateway confirmation"},
        headers={"X-API-Key": test_project.api_key},
    )
    err2 = await client.post(
        "/api/errors",
        json={"message": "Gateway timed out waiting for charge confirmation"},
        headers={"X-API-Key": test_project.api_key},
    )
    err3 = await client.post(
        "/api/errors",
        json={"message": "Cannot read properties of undefined reading avatar_url"},
        headers={"X-API-Key": test_project.api_key},
    )

    err1_id = err1.json()["id"]

    sim_res = await client.get(f"/api/errors/{err1_id}/similar?limit=2")
    assert sim_res.status_code == 200
    similar = sim_res.json()
    assert len(similar) >= 1
    # First similar error should be err2 (payment timeout)
    assert similar[0]["error"]["id"] == err2.json()["id"]
    assert similar[0]["similarity"] > 0.70


@pytest.mark.asyncio
async def test_cluster_endpoints(client: AsyncClient):
    """POST /api/cluster/run and GET /api/cluster/status endpoints execute."""
    run_res = await client.post("/api/cluster/run", json={"algorithm": "dbscan", "eps": 0.22})
    assert run_res.status_code == 202
    assert run_res.json()["status"] == "started"

    status_res = await client.get("/api/cluster/status")
    assert status_res.status_code == 200
    assert "status" in status_res.json()
