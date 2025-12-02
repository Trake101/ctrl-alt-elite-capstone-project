"""User-related API endpoints."""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..db import get_db
from ..models import User
from ..schemas import UserCreate, UserResponse

router = APIRouter(prefix="/api/users", tags=["users"])

@router.post("", response_model=UserResponse)
def create_or_update_user(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    Create or update a user from Clerk sign-up data.
    If user with clerk_id exists, update it. Otherwise, create new user.
    """
    # Check if user already exists by clerk_id
    existing_user = db.query(User).filter(User.clerk_id == user_data.clerk_id).first()

    if existing_user:
        # Update existing user
        existing_user.email = user_data.email
        existing_user.first_name = user_data.first_name
        existing_user.last_name = user_data.last_name
        db.commit()
        db.refresh(existing_user)
        return existing_user

    # Check if email already exists (shouldn't happen with Clerk, but safety check)
    email_exists = db.query(User).filter(User.email == user_data.email).first()
    if email_exists:
        raise HTTPException(status_code=400, detail="User with this email already exists")

    # Create new user
    new_user = User(
        clerk_id=user_data.clerk_id,
        email=user_data.email,
        first_name=user_data.first_name,
        last_name=user_data.last_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.get("/{clerk_id}", response_model=UserResponse)
def get_user_by_clerk_id(clerk_id: str, db: Session = Depends(get_db)):
    """Get user by Clerk ID."""
    user = db.query(User).filter(User.clerk_id == clerk_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
