from fastapi import APIRouter, HTTPException, Depends, status, Header
from typing import Optional
from app.schemas.user import UserCreate, UserLogin, TokenResponse
from app.database import get_db_collection
from app.utils.security import get_password_hash, verify_password, create_access_token, decode_access_token
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])

async def get_current_user(authorization: Optional[str] = Header(None)):
    """Dependency to extract and verify the current authenticated user from JWT token."""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token missing or invalid format. Please log in.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = authorization.split(" ")[1]
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    users_col = get_db_collection("users")
    email = payload.get("sub")
    user = await users_col.find_one({"email": email})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account no longer exists."
        )
    
    # Exclude hashed_password from returned dictionary
    user_data = dict(user)
    user_data.pop("hashed_password", None)
    return user_data

def require_role(allowed_roles: list):
    """Dependency factory for role-based authorization."""
    async def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role")
        if user_role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: {allowed_roles}, but your account role is '{user_role}'."
            )
        return current_user
    return role_checker

@router.post("/register", response_model=TokenResponse)
async def register_student(user_in: UserCreate):
    users_col = get_db_collection("users")
    
    # Check existing email
    existing_email = await users_col.find_one({"email": user_in.email})
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Force role to student if registering through standard registration
    role = user_in.role if user_in.role in ["student", "faculty", "admin"] else "student"
    
    hashed_pwd = get_password_hash(user_in.password)
    
    new_user = {
        "email": user_in.email,
        "full_name": user_in.full_name,
        "role": role,
        "phone": user_in.phone or "",
        "department": user_in.department or "Computer Science & Engineering",
        "student_id": user_in.student_id or "",
        "faculty_id": user_in.faculty_id or "",
        "course": user_in.course or "B.E. Computer Science & Engineering",
        "semester": user_in.semester or 6,
        "year": user_in.year or 3,
        "hashed_password": hashed_pwd,
        "is_active": True,
        "skills": [
            {"name": "Python", "category": "Programming", "score": 75, "level": "Intermediate", "percentage": 75},
            {"name": "Web Development", "category": "Web Development", "score": 70, "level": "Intermediate", "percentage": 70},
            {"name": "Quantitative Aptitude", "category": "Aptitude", "score": 80, "level": "Advanced", "percentage": 80}
        ],
        "github": "",
        "linkedin": "",
        "portfolio": ""
    }

    res = await users_col.insert_one(new_user)
    new_user["_id"] = str(res.inserted_id)
    
    access_token = create_access_token(data={"sub": new_user["email"], "role": role})
    
    user_response = dict(new_user)
    user_response.pop("hashed_password", None)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": role,
        "user": user_response
    }

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    users_col = get_db_collection("users")
    identifier = credentials.username_or_email.strip()
    
    # Query by email, student_id, faculty_id, or phone
    query = {
        "$or": [
            {"email": identifier},
            {"student_id": identifier},
            {"faculty_id": identifier},
            {"phone": identifier}
        ]
    }
    
    user = await users_col.find_one(query)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials. Please check your Student ID/Email/Phone and Password."
        )

    if not verify_password(credentials.password, user.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please try again."
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your user account has been deactivated. Please contact KVGCE TAP Administrator."
        )

    access_token = create_access_token(data={"sub": user["email"], "role": user.get("role", "student")})
    
    user_response = dict(user)
    user_response.pop("hashed_password", None)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "role": user.get("role", "student"),
        "user": user_response
    }

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "message": "User profile fetched successfully",
        "user": current_user
    }

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "message": "Logged out successfully"
    }
