"""
Faultline Clustering Engine
Supports DBSCAN (cosine distance) and HDBSCAN through a unified interface.
Provides centroid/medoid title derivation, optional Ollama LLM summarization,
and fast incremental assignment for sub-200ms ingestion latency.
"""

import logging
import uuid
from typing import Optional, Union
import httpx
import numpy as np
from sklearn.cluster import DBSCAN, HDBSCAN
from sklearn.metrics.pairwise import cosine_distances

from app.core.config import settings

logger = logging.getLogger(__name__)


def run_clustering(
    embeddings: np.ndarray,
    algorithm: str = "dbscan",
    eps: float = 0.20,
    min_samples: int = 3,
) -> np.ndarray:
    """
    Cluster embeddings using either DBSCAN or HDBSCAN with cosine metric.
    Returns integer cluster labels (-1 represents unclustered noise).
    """
    if len(embeddings) == 0:
        return np.array([], dtype=int)

    algo = algorithm.lower().strip()

    if algo == "hdbscan":
        # Compute cosine distance matrix for HDBSCAN robustness
        dist_matrix = cosine_distances(embeddings)
        clusterer = HDBSCAN(
            min_cluster_size=max(2, min_samples),
            min_samples=max(1, min_samples - 1),
            metric="precomputed",
        )
        labels = clusterer.fit_predict(dist_matrix)
    else:
        # Default: DBSCAN with cosine distance
        clusterer = DBSCAN(
            eps=eps,
            min_samples=min_samples,
            metric="cosine",
        )
        labels = clusterer.fit_predict(embeddings)

    return labels


def compute_cluster_centroid(embeddings: np.ndarray) -> np.ndarray:
    """Compute normalized mean centroid vector for a cluster."""
    mean_vec = np.mean(embeddings, axis=0)
    norm = np.linalg.norm(mean_vec)
    if norm > 0:
        return mean_vec / norm
    return mean_vec


def find_medoid_index(embeddings: np.ndarray, centroid: np.ndarray) -> int:
    """Find the index of the embedding closest to the cluster centroid."""
    distances = cosine_distances([centroid], embeddings)[0]
    return int(np.argmin(distances))


async def generate_cluster_title(
    representative_error_message: str,
    exception_type: Optional[str] = None,
    all_sample_messages: Optional[list[str]] = None,
) -> str:
    """
    Derive cluster title:
    1. If ENABLE_OLLAMA_SUMMARY is True, queries local Ollama instance.
    2. Otherwise derives high-quality title from the medoid error.
    """
    if settings.ENABLE_OLLAMA_SUMMARY:
        try:
            samples = all_sample_messages[:5] if all_sample_messages else [representative_error_message]
            prompt = (
                "You are an SRE error analyzer. Summarize these related error messages into "
                "a concise, 4-8 word root cause title (no quotes, no punctuation):\n"
                + "\n".join(f"- {s}" for s in samples)
            )
            async with httpx.AsyncClient(timeout=3.0) as client:
                res = await client.post(
                    f"{settings.OLLAMA_URL.rstrip('/')}/api/generate",
                    json={
                        "model": settings.OLLAMA_MODEL,
                        "prompt": prompt,
                        "stream": False,
                    },
                )
                if res.status_code == 200:
                    title = res.json().get("response", "").strip()
                    if title and len(title) < 150:
                        return title
        except Exception as e:
            logger.debug(f"[Ollama] Falling back to medoid title: {e}")

    # Default heuristic: clean medoid title
    prefix = f"{exception_type}: " if exception_type else ""
    clean_msg = representative_error_message.strip()
    if len(clean_msg) > 90:
        clean_msg = clean_msg[:87] + "..."
    return f"{prefix}{clean_msg}" if not clean_msg.startswith(prefix) else clean_msg


def assign_incrementally(
    new_embedding: list[float],
    cluster_centroids: dict[Union[uuid.UUID, str], np.ndarray],
    threshold: Optional[float] = None,
) -> Optional[Union[uuid.UUID, str]]:
    """
    Assign a single new error embedding to the closest existing cluster centroid
    if within the distance threshold.
    Returns cluster_id if matched, or None if unassigned (pending pool).
    """
    if not cluster_centroids:
        return None

    eps_thresh = threshold if threshold is not None else settings.INCREMENTAL_ASSIGNMENT_THRESHOLD
    query_vec = np.array(new_embedding).reshape(1, -1)

    cluster_ids = list(cluster_centroids.keys())
    centroids_matrix = np.array([cluster_centroids[cid] for cid in cluster_ids])

    # Compute cosine distances: shape (1, N_clusters)
    distances = cosine_distances(query_vec, centroids_matrix)[0]

    min_idx = int(np.argmin(distances))
    min_dist = distances[min_idx]

    if min_dist <= eps_thresh:
        return cluster_ids[min_idx]

    return None
