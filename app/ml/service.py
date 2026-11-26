"""
Faultline ML Orchestration Service
Coordinates preprocessing, embedding generation, database persistence,
batch clustering background jobs, and sub-200ms incremental error assignment.
"""

import asyncio
from datetime import datetime, timezone
import logging
import uuid
from typing import Any, Optional
import numpy as np
from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.db import AsyncSessionLocal
from app.ml.cluster import (
    assign_incrementally,
    compute_cluster_centroid,
    find_medoid_index,
    generate_cluster_title,
    run_clustering,
)
from app.ml.embed import get_embedding_service
from app.ml.preprocess import preprocess_error
from app.models.cluster import Cluster
from app.models.error import Error

logger = logging.getLogger(__name__)

# Global state for background clustering job
cluster_job_state: dict[str, Any] = {
    "status": "idle",  # "idle" | "running" | "completed" | "failed"
    "started_at": None,
    "completed_at": None,
    "clusters_created": 0,
    "errors_processed": 0,
    "error_message": None,
}

# In-memory centroid cache for ultra-fast incremental lookups: {project_id: {cluster_id: centroid_vec}}
_centroid_cache: dict[uuid.UUID, dict[uuid.UUID, np.ndarray]] = {}


async def refresh_project_centroids(db: AsyncSession, project_id: uuid.UUID) -> dict[uuid.UUID, np.ndarray]:
    """Calculate and cache cluster centroids for a project from their member error embeddings."""
    stmt = (
        select(Error.cluster_id, Error.embedding)
        .where(Error.project_id == project_id)
        .where(Error.cluster_id.isnot(None))
        .where(Error.embedding.isnot(None))
    )
    res = await db.execute(stmt)
    rows = res.all()

    cluster_embeddings: dict[uuid.UUID, list[list[float]]] = {}
    for cid, emb in rows:
        if cid not in cluster_embeddings:
            cluster_embeddings[cid] = []
        cluster_embeddings[cid].append(list(emb))

    centroids = {}
    for cid, embs in cluster_embeddings.items():
        if embs:
            centroids[cid] = compute_cluster_centroid(np.array(embs))

    _centroid_cache[project_id] = centroids
    return centroids


async def get_cached_centroids(db: AsyncSession, project_id: uuid.UUID) -> dict[uuid.UUID, np.ndarray]:
    if project_id in _centroid_cache and _centroid_cache[project_id]:
        return _centroid_cache[project_id]
    return await refresh_project_centroids(db, project_id)


async def assign_error_incrementally(
    db: AsyncSession,
    error: Error,
) -> Optional[uuid.UUID]:
    """
    Generate embedding for a newly ingested error, and attempt incremental
    assignment to an existing cluster in under ~50ms.
    """
    embed_svc = get_embedding_service()

    # 1. Preprocess error
    doc = preprocess_error(
        exception_type=error.exception_type,
        message=error.message,
        stack_trace=error.stack_trace,
    )

    # 2. Embed text
    embedding = embed_svc.embed_text(doc)
    error.embedding = embedding

    # 3. Retrieve active centroids
    centroids = await get_cached_centroids(db, error.project_id)

    # 4. Attempt incremental match
    assigned_cluster_id = assign_incrementally(
        new_embedding=embedding,
        cluster_centroids=centroids,
        threshold=settings.INCREMENTAL_ASSIGNMENT_THRESHOLD,
    )

    if assigned_cluster_id:
        # Cast to UUID if needed
        cid = uuid.UUID(str(assigned_cluster_id)) if not isinstance(assigned_cluster_id, uuid.UUID) else assigned_cluster_id
        error.cluster_id = cid

        # Update cluster error count and timestamp
        stmt = (
            update(Cluster)
            .where(Cluster.id == cid)
            .values(
                error_count=Cluster.error_count + 1,
                last_seen=datetime.now(timezone.utc),
            )
        )
        await db.execute(stmt)
        logger.debug(f"[Incremental] Assigned error {error.id} to cluster {cid}")
        return cid
    else:
        # Novel root cause: create a new cluster immediately
        new_cid = uuid.uuid4()
        error.cluster_id = new_cid
        now = datetime.now(timezone.utc)
        clean_title = (
            f"{error.exception_type}: {error.message[:80]}"
            if error.exception_type and not error.message.startswith(error.exception_type)
            else error.message[:90]
        )
        new_cluster = Cluster(
            id=new_cid,
            project_id=error.project_id,
            title=clean_title,
            first_seen=now,
            last_seen=now,
            error_count=1,
            status="unresolved",
        )
        db.add(new_cluster)
        await db.flush()
        centroids[new_cid] = np.array(embedding)
        logger.info(f"[Incremental] Created new cluster {new_cid} for error {error.id}: {clean_title}")
        return new_cid


