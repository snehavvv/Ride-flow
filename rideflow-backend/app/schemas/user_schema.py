from pydantic import BaseModel, ConfigDict, EmailStr, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class UserCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=50)
    email: EmailStr
    password: str = Field(..., min_length=6)
    gender: Optional[str] = None          # male | female | other
    phone: str = Field(..., min_length=10, max_length=20)
    apply_as_driver: bool = False          # triggers driver application on register


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=50)
    email: Optional[EmailStr] = None
    gender: Optional[str] = None
    phone: Optional[str] = None


class PasswordReset(BaseModel):
    email: EmailStr
    new_password: str = Field(..., min_length=6)


class UserResponse(BaseModel):
    user_id: UUID
    name: str
    email: EmailStr
    role: str
    gender: Optional[str] = None
    phone: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str
    user: UserResponse


class TokenData(BaseModel):
    email: Optional[str] = None
