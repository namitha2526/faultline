import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)


class ProjectCreate(ProjectBase):
    api_key: str = Field(..., min_length=8, max_length=255)


class ProjectRead(ProjectBase):
    id: uuid.UUID
    api_key: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
