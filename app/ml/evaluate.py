"""
Faultline Clustering Evaluation Benchmark
Evaluates and benchmarks error grouping quality against /data/ground_truth.json:
- Exact-hash baseline (stack_hash)
- Embedding + DBSCAN
- Embedding + HDBSCAN

Reports:
- Pairwise Precision, Recall, F1
- Adjusted Rand Index (ARI)
- Normalized Mutual Information (NMI)
- Compression Ratio (Total errors / Clusters formed)
- In-depth diagnostics on tricky edge cases (RC-1 vs RC-7, RC-8)
"""

import json
import os
import sys
import time
from typing import Any, Optional
import numpy as np
from sklearn.metrics import adjusted_rand_score, normalized_mutual_info_score

from app.core.hasher import compute_stack_hash
from app.ml.cluster import run_clustering
from app.ml.embed import get_embedding_service
from app.ml.preprocess import preprocess_error


def compute_pairwise_metrics(labels_true: list[Any], labels_pred: list[Any]) -> tuple[float, float, float]:
    """
    Computes pairwise Precision, Recall, and F1 across all sample pairs:
    TP: Same true root cause AND grouped into same cluster
    FP: Different true root causes BUT grouped into same cluster
    FN: Same true root cause BUT split into different clusters
    """
    n = len(labels_true)
    tp = 0
    fp = 0
    fn = 0

    for i in range(n):
        for j in range(i + 1, n):
            same_true = (labels_true[i] == labels_true[j])
            # If predicted label is negative (-1/noise), treat as unclustered / distinct
            pred_i = labels_pred[i]
            pred_j = labels_pred[j]
            same_pred = (pred_i == pred_j) and (pred_i != -1) and (pred_i is not None)

            if same_true and same_pred:
                tp += 1
            elif not same_true and same_pred:
                fp += 1
            elif same_true and not same_pred:
                fn += 1

    precision = tp / (tp + fp) if (tp + fp) > 0 else 0.0
    recall = tp / (tp + fn) if (tp + fn) > 0 else 0.0
    f1 = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0.0

    return precision, recall, f1


def evaluate_predictions(
    y_true: list[str],
    y_pred: list[Any],
    method_name: str,
) -> dict[str, Any]:
    """Calculate complete benchmark suite for a prediction array."""
    precision, recall, f1 = compute_pairwise_metrics(y_true, y_pred)
    ari = float(adjusted_rand_score(y_true, y_pred))
    nmi = float(normalized_mutual_info_score(y_true, y_pred))

    # Calculate cluster count and compression ratio
    unique_clusters = set(y_pred)
    # Exclude noise if represented as -1
    effective_clusters = len([c for c in unique_clusters if c != -1 and c is not None])
    compression_ratio = len(y_true) / max(effective_clusters, 1)

    return {
        "method": method_name,
        "precision": precision,
        "recall": recall,
        "f1": f1,
        "ari": ari,
        "nmi": nmi,
        "cluster_count": effective_clusters,
        "compression_ratio": compression_ratio,
    }


