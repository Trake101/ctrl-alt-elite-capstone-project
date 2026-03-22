"""Comment-related API endpoints."""
import uuid
from datetime import datetime, timezone
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..activity import log_activity
from ..auth import get_current_user_id
from ..db import get_db
from ..models import Comment, Project, ProjectUserRole, Task, User
from ..schemas import CommentCreate, CommentResponse

router = APIRouter(tags=["comments"])


def _verify_task_access(task_id: uuid.UUID, clerk_user_id: str, db: Session):
    """Verify that the user has access to the task's project. Returns (user, task)."""
    user = db.query(User).filter(User.clerk_id == clerk_user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found. Please ensure your user is synced to the database.",
        )

    task = db.query(Task).filter(
        Task.task_id == task_id,
        Task.deleted_at.is_(None),
    ).first()
    if not task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found.",
        )

    # Verify user has access to the project (owner or member)
    member_project_ids = db.query(ProjectUserRole.project_id).filter(
        ProjectUserRole.user_id == user.id,
        ProjectUserRole.deleted_at.is_(None),
    )
    project = db.query(Project).filter(
        Project.project_id == task.project_id,
        or_(
            Project.owner_id == user.id,
            Project.project_id.in_(member_project_ids),
        ),
        Project.deleted_at.is_(None),
    ).first()

    if not project:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have access to this task's project.",
        )

    return user, task


@router.get("/api/tasks/{task_id}/comments", response_model=List[CommentResponse])
async def get_task_comments(
    task_id: uuid.UUID,
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Get all comments for a task, newest first."""
    _verify_task_access(task_id, clerk_user_id, db)

    rows = db.query(Comment, User).join(
        User, Comment.created_by == User.id,
    ).filter(
        Comment.task_id == task_id,
        Comment.deleted_at.is_(None),
    ).order_by(Comment.created_at.desc()).all()

    return [
        CommentResponse(
            comment_id=comment.comment_id,
            task_id=comment.task_id,
            created_by=comment.created_by,
            comment=comment.comment,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
            creator_email=user.email,
            creator_first_name=user.first_name,
            creator_last_name=user.last_name,
        )
        for comment, user in rows
    ]


@router.post("/api/tasks/{task_id}/comments", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    task_id: uuid.UUID,
    data: CommentCreate,
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Add a comment to a task."""
    user, task = _verify_task_access(task_id, clerk_user_id, db)

    if not data.comment or not data.comment.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Comment cannot be empty.",
        )

    new_comment = Comment(
        task_id=task_id,
        created_by=user.id,
        comment=data.comment.strip(),
    )
    db.add(new_comment)
    db.flush()

    log_activity(
        db, "comment", new_comment.comment_id, "created",
        f"Added a comment on task '{task.title}'",
        user.id,
        {"project_id": str(task.project_id), "task_id": str(task_id)},
    )
    db.commit()
    db.refresh(new_comment)

    return CommentResponse(
        comment_id=new_comment.comment_id,
        task_id=new_comment.task_id,
        created_by=new_comment.created_by,
        comment=new_comment.comment,
        created_at=new_comment.created_at,
        updated_at=new_comment.updated_at,
        creator_email=user.email,
        creator_first_name=user.first_name,
        creator_last_name=user.last_name,
    )


@router.delete("/api/comments/{comment_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_comment(
    comment_id: uuid.UUID,
    clerk_user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """Soft-delete a comment. Only the creator can delete their own comment."""
    user = db.query(User).filter(User.clerk_id == clerk_user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    comment = db.query(Comment).filter(
        Comment.comment_id == comment_id,
        Comment.deleted_at.is_(None),
    ).first()
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found.",
        )

    if comment.created_by != user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own comments.",
        )

    task = db.query(Task).filter(Task.task_id == comment.task_id).first()

    comment.deleted_at = datetime.now(timezone.utc)
    log_activity(
        db, "comment", comment.comment_id, "deleted",
        f"Deleted a comment on task '{task.title if task else 'unknown'}'",
        user.id,
        {"project_id": str(task.project_id) if task else None, "task_id": str(comment.task_id)},
    )
    db.commit()
