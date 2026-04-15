from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database.connection import get_db
from app.models.user_model import User
from app.models.driver_model import Driver
from app.schemas.user_schema import UserCreate, UserResponse, Token, UserUpdate, PasswordReset
from app.services.auth_service import (
    get_password_hash, verify_password, create_access_token,
    get_current_user, ACCESS_TOKEN_EXPIRE_MINUTES
)
from app.websocket_manager import manager
import asyncio

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Register with the requested role and phone
    role = "driver" if user.apply_as_driver else "user"
    
    new_user = User(
        name=user.name,
        email=user.email,
        password_hash=get_password_hash(user.password),
        gender=user.gender,
        phone=user.phone,
        role=role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    if user.apply_as_driver:
        new_driver = Driver(
            user_id=new_user.user_id,
            vehicle_number="PENDING",
            vehicle_type="go",
            approval_status="pending",
            gender=new_user.gender
        )
        db.add(new_driver)
        db.commit()

        # Fire and forget socket broadcast for admins
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(manager.broadcast_to_role({"type": "new_driver", "message": f"New driver applied: {new_user.name}"}, "admin"))
        except RuntimeError:
            pass # No running event loop

    # Commit and refresh to ensure user_id is available
    db.commit()
    db.refresh(new_user)

    # Auto-login to provide token for immediate follow-up actions (like driver profile creation)
    access_token_expires = timedelta(hours=24)
    access_token = create_access_token(
        data={"sub": str(new_user.user_id), "role": new_user.role},
        expires_delta=access_token_expires
    )

    return {
        "message": "Account created successfully.",
        "user_id": str(new_user.user_id),
        "access_token": access_token,
        "token_type": "bearer",
        "role": new_user.role
    }



@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    from app.services.auth_service import authenticate_user

    user, status_code = authenticate_user(db, form_data.username, form_data.password)

    if status_code == "no_user":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No account found with this email.")
    if status_code == "wrong_password":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect password. Please try again.")
    if status_code == "inactive":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Your account has been deactivated. Contact support.")

    access_token_expires = timedelta(hours=24)
    access_token = create_access_token(
        data={"sub": str(user.user_id), "role": user.role},
        expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer", "user": user}


@router.get("/me", response_model=UserResponse)
def get_user_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/profile", response_model=UserResponse)
def update_profile(
    profile_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if profile_update.name:
        current_user.name = profile_update.name
    if profile_update.email:
        existing = db.query(User).filter(User.email == profile_update.email).first()
        if existing and existing.user_id != current_user.user_id:
            raise HTTPException(status_code=400, detail="Email already registered")
        current_user.email = profile_update.email
    if profile_update.gender:
        current_user.gender = profile_update.gender
        # Also update driver profile if it exists
        if current_user.driver_profile:
            current_user.driver_profile.gender = profile_update.gender

    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(reset_data: PasswordReset, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == reset_data.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password_hash = get_password_hash(reset_data.new_password)
    db.commit()
    return {"message": "Password updated successfully"}
