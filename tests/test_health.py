import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check_endpoint(client: AsyncClient):
    """Test health check returns HTTP 200 and healthy DB connection."""
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["database"] == "connected"
    assert data["service"] == "faultline-api"


@pytest.mark.asyncio
async def test_root_endpoint(client: AsyncClient):
    """Test root endpoint provides service metadata."""
    response = await client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "platform" in data
    assert data["health"] == "/api/health"
