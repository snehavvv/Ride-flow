import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from app.database.connection import get_db
from app.models.user_model import User
from app.models.driver_model import Driver
from app.models.ride_model import Ride
from app.schemas.booking_schema import RideRequest, RideResponse, RideRating
from app.services.auth_service import get_current_user
from app.websocket_manager import manager
import math
import asyncio

router = APIRouter(prefix="/booking", tags=["booking"])

def calculate_distance(lat1, lon1, lat2, lon2):
    # Haversine formula for simplified straight-line distance
    R = 6371.0 # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

from app.services.ride_matching import find_best_driver

@router.post("/request", response_model=RideResponse, status_code=status.HTTP_201_CREATED)
async def request_ride(
    ride_req: RideRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Passenger requests a new ride with moods, vehicle preference, and eco tracking"""
    dist = 0
    if ride_req.pickup_lat and ride_req.pickup_lng and ride_req.dropoff_lat and ride_req.dropoff_lng:
        dist = calculate_distance(ride_req.pickup_lat, ride_req.pickup_lng, ride_req.dropoff_lat, ride_req.dropoff_lng)
    
    # Pricing Logic
    base_fare = max(50.0, dist * 18.0)
    surcharge = 0.0
    if ride_req.ride_preferences and "pet_friendly" in ride_req.ride_preferences.lower():
        surcharge = 50.0
    
    fare = base_fare + surcharge

    # CO2 Logic
    # 170g is baseline. Bike saves 100%. Small cars save 30% via efficiency.
    savings_multiplier = 0.0
    if ride_req.vehicle_type == 'bike':
        savings_multiplier = 170.0
    elif ride_req.vehicle_type == 'go':
        savings_multiplier = 40.0
    elif ride_req.vehicle_type == 'sedan':
        savings_multiplier = 10.0
    elif ride_req.vehicle_type == 'parcel':
        savings_multiplier = 50.0 # Standard delivery assumption
        fare += 40.0 # Base delivery surcharge
    
    co2_saved = dist * savings_multiplier

    new_ride = Ride(
        rider_id=current_user.user_id,
        pickup_location=ride_req.pickup_location,
        dropoff_location=ride_req.dropoff_location,
        pickup_lat=ride_req.pickup_lat,
        pickup_lng=ride_req.pickup_lng,
        dropoff_lat=ride_req.dropoff_lat,
        dropoff_lng=ride_req.dropoff_lng,
        women_only=ride_req.women_only,
        prefer_female_driver=ride_req.prefer_female_driver,
        
        ride_preferences=ride_req.ride_preferences,
        vehicle_type=ride_req.vehicle_type,
        co2_saved=round(co2_saved, 1),
        is_scheduled=ride_req.is_scheduled,
        scheduled_at=ride_req.scheduled_at,

        # Parcel Features
        parcel_description=ride_req.parcel_description,
        parcel_photo_url=ride_req.parcel_photo_url,

        distance_km=round(dist, 2),
        fare=round(fare, 2),
        status="pending"
    )
    
    # Validation: Only female passengers can prefer female driver
    if new_ride.prefer_female_driver and current_user.gender != "female":
        raise HTTPException(status_code=403, detail="Only female passengers can request female drivers for safety.")

    
    # ATTEMPT ASSIGNMENT (Wait for queue if scheduled)
    if not ride_req.is_scheduled:
        # In this demo, we keep it as pending for manual acceptance in dashboard
        pass
    
    db.add(new_ride)
    db.commit()
    db.refresh(new_ride)
    
    # Broadcast to drivers
    try:
        from app.schemas.booking_schema import RideResponse
        ride_response = RideResponse.model_validate(new_ride)
        # targeted broadcast: if prefer_female_driver is true, only notify female drivers
        gender_limit = "female" if new_ride.prefer_female_driver or new_ride.women_only else None
        
        # Use asyncio.create_task to run broadcast in background
        asyncio.create_task(manager.broadcast_to_role({
            "type": "new_ride_request", 
            "ride": ride_response.model_dump(mode='json')
        }, "driver", gender_limit=gender_limit))
    except Exception as e:
        print(f"Broadcast error: {e}")


    return new_ride

@router.get("/available-rides", response_model=List[RideResponse])
def get_available_rides(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Drivers see available rides. Logic filters by vehicle type and women-only."""
    if current_user.role != "driver" and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only drivers can view available rides")

    driver = db.query(Driver).filter(Driver.user_id == current_user.user_id).first()
    if not driver:
         raise HTTPException(status_code=403)

    # 1. Base filter: status=pending
    query = db.query(Ride).filter(Ride.status == "pending")

    # 2. Vehicle Filter: Only rides requesting this driver's vehicle type
    query = query.filter(Ride.vehicle_type == driver.vehicle_type)

    # 3. Scheduling Filter: 
    # - If NOT scheduled: show immediately
    # - If scheduled: show ONLY if scheduled_at is within next 15 minutes
    from datetime import timedelta
    now = datetime.utcnow()
    window = now + timedelta(minutes=15)
    
    query = query.filter(
        (Ride.is_scheduled == False) | 
        ((Ride.is_scheduled == True) & (Ride.scheduled_at <= window) & (Ride.scheduled_at >= now))
    )

    pending_rides = query.all()
    
    # 4. Women Safety Filter: Strictly exclude women_only rides for non-female drivers
    if driver.gender != "female":
        query = query.filter(Ride.women_only == False)

    pending_rides = query.all()

    return pending_rides

@router.get("/driver-rides", response_model=List[RideResponse])
def get_driver_rides(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a driver's accepted/active rides with enrichment"""
    driver = db.query(Driver).filter(Driver.user_id == current_user.user_id).first()
    if not driver:
         raise HTTPException(status_code=403)
         
    rides = db.query(Ride).filter(Ride.driver_id == driver.driver_id).order_by(Ride.requested_at.desc()).all()
    
    for r in rides:
        u = db.query(User).filter(User.user_id == driver.user_id).first()
        r.driver_name = u.name if u else "Unknown"
        r.driver_badges = ["Top Rated"] # Simpler for self-view
        
    return rides

@router.post("/accept/{ride_id}", response_model=RideResponse)
def accept_ride(
    ride_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Driver accepts a ride"""
    if current_user.role != "driver":
        raise HTTPException(status_code=403, detail="Not a driver")

    driver = db.query(Driver).filter(Driver.user_id == current_user.user_id).first()
    if not driver or driver.approval_status != "approved":
         raise HTTPException(status_code=403, detail="Driver profile not approved")

    ride = db.query(Ride).filter(Ride.ride_id == ride_id).first()
    if not ride or ride.status != "pending":
        raise HTTPException(status_code=400, detail="Ride not available")

    # Safety check
    if ride.women_only and driver.gender != "female":
        raise HTTPException(status_code=403, detail="This ride is marked for female drivers only")

    ride.driver_id = driver.driver_id
    ride.status = "accepted"
    ride.accepted_at = datetime.utcnow()
    
    db.commit()
    db.refresh(ride)
    return ride

@router.post("/complete/{ride_id}", response_model=RideResponse)
def complete_ride(
    ride_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    driver = db.query(Driver).filter(Driver.user_id == current_user.user_id).first()
    if not driver:
         raise HTTPException(status_code=403)

    ride = db.query(Ride).filter(Ride.ride_id == ride_id, Ride.driver_id == driver.driver_id).first()
    if not ride or ride.status not in ["accepted", "in_progress"]:
        raise HTTPException(status_code=400, detail="Invalid ride")

    ride.status = "completed"
    ride.completed_at = datetime.utcnow()
    
    # Update driver stats
    driver.total_rides += 1
    driver.total_earnings += ride.fare if ride.fare else 0

    # Calculate duration
    if ride.accepted_at:
        ride.duration_minutes = round((ride.completed_at - ride.accepted_at).total_seconds() / 60.0, 1)

    db.commit()
    db.refresh(ride)
    return ride

@router.post("/cancel/{ride_id}", response_model=RideResponse)
def cancel_ride(
    ride_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ride = db.query(Ride).filter(Ride.ride_id == ride_id).first()
    if not ride:
        raise HTTPException(status_code=404)
        
    # Either the requesting user or the assigned driver can cancel
    driver = db.query(Driver).filter(Driver.user_id == current_user.user_id).first()
    is_driver = driver and ride.driver_id == driver.driver_id
    is_rider = ride.rider_id == current_user.user_id
    
    if not (is_rider or is_driver or current_user.role == "admin"):
        raise HTTPException(status_code=403, detail="Cannot cancel this ride")

    if ride.status in ["completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Already completed or cancelled")

    ride.status = "cancelled"
    db.commit()
    db.refresh(ride)
    return ride
    
@router.post("/rate/{ride_id}", response_model=RideResponse)
def rate_ride(
    ride_id: uuid.UUID,
    rating_data: RideRating,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    ride = db.query(Ride).filter(Ride.ride_id == ride_id, Ride.rider_id == current_user.user_id).first()
    if not ride or ride.status != "completed":
        raise HTTPException(status_code=400, detail="Ride not found or not completed")
    
    if ride.rating:
        raise HTTPException(status_code=400, detail="Already rated")
        
    ride.rating = rating_data.rating
    ride.feedback = rating_data.feedback
    db.commit()
    return ride

@router.get("/my-rides", response_model=List[RideResponse])
def get_my_rides(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get Passenger's rides with driver info enriched"""
    rides = db.query(Ride).filter(Ride.rider_id == current_user.user_id).order_by(Ride.requested_at.desc()).all()
    
    # Enrich rides with driver info if accepted/completed
    for r in rides:
        if r.driver_id:
            d = db.query(Driver).filter(Driver.driver_id == r.driver_id).first()
            if d:
                u = db.query(User).filter(User.user_id == d.user_id).first()
                r.driver_name = u.name if u else "Unknown"
                # Badges Logic (Match same as driver Hub)
                badges = ["Fast Pickup"]
                if (d.rating or 0) >= 4.8: badges.append("Top Rated")
                if (d.total_rides or 0) > 20: badges.append("Safety First")
                r.driver_badges = badges
    
    return rides

@router.get("/eco/leaderboard")
def get_eco_leaderboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Returns top passengers by CO2 saved"""
    from sqlalchemy import func
    results = db.query(
        User.name,
        func.sum(Ride.co2_saved).label("total_co2")
    ).join(Ride, User.user_id == Ride.rider_id)\
     .filter(Ride.status == "completed")\
     .group_by(User.name, User.user_id)\
     .order_by(func.sum(Ride.co2_saved).desc())\
     .limit(10).all()
     
    return [{"name": r.name, "co2": float(r.total_co2)} for r in results]
