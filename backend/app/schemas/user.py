from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List, Any
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str # "student", "faculty", "admin"
    phone: Optional[str] = None
    department: Optional[str] = None
    is_active: bool = True

class UserCreate(UserBase):
    password: str
    student_id: Optional[str] = None # For students (e.g. 4KV21CS001)
    faculty_id: Optional[str] = None # For faculty (e.g. KVG-FAC-102)
    course: Optional[str] = "B.E. Computer Science & Engineering"
    semester: Optional[int] = 6
    year: Optional[int] = 3

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user: dict

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    course: Optional[str] = None
    semester: Optional[int] = None
    year: Optional[int] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    skills: Optional[List[dict]] = None
