# Backend Tests

This directory contains unit tests for the FastAPI backend application.

## Running Tests

From the `backend` directory:

```bash
# Run all tests
pytest

# Run with verbose output
pytest -v

# Run a specific test file
pytest tests/test_users.py

# Run a specific test
pytest tests/test_users.py::test_create_user

# Run with coverage (requires pytest-cov)
pytest --cov=app --cov-report=html
```

## Test Structure

- `conftest.py` - Pytest fixtures for database sessions and test client
- `test_main.py` - Tests for main application endpoints (health check)
- `test_users.py` - Tests for user endpoints

## Test Database

Tests use an in-memory SQLite database, which is created fresh for each test and torn down afterward. This ensures:
- Tests are isolated from each other
- Tests don't affect the development database
- Tests run quickly

## Adding New Tests

When adding new endpoints or routers:
1. Create a corresponding test file (e.g., `test_new_feature.py`)
2. Use the `client` fixture from `conftest.py` to make requests
3. Use the `db_session` fixture if you need direct database access

Example:
```python
def test_new_endpoint(client):
    response = client.get("/api/new-endpoint")
    assert response.status_code == 200
```

