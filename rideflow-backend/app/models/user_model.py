import uuid
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database.connection import Base

class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="user") # user | driver | admin
    gender = Column(String(10), default="other") # male | female | other
    phone = Column(String, nullable=True) # contact number
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    rides = relationship("Ride", back_populates="rider")
    driver_profile = relationship("Driver", back_populates="user", uselist=False)

    def __repr__(self):
        return f"<User {self.name} ({self.email})>"
