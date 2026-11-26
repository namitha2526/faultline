Write-Host "=== Starting Faultline Services ===" -ForegroundColor Cyan
docker compose up -d --build

Write-Host "Waiting for API readiness..." -ForegroundColor Yellow
$healthy = $false
while (-not $healthy) {
    try {
        $res = Invoke-RestMethod -Uri "http://localhost:8000/api/health" -Method Get -ErrorAction Stop
        if ($res.status -eq "ok") { $healthy = $true }
    } catch {
        Start-Sleep -Seconds 1
    }
}

Write-Host "Seeding 600 synthetic benchmark errors..." -ForegroundColor Green
docker compose exec -T api python data/seed.py

Write-Host "Executing ML Batch Clustering..." -ForegroundColor Green
Invoke-RestMethod -Uri "http://localhost:8000/api/cluster/run" -Method Post -Body '{"eps": 0.22, "min_samples": 3}' -ContentType "application/json" | Out-Null

Write-Host "`n=== Faultline is LIVE ===" -ForegroundColor Green
Write-Host "Web Dashboard:   http://localhost:5173" -ForegroundColor White
Write-Host "ShopDemo Client: http://localhost:5174" -ForegroundColor White
Write-Host "FastAPI Docs:    http://localhost:8000/docs" -ForegroundColor White
