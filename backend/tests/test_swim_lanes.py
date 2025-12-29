"""Tests for swim lane-related endpoints."""
import uuid
from fastapi import status


def test_get_project_swim_lanes(client, db_session):
    """Test getting all swim lanes for a project."""
    # First create a user and project
    from app.models import User, Project, ProjectSwimLane
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

    # Create multiple swim lanes
    swim_lane1 = ProjectSwimLane(project_id=project.project_id, name="Lane 1", order=0)
    swim_lane2 = ProjectSwimLane(project_id=project.project_id, name="Lane 2", order=1)
    swim_lane3 = ProjectSwimLane(project_id=project.project_id, name="Lane 3", order=2)
    db_session.add_all([swim_lane1, swim_lane2, swim_lane3])
    db_session.commit()

    # Get swim lanes
    response = client.get(f"/api/swim-lanes/project/{project.project_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 3
    # Should be ordered by order field
    assert data[0]["name"] == "Lane 1"
    assert data[0]["order"] == 0
    assert data[1]["name"] == "Lane 2"
    assert data[1]["order"] == 1
    assert data[2]["name"] == "Lane 3"
    assert data[2]["order"] == 2


def test_get_project_swim_lanes_excludes_deleted(client, db_session):
    """Test that deleted swim lanes are not returned."""
    from datetime import datetime, timezone
    from app.models import User, Project, ProjectSwimLane
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

    # Create active and deleted swim lanes
    active_lane = ProjectSwimLane(project_id=project.project_id, name="Active", order=0)
    deleted_lane = ProjectSwimLane(
        project_id=project.project_id,
        name="Deleted",
        order=1,
        deleted_at=datetime.now(timezone.utc)
    )
    db_session.add_all([active_lane, deleted_lane])
    db_session.commit()

    # Get swim lanes
    response = client.get(f"/api/swim-lanes/project/{project.project_id}")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Active"
    assert data[0]["deleted_at"] is None


def test_get_project_swim_lanes_unauthorized(client, db_session):
    """Test that users can't get swim lanes for projects they don't own."""
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

    # User1 tries to get swim lanes for user2's project
    response = client.get(f"/api/swim-lanes/project/{project.project_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_create_swim_lane(client, db_session):
    """Test creating a new swim lane."""
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

    # Create swim lane
    swim_lane_data = {
        "project_id": str(project.project_id),
        "name": "New Swim Lane",
        "order": 5
    }
    response = client.post("/api/swim-lanes", json=swim_lane_data)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["name"] == "New Swim Lane"
    assert data["order"] == 5
    assert data["project_id"] == str(project.project_id)
    assert "swim_lane_id" in data
    assert "created_at" in data
    assert "updated_at" in data
    assert data["deleted_at"] is None
    
    # Verify it's a valid UUID
    uuid.UUID(data["swim_lane_id"])


def test_create_swim_lane_unauthorized(client, db_session):
    """Test that users can't create swim lanes for projects they don't own."""
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

    # User1 tries to create swim lane for user2's project
    swim_lane_data = {
        "project_id": str(project.project_id),
        "name": "Unauthorized Lane",
        "order": 0
    }
    response = client.post("/api/swim-lanes", json=swim_lane_data)
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_update_swim_lane(client, db_session):
    """Test updating a swim lane."""
    # First create a user, project, and swim lane
    from app.models import User, Project, ProjectSwimLane
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

    swim_lane = ProjectSwimLane(
        project_id=project.project_id,
        name="Original Name",
        order=0
    )
    db_session.add(swim_lane)
    db_session.commit()
    db_session.refresh(swim_lane)

    # Update swim lane
    update_data = {
        "name": "Updated Name",
        "order": 10
    }
    response = client.put(f"/api/swim-lanes/{swim_lane.swim_lane_id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "Updated Name"
    assert data["order"] == 10
    assert data["swim_lane_id"] == str(swim_lane.swim_lane_id)


def test_update_swim_lane_partial(client, db_session):
    """Test updating only some fields of a swim lane."""
    # First create a user, project, and swim lane
    from app.models import User, Project, ProjectSwimLane
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

    swim_lane = ProjectSwimLane(
        project_id=project.project_id,
        name="Original Name",
        order=5
    )
    db_session.add(swim_lane)
    db_session.commit()
    db_session.refresh(swim_lane)

    # Update only name
    update_data = {"name": "New Name"}
    response = client.put(f"/api/swim-lanes/{swim_lane.swim_lane_id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["name"] == "New Name"
    assert data["order"] == 5  # Should remain unchanged


def test_update_swim_lane_not_found(client, db_session):
    """Test updating a swim lane that doesn't exist."""
    # First create a user
    from app.models import User
    user = User(
        clerk_id="test_clerk_user_123",
        email="test@example.com"
    )
    db_session.add(user)
    db_session.commit()

    # Try to update non-existent swim lane
    fake_id = uuid.uuid4()
    update_data = {"name": "New Name"}
    response = client.put(f"/api/swim-lanes/{fake_id}", json=update_data)
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_delete_swim_lane(client, db_session):
    """Test soft deleting a swim lane."""
    # First create a user, project, and swim lane
    from app.models import User, Project, ProjectSwimLane
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

    swim_lane = ProjectSwimLane(
        project_id=project.project_id,
        name="To Delete",
        order=0
    )
    db_session.add(swim_lane)
    db_session.commit()
    db_session.refresh(swim_lane)

    # Delete swim lane
    response = client.delete(f"/api/swim-lanes/{swim_lane.swim_lane_id}")
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify it's soft deleted (deleted_at is set)
    db_session.refresh(swim_lane)
    assert swim_lane.deleted_at is not None

    # Verify it can't be updated after deletion
    update_data = {"name": "Should Fail"}
    response = client.put(f"/api/swim-lanes/{swim_lane.swim_lane_id}", json=update_data)
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_delete_swim_lane_unauthorized(client, db_session):
    """Test that users can't delete swim lanes from projects they don't own."""
    # Create two users
    from app.models import User, Project, ProjectSwimLane
    user1 = User(clerk_id="test_clerk_user_123", email="user1@example.com")
    user2 = User(clerk_id="test_clerk_user_456", email="user2@example.com")
    db_session.add_all([user1, user2])
    db_session.commit()
    db_session.refresh(user1)
    db_session.refresh(user2)

    # Create project and swim lane owned by user2
    project = Project(name="User2 Project", owner_id=user2.id)
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    swim_lane = ProjectSwimLane(
        project_id=project.project_id,
        name="User2 Lane",
        order=0
    )
    db_session.add(swim_lane)
    db_session.commit()
    db_session.refresh(swim_lane)

    # User1 tries to delete user2's swim lane
    response = client.delete(f"/api/swim-lanes/{swim_lane.swim_lane_id}")
    assert response.status_code == status.HTTP_404_NOT_FOUND

