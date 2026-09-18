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
    existing_email = await users_col.find_one({"email": {"$regex": f"^{user_in.email}$", "$options": "i"}})
    if existing_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )

    # Check existing USN / Student ID / Faculty ID if provided
    identifier_check = user_in.student_id or user_in.faculty_id
    if identifier_check:
        existing_id = await users_col.find_one({
            "$or": [
                {"student_id": {"$regex": f"^{identifier_check}$", "$options": "i"}},
                {"faculty_id": {"$regex": f"^{identifier_check}$", "$options": "i"}},
                {"user_id": {"$regex": f"^{identifier_check}$", "$options": "i"}}
            ]
        })
        if existing_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An account with ID / USN '{identifier_check}' already exists."
            )
            
    if user_in.phone and user_in.role == "faculty":
        existing_phone = await users_col.find_one({"phone": user_in.phone})
        if existing_phone:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"An account with phone number '{user_in.phone}' already exists."
            )

    # Role assignment
    role = user_in.role if user_in.role in ["student", "faculty", "admin"] else "student"
    
    hashed_pwd = get_password_hash(user_in.password)
    
    # All registrations go to Admin for verification
    is_verified = False
    user_status = "pending"
    is_active = False
    
    new_user = {
        "email": user_in.email,
        "full_name": user_in.full_name,
        "role": role,
        "phone": user_in.phone or "",
        "department": user_in.department or "Computer Science & Engineering",
        "student_id": user_in.student_id or "",
        "faculty_id": user_in.faculty_id or (f"KVG-FAC-{user_in.phone[-4:]}" if user_in.phone else ""),
        "user_id": user_in.student_id or user_in.faculty_id or user_in.email,
        "course": user_in.course or "B.E. Computer Science & Engineering",
        "semester": user_in.semester or 6,
        "year": user_in.year or 3,
        "dob": user_in.dob or "",
        "hashed_password": hashed_pwd,
        "is_verified": is_verified,
        "status": user_status,
        "is_active": is_active,
        "created_at": user_in.dob or "2026-09-18T10:00:00",
        "skills": [
            {"name": "Python", "category": "Programming", "score": 75, "level": "Intermediate", "percentage": 75},
            {"name": "Web Development", "category": "Web Development", "score": 70, "level": "Intermediate", "percentage": 70},
            {"name": "Quantitative Aptitude", "category": "Aptitude", "score": 80, "level": "Advanced", "percentage": 80}
        ] if role == "student" else [],
        "github": "",
        "linkedin": "",
        "portfolio": ""
    }

    res = await users_col.insert_one(new_user)
    new_user["_id"] = str(res.inserted_id)
    
    user_response = dict(new_user)
    user_response.pop("hashed_password", None)

    return {
        "access_token": "",
        "token_type": "bearer",
        "role": role,
        "user": user_response,
        "requires_approval": True,
        "message": "Registration request submitted! Your account has been sent for verification to Admin. You will be able to log in once an Administrator approves your registration."
    }

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    users_col = get_db_collection("users")
    identifier = credentials.username_or_email.strip()
    secret = credentials.password.strip()
    
    # Query by email, student_id, faculty_id, user_id, or phone (case-insensitive)
    query = {
        "$or": [
            {"email": {"$regex": f"^{identifier}$", "$options": "i"}},
            {"student_id": {"$regex": f"^{identifier}$", "$options": "i"}},
            {"faculty_id": {"$regex": f"^{identifier}$", "$options": "i"}},
            {"user_id": {"$regex": f"^{identifier}$", "$options": "i"}},
            {"phone": identifier}
        ]
    }
    
    user = await users_col.find_one(query)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Incorrect User ID or password", "error_type": "user_id"},
            headers={"X-Error-Type": "user_id"}
        )

    # Validate against hashed password OR Date of Birth (DOB)
    password_valid = verify_password(secret, user.get("hashed_password", ""))
    dob_valid = False
    
    user_dob = user.get("dob", "").strip()
    if user_dob:
        dob_norm = user_dob.replace("-", "").replace("/", "").replace(".", "")
        secret_norm = secret.replace("-", "").replace("/", "").replace(".", "")
        if secret_norm and (secret == user_dob or secret_norm == dob_norm):
            dob_valid = True

    if not (password_valid or dob_valid):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"message": "Incorrect User ID or password", "error_type": "password"},
            headers={"X-Error-Type": "password"}
        )

    # Check account verification and active status
    status_val = user.get("status", "pending" if not user.get("is_verified", True) else "approved")
    if status_val == "pending" or not user.get("is_verified", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is pending verification by Admin. You will be able to log in once an Administrator approves your registration."
        )

    if status_val == "rejected":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account registration request was declined by Admin. Please contact KVGCE TAP Administrator."
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated. Please contact KVGCE TAP Administrator."
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

@router.post("/forgot-password")
async def forgot_password_verify(req: dict):
    users_col = get_db_collection("users")
    identifier = req.get("username_or_email", "").strip()
    dob_or_phone = req.get("dob_or_phone", "").strip()

    if not identifier:
        raise HTTPException(status_code=400, detail="Please enter your USN, Email, or Faculty ID.")

    user = await users_col.find_one({
        "$or": [
            {"email": identifier},
            {"student_id": identifier},
            {"faculty_id": identifier},
            {"phone": identifier}
        ]
    })

    if not user:
        raise HTTPException(status_code=404, detail="No matching account found with provided USN / Email / ID.")

    # Verify identity via DOB or Phone if provided
    if dob_or_phone:
        user_dob = user.get("dob", "")
        user_phone = user.get("phone", "")
        if dob_or_phone not in [user_dob, user_phone] and dob_or_phone.replace("-", "") not in [user_dob.replace("-", ""), user_phone.replace("-", "")]:
            raise HTTPException(status_code=400, detail="Identity verification failed. Date of Birth or Phone Number does not match our records.")

    return {
        "success": True,
        "verified": True,
        "email": user.get("email"),
        "full_name": user.get("full_name"),
        "message": f"Account verified for {user.get('full_name')}. You may now reset your password."
    }

@router.post("/reset-password")
async def reset_password(req: dict):
    users_col = get_db_collection("users")
    identifier = req.get("username_or_email", "").strip()
    dob_or_phone = req.get("dob_or_phone", "").strip()
    new_password = req.get("new_password", "").strip()

    if not identifier or not new_password:
        raise HTTPException(status_code=400, detail="Username/Email and New Password are required.")

    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="New password must be at least 6 characters long.")

    user = await users_col.find_one({
        "$or": [
            {"email": identifier},
            {"student_id": identifier},
            {"faculty_id": identifier},
            {"phone": identifier}
        ]
    })

    if not user:
        raise HTTPException(status_code=404, detail="No account found matching the provided USN / Email.")

    if dob_or_phone:
        user_dob = user.get("dob", "")
        user_phone = user.get("phone", "")
        if dob_or_phone not in [user_dob, user_phone] and dob_or_phone.replace("-", "") not in [user_dob.replace("-", ""), user_phone.replace("-", "")]:
            raise HTTPException(status_code=400, detail="Identity verification failed. Invalid Date of Birth or Phone Number.")

    new_hash = get_password_hash(new_password)
    await users_col.update_one({"_id": user["_id"]}, {"$set": {"hashed_password": new_hash}})

    return {
        "success": True,
        "message": f"Password reset successfully for {user.get('full_name')}. You can now log in with your new password!"
    }
