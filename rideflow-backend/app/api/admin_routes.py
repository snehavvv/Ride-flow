from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import uuid

from app.database.connection import get_db
from app.models.user_model import User
from app.models.driver_model import Driver
from app.models.ride_model import Ride
from app.services.auth_service import require_admin
from app.schemas.user_schema import UserResponse
from app.schemas.booking_schema import DriverResponse, RideResponse

router = APIRouter(prefix="/admin", tags=["admin"], dependencies=[Depends(require_admin)])

@router.get("/users", response_model=List[UserResponse])
def list_users(db: Session = Depends(get_db)):
    """List all users on the platform"""
    return db.query(User).all()

@router.put("/users/{user_id}/deactivate")
def deactivate_user(user_id: uuid.UUID, db: Session = Depends(get_db)):
    """Deactivate a user account"""
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Cannot deactivate admin accounts")
    
    user.is_active = False
    db.commit()
    return {"message": f"User {user.email} has been deactivated"}

@router.get("/drivers", response_model=List[DriverResponse])
def list_drivers(db: Session = Depends(get_db)):
    """List all drivers with their associated user names"""
    drivers = db.query(Driver).all()
    for d in drivers:
        if d.user:
            d.name = d.user.name
    return drivers

@router.put("/drivers/{driver_id}/approve", response_model=DriverResponse)
def approve_driver(driver_id: uuid.UUID, db: Session = Depends(get_db)):
    """Approve a driver application and upgrade user role to driver"""
    driver = db.query(Driver).filter(Driver.driver_id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    driver.approval_status = "approved"
    
    user = db.query(User).filter(User.user_id == driver.user_id).first()
    if user:
        user.role = "driver"
        
    db.commit()
    db.refresh(driver)
    
    # Populate name for response
    if driver.user:
        driver.name = driver.user.name
        
    return driver

@router.put("/drivers/{driver_id}/reject", response_model=DriverResponse)
def reject_driver(driver_id: uuid.UUID, db: Session = Depends(get_db)):
    """Reject a driver application"""
    driver = db.query(Driver).filter(Driver.driver_id == driver_id).first()
    if not driver:
        raise HTTPException(status_code=404, detail="Driver not found")
        
    driver.approval_status = "rejected"
    # Note: user.role remains "user" instead of "driver" if rejected.
    db.commit()
    db.refresh(driver)
    return driver

@router.get("/rides", response_model=List[RideResponse])
def list_all_rides(db: Session = Depends(get_db)):
    """List all rides from all users"""
    try:
        rides = db.query(Ride).all()
        return rides
    except Exception as e:
        print(f"ERROR list_all_rides: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")

@router.get("/analytics/overview")
def get_platform_overview(db: Session = Depends(get_db)):
    """Get platform-wide statistics for booking system"""
    total_users = db.query(User).count()
    total_drivers = db.query(Driver).filter(Driver.approval_status == "approved").count()
    total_rides = db.query(Ride).count()
    
    completed_rides = db.query(Ride).filter(Ride.status == "completed").all()
    total_revenue = sum(r.fare for r in completed_rides if r.fare)
    
    return {
        "total_users": total_users,
        "total_drivers": total_drivers,
        "total_rides": total_rides,
        "total_revenue": round(total_revenue, 2)
    }
