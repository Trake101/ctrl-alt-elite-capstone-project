"""Task-related API endpoints."""
import uuid
from typing import Tuple

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user_id
from ..db import get_db
from ..models import Project, ProjectSwimLane, Task, User
from ..schemas import TaskCreate, TaskResponse

router = APIRouter(prefix="/api/tasks", tags=["tasks"])


def verify_project_and_swim_lane_access(
    project_id: uuid.UUID,
    project_swim_lane_id: uuid.UUID,
    clerk_user_id: str,
    db: Session
) -> Tuple[Project, ProjectSwimLane]:
    """
    Verify that the user has access to the project and swim lane (by owning the project).
    Raises HTTPException if project/swim lane not found or user doesn't have access.
    Returns tuple of (project, swim_lane).
    """
    # Find the user in our database by clerk_id
    user = db.query(User).filter(User.clerk_id == clerk_user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please ensure your user is synced to the database."
        )

    # Verify project ownership
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

    # Get the swim lane and verify it exists, is not deleted, and belongs to the project
    swim_lane = db.query(ProjectSwimLane).filter(
        ProjectSwimLane.swim_lane_id == project_swim_lane_id,
        ProjectSwimLane.project_id == project_id,
        ProjectSwimLane.deleted_at.is_(None)  # Only non-deleted swim lanes
    ).first()

    if not swim_lane:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Swim lane not found or does not belong to the specified project."
        )

    return project, swim_lane


@router.post("", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_task(
    task_data: TaskCreate,
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Create a new task in a swim lane.
    Requires the user to own the project that the swim lane belongs to.
    Requires a valid Clerk session token in the Authorization header.
    
    Required fields:
    - project_id: UUID of the project
    - project_swim_lane_id: UUID of the swim lane to add the task to
    - title: Title of the task (string)
    
    Optional fields:
    - description: Description/notes for the task (string)
    - assigned_to: UUID of the user assigned to the task
    """
    # Find the user in our database by clerk_id (needed for created_by)
    user = db.query(User).filter(User.clerk_id == clerk_user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please ensure your user is synced to the database."
        )

    # Verify project and swim lane access (this also verifies user authentication)
    project, swim_lane = verify_project_and_swim_lane_access(
        task_data.project_id,
        task_data.project_swim_lane_id,
        clerk_user_id,
        db
    )

    # Validate required fields (Pydantic handles this, but we can add custom validation)
    if not task_data.title or not task_data.title.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title is required and cannot be empty."
        )

    # Validate assigned_to if provided
    if task_data.assigned_to:
        assignee = db.query(User).filter(
            User.id == task_data.assigned_to,
            User.deleted_at.is_(None)
        ).first()
        if not assignee:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assigned user not found."
            )

    # Create the new task
    new_task = Task(
        project_id=task_data.project_id,
        project_swim_lane_id=task_data.project_swim_lane_id,
        title=task_data.title.strip(),
        description=task_data.description,
        assigned_to=task_data.assigned_to,
        created_by=user.id
    )

    db.add(new_task)
    db.commit()
    db.refresh(new_task)

    return new_task

