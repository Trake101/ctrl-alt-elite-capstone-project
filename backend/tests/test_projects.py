"""Tests for project-related endpoints."""
import uuid
from fastapi import status


def test_create_project(client, db_session):
    """Test creating a new project."""
    # First create a user
    from app.models import User
    user = User(
        clerk_id="test_clerk_user_123",
        email="test@example.com",
        first_name="Test",
        last_name="User"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Create project
    project_data = {"name": "Test Project"}
    response = client.post("/api/projects", json=project_data)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "Test Project"
    assert data["owner_id"] == str(user.id)
    assert "project_id" in data
    assert "created_at" in data
    assert "updated_at" in data
    assert "deleted_at" in data
    assert data["deleted_at"] is None
    
    # Verify it's a valid UUID
    uuid.UUID(data["project_id"])


def test_create_project_creates_default_swim_lanes(client, db_session):
    """Test that creating a project automatically creates default swim lanes."""
    # First create a user
    from app.models import User
    user = User(
        clerk_id="test_clerk_user_123",
        email="test@example.com",
        first_name="Test",
        last_name="User"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    # Create project
    project_data = {"name": "Test Project"}
    response = client.post("/api/projects", json=project_data)
    assert response.status_code == status.HTTP_201_CREATED
    project = response.json()
    project_id = project["project_id"]

    # Check that default swim lanes were created
    from app.models import ProjectSwimLane
    swim_lanes = db_session.query(ProjectSwimLane).filter(
        ProjectSwimLane.project_id == uuid.UUID(project_id),
        ProjectSwimLane.deleted_at.is_(None)
    ).order_by(ProjectSwimLane.order).all()

    assert len(swim_lanes) == 3
    assert swim_lanes[0].name == "Backlog"
    assert swim_lanes[0].order == 0
    assert swim_lanes[1].name == "To Do"
    assert swim_lanes[1].order == 1
    assert swim_lanes[2].name == "Done"
    assert swim_lanes[2].order == 2


def test_get_project(client, db_session):
    """Test getting a specific project."""
    # First create a user and project
    from app.models import User, Project
    user = User(
        clerk_id="test_clerk_user_123",
        email="test@example.com"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    project = Project(name="Test Project", owner_id=user.id)
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    # Get project
    response = client.get(f"/api/projects/{project.project_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["project_id"] == str(project.project_id)
    assert data["name"] == "Test Project"


def test_get_project_not_found(client, db_session):
    """Test getting a project that doesn't exist."""
    # First create a user
    from app.models import User
    user = User(
        clerk_id="test_clerk_user_123",
        email="test@example.com"
    )
    db_session.add(user)
    db_session.commit()

    # Try to get non-existent project
    fake_id = uuid.uuid4()
    response = client.get(f"/api/projects/{fake_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_get_user_projects(client, db_session):
    """Test getting all projects for a user."""
    # First create a user and projects
    from app.models import User, Project
    user = User(
        clerk_id="test_clerk_user_123",
        email="test@example.com"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)

    project1 = Project(name="Project 1", owner_id=user.id)
    project2 = Project(name="Project 2", owner_id=user.id)
    db_session.add_all([project1, project2])
    db_session.commit()

    # Get all projects
    response = client.get("/api/projects")
    assert response.status_code == status.HTTP_200_OK
    projects = response.json()
    assert len(projects) == 2
    project_names = [p["name"] for p in projects]
    assert "Project 1" in project_names
    assert "Project 2" in project_names


def test_get_project_unauthorized(client, db_session):
    """Test that users can't access projects they don't own."""
    # Create two users
    from app.models import User, Project
    user1 = User(clerk_id="test_clerk_user_123", email="user1@example.com")
    user2 = User(clerk_id="test_clerk_user_456", email="user2@example.com")
    db_session.add_all([user1, user2])
    db_session.commit()
    db_session.refresh(user1)
    db_session.refresh(user2)

    # Create project owned by user2
    project = Project(name="User2 Project", owner_id=user2.id)
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    # User1 (test_clerk_user_123) tries to access user2's project
    response = client.get(f"/api/projects/{project.project_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND

