"""
Faultline Live Demo Streamer & WebSocket Broadcaster
Replays synthetic errors as a live stream to demonstrate real-time ingestion,
sub-200ms incremental cluster snapping, and bad deployment spikes.
"""

import asyncio
from datetime import datetime, timezone
import json
import logging
import os
import random
from typing import Any, Optional
from fastapi import WebSocket

from app.core.config import settings
from app.core.db import AsyncSessionLocal
from app.core.hasher import compute_stack_hash
from app.ml.service import assign_error_incrementally
from app.models.cluster import Cluster
from app.models.error import Error
from app.models.project import Project

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages active WebSocket connections for live feed streaming."""

    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        logger.info(f"[WS] Client connected. Active: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        logger.info(f"[WS] Client disconnected. Active: {len(self.active_connections)}")

    async def broadcast(self, message: dict[str, Any]):
        if not self.active_connections:
            return
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead.append(connection)
        for d in dead:
            self.disconnect(d)


ws_manager = ConnectionManager()


class DemoStreamController:
    """Controls the live demo replay stream and simulated bad deployment spikes."""

    def __init__(self):
        self.is_running: bool = False
        self.speed: float = 2.0  # Errors per second
        self.spike_active: bool = False
        self.spike_root_cause: str = "RC-2"  # Payment Gateway Timeout
        self._task: Optional[asyncio.Task] = None
        self._dataset: Optional[list[dict[str, Any]]] = None

    def _load_dataset(self) -> list[dict[str, Any]]:
        if self._dataset:
            return self._dataset
        gt_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data", "ground_truth.json")
        if os.path.exists(gt_path):
            with open(gt_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self._dataset = data.get("errors", [])
        return self._dataset or []

    async def start(self, speed: float = 2.0, simulate_spike: bool = False):
        self.speed = max(0.5, min(15.0, speed))
        self.spike_active = simulate_spike
        if self.is_running:
            return {"status": "already_running", "speed": self.speed, "spike": self.spike_active}

        self.is_running = True
        self._task = asyncio.create_task(self._stream_loop())
        logger.info(f"[DemoStream] Started at {self.speed} err/s (spike: {self.spike_active})")
        return {"status": "started", "speed": self.speed, "spike": self.spike_active}

    async def stop(self):
        self.is_running = False
        self.spike_active = False
        if self._task and not self._task.done():
            self._task.cancel()
        logger.info("[DemoStream] Stopped")
        return {"status": "stopped"}

    def set_speed(self, speed: float):
        self.speed = max(0.5, min(15.0, speed))
        return {"status": "updated", "speed": self.speed}

    def trigger_spike(self, root_cause_id: str = "RC-2"):
        """Simulate a bad production deployment that floods errors of one specific type."""
        self.spike_active = True
        self.spike_root_cause = root_cause_id
        logger.warning(f"[DemoStream] BAD DEPLOYMENT SPIKE TRIGGERED: {root_cause_id}")
        return {"status": "spike_triggered", "root_cause": root_cause_id}

    async def _stream_loop(self):
        errors = self._load_dataset()
        if not errors:
            logger.error("[DemoStream] No synthetic dataset found to stream.")
            self.is_running = False
            return

        idx = 0
        while self.is_running:
            try:
                # If bad deployment spike active, select 80% from the spiking cause
                if self.spike_active and random.random() < 0.85:
                    spike_items = [e for e in errors if e.get("root_cause_id") == self.spike_root_cause]
                    item = random.choice(spike_items) if spike_items else errors[idx % len(errors)]
                else:
                    item = errors[idx % len(errors)]
                    idx += 1

                # Ingest through DB & incremental ML cluster assignment
                await self._ingest_stream_item(item)

                delay = 1.0 / self.speed
                await asyncio.sleep(delay)
            except asyncio.CancelledError:
                break
            except Exception as e:
                logger.error(f"[DemoStream Loop Error] {e}")
                await asyncio.sleep(1.0)

    async def _ingest_stream_item(self, item: dict[str, Any]):
        p = item["payload"]
        async with AsyncSessionLocal() as session:
            # 1. Resolve demo project
            proj_res = await session.execute(
                Project.__table__.select().where(Project.api_key == settings.DEMO_PROJECT_API_KEY)
            )
            proj = proj_res.first()
            if not proj:
                return

            sh = compute_stack_hash(p.get("exception_type"), p.get("message"), p.get("stack_trace"))
            now = datetime.now(timezone.utc)

            db_err = Error(
                project_id=proj.id,
                message=p.get("message"),
                stack_trace=p.get("stack_trace"),
                exception_type=p.get("exception_type"),
                browser=p.get("browser"),
                os=p.get("os"),
                url=p.get("url"),
                user_id=p.get("user_id"),
                release=p.get("release"),
                timestamp=now,
                stack_hash=sh,
                embedding=None,
                cluster_id=None,
            )
            session.add(db_err)

            # Incremental auto-assignment
            assigned_cid = None
            try:
                assigned_cid = await assign_error_incrementally(session, db_err)
            except Exception as ex:
                logger.debug(f"[Stream Assign Exception] {ex}")

            await session.commit()
            await session.refresh(db_err)

            # Query cluster title if assigned
            cluster_title = "Unassigned / Pending"
            cluster_count = 1
            if db_err.cluster_id:
                c_res = await session.get(Cluster, db_err.cluster_id)
                if c_res:
                    cluster_title = c_res.title
                    cluster_count = c_res.error_count

            # Broadcast event to frontend via WebSocket
            ws_event = {
                "type": "error_ingested",
                "error": {
                    "id": str(db_err.id),
                    "message": db_err.message,
                    "exception_type": db_err.exception_type,
                    "browser": db_err.browser,
                    "os": db_err.os,
                    "url": db_err.url,
                    "timestamp": db_err.timestamp.isoformat(),
                    "stack_hash": db_err.stack_hash,
                    "cluster_id": str(db_err.cluster_id) if db_err.cluster_id else None,
                    "cluster_title": cluster_title,
                },
                "cluster": {
                    "id": str(db_err.cluster_id) if db_err.cluster_id else None,
                    "title": cluster_title,
                    "error_count": cluster_count,
                },
                "is_spike": self.spike_active and (item.get("root_cause_id") == self.spike_root_cause),
                "timestamp": now.isoformat(),
            }
            await ws_manager.broadcast(ws_event)


demo_stream = DemoStreamController()
