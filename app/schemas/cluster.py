import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict, Field


class ClusterBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    status: str = Field(default="unresolved", max_length=50)


class ClusterCreate(ClusterBase):
    project_id: uuid.UUID


class ClusterRead(ClusterBase):
    id: uuid.UUID
    project_id: uuid.UUID
    first_seen: datetime
    last_seen: datetime
    error_count: int

    model_config = ConfigDict(from_attributes=True)
