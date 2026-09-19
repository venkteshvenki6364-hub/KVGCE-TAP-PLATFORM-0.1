from fastapi import APIRouter, Depends, HTTPException, status
from app.routes.auth import require_role
from app.database import get_db_collection
from app.utils.security import get_password_hash
from app.schemas.user import UserCreate

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/dashboard")
async def get_admin_dashboard(current_user: dict = Depends(require_role(["admin"]))):
    users_col = get_db_collection("users")
    dept_col = get_db_collection("departments")
    assess_col = get_db_collection("assessments")
    activities_col = get_db_collection("activities")

    all_users = await users_col.find({})
    students = [u for u in all_users if u.get("role") == "student"]
    faculty = [u for u in all_users if u.get("role") == "faculty"]
    admins = [u for u in all_users if u.get("role") == "admin"]
    departments = await dept_col.find({})
    assessments = await assess_col.find({})
    activities = await activities_col.find({})

    return {
        "success": True,
        "message": "Admin dashboard statistics loaded",
        "data": {
            "stats": {
                "totalUsers": len(all_users),
                "totalStudents": len(students),
                "totalFaculty": len(faculty),
                "totalAdmins": len(admins),
                "totalDepartments": len(departments),
                "totalAssessments": len(assessments),
                "totalActivities": len(activities)
            },
            "recentUsers": [dict(u, hashed_password="") for u in all_users[:10]],
            "departments": departments,
            "assessments": assessments
        }
    }

@router.get("/pending-users")
async def list_pending_users(current_user: dict = Depends(require_role(["admin"]))):
    users_col = get_db_collection("users")
    pending_users = await users_col.find({
        "$or": [
            {"status": "pending"},
            {"is_verified": False}
        ]
    })
    for u in pending_users:
        u.pop("hashed_password", None)
    return {
        "success": True,
        "data": pending_users
    }

