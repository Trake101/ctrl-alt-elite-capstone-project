"""Activity log-related API endpoints."""
import uuid
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..auth import get_current_user_id
from ..db import get_db
from ..models import ActivityLog, Project, ProjectUserRole, User
from ..schemas import ActivityLogResponse

router = APIRouter(prefix="/api/projects/{project_id}/activity", tags=["activity-logs"])


@router.get("", response_model=List[ActivityLogResponse])
async def get_project_activity(
    project_id: uuid.UUID,
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Get all activity logs for a project.
    Requires the user to own or be a member of the project.
    """
    user = db.query(User).filter(User.clerk_id == clerk_user_id).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please ensure your user is synced to the database.",
        )

    # Verify user has access (owner or member)
    member_project_ids = db.query(ProjectUserRole.project_id).filter(
        ProjectUserRole.user_id == user.id,
        ProjectUserRole.deleted_at.is_(None),
    )
    project = db.query(Project).filter(
        Project.project_id == project_id,
        or_(
            Project.owner_id == user.id,
            Project.project_id.in_(member_project_ids),
        ),
        Project.deleted_at.is_(None),
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found or you don't have access to it.",
        )

    # Get activity logs where metadata contains this project_id
    logs = db.query(ActivityLog).filter(
        ActivityLog.extra_data["project_id"].as_string() == str(project_id),
    ).order_by(ActivityLog.created_at.desc()).all()

    return logs
