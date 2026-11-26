import uuid
from datetime import datetime, timedelta, timezone
from typing import Optional
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
import numpy as np
from sklearn.metrics.pairwise import cosine_distances
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import get_db
from app.core.hasher import compute_stack_hash
from app.core.security import get_current_project, get_optional_project
from app.ml.embed import get_embedding_service
from app.ml.preprocess import preprocess_error
from app.ml.service import assign_error_incrementally, run_batch_clustering
from app.models.error import Error
from app.models.project import Project
from app.schemas.error import ErrorCreate, ErrorRead, SimilarErrorRead

router = APIRouter(tags=["Errors"])


@router.post(
    "/errors",
    response_model=ErrorRead,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Ingest an error event with incremental semantic clustering",
)
async def ingest_error(
    payload: ErrorCreate,
    background_tasks: BackgroundTasks,
    project: Project = Depends(get_current_project),
    db: AsyncSession = Depends(get_db),
):
    """
    Ingest a new error event for the authenticated project.
    Validates payload, calculates Sentry-style stack hash, generates semantic embedding,
    and performs sub-200ms incremental cluster assignment.
    """
    calculated_hash = compute_stack_hash(
        exception_type=payload.exception_type,
        message=payload.message,
        stack_trace=payload.stack_trace,
    )

    error_time = payload.timestamp or datetime.now(timezone.utc)

    db_error = Error(
        project_id=project.id,
        message=payload.message,
        stack_trace=payload.stack_trace,
        exception_type=payload.exception_type,
        browser=payload.browser,
        os=payload.os,
        url=payload.url,
        user_id=payload.user_id,
        release=payload.release,
        timestamp=error_time,
        stack_hash=calculated_hash,
        embedding=None,
        cluster_id=None,
    )

    db.add(db_error)

    # Sub-200ms incremental embedding and cluster assignment
    try:
        await assign_error_incrementally(db, db_error)
    except Exception as e:
        # Embedding or assignment issue shouldn't drop the ingested error
        pass

    await db.commit()
    await db.refresh(db_error)

    # Broadcast event to frontend via WebSocket feed
    try:
        from app.ml.demo_stream import ws_manager
        from app.models.cluster import Cluster

        cluster_title = "Unassigned / Pending"
        cluster_count = 1
        is_spike = False
        if db_error.cluster_id:
            c_res = await db.get(Cluster, db_error.cluster_id)
            if c_res:
                cluster_title = c_res.title
                cluster_count = c_res.error_count
                since_15m = datetime.now(timezone.utc) - timedelta(minutes=15)
                spike_stmt = (
                    select(func.count(Error.id))
                    .where(Error.cluster_id == db_error.cluster_id)
                    .where(Error.timestamp >= since_15m)
                )
                recent_count = (await db.execute(spike_stmt)).scalar() or 0
                is_spike = recent_count >= 5

        ws_event = {
            "id": str(db_error.id),
            "type": "spike_alert" if is_spike else "error_ingested",
            "error": {
                "id": str(db_error.id),
                "message": db_error.message,
                "exception_type": db_error.exception_type or "Error",
                "browser": db_error.browser or "Chrome 122",
                "os": db_error.os or "Windows 11",
                "url": db_error.url or "",
                "user_id": db_error.user_id or "anon",
                "release": db_error.release or "1.4.1",
                "timestamp": db_error.timestamp.isoformat() if db_error.timestamp else datetime.now(timezone.utc).isoformat(),
                "stack_hash": db_error.stack_hash or "",
                "cluster_id": str(db_error.cluster_id) if db_error.cluster_id else None,
                "cluster_title": cluster_title,
            },
            "cluster": {
                "id": str(db_error.cluster_id) if db_error.cluster_id else None,
                "title": cluster_title,
                "error_count": cluster_count,
            },
            "target_cluster_id": str(db_error.cluster_id) if db_error.cluster_id else "Unassigned",
            "target_cluster_title": cluster_title,
            "target_cluster_count": cluster_count,
            "is_spike": is_spike,
            "timestamp": (db_error.timestamp or datetime.now(timezone.utc)).isoformat(),
        }
        await ws_manager.broadcast(ws_event)
    except Exception:
        pass

    # Check unclustered pending pool threshold to trigger auto-reclustering if needed
    if db_error.cluster_id is None:
        count_stmt = (
            select(func.count(Error.id))
            .where(Error.project_id == project.id)
            .where(Error.cluster_id.is_(None))
        )
        count_res = await db.execute(count_stmt)
        unclustered_count = count_res.scalar() or 0
        if unclustered_count >= settings.PENDING_RECLUSTER_THRESHOLD:
            background_tasks.add_task(run_batch_clustering, project_id=project.id)

    return db_error


