"""Pydantic schemas for request/response validation."""
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
    id: int
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
    project_id: int
    name: str
    owner_id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
