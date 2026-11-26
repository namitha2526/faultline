"""
Faultline 2D Embedding Map Projection
Projects high-dimensional error embeddings (384-D) to 2D using UMAP (or PCA fallback).
Caches projections in-memory for instant frontend response times.
"""

import logging
from typing import Any, Optional
import numpy as np
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.cluster import Cluster
from app.models.error import Error

logger = logging.getLogger(__name__)

# In-memory projection cache: {"last_computed": timestamp, "points": [...]}
_map_cache: Optional[dict[str, Any]] = None


async def get_embedding_map_points(
    db: AsyncSession,
    force_recompute: bool = False,
    max_points: int = 1000,
) -> list[dict[str, Any]]:
    global _map_cache

    if not force_recompute and _map_cache is not None:
        return _map_cache["points"]

    stmt = (
        select(Error, Cluster.title.label("cluster_title"))
        .outerjoin(Cluster, Error.cluster_id == Cluster.id)
        .where(Error.embedding.isnot(None))
        .order_by(Error.timestamp.desc())
        .limit(max_points)
    )

    res = await db.execute(stmt)
    rows = res.all()

    if not rows:
        return []

    errors = [r[0] for r in rows]
    cluster_titles = [r[1] or "Unassigned" for r in rows]

    embeddings = np.array([list(e.embedding) for e in errors])

    # 2D projection via UMAP with PCA fallback
    coords_2d = None
    if len(embeddings) >= 4:
        try:
            import umap

            reducer = umap.UMAP(
                n_neighbors=min(15, len(embeddings) - 1),
                min_dist=0.15,
                metric="cosine",
                random_state=42,
            )
            coords_2d = reducer.fit_transform(embeddings)
        except Exception as e:
            logger.warning(f"[UMAP] Projection failed, falling back to PCA: {e}")

    if coords_2d is None:
        from sklearn.decomposition import PCA

        pca = PCA(n_components=2, random_state=42)
        coords_2d = pca.fit_transform(embeddings)

    points = []
    for i, err in enumerate(errors):
        points.append({
            "id": str(err.id),
            "x": float(round(coords_2d[i, 0], 4)),
            "y": float(round(coords_2d[i, 1], 4)),
            "cluster_id": str(err.cluster_id) if err.cluster_id else None,
            "cluster_title": cluster_titles[i],
            "exception_type": err.exception_type or "Error",
            "message": err.message,
            "browser": err.browser or "Unknown",
            "timestamp": err.timestamp.isoformat(),
        })

    _map_cache = {"points": points}
    return points
