"""
Faultline Hyperparameter Tuning Script
Sweeps eps, min_samples, and embedding models to identify optimal clustering quality.
Outputs a detailed results table and saves a diagnostic visualization chart (tuning_results.png).
"""

import argparse
import csv
import json
import os
import sys
import numpy as np

# Ensure project root is in python path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(os.path.dirname(current_dir))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from app.ml.cluster import run_clustering
from app.ml.embed import get_embedding_service
from app.ml.evaluate import evaluate_predictions
from app.ml.preprocess import preprocess_error


def sweep_parameters(
    ground_truth_path: str = "data/ground_truth.json",
    model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
    output_chart_path: str = "data/tuning_results.png",
    output_csv_path: str = "data/tuning_results.csv",
):
    if not os.path.exists(ground_truth_path):
        raise FileNotFoundError(f"File not found: {ground_truth_path}")

    with open(ground_truth_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    errors = data["errors"]
    y_true = [e["root_cause_id"] for e in errors]

    print(f"\n[Tuning] Preprocessing {len(errors)} errors...")
    docs = [
        preprocess_error(
            e["payload"].get("exception_type"),
            e["payload"].get("message"),
            e["payload"].get("stack_trace"),
        )
        for e in errors
    ]

    print(f"[Tuning] Embedding with '{model_name}'...")
    embed_svc = get_embedding_service(model_name)
    embeddings = np.array(embed_svc.embed_batch(docs))

    eps_range = [0.12, 0.16, 0.20, 0.22, 0.25, 0.28, 0.32, 0.36]
    min_samples_range = [2, 3, 5]

    results = []

    print(f"\n{'eps':<6} | {'min_samples':<11} | {'F1 Score':<9} | {'ARI':<7} | {'Precision':<9} | {'Recall':<8} | {'Clusters'}")
    print("-" * 68)

    best_f1 = -1.0
    best_config = None

    for ms in min_samples_range:
        for eps in eps_range:
            preds = run_clustering(embeddings, algorithm="dbscan", eps=eps, min_samples=ms)
            metrics = evaluate_predictions(y_true, preds.tolist(), f"DBSCAN(eps={eps}, min_samples={ms})")

            row = {
                "eps": eps,
                "min_samples": ms,
                "precision": metrics["precision"],
                "recall": metrics["recall"],
                "f1": metrics["f1"],
                "ari": metrics["ari"],
                "clusters": metrics["cluster_count"],
            }
            results.append(row)

            if metrics["f1"] > best_f1:
                best_f1 = metrics["f1"]
                best_config = (eps, ms, metrics)

            print(
                f"{eps:<6.2f} | {ms:<11} | "
                f"{metrics['f1'] * 100:>7.2f}% | "
                f"{metrics['ari']:>7.3f} | "
                f"{metrics['precision'] * 100:>7.2f}% | "
                f"{metrics['recall'] * 100:>6.2f}% | "
                f"{metrics['cluster_count']:>8}"
            )

    print("-" * 68)
    if best_config:
        b_eps, b_ms, b_m = best_config
        print(f"\n[Optimal Configuration] eps={b_eps}, min_samples={b_ms} -> F1: {b_m['f1']*100:.2f}%, ARI: {b_m['ari']:.3f}, Clusters: {b_m['cluster_count']}")

    # Save CSV
    os.makedirs(os.path.dirname(output_csv_path), exist_ok=True)
    with open(output_csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["eps", "min_samples", "precision", "recall", "f1", "ari", "clusters"])
        writer.writeheader()
        writer.writerows(results)
    print(f"[Tuning] Results saved to CSV: {output_csv_path}")

    # Generate Chart via Matplotlib
    try:
        import matplotlib.pyplot as plt

        fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5))

        for ms in min_samples_range:
            subset = [r for r in results if r["min_samples"] == ms]
            x = [r["eps"] for r in subset]
            y_f1 = [r["f1"] for r in subset]
            y_ari = [r["ari"] for r in subset]
            ax1.plot(x, y_f1, marker="o", label=f"min_samples={ms}")
            ax2.plot(x, y_ari, marker="s", label=f"min_samples={ms}")

        ax1.set_title("F1 Score vs DBSCAN eps")
        ax1.set_xlabel("eps (cosine distance)")
        ax1.set_ylabel("Pairwise F1 Score")
        ax1.grid(True, linestyle="--", alpha=0.6)
        ax1.legend()

        ax2.set_title("Adjusted Rand Index (ARI) vs DBSCAN eps")
        ax2.set_xlabel("eps (cosine distance)")
        ax2.set_ylabel("Adjusted Rand Index")
        ax2.grid(True, linestyle="--", alpha=0.6)
        ax2.legend()

        plt.tight_layout()
        plt.savefig(output_chart_path, dpi=200)
        plt.close()
        print(f"[Tuning] Visualization chart saved to: {output_chart_path}")
    except Exception as e:
        print(f"[Tuning Warning] Could not generate chart: {e}")

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Faultline Parameter Tuner")
    parser.add_argument("--ground-truth", default="data/ground_truth.json", help="Path to ground truth JSON")
    parser.add_argument("--model", default="sentence-transformers/all-MiniLM-L6-v2", help="Embedding model")
    parser.add_argument("--chart", default="data/tuning_results.png", help="Output chart image path")
    parser.add_argument("--csv", default="data/tuning_results.csv", help="Output CSV path")
    args = parser.parse_args()

    sweep_parameters(
        ground_truth_path=args.ground_truth,
        model_name=args.model,
        output_chart_path=args.chart,
        output_csv_path=args.csv,
    )
