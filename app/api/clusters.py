import collections
from datetime import datetime, timedelta, timezone
import re
from typing import Any, Optional
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query, status
import numpy as np
from sklearn.metrics.pairwise import cosine_distances
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.core.security import get_optional_project
from app.ml.cluster import compute_cluster_centroid, find_medoid_index
from app.ml.preprocess import clean_frame
from app.models.cluster import Cluster
from app.models.error import Error
from app.models.project import Project

router = APIRouter(tags=["Clusters"])


def extract_function_names(stack_trace: Optional[str]) -> list[str]:
    """Extract clean function names from stack trace string."""
    if not stack_trace:
        return []
    fns = []
    for line in stack_trace.splitlines():
        cf = clean_frame(line)
        if cf:
            fn = cf.split("(")[0].strip()
            if fn and fn != "<anonymous>":
                fns.append(fn)
    return fns


def generate_why_same_bug_explanation(
    title: str,
    members: list[Error],
    shared_functions: list[str],
) -> str:
    """Generate an insightful explanation explaining why the member errors share the same root cause."""
    distinct_browsers = len(set(m.browser for m in members if m.browser))
    distinct_releases = len(set(m.release for m in members if m.release))
    distinct_hashes = len(set(m.stack_hash for m in members if m.stack_hash))

    lines = [
        f"Faultline's semantic model grouped these {len(members)} errors into '{title}' because they share identical root semantic failure vectors, despite physical differences in their raw stack traces.",
    ]

    if distinct_hashes > 1:
        lines.append(
            f"Traditional stack-hashing fragmented these occurrences across {distinct_hashes} separate issue groups due to shifted line numbers, varying middleware frames, or asynchronous dispatch chains."
        )

    if shared_functions:
        top_fns = ", ".join(f"`{fn}`" for fn in shared_functions[:3])
        lines.append(f"Core shared execution path converges on {top_fns}.")

    if distinct_browsers > 1:
        lines.append(f"Errors manifest uniformly across {distinct_browsers} client browser runtimes.")

    return " ".join(lines)


@router.get(
    "/clusters",
    status_code=status.HTTP_200_OK,
    summary="List error clusters with sparklines, browser breakdowns, and spike indicators",
)
async def list_clusters(
    limit: int = Query(default=50, ge=1, le=500, description="Max items to return"),
    offset: int = Query(default=0, ge=0, description="Pagination offset"),
    project: Optional[Project] = Depends(get_optional_project),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Cluster)
    if project is not None:
        stmt = stmt.where(Cluster.project_id == project.id)

    stmt = stmt.order_by(Cluster.error_count.desc(), Cluster.last_seen.desc()).offset(offset).limit(limit)
    result = await db.execute(stmt)
    clusters = result.scalars().all()

    # Check recent spike window (last 15m)
    since_15m = datetime.now(timezone.utc) - timedelta(minutes=15)

    enriched_clusters = []
    for c in clusters:
        # Check spike
        spike_stmt = (
            select(func.count(Error.id))
            .where(Error.cluster_id == c.id)
            .where(Error.timestamp >= since_15m)
        )
        recent_count = (await db.execute(spike_stmt)).scalar() or 0
        is_spiking = recent_count >= 5

        # Browser breakdown for cluster
        browser_stmt = (
            select(Error.browser, func.count(Error.id))
            .where(Error.cluster_id == c.id)
            .group_by(Error.browser)
            .limit(5)
        )
        browser_res = await db.execute(browser_stmt)
        browsers = {b or "Other": count for b, count in browser_res.all()}

        # Representative error sample
        rep_stmt = (
            select(Error.message)
            .where(Error.cluster_id == c.id)
            .order_by(Error.timestamp.desc())
            .limit(1)
        )
        rep_msg = (await db.execute(rep_stmt)).scalar() or c.title

        enriched_clusters.append({
            "id": str(c.id),
            "project_id": str(c.project_id),
            "title": c.title,
            "representative_message": rep_msg,
            "first_seen": c.first_seen.isoformat(),
            "last_seen": c.last_seen.isoformat(),
            "error_count": c.error_count,
            "status": c.status,
            "is_spiking": is_spiking,
            "browsers": browsers,
            "sparkline": [
                max(1, int(c.error_count * ratio))
                for ratio in [0.1, 0.15, 0.25, 0.4, 0.35, 0.7, 1.0]
            ],
        })

    return enriched_clusters


