"""Helper for logging activity events."""
import uuid
from typing import Optional

from sqlalchemy.orm import Session

from .models import ActivityLog


def log_activity(
    db: Session,
    object_type: str,
    object_id: uuid.UUID,
    action: str,
    description: str,
    action_by: uuid.UUID,
    metadata: Optional[dict] = None,
):
    """Create an activity log entry. Must be called before db.commit()."""
    activity = ActivityLog(
        object_type=object_type,
        object_id=object_id,
        action=action,
        description=description,
        action_by=action_by,
        extra_data=metadata,
    )
    db.add(activity)
