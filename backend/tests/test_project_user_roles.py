"""Tests for project user role-related endpoints."""
import uuid
from fastapi import status


def test_get_project_user_roles(client, db_session):
    """Test getting all user roles for a project."""
    # Create users and project
    from app.models import User, Project, ProjectUserRole
    user1 = User(clerk_id="test_clerk_user_123", email="user1@example.com")
    user2 = User(clerk_id="test_clerk_user_456", email="user2@example.com")
    db_session.add_all([user1, user2])
    db_session.commit()
    db_session.refresh(user1)
    db_session.refresh(user2)

    project = Project(name="Test Project", owner_id=user1.id, roles=["admin", "editor"])
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    # Create user roles
    user_role1 = ProjectUserRole(project_id=project.project_id, user_id=user2.id, role="admin")
    db_session.add(user_role1)
    db_session.commit()

    # Get user roles
    response = client.get(f"/api/projects/{project.project_id}/user-roles")
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    assert data[0]["role"] == "admin"
    assert data[0]["user_id"] == str(user2.id)
    assert "user" in data[0]
    assert data[0]["user"]["email"] == "user2@example.com"


def test_create_project_user_role(client, db_session):
    """Test creating a new project user role."""
    # Create users and project
    from app.models import User, Project
    user1 = User(clerk_id="test_clerk_user_123", email="user1@example.com")
    user2 = User(clerk_id="test_clerk_user_456", email="user2@example.com")
    db_session.add_all([user1, user2])
    db_session.commit()
    db_session.refresh(user1)
    db_session.refresh(user2)

    project = Project(name="Test Project", owner_id=user1.id, roles=["admin", "editor"])
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    # Create user role
    role_data = {
        "project_id": str(project.project_id),
        "user_id": str(user2.id),
        "role": "admin"
    }
    response = client.post(f"/api/projects/{project.project_id}/user-roles", json=role_data)
    assert response.status_code == status.HTTP_201_CREATED
    data = response.json()
    assert data["role"] == "admin"
    assert data["user_id"] == str(user2.id)
    assert data["project_id"] == str(project.project_id)


