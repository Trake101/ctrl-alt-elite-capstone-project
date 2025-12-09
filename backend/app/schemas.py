"""Pydantic schemas for request/response validation."""
import uuid
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr

class UserCreate(BaseModel):
    """Schema for creating or updating a user."""
    clerk_id: str
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None

class UserResponse(BaseModel):
    """Schema for user response data."""
    id: uuid.UUID
    clerk_id: str
    email: str
    first_name: Optional[str]
    last_name: Optional[str]

    class Config:
        from_attributes = True


class ProjectCreate(BaseModel):
    """Schema for creating a project."""
    name: str


class ProjectResponse(BaseModel):
    """Schema for project response data."""
    project_id: uuid.UUID
    name: str
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class SwimLaneCreate(BaseModel):
    """Schema for creating a swim lane."""
    project_id: uuid.UUID
    name: str
    order: int


class SwimLaneUpdate(BaseModel):
    """Schema for updating a swim lane."""
    name: Optional[str] = None
    order: Optional[int] = None


class SwimLaneResponse(BaseModel):
    """Schema for swim lane response data."""
    swim_lane_id: uuid.UUID
    project_id: uuid.UUID
    name: str
    order: int
    created_at: datetime
    updated_at: datetime
    deleted_at: Optional[datetime] = None

    class Config:
        from_attributes = True
