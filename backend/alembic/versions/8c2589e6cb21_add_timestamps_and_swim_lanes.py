"""add_swim_lanes

Revision ID: 8c2589e6cb21
Revises: 228690ba72dd
Create Date: 2025-12-08 21:22:38.042715

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = '8c2589e6cb21'
down_revision: Union[str, None] = '228690ba72dd'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Create project_swim_lanes table
    op.create_table(
        'project_swim_lanes',
        sa.Column('swim_lane_id', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('uuid_generate_v4()')),
        sa.Column('project_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('order', sa.Integer(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('deleted_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['project_id'], ['projects.project_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('swim_lane_id')
    )
    op.create_index(op.f('ix_project_swim_lanes_swim_lane_id'), 'project_swim_lanes', ['swim_lane_id'], unique=False)
    op.create_index(op.f('ix_project_swim_lanes_project_id'), 'project_swim_lanes', ['project_id'], unique=False)


def downgrade() -> None:
    # Drop project_swim_lanes table
    op.drop_index(op.f('ix_project_swim_lanes_project_id'), table_name='project_swim_lanes')
    op.drop_index(op.f('ix_project_swim_lanes_swim_lane_id'), table_name='project_swim_lanes')
    op.drop_table('project_swim_lanes')
