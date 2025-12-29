"""Project user role-related API endpoints."""
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth import get_current_user_id
from ..db import get_db
from ..models import Project, ProjectUserRole, User
from ..schemas import (
    ProjectUserRoleCreate,
    ProjectUserRoleResponse,
    ProjectUserRoleUpdate,
    ProjectUserRoleWithUserResponse,
)

router = APIRouter(prefix="/api/projects/{project_id}/user-roles", tags=["project-user-roles"])


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
        Project.deleted_at.is_(None)
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or you don't have access to it."
        )

    return project


@router.get("", response_model=List[ProjectUserRoleWithUserResponse])
async def get_project_user_roles(
    project_id: uuid.UUID,
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Get all user roles for a project.
    Requires the user to own the project.
    Requires a valid Clerk session token in the Authorization header.
    """
    verify_project_ownership(project_id, clerk_user_id, db)

    # Get all user roles for this project that are not deleted, with user data
    user_roles = db.query(ProjectUserRole, User).join(
        User, ProjectUserRole.user_id == User.id
    ).filter(
        ProjectUserRole.project_id == project_id,
        ProjectUserRole.deleted_at.is_(None)
    ).all()

    # Build response with user details
    result = []
    for user_role, user in user_roles:
        result.append({
            'id': user_role.id,
            'project_id': user_role.project_id,
            'user_id': user_role.user_id,
            'role': user_role.role,
            'created_at': user_role.created_at,
            'updated_at': user_role.updated_at,
            'deleted_at': user_role.deleted_at,
            'user': {
                'id': user.id,
                'clerk_id': user.clerk_id,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
            }
        })

    return result


@router.post("", response_model=ProjectUserRoleResponse, status_code=status.HTTP_201_CREATED)
async def create_project_user_role(
    project_id: uuid.UUID,
    user_role_data: ProjectUserRoleCreate,
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Create a new project user role.
    Requires the user to own the project.
    Requires a valid Clerk session token in the Authorization header.
    """
    project = verify_project_ownership(project_id, clerk_user_id, db)

    # Verify the project_id matches
    if user_role_data.project_id != project_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project ID mismatch"
        )

    # Verify the role exists in the project's roles list
    if project.roles and user_role_data.role not in project.roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role '{user_role_data.role}' is not defined for this project"
        )

    # Check if user exists
    user = db.query(User).filter(User.id == user_role_data.user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check if this user-role combination already exists (and is not deleted)
    existing = db.query(ProjectUserRole).filter(
        ProjectUserRole.project_id == project_id,
        ProjectUserRole.user_id == user_role_data.user_id,
        ProjectUserRole.role == user_role_data.role,
        ProjectUserRole.deleted_at.is_(None)
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This user already has this role for this project"
        )

    # Create the new user role
    new_user_role = ProjectUserRole(
        project_id=user_role_data.project_id,
        user_id=user_role_data.user_id,
        role=user_role_data.role
    )

    db.add(new_user_role)
    db.commit()
    db.refresh(new_user_role)

    return new_user_role


@router.put("/{user_role_id}", response_model=ProjectUserRoleResponse)
async def update_project_user_role(
    project_id: uuid.UUID,
    user_role_id: uuid.UUID,
    user_role_data: ProjectUserRoleUpdate,
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Update a project user role.
    Requires the user to own the project.
    Requires a valid Clerk session token in the Authorization header.
    """
    project = verify_project_ownership(project_id, clerk_user_id, db)

    # Get the user role and verify it exists and is not deleted
    user_role = db.query(ProjectUserRole).filter(
        ProjectUserRole.id == user_role_id,
        ProjectUserRole.project_id == project_id,
        ProjectUserRole.deleted_at.is_(None)
    ).first()

    if not user_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User role not found"
        )

    # If updating the role, verify it exists in the project's roles list
    if user_role_data.role is not None:
        if project.roles and user_role_data.role not in project.roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Role '{user_role_data.role}' is not defined for this project"
            )

        # Check if this user already has this role (excluding current one)
        existing = db.query(ProjectUserRole).filter(
            ProjectUserRole.project_id == project_id,
            ProjectUserRole.user_id == user_role.user_id,
            ProjectUserRole.role == user_role_data.role,
            ProjectUserRole.id != user_role_id,
            ProjectUserRole.deleted_at.is_(None)
        ).first()

        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This user already has this role for this project"
            )

        user_role.role = user_role_data.role

    db.commit()
    db.refresh(user_role)

    return user_role


@router.delete("/{user_role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project_user_role(
    project_id: uuid.UUID,
    user_role_id: uuid.UUID,
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db)
):
    """
    Delete (soft delete) a project user role.
    Requires the user to own the project.
    Requires a valid Clerk session token in the Authorization header.
    """
    verify_project_ownership(project_id, clerk_user_id, db)

    # Get the user role and verify it exists and is not deleted
    user_role = db.query(ProjectUserRole).filter(
        ProjectUserRole.id == user_role_id,
        ProjectUserRole.project_id == project_id,
        ProjectUserRole.deleted_at.is_(None)
    ).first()

    if not user_role:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User role not found"
        )

    # Soft delete
    from datetime import datetime, timezone
    user_role.deleted_at = datetime.now(timezone.utc)

    db.commit()

    return None

