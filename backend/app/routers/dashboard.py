"""Dashboard-related API endpoints."""
from collections import defaultdict
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from ..auth import get_current_user_id
from ..db import get_db
from ..models import Project, ProjectSwimLane, ProjectUserRole, Task, User
from ..schemas import DashboardMember, DashboardStatsResponse, ProjectStats, SwimLaneTaskCount

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

    # Batch query: task counts per (project, swim lane)
    lane_task_rows = db.query(
        Task.project_id,
        Task.project_swim_lane_id,
        func.count(Task.task_id),
    ).filter(
        Task.project_id.in_(project_ids),
        Task.deleted_at.is_(None),
    ).group_by(Task.project_id, Task.project_swim_lane_id).all()

    # lane_task_counts: {project_id: {swim_lane_id: count}}
    lane_task_counts: dict = defaultdict(dict)
    for pid, lane_id, cnt in lane_task_rows:
        lane_task_counts[pid][lane_id] = cnt

    # Batch query: all swim lanes for user's projects
    swim_lanes = db.query(ProjectSwimLane).filter(
        ProjectSwimLane.project_id.in_(project_ids),
        ProjectSwimLane.deleted_at.is_(None),
    ).order_by(ProjectSwimLane.order).all()

    # swim_lanes_by_project: {project_id: [(swim_lane_id, name, order)]}
    swim_lanes_by_project: dict = defaultdict(list)
    for lane in swim_lanes:
        swim_lanes_by_project[lane.project_id].append(lane)

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
        # Build task breakdown per swim lane (include lanes with 0 tasks)
        breakdown = []
        for lane in swim_lanes_by_project.get(pid, []):
            breakdown.append(SwimLaneTaskCount(
                name=lane.name,
                order=lane.order,
                count=lane_task_counts.get(pid, {}).get(lane.swim_lane_id, 0),
            ))
        result.append(ProjectStats(
            project_id=pid,
            task_count=task_counts.get(pid, 0),
            member_count=len(members),
            members=members[:5],
            task_breakdown=breakdown,
        ))

    return DashboardStatsResponse(projects=result)
