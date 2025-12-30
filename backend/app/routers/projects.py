"""Project-related API endpoints."""
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user_id
from ..db import get_db
from ..models import Project, ProjectSwimLane, User
from ..schemas import ProjectCreate, ProjectResponse, ProjectUpdate

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
        Project.owner_id == user.id
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
        Project.owner_id == user.id
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

    # Get all projects owned by this user
    projects = db.query(Project).filter(Project.owner_id == user.id).order_by(Project.created_at.desc()).all()

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
