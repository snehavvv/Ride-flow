import uuid
from sqlalchemy import Column, String, Boolean, Float, Integer, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base


class Driver(Base):
    __tablename__ = "drivers"

    driver_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.user_id"), unique=True, nullable=False)
    vehicle_number = Column(String, unique=True, nullable=False)
    vehicle_type = Column(String, default="go")
    approval_status = Column(String, default="pending")  # pending, approved, rejected
    is_available = Column(Boolean, default=False)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    gender = Column(String, nullable=True)
    rating = Column(Float, default=5.0)
    total_rides = Column(Integer, default=0)
    total_earnings = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)


    # Relationships
    user = relationship("User", back_populates="driver_profile")
    rides = relationship("Ride", back_populates="driver")
