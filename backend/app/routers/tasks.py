"""Task-related API endpoints."""
import uuid
from typing import List, Tuple

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..activity import log_activity
from ..auth import get_current_user_id
from ..db import get_db
from ..models import Project, ProjectSwimLane, ProjectUserRole, Task, User
from ..schemas import MyTaskResponse, TaskCreate, TaskResponse, TaskUpdate

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
    log_activity(
        db, "task", new_task.task_id, "created",
        f"Created task '{new_task.title}'",
        user.id,
        {"project_id": str(task_data.project_id), "swim_lane_id": str(task_data.project_swim_lane_id)},
    )
    db.commit()
    db.refresh(new_task)

    return new_task


@router.get("/assigned-to-me", response_model=List[MyTaskResponse])
async def get_my_assigned_tasks(
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Get all tasks assigned to the authenticated user across all accessible projects.
    """
    user = db.query(User).filter(User.clerk_id == clerk_user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please ensure your user is synced to the database.",
        )

    # Get all project IDs the user has access to
    member_project_ids = db.query(ProjectUserRole.project_id).filter(
        ProjectUserRole.user_id == user.id,
        ProjectUserRole.deleted_at.is_(None),
    )
    accessible_project_ids = db.query(Project.project_id).filter(
        or_(
            Project.owner_id == user.id,
            Project.project_id.in_(member_project_ids),
        ),
        Project.deleted_at.is_(None),
    )

    results = db.query(Task, Project.name).join(
        Project, Task.project_id == Project.project_id,
    ).filter(
        Task.assigned_to == user.id,
        Task.project_id.in_(accessible_project_ids),
        Task.deleted_at.is_(None),
        Project.deleted_at.is_(None),
    ).order_by(Task.updated_at.desc()).all()

    return [
        MyTaskResponse(
            task_id=task.task_id,
            project_id=task.project_id,
            project_name=project_name,
            project_swim_lane_id=task.project_swim_lane_id,
            title=task.title,
            description=task.description,
            assigned_to=task.assigned_to,
            created_by=task.created_by,
            created_at=task.created_at,
            updated_at=task.updated_at,
        )
        for task, project_name in results
    ]


@router.get("/project/{project_id}", response_model=List[TaskResponse])
async def get_project_tasks(
    project_id: uuid.UUID,
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get all tasks for a project.
    Requires the user to own the project.
    Requires a valid Clerk session token in the Authorization header.
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
        Project.deleted_at.is_(None)
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or you don't have access to it."
        )

    # Get all tasks for this project that are not deleted
    tasks = db.query(Task).filter(
        Task.project_id == project_id,
        Task.deleted_at.is_(None)
    ).order_by(Task.created_at).all()

    return tasks


@router.put("/{task_id}", response_model=TaskResponse)
async def update_task(
    task_id: uuid.UUID,
    task_data: TaskUpdate,
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Update an existing task.
    Requires the user to own the project that the task belongs to.
    Requires a valid Clerk session token in the Authorization header.
    """
    # Find the user in our database by clerk_id
    user = db.query(User).filter(User.clerk_id == clerk_user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please ensure your user is synced to the database."
        )

    # Get the task and verify it exists and is not deleted
    task = db.query(Task).filter(
        Task.task_id == task_id,
        Task.deleted_at.is_(None)
    ).first()

    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found."
        )

    # Verify project ownership
    project = db.query(Project).filter(
        Project.project_id == task.project_id,
        Project.owner_id == user.id,
        Project.deleted_at.is_(None)
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or you don't have access to it."
        )

    # Snapshot old values before any mutations
    old_values = {
        "title": task.title,
        "description": task.description,
        "project_swim_lane_id": str(task.project_swim_lane_id),
        "assigned_to": str(task.assigned_to) if task.assigned_to else None,
    }

    # Resolve old swim lane name for readable logging
    old_swim_lane = db.query(ProjectSwimLane).filter(
        ProjectSwimLane.swim_lane_id == task.project_swim_lane_id
    ).first()
    old_swim_lane_name = old_swim_lane.name if old_swim_lane else None

    # Resolve old assignee name
    old_assignee_name = None
    if task.assigned_to:
        old_assignee = db.query(User).filter(User.id == task.assigned_to).first()
        if old_assignee:
            old_assignee_name = f"{old_assignee.first_name or ''} {old_assignee.last_name or ''}".strip() or old_assignee.email

    # If updating swim lane, verify it belongs to the same project
    new_swim_lane_name = None
    if task_data.project_swim_lane_id is not None:
        swim_lane = db.query(ProjectSwimLane).filter(
            ProjectSwimLane.swim_lane_id == task_data.project_swim_lane_id,
            ProjectSwimLane.project_id == task.project_id,
            ProjectSwimLane.deleted_at.is_(None)
        ).first()

        if not swim_lane:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Swim lane not found or does not belong to this project."
            )
        new_swim_lane_name = swim_lane.name
        task.project_swim_lane_id = task_data.project_swim_lane_id

    # Validate assigned_to if provided
    new_assignee_name = None
    if task_data.assigned_to is not None:
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
            new_assignee_name = f"{assignee.first_name or ''} {assignee.last_name or ''}".strip() or assignee.email
        task.assigned_to = task_data.assigned_to if task_data.assigned_to else None

    # Update fields if provided
    if task_data.title is not None:
        if not task_data.title.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Title cannot be empty."
            )
        task.title = task_data.title.strip()

    if task_data.description is not None:
        task.description = task_data.description

    # Build detailed change tracking
    new_values = {
        "title": task.title,
        "description": task.description,
        "project_swim_lane_id": str(task.project_swim_lane_id),
        "assigned_to": str(task.assigned_to) if task.assigned_to else None,
    }

    changes = {}
    for field in old_values:
        if old_values[field] != new_values[field]:
            changes[field] = {"old": old_values[field], "new": new_values[field]}

    # Build a human-readable description of what changed
    change_parts = []
    for field, diff in changes.items():
        if field == "title":
            change_parts.append(f"title from '{diff['old']}' to '{diff['new']}'")
        elif field == "description":
            change_parts.append("description")
        elif field == "project_swim_lane_id":
            change_parts.append(f"status from '{old_swim_lane_name}' to '{new_swim_lane_name}'")
        elif field == "assigned_to":
            if diff["old"] is None:
                change_parts.append(f"assigned to {new_assignee_name}")
            elif diff["new"] is None:
                change_parts.append(f"unassigned from {old_assignee_name}")
            else:
                change_parts.append(f"reassigned from {old_assignee_name} to {new_assignee_name}")

    if change_parts:
        description = f"Updated task '{task.title}': changed {', '.join(change_parts)}"
    else:
        description = f"Updated task '{task.title}' (no changes)"

    log_activity(
        db, "task", task.task_id, "updated",
        description,
        user.id,
        {"project_id": str(task.project_id), "changes": changes},
    )
    db.commit()
    db.refresh(task)

    return task

