import os
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.ml.evaluate import run_evaluation
from app.ml.map_projection import get_embedding_map_points

router = APIRouter(tags=["Visualization & Evaluation"])

# In-memory cached evaluation results
_eval_cache: Optional[dict] = None


@router.get(
    "/embedding-map",
    status_code=status.HTTP_200_OK,
    summary="Get 2D UMAP projection of all error embeddings for scatter plot visualization",
)
async def get_embedding_map(
    recompute: bool = Query(default=False, description="Force recomputation of 2D UMAP projection"),
    db: AsyncSession = Depends(get_db),
):
    points = await get_embedding_map_points(db, force_recompute=recompute)
    return {
        "total_points": len(points),
        "points": points,
    }


@router.get(
    "/evaluation",
    status_code=status.HTTP_200_OK,
    summary="Get benchmark evaluation metrics comparing Hash Baseline vs DBSCAN vs HDBSCAN",
)
async def get_evaluation_metrics(
    recompute: bool = Query(default=False, description="Re-run evaluation benchmark"),
):
    global _eval_cache
    if not recompute and _eval_cache is not None:
        return _eval_cache

    gt_path = os.path.join(
        os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
        "data",
        "ground_truth.json",
    )
    if not os.path.exists(gt_path):
        return {
            "error": "Ground truth dataset not found. Generate via data/generator.py first.",
            "results": [],
        }

    metrics = run_evaluation(ground_truth_path=gt_path, eps=0.22, min_samples=3)
    _eval_cache = metrics
    return metrics
