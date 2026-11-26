"""Convenience runner for Faultline ML Evaluation."""
import os
import sys

# Ensure project root is in path
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from app.ml.evaluate import run_evaluation

if __name__ == "__main__":
    gt_path = os.path.join(current_dir, "ground_truth.json")
    run_evaluation(ground_truth_path=gt_path)
