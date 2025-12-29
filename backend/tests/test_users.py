"""Tests for user-related endpoints."""
import uuid
from fastapi import status


def test_create_user(client):
    """Test creating a new user."""
    user_data = {
        "clerk_id": "user_123",
        "email": "test@example.com",
        "first_name": "John",
        "last_name": "Doe"
    }
    response = client.post("/api/users", json=user_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["clerk_id"] == "user_123"
    assert data["email"] == "test@example.com"
    assert data["first_name"] == "John"
    assert data["last_name"] == "Doe"
    assert "id" in data
    # Verify it's a valid UUID string
    uuid.UUID(data["id"])


def test_create_user_minimal(client):
    """Test creating a user with only required fields."""
    user_data = {
        "clerk_id": "user_456",
        "email": "minimal@example.com"
    }
    response = client.post("/api/users", json=user_data)
    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert data["clerk_id"] == "user_456"
    assert data["email"] == "minimal@example.com"
    assert data["first_name"] is None
    assert data["last_name"] is None


def test_create_user_duplicate_clerk_id(client):
    """Test updating a user when clerk_id already exists."""
    user_data = {
        "clerk_id": "user_789",
        "email": "original@example.com",
        "first_name": "Original",
        "last_name": "Name"
    }
    # Create user
    response1 = client.post("/api/users", json=user_data)
    assert response1.status_code == status.HTTP_200_OK
    original_id = response1.json()["id"]

    # Update with same clerk_id but different data
    updated_data = {
        "clerk_id": "user_789",
        "email": "updated@example.com",
        "first_name": "Updated",
        "last_name": "Name"
    }
    response2 = client.post("/api/users", json=updated_data)
    assert response2.status_code == status.HTTP_200_OK
    updated_user = response2.json()

    # Should have same ID (updated, not created)
    assert updated_user["id"] == original_id
    assert updated_user["email"] == "updated@example.com"
    assert updated_user["first_name"] == "Updated"


def test_create_user_duplicate_email(client):
    """Test that creating a user with duplicate email raises error."""
    user_data1 = {
        "clerk_id": "user_111",
        "email": "duplicate@example.com"
    }
    user_data2 = {
        "clerk_id": "user_222",
        "email": "duplicate@example.com"
    }

    # Create first user
    response1 = client.post("/api/users", json=user_data1)
    assert response1.status_code == status.HTTP_200_OK

    # Try to create second user with same email
    response2 = client.post("/api/users", json=user_data2)
    assert response2.status_code == status.HTTP_400_BAD_REQUEST
    assert "email already exists" in response2.json()["detail"].lower()


def test_get_user_by_clerk_id(client):
    """Test getting a user by clerk_id."""
    # Create user
    user_data = {
        "clerk_id": "user_get",
        "email": "get@example.com",
        "first_name": "Get",
        "last_name": "User"
    }
    create_response = client.post("/api/users", json=user_data)
    assert create_response.status_code == status.HTTP_200_OK
    created_user = create_response.json()

    # Get user by clerk_id
    response = client.get(f"/api/users/{user_data['clerk_id']}")
    assert response.status_code == status.HTTP_200_OK
    user = response.json()
    assert user["id"] == created_user["id"]
    assert user["clerk_id"] == "user_get"
    assert user["email"] == "get@example.com"


def test_get_user_not_found(client):
    """Test getting a user that doesn't exist."""
    response = client.get("/api/users/nonexistent_user")
    assert response.status_code == status.HTTP_404_NOT_FOUND
    assert "not found" in response.json()["detail"].lower()


def test_create_user_invalid_email(client):
    """Test creating a user with invalid email format."""
    user_data = {
        "clerk_id": "user_invalid",
        "email": "not-an-email"
    }
    response = client.post("/api/users", json=user_data)
    # FastAPI/Pydantic should validate email format
    assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY


def test_user_response_model(client):
    """Test that user response matches the expected schema."""
    user_data = {
        "clerk_id": "user_schema",
        "email": "schema@example.com",
        "first_name": "Schema",
        "last_name": "Test"
    }
    response = client.post("/api/users", json=user_data)
    assert response.status_code == status.HTTP_200_OK
    user = response.json()

    # Verify all expected fields are present
    required_fields = ["id", "clerk_id", "email", "first_name", "last_name", "created_at", "updated_at", "deleted_at"]
    for field in required_fields:
        assert field in user
    
    # Verify timestamp fields are properly set
    assert user["created_at"] is not None
    assert user["updated_at"] is not None
    assert user["deleted_at"] is None  # Should be None for new users


def test_get_all_users(client, db_session):
    """Test getting all users."""
    # Create multiple users
    from app.models import User
    user1 = User(
        clerk_id="user_list_1",
        email="list1@example.com",
        first_name="User",
        last_name="One"
    )
    user2 = User(
        clerk_id="user_list_2",
        email="list2@example.com",
        first_name="User",
        last_name="Two"
    )
    db_session.add_all([user1, user2])
    db_session.commit()

    # Get all users
    response = client.get("/api/users")
    assert response.status_code == status.HTTP_200_OK
    users = response.json()
    
    # Should return at least our 2 users (may have more from other tests)
    user_emails = [u["email"] for u in users]
    assert "list1@example.com" in user_emails
    assert "list2@example.com" in user_emails
    
    # Verify all users have required fields
    for user in users:
        assert "id" in user
        assert "clerk_id" in user
        assert "email" in user
        assert "first_name" in user
        assert "last_name" in user


def test_get_all_users_excludes_deleted(client, db_session):
    """Test that deleted users are not returned in the list."""
    from datetime import datetime, timezone
    from app.models import User
    
    # Create active user
    active_user = User(
        clerk_id="active_user",
        email="active@example.com"
    )
    
    # Create deleted user
    deleted_user = User(
        clerk_id="deleted_user",
        email="deleted@example.com",
        deleted_at=datetime.now(timezone.utc)
    )
    
    db_session.add_all([active_user, deleted_user])
    db_session.commit()

    # Get all users
    response = client.get("/api/users")
    assert response.status_code == status.HTTP_200_OK
    users = response.json()
    
    # Should not include deleted user
    user_emails = [u["email"] for u in users]
    assert "active@example.com" in user_emails
    assert "deleted@example.com" not in user_emails
