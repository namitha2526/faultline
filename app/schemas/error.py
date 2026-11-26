import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ErrorCreate(BaseModel):
    event_id: Optional[str] = Field(None, description="Client-side event UUID")
    message: str = Field(..., min_length=1, description="Error message")
    stack_trace: Optional[str] = Field(None, description="Raw stack trace string")
    exception_type: Optional[str] = Field(None, max_length=100, description="Exception name or type")
    browser: Optional[str] = Field(None, max_length=100, description="Browser or client runtime")
    os: Optional[str] = Field(None, max_length=100, description="Operating system")
    url: Optional[str] = Field(None, description="URL or route where error occurred")
    user_id: Optional[str] = Field(None, max_length=255, description="Associated user ID or session ID")
    release: Optional[str] = Field(None, max_length=100, description="Application version/release")
    environment: Optional[str] = Field(None, max_length=100, description="Deployment environment")
    timestamp: Optional[datetime] = Field(None, description="Timestamp of the error")


class ErrorRead(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    message: str
    stack_trace: Optional[str] = None
    exception_type: Optional[str] = None
    browser: Optional[str] = None
    os: Optional[str] = None
    url: Optional[str] = None
    user_id: Optional[str] = None
    release: Optional[str] = None
    timestamp: datetime
    stack_hash: Optional[str] = None
    cluster_id: Optional[uuid.UUID] = None

    model_config = ConfigDict(from_attributes=True)


class ErrorListResponse(BaseModel):
    items: list[ErrorRead]
    total: int
    limit: int
    offset: int


class SimilarErrorRead(BaseModel):
    error: ErrorRead
    similarity: float
    distance: float
