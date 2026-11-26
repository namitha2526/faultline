"""Initial schema for Faultline platform

Revision ID: 0001_initial_schema
Revises:
Create Date: 2026-10-12 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql
from pgvector.sqlalchemy import Vector

# revision identifiers, used by Alembic.
revision: str = "0001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # 1. Enable pgvector extension
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    # 2. Create projects table
    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("api_key", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.create_index(op.f("ix_projects_api_key"), "projects", ["api_key"], unique=True)

    # 3. Create clusters table
    op.create_table(
        "clusters",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("first_seen", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("last_seen", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("error_count", sa.Integer(), server_default="0", nullable=False),
        sa.Column("status", sa.String(length=50), server_default="unresolved", nullable=False),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
    )
    op.create_index(op.f("ix_clusters_project_id"), "clusters", ["project_id"], unique=False)
    op.create_index(op.f("ix_clusters_error_count"), "clusters", ["error_count"], unique=False)

    # 4. Create errors table
    op.create_table(
        "errors",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("stack_trace", sa.Text(), nullable=True),
        sa.Column("exception_type", sa.String(length=100), nullable=True),
        sa.Column("browser", sa.String(length=100), nullable=True),
        sa.Column("os", sa.String(length=100), nullable=True),
        sa.Column("url", sa.Text(), nullable=True),
        sa.Column("user_id", sa.String(length=255), nullable=True),
        sa.Column("release", sa.String(length=100), nullable=True),
        sa.Column("timestamp", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("stack_hash", sa.String(length=64), nullable=True),
        sa.Column("embedding", Vector(384), nullable=True),
        sa.Column("cluster_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.ForeignKeyConstraint(["project_id"], ["projects.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["cluster_id"], ["clusters.id"], ondelete="SET NULL"),
    )
    op.create_index(op.f("ix_errors_project_id"), "errors", ["project_id"], unique=False)
    op.create_index(op.f("ix_errors_stack_hash"), "errors", ["stack_hash"], unique=False)
    op.create_index(op.f("ix_errors_cluster_id"), "errors", ["cluster_id"], unique=False)
    op.create_index(op.f("ix_errors_timestamp"), "errors", ["timestamp"], unique=False)

    # 5. Insert initial demo project
    op.execute(
        """
        INSERT INTO projects (id, name, api_key, created_at)
        VALUES ('00000000-0000-0000-0000-000000000001', 'Demo Project', 'fl_demo_key_9f8e7d6c5b4a', now())
        ON CONFLICT (api_key) DO NOTHING;
        """
    )


def downgrade() -> None:
    op.drop_table("errors")
    op.drop_table("clusters")
    op.drop_table("projects")