@router.post("/users/{identifier}/approve")
async def approve_user_registration(
    identifier: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    users_col = get_db_collection("users")
    clean_id = identifier.strip()
    user = await users_col.find_one({
        "$or": [
            {"email": {"$regex": f"^{clean_id}$", "$options": "i"}},
            {"student_id": {"$regex": f"^{clean_id}$", "$options": "i"}},
            {"faculty_id": {"$regex": f"^{clean_id}$", "$options": "i"}},
            {"user_id": {"$regex": f"^{clean_id}$", "$options": "i"}},
            {"_id": clean_id}
        ]
    })
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    update_fields = {
        "is_verified": True,
        "is_active": True,
        "status": "approved"
    }

    # Ensure default fields based on role
    if user.get("role") == "student" and not user.get("skills"):
        update_fields["skills"] = [
            {"name": "Python", "category": "Programming", "score": 75, "level": "Intermediate", "percentage": 75},
            {"name": "Web Development", "category": "Web Development", "score": 70, "level": "Intermediate", "percentage": 70},
            {"name": "Quantitative Aptitude", "category": "Aptitude", "score": 80, "level": "Advanced", "percentage": 80}
        ]

    await users_col.update_one({"_id": user["_id"]}, {"$set": update_fields})

    return {
        "success": True,
        "message": f"User '{user.get('full_name')}' ({user.get('role', 'user').capitalize()}) approved and added to active database."
    }

@router.post("/users/{identifier}/reject")
async def reject_user_registration(
    identifier: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    users_col = get_db_collection("users")
    clean_id = identifier.strip()
    user = await users_col.find_one({
        "$or": [
            {"email": {"$regex": f"^{clean_id}$", "$options": "i"}},
            {"student_id": {"$regex": f"^{clean_id}$", "$options": "i"}},
            {"faculty_id": {"$regex": f"^{clean_id}$", "$options": "i"}},
            {"user_id": {"$regex": f"^{clean_id}$", "$options": "i"}},
            {"_id": clean_id}
        ]
    })
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    await users_col.update_one({"_id": user["_id"]}, {"$set": {"status": "rejected", "is_active": False, "is_verified": False}})

    return {
        "success": True,
        "message": f"Registration request for '{user.get('full_name')}' rejected."
    }

@router.get("/pending-resets")
async def list_pending_password_resets(current_user: dict = Depends(require_role(["admin"]))):
    resets_col = get_db_collection("password_resets")
    pending_resets = await resets_col.find({"status": "pending"})
    return {
        "success": True,
        "data": pending_resets
    }

@router.post("/reset-requests/{request_id}/approve")
async def approve_password_reset(
    request_id: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    resets_col = get_db_collection("password_resets")
    users_col = get_db_collection("users")

    clean_req_id = request_id.strip()
    reset_req = await resets_col.find_one({"_id": clean_req_id})
    if not reset_req:
        reset_req = await resets_col.find_one({"user_email": clean_req_id, "status": "pending"})
    if not reset_req:
        reset_req = await resets_col.find_one({"user_id": clean_req_id, "status": "pending"})
    if not reset_req:
        # Match case-insensitively across pending resets
        all_pending = await resets_col.find({"status": "pending"})
        for r in all_pending:
            if clean_req_id.lower() in [
                str(r.get("_id") or "").lower(),
                str(r.get("user_email") or "").lower(),
                str(r.get("user_id") or "").lower()
            ]:
                reset_req = r
                break

    if not reset_req:
        raise HTTPException(status_code=404, detail="Password reset request not found or already processed.")

    email = reset_req.get("user_email")
    user_id_val = reset_req.get("user_id")
    new_hash = reset_req.get("new_password_hash")
    plain_pass = reset_req.get("new_password_plain")

    import re
    dob_pattern = r"^(\d{2}[-/\.]\d{2}[-/\.]\d{4}|\d{4}[-/\.]\d{2}[-/\.]\d{2})$"
    if plain_pass and not re.match(dob_pattern, str(plain_pass).strip()):
        raise HTTPException(
            status_code=400,
            detail="Only Date of Birth (DOB) formatted passwords (DD-MM-YYYY, e.g. 28-02-2004) can be approved."
        )

    # Search user account across all identifier fields
    user = await users_col.find_one({
        "$or": [
            {"email": email},
            {"student_id": user_id_val},
            {"faculty_id": user_id_val},
            {"user_id": user_id_val},
            {"usn": user_id_val}
        ]
    })

    role = reset_req.get("role", "student")
    full_name = reset_req.get("full_name") or f"User ({user_id_val})"

    if user:
        # Update existing user password and activate status
        update_fields = {
            "hashed_password": new_hash,
            "is_verified": True,
            "is_active": True,
            "status": "approved"
        }
        if plain_pass:
            update_fields["password_plain"] = plain_pass

        await users_col.update_one({"_id": user["_id"]}, {"$set": update_fields})
    else:
        # Create user account with updated password
        new_user_doc = {
            "email": email or f"{user_id_val.lower()}@kvgce.edu.in",
            "student_id": user_id_val if role == "student" else None,
            "faculty_id": user_id_val if role == "faculty" else None,
            "user_id": user_id_val,
            "full_name": full_name,
            "role": role,
            "hashed_password": new_hash,
            "password_plain": plain_pass,
            "is_verified": True,
            "is_active": True,
            "status": "approved"
        }
        await users_col.insert_one(new_user_doc)

    # Mark reset request as approved
    await resets_col.update_one({"_id": reset_req["_id"]}, {"$set": {"status": "approved"}})

    return {
        "success": True,
        "message": f"✅ Approved password update for '{full_name}' ({user_id_val}). The user can now log in with their updated password!"
    }

@router.post("/reset-requests/{request_id}/reject")
async def reject_password_reset(
    request_id: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    resets_col = get_db_collection("password_resets")
    clean_req_id = request_id.strip()
    reset_req = await resets_col.find_one({"_id": clean_req_id})
    if not reset_req:
        reset_req = await resets_col.find_one({"user_email": clean_req_id, "status": "pending"})

    if reset_req:
        await resets_col.update_one({"_id": reset_req["_id"]}, {"$set": {"status": "rejected"}})

    return {
        "success": True,
        "message": f"Password reset request rejected."
    }


@router.get("/users")
async def list_all_users(current_user: dict = Depends(require_role(["admin"]))):
    users_col = get_db_collection("users")
    users = await users_col.find({})
    for u in users:
        u.pop("hashed_password", None)
    return {
        "success": True,
        "data": users
    }

@router.post("/users")
async def create_user_by_admin(
    user_in: UserCreate,
    current_user: dict = Depends(require_role(["admin"]))
):
    users_col = get_db_collection("users")
    existing = await users_col.find_one({"email": user_in.email})
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already exists.")

    hashed_pwd = get_password_hash(user_in.password)
    user_doc = {
        "email": user_in.email,
        "full_name": user_in.full_name,
        "role": user_in.role,
        "phone": user_in.phone or "",
        "department": user_in.department or "Computer Science & Engineering",
        "student_id": user_in.student_id or "",
        "faculty_id": user_in.faculty_id or (f"KVG-FAC-{user_in.phone[-4:]}" if user_in.phone else ""),
        "course": user_in.course or "B.E. Computer Science & Engineering",
        "semester": user_in.semester or 1,
        "year": user_in.year or 1,
        "dob": user_in.dob or "",
        "hashed_password": hashed_pwd,
        "is_active": True,
        "is_verified": True,
        "status": "approved",
        "skills": [
            {"name": "Python", "category": "Programming", "score": 75, "level": "Intermediate", "percentage": 75},
            {"name": "Web Development", "category": "Web Development", "score": 70, "level": "Intermediate", "percentage": 70},
            {"name": "Quantitative Aptitude", "category": "Aptitude", "score": 80, "level": "Advanced", "percentage": 80}
        ] if user_in.role == "student" else []
    }
    
    res = await users_col.insert_one(user_doc)
    user_doc["_id"] = str(res.inserted_id)
    user_doc.pop("hashed_password", None)

    return {
        "success": True,
        "message": f"User '{user_in.full_name}' ({user_in.role.capitalize()}) added directly to database and verified.",
        "data": user_doc
    }

@router.put("/users/{email}/toggle-status")
async def toggle_user_active_status(
    email: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    users_col = get_db_collection("users")
    user = await users_col.find_one({"email": email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    new_status = not user.get("is_active", True)
    await users_col.update_one({"email": email}, {"$set": {"is_active": new_status}})

    return {
        "success": True,
        "message": f"User status set to {'Active' if new_status else 'Deactivated'}"
    }

@router.delete("/users/{email}")
async def delete_user_by_admin(
    email: str,
    current_user: dict = Depends(require_role(["admin"]))
):
    users_col = get_db_collection("users")
    if email == current_user["email"]:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account.")
    
    await users_col.delete_one({"email": email})
    return {
        "success": True,
        "message": f"User {email} deleted successfully."
    }

@router.get("/departments")
async def get_departments(current_user: dict = Depends(require_role(["admin", "faculty", "student"]))):
    dept_col = get_db_collection("departments")
    depts = await dept_col.find({})
    return {
        "success": True,
        "data": depts
    }

@router.get("/analytics")
async def get_system_analytics(current_user: dict = Depends(require_role(["admin"]))):
    return {
        "success": True,
        "data": {
            "departmentPerformance": [
                {"department": "CSE", "avgScore": 84.5, "passRate": 92.0},
                {"department": "ISE", "avgScore": 81.2, "passRate": 88.5},
                {"department": "ECE", "avgScore": 79.0, "passRate": 85.0},
                {"department": "ME", "avgScore": 76.5, "passRate": 82.0},
                {"department": "CIV", "avgScore": 75.0, "passRate": 80.0}
            ],
            "monthlyParticipation": [
                {"month": "Jan", "attempts": 120, "activities": 45},
                {"month": "Feb", "attempts": 230, "activities": 88},
                {"month": "Mar", "attempts": 310, "activities": 140},
                {"month": "Apr", "attempts": 450, "activities": 190},
                {"month": "May", "attempts": 580, "activities": 260}
            ],
            "skillDistribution": [
                {"skill": "Python", "count": 210},
                {"skill": "Web Dev", "count": 180},
                {"skill": "Aptitude", "count": 240},
                {"skill": "Data Structures", "count": 195},
                {"skill": "SQL", "count": 165}
            ]
        }
    }
