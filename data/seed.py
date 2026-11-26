"""
Faultline Seed Script
Loads all 600 errors through the real Faultline ingestion API.
Updates ground_truth.json with the generated server IDs and stack_hashes.
"""

import argparse
import asyncio
import json
import os
import sys
import time
import httpx

# Ensure data directory modules can be loaded
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from generator import ROOT_CAUSES, generate_dataset, save_ground_truth


async def run_seed(
    api_url: str = "http://localhost:8000",
    api_key: str = "fl_demo_key_9f8e7d6c5b4a",
    concurrency: int = 15,
):
    api_url = api_url.rstrip("/")
    ground_truth_path = os.path.join(current_dir, "ground_truth.json")

    # 1. Load or generate synthetic dataset
    if not os.path.exists(ground_truth_path):
        print(f"[Seed] ground_truth.json not found, generating dataset...")
        dataset = save_ground_truth(ground_truth_path)
    else:
        print(f"[Seed] Loading existing dataset from {ground_truth_path}...")
        with open(ground_truth_path, "r", encoding="utf-8") as f:
            dataset = json.load(f)

    errors = dataset["errors"]
    total = len(errors)
    print(f"[Seed] Preparing to load {total} errors into Faultline at {api_url}...")

    # 2. Verify API health
    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            health_res = await client.get(f"{api_url}/api/health")
            health_res.raise_for_status()
            print(f"[Seed] Health check passed: {health_res.json()}")
        except Exception as e:
            print(f"[Seed Error] Could not connect to API at {api_url}/api/health: {e}")
            print("Make sure the backend is running (`docker compose up` or `uvicorn app.main:app`).")
            return False

    # 3. Ingest errors concurrently through the real API
    semaphore = asyncio.Semaphore(concurrency)
    success_count = 0
    failure_count = 0
    distinct_stack_hashes = set()
    start_time = time.time()

    async with httpx.AsyncClient(timeout=30.0) as client:
        headers = {
            "Content-Type": "application/json",
            "X-API-Key": api_key,
        }

        async def send_error(item):
            nonlocal success_count, failure_count
            async with semaphore:
                try:
                    payload = item["payload"]
                    res = await client.post(f"{api_url}/api/errors", json=payload, headers=headers)
                    if res.status_code in (201, 202):
                        data = res.json()
                        item["server_id"] = data.get("id")
                        item["server_stack_hash"] = data.get("stack_hash")
                        if data.get("stack_hash"):
                            distinct_stack_hashes.add(data.get("stack_hash"))
                        success_count += 1
                        if success_count % 50 == 0 or success_count == total:
                            print(f"[Seed Progress] Ingested {success_count}/{total} errors...")
                    else:
                        failure_count += 1
                        print(f"[Seed Failed] Status {res.status_code}: {res.text}")
                except Exception as ex:
                    failure_count += 1
                    print(f"[Seed Exception] {ex}")

        tasks = [send_error(err) for err in errors]
        await asyncio.gather(*tasks)

    duration = time.time() - start_time
    print(f"\n==================== SEED SUMMARY ====================")
    print(f"Total Errors Processed: {total}")
    print(f"Successfully Ingested:  {success_count}")
    print(f"Failed:                 {failure_count}")
    print(f"Duration:               {duration:.2f} seconds ({success_count / max(duration, 0.001):.1f} req/s)")
    print(f"True Semantic Causes:   {len(dataset['root_causes'])}")
    print(f"Sentry-Style Hashes:    {len(distinct_stack_hashes)} distinct hashes")
    print(
        f"Insight: Traditional stack hashing fragmented {len(dataset['root_causes'])} actual bugs "
        f"into {len(distinct_stack_hashes)} separate groups. Semantic embedding clustering fixes this."
    )
    print(f"=======================================================\n")

    # 4. Save updated ground_truth.json with server IDs
    with open(ground_truth_path, "w", encoding="utf-8") as f:
        json.dump(dataset, f, indent=2)
    print(f"[Seed] Updated ground_truth.json with server IDs and stack hashes.")

    return success_count == total


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Faultline Synthetic Error Loader")
    parser.add_argument("--url", default="http://localhost:8000", help="Faultline API base URL")
    parser.add_argument("--key", default="fl_demo_key_9f8e7d6c5b4a", help="Demo project API Key")
    parser.add_argument("--concurrency", type=int, default=15, help="Concurrent HTTP requests")
    args = parser.parse_args()

    asyncio.run(run_seed(api_url=args.url, api_key=args.key, concurrency=args.concurrency))