@router.get(
    "/errors",
    response_model=list[ErrorRead],
    status_code=status.HTTP_200_OK,
    summary="List error events",
)
async def list_errors(
    cluster_id: Optional[uuid.UUID] = Query(None, description="Filter errors by cluster ID"),
    limit: int = Query(default=50, ge=1, le=500, description="Maximum items to return"),
    offset: int = Query(default=0, ge=0, description="Offset for pagination"),
    project: Optional[Project] = Depends(get_optional_project),
    db: AsyncSession = Depends(get_db),
):
    """
    List errors with optional filtering by cluster_id.
    If authenticated with X-API-Key, results are scoped to that project.
    """
    stmt = select(Error)

    if project is not None:
        stmt = stmt.where(Error.project_id == project.id)

    if cluster_id is not None:
        stmt = stmt.where(Error.cluster_id == cluster_id)

    stmt = stmt.order_by(Error.timestamp.desc()).offset(offset).limit(limit)

    result = await db.execute(stmt)
    errors = result.scalars().all()

    return errors


@router.get(
    "/errors/{error_id}/similar",
    response_model=list[SimilarErrorRead],
    status_code=status.HTTP_200_OK,
    summary="Find nearest neighbor errors using semantic embeddings",
)
async def get_similar_errors(
    error_id: uuid.UUID,
    limit: int = Query(default=5, ge=1, le=50, description="Number of similar errors to return"),
    project: Optional[Project] = Depends(get_optional_project),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieve nearest neighbor errors based on vector cosine distance.
    Uses pgvector in PostgreSQL, with seamless numpy fallback for tests.
    """
    # 1. Fetch target error
    stmt = select(Error).where(Error.id == error_id)
    if project:
        stmt = stmt.where(Error.project_id == project.id)

    res = await db.execute(stmt)
    target = res.scalar_one_or_none()

    if not target:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Error {error_id} not found.",
        )

    # Ensure target has an embedding
    embed_svc = get_embedding_service()
    if target.embedding is None:
        doc = preprocess_error(
            exception_type=target.exception_type,
            message=target.message,
            stack_trace=target.stack_trace,
        )
        target.embedding = embed_svc.embed_text(doc)
        await db.commit()
        await db.refresh(target)

    target_emb = list(target.embedding)

    # 2. Query candidate errors with embeddings
    candidate_stmt = (
        select(Error)
        .where(Error.id != error_id)
        .where(Error.embedding.isnot(None))
    )
    if project:
        candidate_stmt = candidate_stmt.where(Error.project_id == project.id)

    # Check dialect for native pgvector cosine distance operator <=>
    bind = db.bind
    is_postgres = bind and bind.dialect.name == "postgresql"

    if is_postgres:
        try:
            # Native pgvector cosine distance query
            pg_stmt = (
                select(Error, Error.embedding.cosine_distance(target_emb).label("distance"))
                .where(Error.id != error_id)
                .where(Error.embedding.isnot(None))
            )
            if project:
                pg_stmt = pg_stmt.where(Error.project_id == project.id)
            pg_stmt = pg_stmt.order_by("distance").limit(limit)
            pg_res = await db.execute(pg_stmt)
            rows = pg_res.all()
            return [
                SimilarErrorRead(
                    error=ErrorRead.model_validate(err),
                    similarity=float(max(0.0, 1.0 - dist)),
                    distance=float(dist),
                )
                for err, dist in rows
            ]
        except Exception:
            pass  # Fallback to in-memory cosine distance

    # Universal / SQLite fallback
    cand_res = await db.execute(candidate_stmt.limit(500))
    candidates = cand_res.scalars().all()

    if not candidates:
        return []

    target_vec = np.array(target_emb).reshape(1, -1)
    cand_vecs = np.array([list(c.embedding) for c in candidates])
    distances = cosine_distances(target_vec, cand_vecs)[0]

    # Sort indices by distance ascending
    sorted_indices = np.argsort(distances)[:limit]

    results = []
    for idx in sorted_indices:
        dist = float(distances[idx])
        sim = float(max(0.0, 1.0 - dist))
        results.append(
            SimilarErrorRead(
                error=ErrorRead.model_validate(candidates[idx]),
                similarity=sim,
                distance=dist,
            )
        )

    return results
