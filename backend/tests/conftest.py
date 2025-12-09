"""Pytest configuration and fixtures for testing."""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from app.db import Base, get_db
from app.main import app
from app.auth import get_current_user_id
import app.models  # Import models to register them with Base.metadata

# Use SQLite in-memory database for testing
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

test_engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)


@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database session for each test."""
    # Create tables
    Base.metadata.create_all(bind=test_engine)

    # Create session
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        # Drop tables after test
        Base.metadata.drop_all(bind=test_engine)


@pytest.fixture(scope="function")
def mock_user_id():
    """Mock Clerk user ID for testing."""
    return "test_clerk_user_123"


@pytest.fixture(scope="function")
def client(db_session, mock_user_id):
    """Create a test client with database and auth overrides."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    def override_get_current_user_id():
        return mock_user_id

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user_id] = override_get_current_user_id
    yield TestClient(app)
    app.dependency_overrides.clear()
