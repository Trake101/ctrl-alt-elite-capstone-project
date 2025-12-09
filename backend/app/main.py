"""FastAPI application entry point."""
from pathlib import Path

from dotenv import load_dotenv
from fastapi import Depends, FastAPI
from sqlalchemy import text
from sqlalchemy.orm import Session

from .db import Base, engine, get_db
from .routers import projects, swim_lanes, users

# Load environment variables from .env file
# This is safe to call multiple times, and will only load if file exists
env_path = Path(__file__).parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

app = FastAPI(redirect_slashes=False)

@app.on_event("startup")
def on_startup():
    """Create database tables on application startup."""
    Base.metadata.create_all(bind=engine)

@app.get("/health")
def health(db: Session = Depends(get_db)):
    """Health check endpoint that verifies database connectivity."""
    db.execute(text("SELECT 1"))
    return {"status": "ok", "db": "up"}

# Include routers
app.include_router(users.router)
app.include_router(projects.router)
app.include_router(swim_lanes.router)
