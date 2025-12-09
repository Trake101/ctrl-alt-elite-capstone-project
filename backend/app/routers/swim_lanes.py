"""Swim lane-related API endpoints."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user_id
from ..db import get_db
from ..models import Project, ProjectSwimLane, User
from ..schemas import SwimLaneCreate, SwimLaneResponse, SwimLaneUpdate

router = APIRouter(prefix="/api/swim-lanes", tags=["swim-lanes"])


def verify_project_ownership(
    project_id: uuid.UUID,
    clerk_user_id: str,
    db: Session
) -> Project:
    """
    Verify that the user owns the project and return the project.
    Raises HTTPException if project not found or user doesn't own it.
    """
    # Find the user in our database by clerk_id
    user = db.query(User).filter(User.clerk_id == clerk_user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please ensure your user is synced to the database."
        )

    # Get the project and verify ownership
    project = db.query(Project).filter(
        Project.project_id == project_id,
        Project.owner_id == user.id,
        Project.deleted_at.is_(None)  # Only non-deleted projects
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or you don't have access to it."
        )

    return project


@router.post("", response_model=SwimLaneResponse, status_code=status.HTTP_201_CREATED)
async def create_swim_lane(
    swim_lane_data: SwimLaneCreate,
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Create a new swim lane for a project.
    Requires the user to own the project.
    Requires a valid Clerk session token in the Authorization header.
    """
    # Verify project ownership
    project = verify_project_ownership(swim_lane_data.project_id, clerk_user_id, db)

    # Create the new swim lane
    new_swim_lane = ProjectSwimLane(
        project_id=swim_lane_data.project_id,
        name=swim_lane_data.name,
        order=swim_lane_data.order
    )

    db.add(new_swim_lane)
    db.commit()
    db.refresh(new_swim_lane)

    return new_swim_lane


@router.put("/{swim_lane_id}", response_model=SwimLaneResponse)
async def update_swim_lane(
    swim_lane_id: uuid.UUID,
    swim_lane_data: SwimLaneUpdate,
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Update an existing swim lane.
    Requires the user to own the project that the swim lane belongs to.
    Requires a valid Clerk session token in the Authorization header.
    """
    # Find the user in our database by clerk_id
    user = db.query(User).filter(User.clerk_id == clerk_user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please ensure your user is synced to the database."
        )

    # Get the swim lane and verify it exists and is not deleted
    swim_lane = db.query(ProjectSwimLane).filter(
        ProjectSwimLane.swim_lane_id == swim_lane_id,
        ProjectSwimLane.deleted_at.is_(None)  # Only non-deleted swim lanes
    ).first()

    if not swim_lane:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Swim lane not found."
        )

    # Verify project ownership
    project = db.query(Project).filter(
        Project.project_id == swim_lane.project_id,
        Project.owner_id == user.id,
        Project.deleted_at.is_(None)
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or you don't have access to it."
        )

    # Update fields if provided
    if swim_lane_data.name is not None:
        swim_lane.name = swim_lane_data.name
    if swim_lane_data.order is not None:
        swim_lane.order = swim_lane_data.order

    db.commit()
    db.refresh(swim_lane)

    return swim_lane


@router.delete("/{swim_lane_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_swim_lane(
    swim_lane_id: uuid.UUID,
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Soft delete a swim lane by setting its deleted_at timestamp.
    Requires the user to own the project that the swim lane belongs to.
    Requires a valid Clerk session token in the Authorization header.
    """
    # Find the user in our database by clerk_id
    user = db.query(User).filter(User.clerk_id == clerk_user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please ensure your user is synced to the database."
        )

    # Get the swim lane and verify it exists and is not already deleted
    swim_lane = db.query(ProjectSwimLane).filter(
        ProjectSwimLane.swim_lane_id == swim_lane_id,
        ProjectSwimLane.deleted_at.is_(None)  # Only non-deleted swim lanes
    ).first()

    if not swim_lane:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Swim lane not found."
        )

    # Verify project ownership
    project = db.query(Project).filter(
        Project.project_id == swim_lane.project_id,
        Project.owner_id == user.id,
        Project.deleted_at.is_(None)
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or you don't have access to it."
        )

    # Soft delete by setting deleted_at
    swim_lane.deleted_at = datetime.now(timezone.utc)
    db.commit()

    return None

