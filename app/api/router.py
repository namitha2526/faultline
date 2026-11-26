from fastapi import APIRouter

from app.api.cluster import router as cluster_ops_router
from app.api.clusters import router as clusters_router
from app.api.demo import router as demo_router
from app.api.errors import router as errors_router
from app.api.health import router as health_router
from app.api.overview import router as overview_router
from app.api.visualization import router as visualization_router

api_router = APIRouter(prefix="/api")

api_router.include_router(health_router)
api_router.include_router(overview_router)
api_router.include_router(errors_router)
api_router.include_router(clusters_router)
api_router.include_router(cluster_ops_router)
api_router.include_router(visualization_router)
api_router.include_router(demo_router)