def run_evaluation(
    ground_truth_path: str = "data/ground_truth.json",
    eps: float = 0.22,
    min_samples: int = 3,
    model_name: Optional[str] = None,
) -> dict[str, Any]:
    """Runs side-by-side benchmark comparison on ground_truth.json."""
    if not os.path.exists(ground_truth_path):
        raise FileNotFoundError(f"Ground truth dataset not found at '{ground_truth_path}'. Run data/generator.py first.")

    with open(ground_truth_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    errors = data["errors"]
    total = len(errors)
    y_true = [err["root_cause_id"] for err in errors]

    print(f"\n=========================================================================")
    print(f"       FAULTLINE ERROR CLUSTERING BENCHMARK EVALUATION ({total} Errors)")
    print(f"=========================================================================")

    # 1. Exact-Hash Baseline (Sentry-style stack_hash)
    t0 = time.time()
    hash_preds = []
    for err in errors:
        p = err["payload"]
        sh = compute_stack_hash(p.get("exception_type"), p.get("message"), p.get("stack_trace"))
        hash_preds.append(sh)
    hash_time = time.time() - t0
    hash_metrics = evaluate_predictions(y_true, hash_preds, "Hash Baseline (Sentry)")

    # 2. Preprocess & Embed for ML Clustering
    t0 = time.time()
    embed_svc = get_embedding_service(model_name)
    docs = [
        preprocess_error(
            e["payload"].get("exception_type"),
            e["payload"].get("message"),
            e["payload"].get("stack_trace"),
        )
        for e in errors
    ]
    embeddings = np.array(embed_svc.embed_batch(docs))
    embed_time = time.time() - t0

    # 3. Embedding + DBSCAN
    t0 = time.time()
    dbscan_preds = run_clustering(embeddings, algorithm="dbscan", eps=eps, min_samples=min_samples)
    dbscan_time = time.time() - t0
    dbscan_metrics = evaluate_predictions(y_true, dbscan_preds.tolist(), f"Embedding + DBSCAN (eps={eps})")

    # 4. Embedding + HDBSCAN
    t0 = time.time()
    hdbscan_preds = run_clustering(embeddings, algorithm="hdbscan", min_samples=min_samples)
    hdbscan_time = time.time() - t0
    hdbscan_metrics = evaluate_predictions(y_true, hdbscan_preds.tolist(), "Embedding + HDBSCAN")

    # Print Comparative Results Table
    results = [hash_metrics, dbscan_metrics, hdbscan_metrics]

    headers = f"{'Method':<32} | {'Precision':<9} | {'Recall':<8} | {'F1 Score':<8} | {'ARI':<7} | {'Clusters':<8} | {'Compression'}"
    print("\n" + headers)
    print("-" * len(headers))
    for r in results:
        print(
            f"{r['method']:<32} | "
            f"{r['precision'] * 100:>8.2f}% | "
            f"{r['recall'] * 100:>7.2f}% | "
            f"{r['f1'] * 100:>7.2f}% | "
            f"{r['ari']:>7.3f} | "
            f"{r['cluster_count']:>8} | "
            f"{r['compression_ratio']:>6.1f}x"
        )
    print("-" * len(headers))

    # Diagnose Tricky Cases
    print("\n---------------------- TRICKY CASES DIAGNOSTIC ----------------------")

    # Tricky Case 1: RC-1 (Auth Login) vs RC-7 (Org Settings)
    # Check if any RC-1 and RC-7 share the same cluster
    rc1_indices = [i for i, y in enumerate(y_true) if y == "RC-1"]
    rc7_indices = [i for i, y in enumerate(y_true) if y == "RC-7"]

    rc1_clusters_dbscan = {dbscan_preds[i] for i in rc1_indices if dbscan_preds[i] != -1}
    rc7_clusters_dbscan = {dbscan_preds[i] for i in rc7_indices if dbscan_preds[i] != -1}
    overlap_dbscan = rc1_clusters_dbscan.intersection(rc7_clusters_dbscan)

    print(f"Tricky Case 1 (Superficial message similarity: Login RC-1 vs Org Settings RC-7):")
    print(f"  - RC-1 clusters in DBSCAN: {rc1_clusters_dbscan}")
    print(f"  - RC-7 clusters in DBSCAN: {rc7_clusters_dbscan}")
    if not overlap_dbscan:
        print(f"  [SUCCESS] PERFECT SEPARATION! RC-1 and RC-7 share 0 clusters despite identical error messages.")
    else:
        print(f"  [MISGROUP] RC-1 and RC-7 merged in clusters: {overlap_dbscan}")

    # Tricky Case 2: RC-8 (Redis partition with 4 divergent stack traces)
    rc8_indices = [i for i, y in enumerate(y_true) if y == "RC-8"]
    rc8_hashes = {hash_preds[i] for i in rc8_indices}
    rc8_clusters_dbscan = {dbscan_preds[i] for i in rc8_indices if dbscan_preds[i] != -1}

    print(f"\nTricky Case 2 (Single bug with 4 divergent stack pathways: RC-8 Redis Partition):")
    print(f"  - Sentry Hash Baseline fragmented RC-8 into: {len(rc8_hashes)} separate hash groups.")
    print(f"  - Embedding + DBSCAN unified RC-8 into:       {len(rc8_clusters_dbscan)} cluster(s).")
    if len(rc8_clusters_dbscan) == 1:
        print(f"  [SUCCESS] PERFECT UNIFICATION! All 4 divergent stack pathways grouped into a single cluster!")
    else:
        print(f"  [PARTIAL] RC-8 split into {len(rc8_clusters_dbscan)} clusters.")

    print(f"=========================================================================\n")

    return {
        "results": results,
        "timing": {
            "hash_time_sec": hash_time,
            "embed_time_sec": embed_time,
            "dbscan_time_sec": dbscan_time,
            "hdbscan_time_sec": hdbscan_time,
        },
        "tricky_cases": {
            "tricky_1_separated": len(overlap_dbscan) == 0,
            "tricky_2_hash_groups": len(rc8_hashes),
            "tricky_2_dbscan_clusters": len(rc8_clusters_dbscan),
        },
    }


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Faultline Clustering Benchmark")
    parser.add_argument("--ground-truth", default="data/ground_truth.json", help="Path to ground truth JSON")
    parser.add_argument("--eps", type=float, default=0.22, help="DBSCAN eps parameter")
    parser.add_argument("--min-samples", type=int, default=3, help="Min samples")
    parser.add_argument("--model", default=None, help="Embedding model name")
    args = parser.parse_args()

    run_evaluation(
        ground_truth_path=args.ground_truth,
        eps=args.eps,
        min_samples=args.min_samples,
        model_name=args.model,
    )
