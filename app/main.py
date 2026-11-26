from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select

from app.api.router import api_router
from app.core.config import settings
from app.core.db import AsyncSessionLocal, engine
from app.models.project import Project


async def init_demo_project():
    """Ensure a default demo project exists for out-of-the-box ingestion and testing."""
    async with AsyncSessionLocal() as session:
        try:
            stmt = select(Project).where(Project.api_key == settings.DEMO_PROJECT_API_KEY)
            res = await session.execute(stmt)
            existing = res.scalar_one_or_none()
            if not existing:
                demo_project = Project(
                    name=settings.DEMO_PROJECT_NAME,
                    api_key=settings.DEMO_PROJECT_API_KEY,
                )
                session.add(demo_project)
                await session.commit()
        except Exception as e:
            # Table might not exist yet if migrations haven't run
            print(f"[Startup Warning] Could not ensure demo project: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup actions
    await init_demo_project()
    # Pre-warm embedding model once at startup (not per request)
    try:
        from app.ml.embed import get_embedding_service
        get_embedding_service()
    except Exception as e:
        print(f"[Startup Warning] Could not pre-warm embedding model: {e}")
    yield
    # Shutdown actions
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Faultline: Semantic Error Intelligence Platform grouping errors by meaning.",
    version="0.1.0",
    lifespan=lifespan,
)

# Enable CORS for JS SDK browser integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ],
    allow_origin_regex=r"https?://.*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.websocket("/ws/feed")
async def root_websocket_feed(websocket: WebSocket):
    from app.ml.demo_stream import ws_manager
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)


@app.get("/", tags=["Root"])
async def root():
    return {
        "platform": settings.PROJECT_NAME,
        "docs": "/docs",
        "health": "/api/health",
        "version": "0.1.0",
    }
