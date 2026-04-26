"""description of changes

Revision ID: 3daa94c92fdf
Revises: a1b2c3d4e5f6
Create Date: 2026-03-31 03:18:38.414437

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '3daa94c92fdf'
down_revision: Union[str, None] = 'a1b2c3d4e5f6'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('tasks', sa.Column('position', sa.Integer(), nullable=False, server_default='0'))
    op.execute(
        """
        WITH ranked AS (
            SELECT
                task_id,
                ROW_NUMBER() OVER (
                    PARTITION BY project_swim_lane_id
                    ORDER BY created_at, task_id
                ) - 1 AS new_position
            FROM tasks
            WHERE deleted_at IS NULL
        )
        UPDATE tasks
        SET position = ranked.new_position
        FROM ranked
        WHERE tasks.task_id = ranked.task_id
        """
    )
    op.alter_column('tasks', 'position', server_default=None)


def downgrade() -> None:
    op.drop_column('tasks', 'position')
