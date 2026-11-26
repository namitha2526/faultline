#!/usr/bin/env bash
set -e

echo "=== Starting Faultline (PostgreSQL + FastAPI + Vite Web) ==="
docker compose up -d --build

echo "=== Waiting for API to be healthy ==="
until curl -s http://localhost:8000/api/health | grep -q "ok"; do
  sleep 1
done

echo "=== Seeding 600 synthetic errors ==="
docker compose exec api python data/seed.py

echo "=== Running ML batch clustering ==="
curl -s -X POST http://localhost:8000/api/cluster/run -H "Content-Type: application/json" -d '{"eps": 0.22, "min_samples": 3}'

echo "=== Faultline is LIVE ==="
echo "Web UI:      http://localhost:5173"
echo "API Docs:    http://localhost:8000/docs"