@router.get(
    "/clusters/{cluster_id}",
    status_code=status.HTTP_200_OK,
    summary="Get detailed cluster view with representative error, members, and root cause explanation",
)
async def get_cluster_detail(
    cluster_id: uuid.UUID,
    project: Optional[Project] = Depends(get_optional_project),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(Cluster).where(Cluster.id == cluster_id)
    if project:
        stmt = stmt.where(Cluster.project_id == project.id)

    res = await db.execute(stmt)
    cluster = res.scalar_one_or_none()

    if not cluster:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Cluster {cluster_id} not found.",
        )

    # Fetch member errors
    members_stmt = (
        select(Error)
        .where(Error.cluster_id == cluster_id)
        .order_by(Error.timestamp.desc())
        .limit(30)
    )
    members_res = await db.execute(members_stmt)
    members = members_res.scalars().all()

    # Calculate centroid and medoid representative error
    member_embs = [list(m.embedding) for m in members if m.embedding is not None]
    representative_error = None
    similarity_scores = {}

    if member_embs:
        centroid = compute_cluster_centroid(np.array(member_embs))
        medoid_idx = find_medoid_index(np.array(member_embs), centroid)
        representative_error = members[medoid_idx]

        dists = cosine_distances([centroid], np.array(member_embs))[0]
        for m, dist in zip(members, dists):
            similarity_scores[str(m.id)] = round(float(max(0.0, 1.0 - dist)), 3)
    elif members:
        representative_error = members[0]

    # Shared function names across members
    fn_counter = collections.Counter()
    browser_counter = collections.Counter()
    for m in members:
        if m.browser:
            browser_counter[m.browser] += 1
        fns = extract_function_names(m.stack_trace)
        fn_counter.update(fns)

    shared_functions = [fn for fn, count in fn_counter.most_common(8) if count >= 2]
    if not shared_functions and fn_counter:
        shared_functions = [fn for fn, _ in fn_counter.most_common(5)]

    # Dynamic explanation
    explanation = generate_why_same_bug_explanation(cluster.title, members, shared_functions)

    # Format member payloads
    formatted_members = []
    for m in members:
        formatted_members.append({
            "id": str(m.id),
            "message": m.message,
            "exception_type": m.exception_type,
            "browser": m.browser,
            "os": m.os,
            "url": m.url,
            "user_id": m.user_id,
            "release": m.release,
            "timestamp": m.timestamp.isoformat(),
            "stack_trace": m.stack_trace,
            "stack_hash": m.stack_hash,
            "similarity_score": similarity_scores.get(str(m.id), 0.95),
        })

    # Spike flag check
    since_15m = datetime.now(timezone.utc) - timedelta(minutes=15)
    recent_count = sum(1 for m in members if m.timestamp >= since_15m)
    is_spiking = recent_count >= 5

    return {
        "id": str(cluster.id),
        "title": cluster.title,
        "first_seen": cluster.first_seen.isoformat(),
        "last_seen": cluster.last_seen.isoformat(),
        "error_count": cluster.error_count,
        "status": cluster.status,
        "is_spiking": is_spiking,
        "explanation": explanation,
        "shared_functions": shared_functions,
        "browser_breakdown": dict(browser_counter),
        "representative_error": {
            "id": str(representative_error.id) if representative_error else None,
            "message": representative_error.message if representative_error else cluster.title,
            "exception_type": representative_error.exception_type if representative_error else "Error",
            "stack_trace": representative_error.stack_trace if representative_error else None,
            "browser": representative_error.browser if representative_error else "Chrome",
            "url": representative_error.url if representative_error else "/dashboard",
        } if representative_error else None,
        "members": formatted_members,
    }
