# CTRL ALT Elite – Task Board

A modern, drag-and-drop task management board.

This project was developed by **CTRL ALT Elite** as part of our capstone work.

---

## 🚀 Features

* 📌 **Task Management**
  * Add tasks inline to each column
  * Edit task details, due date, assignee, and notes
* 🔀 **Drag & Drop**
  * Reorder tasks easily across columns
* **Details**: title, assignee, due date, notes
* **Comments**: threaded input with persistence
* **History**: automatic activity log
* ⚡ **Responsive Layout**

---

## 👨‍💻 Team – CTRL ALT Elite

* Kevin Ekart
* Huynh Le
* Laken Hollen
* Ethan Gray

---

## 🐳 Running with Docker

This project uses Docker Compose to orchestrate the frontend, backend, and database services.

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd ctrl-alt-elite-capstone-project
   ```

2. **Start all services**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - Frontend: http://localhost:3445
   - Backend API: http://localhost:8445
   - Database: localhost:5445

### Service Details

- **Frontend**: Next.js application running on port 3445
- **Backend**: FastAPI application running on port 8445
- **Database**: PostgreSQL 16 running on port 5445

### Development Commands

- **Start services in background**: `docker-compose up -d`
- **View logs**: `docker-compose logs -f [service-name]`
- **Stop services**: `docker-compose down`
- **Rebuild services**: `docker-compose up --build`
- **Remove volumes**: `docker-compose down -v`

### Environment Configuration

The application uses environment variables for configuration. Example files are provided for easy setup:

1. **Copy the example files:**
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env.local
   ```

2. **Update the values** in each file as needed for your environment.

The example files include:
- **Root `.env.example`**: Common environment variables for the entire application
- **Backend `.env.example`**: Database connection, API configuration, and security settings
- **Frontend `.env.example`**: Next.js configuration and API endpoints

---

## 🗄️ Database Migrations

This project uses [Alembic](https://alembic.sqlalchemy.org/) for database migrations.

### Running Migrations

From the `backend` directory:

```bash
# Create a new migration
alembic revision --autogenerate -m "description of changes"

# Apply all pending migrations
alembic upgrade head

# Rollback the last migration
alembic downgrade -1

# View migration history
alembic history

# Show current database revision
alembic current
```

### Migration Workflow

1. **Make changes** to your SQLAlchemy models in `backend/app/models.py`
2. **Generate migration**: `alembic revision --autogenerate -m "your message"`
3. **Review the generated migration** in `backend/alembic/versions/`
4. **Apply migration**: `alembic upgrade head`

> **Note**: When running in Docker, execute migration commands inside the backend container:
> ```bash
> docker-compose exec backend alembic upgrade head
> ```

---

## 🧪 Running Tests

The backend includes a comprehensive test suite using pytest.

### Prerequisites

Ensure dependencies are installed:
```bash
cd backend
pip install -r requirements.txt
```

### Running Tests

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

### Test Structure

- `tests/conftest.py` - Pytest fixtures for database sessions and test client
- `tests/test_main.py` - Tests for main application endpoints (health check)
- `tests/test_users.py` - Tests for user endpoints

Tests use an in-memory SQLite database, ensuring:
- Tests are isolated from each other
- Tests don't affect the development database
- Tests run quickly

---

## 📜 License

BSD 2-Clause Simplified License – feel free to fork and build on this project.
