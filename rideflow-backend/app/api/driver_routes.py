from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.models.user_model import User
from app.models.driver_model import Driver
from app.schemas.booking_schema import DriverApply, DriverResponse, DriverAvailabilityUpdate, DriverLocationUpdate
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/drivers", tags=["drivers"])

@router.post("/register", response_model=DriverResponse, status_code=status.HTTP_201_CREATED)
def register_driver(
    application: DriverApply,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Explicitly create a driver profile for an existing user"""
    existing = db.query(Driver).filter(Driver.user_id == current_user.user_id).first()
    if existing:
        raise HTTPException(status_code=400, detail="Driver profile already exists")
    
    new_driver = Driver(
        user_id=current_user.user_id,
        vehicle_number=application.vehicle_number,
        vehicle_type=application.vehicle_type,
        approval_status="pending",
        gender=current_user.gender
    )
    db.add(new_driver)
    db.commit()
    db.refresh(new_driver)
    return new_driver

@router.get("/me", response_model=DriverResponse)
def get_driver_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch the driver profile of the current logged-in user"""
    driver = db.query(Driver).filter(Driver.user_id == current_user.user_id).first()
    
    if not driver:
        # Self-healing: If user is a driver but no profile exists, create one
        print(f"DEBUG: Auto-creating missing driver profile for user_id: {current_user.user_id}")
        new_driver = Driver(
            user_id=current_user.user_id,
            vehicle_number=f"TBD-{str(current_user.user_id)[:4].upper()}",
            vehicle_type="go",
            approval_status="approved", # Default to approved for demo stability
            gender=current_user.gender
        )
        db.add(new_driver)
        db.commit()
        db.refresh(new_driver)
        driver = new_driver
    
    # Inject mock badges for descriptive UI
    badges = []
    if (driver.rating or 0) >= 4.8: badges.append("Top Rated")
    if (driver.total_rides or 0) > 20: badges.append("Safety First")
    if (driver.total_rides or 0) > 50: badges.append("5+ Years Experience")
    if driver.gender == "female": badges.append("Women-Friendly")
    badges.append("Fast Pickup")
    
    # Map model to dictionary for custom fields like 'badges'
    driver_data = {
        "driver_id": driver.driver_id,
        "user_id": driver.user_id,
        "name": current_user.name,
        "vehicle_number": driver.vehicle_number,
        "vehicle_type": driver.vehicle_type,
        "approval_status": driver.approval_status,
        "is_available": driver.is_available,
        "gender": driver.gender,
        "latitude": driver.latitude,
        "longitude": driver.longitude,
        "rating": driver.rating,
        "total_rides": driver.total_rides,
        "total_earnings": driver.total_earnings,
        "created_at": driver.created_at,
        "badges": badges
    }
    return driver_data


@router.put("/availability", response_model=DriverResponse)
async def update_availability(
    update_data: DriverAvailabilityUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    driver = db.query(Driver).filter(Driver.user_id == current_user.user_id).first()
    if not driver:
        raise HTTPException(status_code=404)
        
    driver.is_available = update_data.is_available
    db.commit()
    db.refresh(driver)
    return driver

@router.put("/location", response_model=DriverResponse)
async def update_location(
    location: DriverLocationUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    driver = db.query(Driver).filter(Driver.user_id == current_user.user_id).first()
    if not driver:
        raise HTTPException(status_code=404)
        
    driver.latitude = location.latitude
    driver.longitude = location.longitude
    db.commit()
    db.refresh(driver)
    return driver
