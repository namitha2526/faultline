import pytest
from httpx import AsyncClient
from app.models.project import Project


@pytest.mark.asyncio
async def test_overview_endpoint(client: AsyncClient):
    """GET /api/overview returns platform metrics and hash vs semantic comparison."""
    res = await client.get("/api/overview")
    assert res.status_code == 200
    data = res.json()
    assert "total_errors" in data
    assert "total_clusters" in data
    assert "compression_ratio" in data
    assert "comparison" in data
    assert "hash_groups" in data["comparison"]
    assert "semantic_clusters" in data["comparison"]


@pytest.mark.asyncio
async def test_cluster_detail_not_found(client: AsyncClient):
    """GET /api/clusters/{id} returns 404 for non-existent cluster."""
    import uuid
    res = await client.get(f"/api/clusters/{uuid.uuid4()}")
    assert res.status_code == 404


@pytest.mark.asyncio
async def test_embedding_map_endpoint(client: AsyncClient):
    """GET /api/embedding-map returns 2D projection points array."""
    res = await client.get("/api/embedding-map")
    assert res.status_code == 200
    data = res.json()
    assert "points" in data
    assert "total_points" in data


@pytest.mark.asyncio
async def test_demo_stream_endpoints(client: AsyncClient):
    """POST /api/demo/start, stop, speed controls live streaming state."""
    start_res = await client.post("/api/demo/start", json={"speed": 3.0, "simulate_spike": False})
    assert start_res.status_code == 200
    assert start_res.json()["status"] in ["started", "already_running"]

    speed_res = await client.post("/api/demo/speed", json={"speed": 5.0})
    assert speed_res.status_code == 200
    assert speed_res.json()["speed"] == 5.0

    stop_res = await client.post("/api/demo/stop")
    assert stop_res.status_code == 200
    assert stop_res.json()["status"] == "stopped"
