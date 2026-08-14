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
        "faculty_id": user_in.faculty_id or "",
        "course": user_in.course or "",
        "semester": user_in.semester or 1,
        "year": user_in.year or 1,
        "hashed_password": hashed_pwd,
        "is_active": True
    }
    
    res = await users_col.insert_one(user_doc)
    user_doc["_id"] = str(res.inserted_id)
    user_doc.pop("hashed_password", None)

    return {
        "success": True,
        "message": f"User ({user_in.role}) created successfully",
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
