from pydantic import BaseModel, ConfigDict
from typing import Optional, List
from uuid import UUID
from datetime import datetime


# --- Driver Schemas ---

class DriverApply(BaseModel):
    vehicle_number: str
    vehicle_type: str = "go"   # bike | go | sedan | xl


class DriverResponse(BaseModel):
    driver_id: UUID
    user_id: UUID
    name: Optional[str] = None
    vehicle_number: str
    vehicle_type: str
    approval_status: str
    is_available: bool
    gender: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    rating: float
    total_rides: int
    total_earnings: float
    created_at: datetime
    badges: List[str] = []

    model_config = ConfigDict(from_attributes=True)


class DriverAvailabilityUpdate(BaseModel):
    is_available: bool


class DriverLocationUpdate(BaseModel):
    latitude: float
    longitude: float


# --- Ride / Booking Schemas ---

class RideRequest(BaseModel):
    pickup_location: str
    dropoff_location: str
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    dropoff_lat: Optional[float] = None
    dropoff_lng: Optional[float] = None
    women_only: bool = False
    prefer_female_driver: bool = False

    
    # Pro Features
    ride_preferences: Optional[str] = None  # JSON: {mood, comfort}
    vehicle_type: str = "go"                # bike | go | sedan | xl
    is_scheduled: bool = False
    scheduled_at: Optional[datetime] = None

    # Parcel Features
    parcel_description: Optional[str] = None
    parcel_photo_url: Optional[str] = None


class RideRating(BaseModel):
    rating: float          # 1-5
    feedback: Optional[str] = None


class RideResponse(BaseModel):
    ride_id: UUID
    rider_id: UUID
    driver_id: Optional[UUID] = None
    driver_name: Optional[str] = None
    driver_badges: List[str] = []
    pickup_location: str
    dropoff_location: str
    pickup_lat: Optional[float] = None
    pickup_lng: Optional[float] = None
    dropoff_lat: Optional[float] = None
    dropoff_lng: Optional[float] = None
    
    ride_preferences: Optional[str] = None
    vehicle_type: str
    co2_saved: float
    is_scheduled: bool
    scheduled_at: Optional[datetime] = None

    # Parcel Features
    parcel_description: Optional[str] = None
    parcel_photo_url: Optional[str] = None

    distance_km: Optional[float] = None
    duration_minutes: Optional[float] = None
    fare: Optional[float] = None
    status: str
    women_only: bool
    prefer_female_driver: bool
    requested_at: datetime

    accepted_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    rating: Optional[float] = None
    feedback: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