async def run_batch_clustering(
    algorithm: Optional[str] = None,
    eps: Optional[float] = None,
    min_samples: Optional[int] = None,
    project_id: Optional[uuid.UUID] = None,
):
    """
    Full batch clustering pipeline:
    1. Embed all errors missing embeddings.
    2. Cluster all errors (or unclustered errors).
    3. Form clusters, derive medoid titles, and assign cluster_ids.
    """
    global cluster_job_state
    cluster_job_state["status"] = "running"
    cluster_job_state["started_at"] = datetime.now(timezone.utc).isoformat()
    cluster_job_state["error_message"] = None

    algo = algorithm or settings.CLUSTERING_ALGORITHM
    eps_val = eps if eps is not None else settings.DBSCAN_EPS
    min_samp = min_samples if min_samples is not None else settings.DBSCAN_MIN_SAMPLES

    logger.info(f"[Batch Clustering] Starting with algorithm={algo}, eps={eps_val}, min_samples={min_samp}")

    try:
        async with AsyncSessionLocal() as session:
            # 1. Fetch errors that need embeddings
            stmt = select(Error).order_by(Error.timestamp.asc())
            if project_id:
                stmt = stmt.where(Error.project_id == project_id)

            res = await session.execute(stmt)
            errors = res.scalars().all()

            if not errors:
                cluster_job_state["status"] = "completed"
                cluster_job_state["completed_at"] = datetime.now(timezone.utc).isoformat()
                cluster_job_state["clusters_created"] = 0
                cluster_job_state["errors_processed"] = 0
                return

            embed_svc = get_embedding_service()

            # Batch compute missing embeddings
            missing_embeds_docs = []
            missing_embeds_indices = []
            all_embeddings = []

            for i, err in enumerate(errors):
                if err.embedding is None:
                    doc = preprocess_error(
                        exception_type=err.exception_type,
                        message=err.message,
                        stack_trace=err.stack_trace,
                    )
                    missing_embeds_docs.append(doc)
                    missing_embeds_indices.append(i)
                else:
                    all_embeddings.append(list(err.embedding))

            if missing_embeds_docs:
                logger.info(f"[Batch Clustering] Generating embeddings for {len(missing_embeds_docs)} errors...")
                new_embeddings = embed_svc.embed_batch(missing_embeds_docs)
                for idx, emb in zip(missing_embeds_indices, new_embeddings):
                    errors[idx].embedding = emb

                await session.commit()

            # Collect complete embeddings array
            embed_matrix = np.array([list(err.embedding) for err in errors])

            # 2. Run clustering
            labels = run_clustering(
                embed_matrix,
                algorithm=algo,
                eps=eps_val,
                min_samples=min_samp,
            )

            # Group errors by cluster label
            unique_labels = set(labels)
            clusters_created = 0

            # Delete old clusters for project to perform clean cluster reformation
            # or update existing clusters
            for label in unique_labels:
                if label == -1:
                    # Noise / unclustered
                    continue

                member_indices = np.where(labels == label)[0]
                cluster_members = [errors[idx] for idx in member_indices]
                member_embeddings = embed_matrix[member_indices]

                centroid = compute_cluster_centroid(member_embeddings)
                medoid_idx = find_medoid_index(member_embeddings, centroid)
                medoid_error = cluster_members[medoid_idx]

                sample_messages = [m.message for m in cluster_members[:10]]
                title = await generate_cluster_title(
                    representative_error_message=medoid_error.message,
                    exception_type=medoid_error.exception_type,
                    all_sample_messages=sample_messages,
                )

                cluster_id = uuid.uuid4()
                first_seen = min(m.timestamp for m in cluster_members)
                last_seen = max(m.timestamp for m in cluster_members)

                new_cluster = Cluster(
                    id=cluster_id,
                    project_id=cluster_members[0].project_id,
                    title=title,
                    first_seen=first_seen,
                    last_seen=last_seen,
                    error_count=len(cluster_members),
                    status="unresolved",
                )
                session.add(new_cluster)

                for m in cluster_members:
                    m.cluster_id = cluster_id

                clusters_created += 1

            # Mark noise items as unclustered
            noise_indices = np.where(labels == -1)[0]
            for idx in noise_indices:
                errors[idx].cluster_id = None

            await session.commit()

            # Refresh in-memory centroid caches
            all_project_ids = {e.project_id for e in errors}
            for pid in all_project_ids:
                await refresh_project_centroids(session, pid)

            cluster_job_state["status"] = "completed"
            cluster_job_state["completed_at"] = datetime.now(timezone.utc).isoformat()
            cluster_job_state["clusters_created"] = clusters_created
            cluster_job_state["errors_processed"] = len(errors)
            logger.info(
                f"[Batch Clustering] Completed: {clusters_created} clusters created from {len(errors)} errors."
            )

    except Exception as e:
        logger.error(f"[Batch Clustering Failed] {e}", exc_info=True)
        cluster_job_state["status"] = "failed"
        cluster_job_state["completed_at"] = datetime.now(timezone.utc).isoformat()
        cluster_job_state["error_message"] = str(e)
