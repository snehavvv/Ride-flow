import uuid
from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, Text, Integer, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base


class Ride(Base):
    __tablename__ = "rides"

    ride_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Who
    rider_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id", ondelete="CASCADE"), nullable=False)
    driver_id = Column(UUID(as_uuid=True), ForeignKey("drivers.driver_id", ondelete="SET NULL"), nullable=True)

    # Where
    pickup_location = Column(String, nullable=False)
    dropoff_location = Column(String, nullable=False)
    pickup_lat = Column(Float, nullable=True)
    pickup_lng = Column(Float, nullable=True)
    dropoff_lat = Column(Float, nullable=True)
    dropoff_lng = Column(Float, nullable=True)

    # Pro Features
    ride_preferences = Column(Text, nullable=True) # JSON string: {mood, comfort: []}
    vehicle_type = Column(String, default="go")     # bike | go | sedan | xl
    co2_saved = Column(Float, default=0.0)          # stored in grams

    # Metrics (set once ride is completed)
    distance_km = Column(Float, nullable=True)
    duration_minutes = Column(Float, nullable=True)
    fare = Column(Float, nullable=True)

    # Status lifecycle: pending -> accepted -> in_progress -> completed | cancelled
    status = Column(String, default="pending")

    # Scheduling
    is_scheduled = Column(Boolean, default=False)
    scheduled_at = Column(DateTime, nullable=True)

    # Parcel / Gift Features
    parcel_description = Column(Text, nullable=True)
    parcel_photo_url = Column(String, nullable=True)

    # Women safety flag
    women_only = Column(Boolean, default=False)
    prefer_female_driver = Column(Boolean, default=False)

    # Timestamps
    requested_at = Column(DateTime, default=datetime.utcnow)
    accepted_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)

    # Feedback (passenger rates driver after completion)
    rating = Column(Float, nullable=True)      # 1-5 stars
    feedback = Column(Text, nullable=True)

    __table_args__ = (
        Index('idx_ride_status', 'status'),
        Index('idx_ride_requested_at', 'requested_at'),
    )

    # Relationships
    rider = relationship("User", back_populates="rides", foreign_keys=[rider_id])
    driver = relationship("Driver", back_populates="rides", foreign_keys=[driver_id])
