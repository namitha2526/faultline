from typing import Optional
from fastapi import Depends, Header, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import get_db
from app.models.project import Project


async def get_current_project(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    api_key_query: Optional[str] = Query(None, alias="api_key"),
    key_query: Optional[str] = Query(None, alias="key"),
    db: AsyncSession = Depends(get_db),
) -> Project:
    """
    Authenticate request via X-API-Key, Bearer token in Authorization header,
    or api_key query parameter (required for navigator.sendBeacon).
    Returns the Project associated with the key or raises 401 Unauthorized.
    """
    api_key = x_api_key or api_key_query or key_query
    if not api_key and authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            api_key = parts[1]
        elif len(parts) == 1:
            api_key = parts[0]

    if not api_key:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing API key. Provide via X-API-Key header or Authorization: Bearer <key>.",
        )

    stmt = select(Project).where(Project.api_key == api_key)
    result = await db.execute(stmt)
    project = result.scalar_one_or_none()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid API key.",
        )

    return project


async def get_optional_project(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    authorization: Optional[str] = Header(None, alias="Authorization"),
    api_key_query: Optional[str] = Query(None, alias="api_key"),
    key_query: Optional[str] = Query(None, alias="key"),
    db: AsyncSession = Depends(get_db),
) -> Optional[Project]:
    """Optional project authentication for endpoints that can filter by project if provided."""
    api_key = x_api_key or api_key_query or key_query
    if not api_key and authorization:
        parts = authorization.split()
        if len(parts) == 2 and parts[0].lower() == "bearer":
            api_key = parts[1]
        elif len(parts) == 1:
            api_key = parts[0]

    if not api_key:
        return None

    stmt = select(Project).where(Project.api_key == api_key)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
