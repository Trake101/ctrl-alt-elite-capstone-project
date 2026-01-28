"""Template-related API endpoints."""
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user_id
from ..db import get_db
from ..models import Project, ProjectSwimLane, ProjectTemplate, ProjectUserRole, Task, User
from ..schemas import (
    ProjectCreateFromSavedTemplate,
    ProjectResponse,
    TemplateCreateFromProject,
    TemplateResponse,
)

router = APIRouter(prefix="/api/templates", tags=["templates"])


@router.get("", response_model=List[TemplateResponse])
async def get_templates(
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get all templates owned by the authenticated user.
    Requires a valid Clerk session token in the Authorization header.
    """
    user = db.query(User).filter(User.clerk_id == clerk_user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please ensure your user is synced to the database."
        )

    templates = db.query(ProjectTemplate).filter(
        ProjectTemplate.owner_id == user.id,
        ProjectTemplate.deleted_at.is_(None)
    ).order_by(ProjectTemplate.created_at.desc()).all()

    return templates


@router.post("/from-project", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template_from_project(
    template_data: TemplateCreateFromProject,
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Create a new template from an existing project.
    Requires a valid Clerk session token in the Authorization header.
    """
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

    # Build template data
    statuses_data = None
    tasks_data = None
    roles_data = None
    users_data = None

    if template_data.include_statuses:
        source_swim_lanes = db.query(ProjectSwimLane).filter(
            ProjectSwimLane.project_id == source_project.project_id,
            ProjectSwimLane.deleted_at.is_(None)
        ).order_by(ProjectSwimLane.order).all()

        statuses_data = [
            {"name": lane.name, "order": lane.order}
            for lane in source_swim_lanes
        ]

        # Build a map of swim_lane_id to order for tasks
        swim_lane_order_map = {
            lane.swim_lane_id: lane.order
            for lane in source_swim_lanes
        }

        if template_data.include_tasks:
            source_tasks = db.query(Task).filter(
                Task.project_id == source_project.project_id,
                Task.deleted_at.is_(None)
            ).all()

            # Only keep assignees if both keep_assignees and include_users are true
            should_keep_assignees = template_data.keep_assignees and template_data.include_users

            tasks_data = [
                {
                    "title": task.title,
                    "description": task.description,
                    "status_order": swim_lane_order_map.get(task.project_swim_lane_id, 0),
                    "assigned_to": str(task.assigned_to) if should_keep_assignees and task.assigned_to else None
                }
                for task in source_tasks
            ]

    if template_data.include_roles and source_project.roles:
        roles_data = source_project.roles

    if template_data.include_users:
        source_user_roles = db.query(ProjectUserRole).filter(
            ProjectUserRole.project_id == source_project.project_id,
            ProjectUserRole.deleted_at.is_(None)
        ).all()

        users_data = [
            {"user_id": str(user_role.user_id), "role": user_role.role}
            for user_role in source_user_roles
        ]

    # Create the template
    new_template = ProjectTemplate(
        name=template_data.name,
        description=template_data.description,
        owner_id=user.id,
        statuses=statuses_data,
        roles=roles_data,
        users=users_data,
        tasks=tasks_data
    )

    db.add(new_template)
    db.commit()
    db.refresh(new_template)

    return new_template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_template(
    template_id: uuid.UUID,
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Delete a template (soft delete).
    Requires a valid Clerk session token in the Authorization header.
    """
    user = db.query(User).filter(User.clerk_id == clerk_user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please ensure your user is synced to the database."
        )

    template = db.query(ProjectTemplate).filter(
        ProjectTemplate.template_id == template_id,
        ProjectTemplate.owner_id == user.id,
        ProjectTemplate.deleted_at.is_(None)
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found or you don't have access to it."
        )

    # Soft delete
    from datetime import datetime, timezone
    template.deleted_at = datetime.now(timezone.utc)
    db.commit()


@router.post("/create-project", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project_from_saved_template(
    project_data: ProjectCreateFromSavedTemplate,
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Create a new project from a saved template.
    Requires a valid Clerk session token in the Authorization header.
    """
    user = db.query(User).filter(User.clerk_id == clerk_user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please ensure your user is synced to the database."
        )

    # Get the template
    template = db.query(ProjectTemplate).filter(
        ProjectTemplate.template_id == project_data.template_id,
        ProjectTemplate.owner_id == user.id,
        ProjectTemplate.deleted_at.is_(None)
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found or you don't have access to it."
        )

    # Create the new project
    new_project = Project(
        name=project_data.name,
        owner_id=user.id,
        roles=template.roles
    )

    db.add(new_project)
    db.commit()
    db.refresh(new_project)

    # Track the first swim lane ID (all tasks will be assigned to this)
    first_swim_lane_id = None

    if template.statuses:
        # Sort by order to ensure we get the first one
        sorted_statuses = sorted(template.statuses, key=lambda x: x["order"])
        for status_data in sorted_statuses:
            new_lane = ProjectSwimLane(
                project_id=new_project.project_id,
                name=status_data["name"],
                order=status_data["order"]
            )
            db.add(new_lane)
            db.flush()
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
        for lane in default_swim_lanes:
            db.add(lane)
            db.flush()
        # Get the first swim lane ID (order 0)
        first_lane = db.query(ProjectSwimLane).filter(
            ProjectSwimLane.project_id == new_project.project_id
        ).order_by(ProjectSwimLane.order).first()
        if first_lane:
            first_swim_lane_id = first_lane.swim_lane_id

    # Create user roles from template
    valid_user_ids = set()
    if template.users:
        for user_data in template.users:
            try:
                user_id = uuid.UUID(user_data["user_id"])
                # Verify the user exists
                template_user = db.query(User).filter(
                    User.id == user_id,
                    User.deleted_at.is_(None)
                ).first()
                if template_user:
                    new_user_role = ProjectUserRole(
                        project_id=new_project.project_id,
                        user_id=user_id,
                        role=user_data["role"]
                    )
                    db.add(new_user_role)
                    valid_user_ids.add(user_id)
            except (ValueError, TypeError):
                pass

    # Create tasks - all assigned to first swim lane
    if template.tasks and first_swim_lane_id:
        for task_data in template.tasks:
            # Only keep assignee if requested, the assignee ID is valid, and user was added to project
            assigned_to = None
            if project_data.keep_assignees and task_data.get("assigned_to"):
                try:
                    assignee_id = uuid.UUID(task_data["assigned_to"])
                    # Only assign if the user was added to the project
                    if assignee_id in valid_user_ids:
                        assigned_to = assignee_id
                except (ValueError, TypeError):
                    assigned_to = None

            new_task = Task(
                project_id=new_project.project_id,
                project_swim_lane_id=first_swim_lane_id,
                title=task_data["title"],
                description=task_data.get("description"),
                assigned_to=assigned_to,
                created_by=user.id
            )
            db.add(new_task)

    db.commit()
    db.refresh(new_project)

    return new_project
