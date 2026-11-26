"""Convenience runner for Faultline ML Tuning."""
import os
import sys

current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(current_dir)
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from app.ml.tune import sweep_parameters

if __name__ == "__main__":
    gt_path = os.path.join(current_dir, "ground_truth.json")
    chart_path = os.path.join(current_dir, "tuning_results.png")
    csv_path = os.path.join(current_dir, "tuning_results.csv")
    sweep_parameters(ground_truth_path=gt_path, output_chart_path=chart_path, output_csv_path=csv_path)