def test_create_project_user_role_invalid_role(client, db_session):
    """Test creating a user role with a role that doesn't exist in the project."""
    # Create users and project
    from app.models import User, Project
    user1 = User(clerk_id="test_clerk_user_123", email="user1@example.com")
    user2 = User(clerk_id="test_clerk_user_456", email="user2@example.com")
    db_session.add_all([user1, user2])
    db_session.commit()
    db_session.refresh(user1)
    db_session.refresh(user2)

    project = Project(name="Test Project", owner_id=user1.id, roles=["admin", "editor"])
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    # Try to create user role with invalid role
    role_data = {
        "project_id": str(project.project_id),
        "user_id": str(user2.id),
        "role": "invalid_role"
    }
    response = client.post(f"/api/projects/{project.project_id}/user-roles", json=role_data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "not defined" in response.json()["detail"].lower()


def test_create_project_user_role_duplicate(client, db_session):
    """Test creating a duplicate user role."""
    # Create users and project
    from app.models import User, Project, ProjectUserRole
    user1 = User(clerk_id="test_clerk_user_123", email="user1@example.com")
    user2 = User(clerk_id="test_clerk_user_456", email="user2@example.com")
    db_session.add_all([user1, user2])
    db_session.commit()
    db_session.refresh(user1)
    db_session.refresh(user2)

    project = Project(name="Test Project", owner_id=user1.id, roles=["admin", "editor"])
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    # Create first user role
    user_role = ProjectUserRole(project_id=project.project_id, user_id=user2.id, role="admin")
    db_session.add(user_role)
    db_session.commit()

    # Try to create duplicate
    role_data = {
        "project_id": str(project.project_id),
        "user_id": str(user2.id),
        "role": "admin"
    }
    response = client.post(f"/api/projects/{project.project_id}/user-roles", json=role_data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already has this role" in response.json()["detail"].lower()


def test_update_project_user_role(client, db_session):
    """Test updating a project user role."""
    # Create users and project
    from app.models import User, Project, ProjectUserRole
    user1 = User(clerk_id="test_clerk_user_123", email="user1@example.com")
    user2 = User(clerk_id="test_clerk_user_456", email="user2@example.com")
    db_session.add_all([user1, user2])
    db_session.commit()
    db_session.refresh(user1)
    db_session.refresh(user2)

    project = Project(name="Test Project", owner_id=user1.id, roles=["admin", "editor", "viewer"])
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    # Create user role
    user_role = ProjectUserRole(project_id=project.project_id, user_id=user2.id, role="admin")
    db_session.add(user_role)
    db_session.commit()
    db_session.refresh(user_role)

    # Update user role
    update_data = {"role": "editor"}
    response = client.put(f"/api/projects/{project.project_id}/user-roles/{user_role.id}", json=update_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["role"] == "editor"
    assert data["user_id"] == str(user2.id)


def test_update_project_user_role_invalid_role(client, db_session):
    """Test updating a user role to an invalid role."""
    # Create users and project
    from app.models import User, Project, ProjectUserRole
    user1 = User(clerk_id="test_clerk_user_123", email="user1@example.com")
    user2 = User(clerk_id="test_clerk_user_456", email="user2@example.com")
    db_session.add_all([user1, user2])
    db_session.commit()
    db_session.refresh(user1)
    db_session.refresh(user2)

    project = Project(name="Test Project", owner_id=user1.id, roles=["admin", "editor"])
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    # Create user role
    user_role = ProjectUserRole(project_id=project.project_id, user_id=user2.id, role="admin")
    db_session.add(user_role)
    db_session.commit()
    db_session.refresh(user_role)

    # Try to update to invalid role
    update_data = {"role": "invalid_role"}
    response = client.put(f"/api/projects/{project.project_id}/user-roles/{user_role.id}", json=update_data)
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "not defined" in response.json()["detail"].lower()


def test_delete_project_user_role(client, db_session):
    """Test deleting a project user role."""
    # Create users and project
    from app.models import User, Project, ProjectUserRole
    user1 = User(clerk_id="test_clerk_user_123", email="user1@example.com")
    user2 = User(clerk_id="test_clerk_user_456", email="user2@example.com")
    db_session.add_all([user1, user2])
    db_session.commit()
    db_session.refresh(user1)
    db_session.refresh(user2)

    project = Project(name="Test Project", owner_id=user1.id, roles=["admin", "editor"])
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    # Create user role
    user_role = ProjectUserRole(project_id=project.project_id, user_id=user2.id, role="admin")
    db_session.add(user_role)
    db_session.commit()
    db_session.refresh(user_role)

    # Delete user role
    response = client.delete(f"/api/projects/{project.project_id}/user-roles/{user_role.id}")
    assert response.status_code == status.HTTP_204_NO_CONTENT

    # Verify it's soft deleted (not in list)
    get_response = client.get(f"/api/projects/{project.project_id}/user-roles")
    assert get_response.status_code == status.HTTP_200_OK
    data = get_response.json()
    assert len(data) == 0


def test_get_project_user_roles_unauthorized(client, db_session):
    """Test that users can't access user roles for projects they don't own."""
    # Create two users
    from app.models import User, Project
    user1 = User(clerk_id="test_clerk_user_123", email="user1@example.com")
    user2 = User(clerk_id="test_clerk_user_456", email="user2@example.com")
    db_session.add_all([user1, user2])
    db_session.commit()
    db_session.refresh(user1)
    db_session.refresh(user2)

    # Create project owned by user2
    project = Project(name="User2 Project", owner_id=user2.id, roles=["admin"])
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    # User1 tries to access user roles for user2's project
    response = client.get(f"/api/projects/{project.project_id}/user-roles")
    assert response.status_code == status.HTTP_404_NOT_FOUND


def test_create_project_user_role_unauthorized(client, db_session):
    """Test that users can't create user roles for projects they don't own."""
    # Create two users
    from app.models import User, Project
    user1 = User(clerk_id="test_clerk_user_123", email="user1@example.com")
    user2 = User(clerk_id="test_clerk_user_456", email="user2@example.com")
    db_session.add_all([user1, user2])
    db_session.commit()
    db_session.refresh(user1)
    db_session.refresh(user2)

    # Create project owned by user2
    project = Project(name="User2 Project", owner_id=user2.id, roles=["admin"])
    db_session.add(project)
    db_session.commit()
    db_session.refresh(project)

    # User1 tries to create user role for user2's project
    role_data = {
        "project_id": str(project.project_id),
        "user_id": str(user1.id),
        "role": "admin"
    }
    response = client.post(f"/api/projects/{project.project_id}/user-roles", json=role_data)
    assert response.status_code == status.HTTP_404_NOT_FOUND

