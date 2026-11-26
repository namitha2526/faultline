from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.cluster import Cluster
from app.models.error import Error

router = APIRouter(tags=["Overview"])


@router.get(
    "/overview",
    summary="Get platform totals, compression statistics, and Hash vs Semantic comparison",
)
async def get_overview_metrics(db: AsyncSession = Depends(get_db)):
    # 1. Total errors
    total_errors_stmt = select(func.count(Error.id))
    total_errors = (await db.execute(total_errors_stmt)).scalar() or 0

    # 2. Total clusters
    total_clusters_stmt = select(func.count(Cluster.id))
    total_clusters = (await db.execute(total_clusters_stmt)).scalar() or 0

    # 3. Total unique stack hashes (Sentry baseline issue count)
    distinct_hashes_stmt = select(func.count(func.distinct(Error.stack_hash)))
    total_hash_issues = (await db.execute(distinct_hashes_stmt)).scalar() or 0

    # 4. Recent errors in past 24 hours
    since_24h = datetime.now(timezone.utc) - timedelta(hours=24)
    recent_errors_stmt = select(func.count(Error.id)).where(Error.timestamp >= since_24h)
    recent_24h = (await db.execute(recent_errors_stmt)).scalar() or 0

    # 5. Check spiking clusters (recent surge in last 15 mins)
    since_15m = datetime.now(timezone.utc) - timedelta(minutes=15)
    spiking_stmt = (
        select(Error.cluster_id, func.count(Error.id))
        .where(Error.cluster_id.isnot(None))
        .where(Error.timestamp >= since_15m)
        .group_by(Error.cluster_id)
        .having(func.count(Error.id) >= 6)
    )
    spiking_res = await db.execute(spiking_stmt)
    spiking_clusters_count = len(spiking_res.all())

    # Compression ratios
    compression_ratio = round(total_errors / max(total_clusters, 1), 1) if total_clusters > 0 else 1.0
    hash_compression_ratio = round(total_errors / max(total_hash_issues, 1), 1) if total_hash_issues > 0 else 1.0
    noise_reduction_pct = (
        round(((total_hash_issues - total_clusters) / max(total_hash_issues, 1)) * 100, 1)
        if total_hash_issues > total_clusters
        else 0.0
    )

    return {
        "total_errors": total_errors,
        "total_clusters": total_clusters,
        "total_hash_issues": total_hash_issues,
        "compression_ratio": compression_ratio,
        "hash_compression_ratio": hash_compression_ratio,
        "recent_errors_count_24h": recent_24h,
        "spiking_clusters_count": spiking_clusters_count,
        "comparison": {
            "raw_errors": total_errors,
            "hash_groups": total_hash_issues,
            "semantic_clusters": total_clusters,
            "noise_reduction_pct": noise_reduction_pct,
            "ratio_improvement": f"{compression_ratio}x vs {hash_compression_ratio}x",
        },
    }
