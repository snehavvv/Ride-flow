import math
import uuid
from typing import List
from sqlalchemy.orm import Session
from app.models.driver_model import Driver
from app.models.ride_model import Ride

def haversine(lat1, lon1, lat2, lon2):
    """Calculates the great-circle distance between two points on a sphere (Earth)."""
    R = 6371.0 # Earth radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

async def find_best_driver(db: Session, pickup_lat: float, pickup_lng: float, women_only: bool = False) -> uuid.UUID | None:
    """
    Finds the nearest eligible driver using a PostgreSQL scan and Haversine heuristic.
    Radius = 50km (Increased for dev testing).
    """
    print(f"DEBUG: Finding best driver for location {pickup_lat}, {pickup_lng} (Women Only: {women_only})")
    
    # 1. Query all online, approved drivers
    query = db.query(Driver).filter(
        Driver.is_available == True,
        Driver.approval_status == "approved"
    )
    
    if women_only:
        query = query.filter(Driver.gender == "female")
        
    drivers = query.all()
    print(f"DEBUG: Found {len(drivers)} potential drivers in DB.")
    
    best_driver_id = None
    min_distance = 50.0 # max 50km radius
    
    # 2. Iterate through drivers with known coordinates to compute shortest path
    for driver in drivers:
        if driver.latitude is not None and driver.longitude is not None:
            dist = haversine(pickup_lat, pickup_lng, driver.latitude, driver.longitude)
            print(f"DEBUG: Driver {driver.driver_id} is {dist:.2f}km away.")
            if dist < min_distance:
                min_distance = dist
                best_driver_id = driver.driver_id
                
    if best_driver_id:
        print(f"DEBUG: Assigned driver {best_driver_id} at distance {min_distance:.2f}km")
    else:
        print("DEBUG: No suitable driver found within radius.")
        
    return best_driver_id
