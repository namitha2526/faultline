from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from pydantic import BaseModel

from app.ml.demo_stream import demo_stream, ws_manager

router = APIRouter(tags=["Demo Stream"])


class DemoStartRequest(BaseModel):
    speed: Optional[float] = 2.0
    simulate_spike: Optional[bool] = False


class DemoSpeedRequest(BaseModel):
    speed: float


class DemoSpikeRequest(BaseModel):
    root_cause: Optional[str] = "RC-2"


@router.post(
    "/demo/start",
    status_code=status.HTTP_200_OK,
    summary="Start live streaming synthetic errors into Faultline",
)
async def start_demo_stream(request: Optional[DemoStartRequest] = None):
    speed = request.speed if request else 2.0
    spike = request.simulate_spike if request else False
    return await demo_stream.start(speed=speed, simulate_spike=spike)


@router.post(
    "/demo/stop",
    status_code=status.HTTP_200_OK,
    summary="Stop live synthetic error replay stream",
)
async def stop_demo_stream():
    return await demo_stream.stop()


@router.post(
    "/demo/speed",
    status_code=status.HTTP_200_OK,
    summary="Adjust playback rate of the live demo stream",
)
async def set_demo_speed(request: DemoSpeedRequest):
    return demo_stream.set_speed(request.speed)


@router.post(
    "/demo/spike",
    status_code=status.HTTP_200_OK,
    summary="Simulate a bad production deployment that floods errors of one specific root cause",
)
async def trigger_demo_spike(request: Optional[DemoSpikeRequest] = None):
    rc = request.root_cause if request and request.root_cause else "RC-2"
    return demo_stream.trigger_spike(root_cause_id=rc)


@router.get(
    "/demo/status",
    status_code=status.HTTP_200_OK,
    summary="Get current replay stream status",
)
async def get_demo_status():
    return {
        "is_running": demo_stream.is_running,
        "speed": demo_stream.speed,
        "spike_active": demo_stream.spike_active,
        "spike_root_cause": demo_stream.spike_root_cause,
    }


# WebSocket endpoint for real-time live feed
@router.websocket("/ws/feed")
async def websocket_feed_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection open; clients can send pings
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception:
        ws_manager.disconnect(websocket)
