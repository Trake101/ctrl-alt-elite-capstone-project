"""Dashboard-related API endpoints."""
from collections import defaultdict
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from ..auth import get_current_user_id
from ..db import get_db
from ..models import Project, ProjectUserRole, Task, User
from ..schemas import DashboardMember, DashboardStatsResponse, ProjectStats

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStatsResponse)
async def get_dashboard_stats(
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Get aggregated stats (task counts, members) for all projects
    the authenticated user owns or is a member of.
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
    projects = db.query(Project).filter(
        or_(
            Project.owner_id == user.id,
            Project.project_id.in_(member_project_ids),
        ),
        Project.deleted_at.is_(None),
    ).all()

    project_ids = [p.project_id for p in projects]

    if not project_ids:
        return DashboardStatsResponse(projects=[])

    # Batch query: task counts per project
    task_counts_rows = db.query(
        Task.project_id,
        func.count(Task.task_id),
    ).filter(
        Task.project_id.in_(project_ids),
        Task.deleted_at.is_(None),
    ).group_by(Task.project_id).all()

    task_counts = {row[0]: row[1] for row in task_counts_rows}

    # Batch query: members from project_user_roles
    role_members = db.query(
        ProjectUserRole.project_id,
        User.id,
        User.email,
        User.first_name,
        User.last_name,
    ).join(User, ProjectUserRole.user_id == User.id).filter(
        ProjectUserRole.project_id.in_(project_ids),
        ProjectUserRole.deleted_at.is_(None),
    ).all()

    # Batch query: project owners
    owners = db.query(
        Project.project_id,
        User.id,
        User.email,
        User.first_name,
        User.last_name,
    ).join(User, Project.owner_id == User.id).filter(
        Project.project_id.in_(project_ids),
    ).all()

    # Build members dict per project, deduplicating owner if also in roles
    members_by_project: dict[str, dict] = defaultdict(dict)

    for project_id, user_id, email, first_name, last_name in owners:
        members_by_project[project_id][user_id] = DashboardMember(
            user_id=user_id, email=email, first_name=first_name, last_name=last_name,
        )

    for project_id, user_id, email, first_name, last_name in role_members:
        members_by_project[project_id][user_id] = DashboardMember(
            user_id=user_id, email=email, first_name=first_name, last_name=last_name,
        )

    # Assemble response
    result: List[ProjectStats] = []
    for pid in project_ids:
        members = list(members_by_project.get(pid, {}).values())
        result.append(ProjectStats(
            project_id=pid,
            task_count=task_counts.get(pid, 0),
            member_count=len(members),
            members=members[:5],
        ))

    return DashboardStatsResponse(projects=result)
