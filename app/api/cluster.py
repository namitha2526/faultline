from typing import Optional
from fastapi import APIRouter, BackgroundTasks, Depends, Query, status
from pydantic import BaseModel

from app.core.security import get_optional_project
from app.ml.service import cluster_job_state, run_batch_clustering
from app.models.project import Project

router = APIRouter(prefix="/cluster", tags=["Clustering"])


class ClusterRunRequest(BaseModel):
    algorithm: Optional[str] = None  # "dbscan" or "hdbscan"
    eps: Optional[float] = None
    min_samples: Optional[int] = None


@router.post(
    "/run",
    status_code=status.HTTP_202_ACCEPTED,
    summary="Trigger asynchronous batch embedding and clustering",
)
async def trigger_cluster_run(
    background_tasks: BackgroundTasks,
    request: Optional[ClusterRunRequest] = None,
    project: Optional[Project] = Depends(get_optional_project),
):
    """
    Triggers batch clustering across unclustered/all errors as a FastAPI BackgroundTask.
    Progress and results can be inspected via GET /api/cluster/status.
    """
    algo = request.algorithm if request else None
    eps = request.eps if request else None
    min_samples = request.min_samples if request else None
    project_id = project.id if project else None

    background_tasks.add_task(
        run_batch_clustering,
        algorithm=algo,
        eps=eps,
        min_samples=min_samples,
        project_id=project_id,
    )

    return {
        "status": "started",
        "message": "Batch clustering job has been queued in the background.",
    }


@router.get(
    "/status",
    status_code=status.HTTP_200_OK,
    summary="Get status of current or most recent clustering job",
)
async def get_cluster_status():
    """Returns real-time execution status of the background clustering task."""
    return cluster_job_state
