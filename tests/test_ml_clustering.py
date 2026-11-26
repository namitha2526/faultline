"""
Unit tests for Faultline Clustering & Incremental Assignment.
Tests:
- Incremental assignment to closest cluster within threshold
- Rejection of distant anomalies to pending pool (None)
- Centroid computation and medoid index determination
- Cluster title derivation
- Unified DBSCAN & HDBSCAN interface
"""

import uuid
import numpy as np
import pytest

from app.ml.cluster import (
    assign_incrementally,
    compute_cluster_centroid,
    find_medoid_index,
    generate_cluster_title,
    run_clustering,
)


def test_incremental_assignment_within_threshold():
    """An incoming embedding within eps threshold joins the nearest cluster."""
    cluster_a_id = uuid.uuid4()
    cluster_b_id = uuid.uuid4()

    # Create two synthetic centroids (orthogonal)
    c_a = np.zeros(384)
    c_a[0] = 1.0  # Points along dim 0

    c_b = np.zeros(384)
    c_b[1] = 1.0  # Points along dim 1

    centroids = {
        cluster_a_id: c_a,
        cluster_b_id: c_b,
    }

    # New error that is very close to cluster A (cosine distance ~ 0.05)
    new_vec = np.zeros(384)
    new_vec[0] = 0.95
    new_vec[2] = 0.05
    new_vec /= np.linalg.norm(new_vec)

    assigned_id = assign_incrementally(
        new_embedding=new_vec.tolist(),
        cluster_centroids=centroids,
        threshold=0.25,
    )

    assert assigned_id == cluster_a_id


def test_incremental_assignment_exceeds_threshold():
    """An incoming embedding far from all centroids is rejected to the pending pool (None)."""
    cluster_a_id = uuid.uuid4()

    c_a = np.zeros(384)
    c_a[0] = 1.0

    centroids = {cluster_a_id: c_a}

    # New error orthogonal to cluster A (cosine distance 1.0 > threshold 0.25)
    new_vec = np.zeros(384)
    new_vec[10] = 1.0

    assigned_id = assign_incrementally(
        new_embedding=new_vec.tolist(),
        cluster_centroids=centroids,
        threshold=0.25,
    )

    assert assigned_id is None


def test_centroid_and_medoid_computation():
    """Computes mean centroid and identifies true medoid index."""
    vecs = np.array([
        [1.0, 0.0, 0.0],
        [0.9, 0.1, 0.0],
        [0.8, 0.2, 0.0],
    ])

    centroid = compute_cluster_centroid(vecs)
    assert len(centroid) == 3
    # Check unit norm
    assert np.isclose(np.linalg.norm(centroid), 1.0)

    medoid_idx = find_medoid_index(vecs, centroid)
    # The middle vector [0.9, 0.1, 0.0] is closest to the mean
    assert medoid_idx == 1


@pytest.mark.asyncio
async def test_cluster_title_generation():
    """Derives clean title from medoid error message."""
    title = await generate_cluster_title(
        representative_error_message="Gateway timed out waiting for charge confirmation",
        exception_type="PaymentGatewayTimeoutError",
    )

    assert "PaymentGatewayTimeoutError: Gateway timed out" in title


def test_run_clustering_dbscan_and_hdbscan():
    """Verifies DBSCAN and HDBSCAN execute under the common interface."""
    # 2 distinct clusters in 3D with 15 points each
    np.random.seed(42)
    cluster_1 = np.random.normal(loc=[1.0, 0.0, 0.0], scale=0.01, size=(15, 3))
    cluster_2 = np.random.normal(loc=[0.0, 1.0, 0.0], scale=0.01, size=(15, 3))
    # Normalize
    X = np.vstack([cluster_1, cluster_2])
    X /= np.linalg.norm(X, axis=1, keepdims=True)

    labels_dbscan = run_clustering(X, algorithm="dbscan", eps=0.25, min_samples=3)
    assert len(labels_dbscan) == 30
    assert len(set(labels_dbscan[labels_dbscan != -1])) == 2

    labels_hdbscan = run_clustering(X, algorithm="hdbscan", min_samples=5)
    assert len(labels_hdbscan) == 30
    assert len(set(labels_hdbscan[labels_hdbscan != -1])) >= 1
