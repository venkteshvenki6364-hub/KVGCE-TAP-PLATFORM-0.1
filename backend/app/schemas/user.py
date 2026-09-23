from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: str # "student", "faculty", "admin"
    phone: Optional[str] = None
    department: Optional[str] = None
    is_active: bool = True
    is_verified: bool = False
    status: Optional[str] = "pending"

class UserCreate(UserBase):
    password: str
    student_id: Optional[str] = None # For students (e.g. 4KV21CS001)
    faculty_id: Optional[str] = None # For faculty (e.g. KVG-FAC-102)
    course: Optional[str] = "B.E. Computer Science & Engineering"
    semester: Optional[int] = 6
    year: Optional[int] = 3
    dob: Optional[str] = None

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user: dict
    requires_approval: Optional[bool] = False
    message: Optional[str] = None

class UserProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    student_id: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[str] = None
    course: Optional[str] = None
    semester: Optional[Any] = None
    section: Optional[str] = None
    year: Optional[int] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    nationality: Optional[str] = None
    avatarUrl: Optional[str] = None
    objective: Optional[str] = None
    github: Optional[str] = None
    linkedin: Optional[str] = None
    portfolio: Optional[str] = None
    technicalSkills: Optional[List[str]] = None
    softSkills: Optional[List[str]] = None
    skills: Optional[List[dict]] = None
    academics: Optional[List[dict]] = None

    @field_validator("objective", mode="before")
    @classmethod
    def validate_objective_length(cls, v: Any) -> Optional[str]:
        if v is None:
            return v
        text = str(v).strip()
        if not text:
            return text
        words = [w for w in text.split() if w]
        if len(words) > 50:
            raise ValueError("Resume Objective must be concise (maximum 50 words).")
        return text

    @field_validator("phone", mode="before")
    @classmethod
    def validate_and_format_phone(cls, v: Any) -> Optional[str]:
        if v is None:
            return v
        v_str = str(v).strip()
        if not v_str:
            return ""
        digits = "".join([c for c in v_str if c.isdigit()])
        if digits.startswith("91") and len(digits) > 10:
            digits = digits[2:]
        if len(digits) > 10:
            digits = digits[-10:]
        if len(digits) != 10:
            raise ValueError("Phone number must contain exactly 10 digits (e.g. 9108612345 or +91 9108612345).")
        return f"+91 {digits}"

class PasswordResetRequest(BaseModel):
    username_or_email: str
    dob_or_phone: Optional[str] = None

class PasswordResetConfirm(BaseModel):
    username_or_email: str
    dob_or_phone: str
    new_password: str
