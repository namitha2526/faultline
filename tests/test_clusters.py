import uuid
from datetime import datetime, timezone
import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cluster import Cluster
from app.models.project import Project


@pytest.mark.asyncio
async def test_list_clusters_sorted(
    client: AsyncClient, test_project: Project, db_session: AsyncSession
):
    """Clusters endpoint returns clusters sorted by error_count descending."""
    now = datetime.now(timezone.utc)
    c1 = Cluster(
        id=uuid.uuid4(),
        project_id=test_project.id,
        title="Payment Gateway Timeout",
        first_seen=now,
        last_seen=now,
        error_count=15,
        status="unresolved",
    )
    c2 = Cluster(
        id=uuid.uuid4(),
        project_id=test_project.id,
        title="Null User on Login",
        first_seen=now,
        last_seen=now,
        error_count=82,
        status="unresolved",
    )
    c3 = Cluster(
        id=uuid.uuid4(),
        project_id=test_project.id,
        title="JWT Expired",
        first_seen=now,
        last_seen=now,
        error_count=4,
        status="unresolved",
    )
    db_session.add_all([c1, c2, c3])
    await db_session.commit()

    response = await client.get("/api/clusters")
    assert response.status_code == 200
    clusters = response.json()
    assert len(clusters) == 3

    # Verify descending sort order
    counts = [c["error_count"] for c in clusters]
    assert counts == [82, 15, 4]
    assert clusters[0]["title"] == "Null User on Login"
