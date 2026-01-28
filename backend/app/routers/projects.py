"""Project-related API endpoints."""
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user_id
from ..db import get_db
from ..models import Project, ProjectSwimLane, ProjectUserRole, Task, User
from ..schemas import ProjectCreate, ProjectCreateFromTemplate, ProjectResponse, ProjectUpdate

router = APIRouter(prefix="/api/projects", tags=["projects"])


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get a specific project by ID.
    Only returns the project if it belongs to the authenticated user.
    Requires a valid Clerk session token in the Authorization header.
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
        Project.deleted_at.is_(None)
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or you don't have access to it."
        )

    return project


@router.put("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    project_data: ProjectUpdate,
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Update a project by ID.
    Only allows updating projects owned by the authenticated user.
    Requires a valid Clerk session token in the Authorization header.
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
        Project.deleted_at.is_(None)
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or you don't have access to it."
        )

    # Update the project with provided data
    update_data = project_data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    db.commit()
    db.refresh(project)

    return project


@router.get("", response_model=List[ProjectResponse])
async def get_user_projects(
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get all projects owned by the authenticated user.
    Requires a valid Clerk session token in the Authorization header.
    """
    # Find the user in our database by clerk_id
    user = db.query(User).filter(User.clerk_id == clerk_user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please ensure your user is synced to the database."
        )

    # Get all projects owned by this user (excluding soft-deleted)
    projects = db.query(Project).filter(
        Project.owner_id == user.id,
        Project.deleted_at.is_(None)
    ).order_by(Project.created_at.desc()).all()

    return projects


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    project_data: ProjectCreate,
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Create a new project for the authenticated user.
    Requires a valid Clerk session token in the Authorization header.
    """
    # Find the user in our database by clerk_id
    user = db.query(User).filter(User.clerk_id == clerk_user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please ensure your user is synced to the database."
        )

    # Create the new project
    new_project = Project(
        name=project_data.name,
        owner_id=user.id
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    # Create default swim lanes: Backlog, To Do, and Done
    default_swim_lanes = [
        ProjectSwimLane(project_id=new_project.project_id, name="Backlog", order=0),
        ProjectSwimLane(project_id=new_project.project_id, name="To Do", order=1),
        ProjectSwimLane(project_id=new_project.project_id, name="Done", order=2),
    ]

    db.add_all(default_swim_lanes)
    db.commit()

    return new_project


@router.post("/from-template", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project_from_template(
    template_data: ProjectCreateFromTemplate,
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Create a new project from an existing project as a template.
    Requires a valid Clerk session token in the Authorization header.

    Options:
    - include_statuses: Copy statuses (swim lanes) from the source project
    - include_roles: Copy roles from the source project
    - include_users: Copy user assignments from the source project
    - include_tasks: Copy tasks from the source project
    - keep_assignees: Keep task assignees (only applies if include_tasks is True)
    """
    # Find the user in our database by clerk_id
    user = db.query(User).filter(User.clerk_id == clerk_user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please ensure your user is synced to the database."
        )

    # Get the source project and verify ownership
    source_project = db.query(Project).filter(
        Project.project_id == template_data.source_project_id,
        Project.owner_id == user.id,
        Project.deleted_at.is_(None)
    ).first()

    if not source_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source project not found or you don't have access to it."
        )

    # Create the new project
    new_project = Project(
        name=template_data.name,
        owner_id=user.id,
        roles=source_project.roles if template_data.include_roles else None
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    # Track the first swim lane ID (all tasks will be assigned to this)
    first_swim_lane_id = None

    if template_data.include_statuses:
        # Copy swim lanes from source project
        source_swim_lanes = db.query(ProjectSwimLane).filter(
            ProjectSwimLane.project_id == source_project.project_id,
            ProjectSwimLane.deleted_at.is_(None)
        ).order_by(ProjectSwimLane.order).all()

        for source_lane in source_swim_lanes:
            new_lane = ProjectSwimLane(
                project_id=new_project.project_id,
                name=source_lane.name,
                order=source_lane.order
            )
            db.add(new_lane)
            db.flush()  # Get the new swim_lane_id
            # Track the first swim lane (lowest order)
            if first_swim_lane_id is None:
                first_swim_lane_id = new_lane.swim_lane_id
    else:
        # Create default swim lanes
        default_swim_lanes = [
            ProjectSwimLane(project_id=new_project.project_id, name="Backlog", order=0),
            ProjectSwimLane(project_id=new_project.project_id, name="To Do", order=1),
            ProjectSwimLane(project_id=new_project.project_id, name="Done", order=2),
        ]
        db.add_all(default_swim_lanes)
        db.flush()
        # Get the first swim lane ID
        first_lane = db.query(ProjectSwimLane).filter(
            ProjectSwimLane.project_id == new_project.project_id
        ).order_by(ProjectSwimLane.order).first()
        if first_lane:
            first_swim_lane_id = first_lane.swim_lane_id

    if template_data.include_users:
        # Copy user roles from source project
        source_user_roles = db.query(ProjectUserRole).filter(
            ProjectUserRole.project_id == source_project.project_id,
            ProjectUserRole.deleted_at.is_(None)
        ).all()

        for source_role in source_user_roles:
            new_user_role = ProjectUserRole(
                project_id=new_project.project_id,
                user_id=source_role.user_id,
                role=source_role.role
            )
            db.add(new_user_role)

    if template_data.include_tasks and template_data.include_statuses and first_swim_lane_id:
        # Copy tasks from source project (only if statuses are included)
        # All tasks are assigned to the first swim lane
        source_tasks = db.query(Task).filter(
            Task.project_id == source_project.project_id,
            Task.deleted_at.is_(None)
        ).all()

        for source_task in source_tasks:
            # Only keep assignees if both keep_assignees and include_users are true
            should_keep_assignee = (
                template_data.keep_assignees and
                template_data.include_users and
                source_task.assigned_to
            )
            new_task = Task(
                project_id=new_project.project_id,
                project_swim_lane_id=first_swim_lane_id,
                title=source_task.title,
                description=source_task.description,
                assigned_to=source_task.assigned_to if should_keep_assignee else None,
                created_by=user.id
            )
            db.add(new_task)

    db.commit()
    db.refresh(new_project)

    return new_project


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID,
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Delete a project (soft delete).
    Only allows deleting projects owned by the authenticated user.
    Requires a valid Clerk session token in the Authorization header.
    """
    from datetime import datetime, timezone

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
        Project.deleted_at.is_(None)
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or you don't have access to it."
        )

    # Soft delete
    project.deleted_at = datetime.now(timezone.utc)
    db.commit()
