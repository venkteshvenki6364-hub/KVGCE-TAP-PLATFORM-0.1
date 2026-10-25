from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
import base64
from datetime import datetime
from typing import Optional
from app.routes.auth import require_role, get_current_user
from app.database import get_db_collection
from app.utils.security import get_password_hash
from app.schemas.user import UserCreate
from app.services.analytics import build_analytics, legacy_analysis

router = APIRouter(prefix="/admin", tags=["Admin"])


def _public_profile(user: dict) -> dict:
    profile = dict(user)
    profile.pop("hashed_password", None)
    profile.pop("password_plain", None)
    return profile


@router.get("/profile")
async def get_admin_profile(current_user: dict = Depends(require_role(["admin"]))):
    return {"success": True, "data": _public_profile(current_user)}


@router.put("/profile")
async def update_admin_profile(
    payload: dict,
    current_user: dict = Depends(require_role(["admin"]))
):
    allowed = {}
    if "full_name" in payload:
        name = str(payload["full_name"]).strip()
        if not name:
            raise HTTPException(status_code=400, detail="Full name is required.")
        allowed["full_name"] = name
    if "phone" in payload:
        phone = str(payload["phone"]).strip()
        phone_digits = "".join(char for char in phone if char.isdigit())
        if phone_digits.startswith("91") and len(phone_digits) == 12:
            phone_digits = phone_digits[2:]
        if phone and len(phone_digits) != 10:
            raise HTTPException(status_code=400, detail="Phone number must contain exactly 10 digits.")
        allowed["phone"] = phone
    if "department" in payload:
        department = str(payload["department"]).strip()
        if len(department) > 150:
            raise HTTPException(status_code=400, detail="Department must be 150 characters or fewer.")
        allowed["department"] = department
    if "summary" in payload:
        summary = str(payload["summary"]).strip()
        if len(summary) > 1000:
            raise HTTPException(status_code=400, detail="Summary must be 1000 characters or fewer.")
        allowed["summary"] = summary
    allowed["updated_at"] = datetime.utcnow().isoformat()
    users_col = get_db_collection("users")
    await users_col.update_one({"email": current_user["email"]}, {"$set": allowed})
    updated = await users_col.find_one({"email": current_user["email"]})
    return {"success": True, "data": _public_profile(updated or current_user)}


@router.put("/profile/password")
async def change_admin_password(
    payload: dict,
    current_user: dict = Depends(require_role(["admin"]))
):
    current_password = str(payload.get("current_password") or "")
    new_password = str(payload.get("new_password") or "")
    confirm_password = str(payload.get("confirm_password") or "")
    if not current_password or not new_password or not confirm_password:
        raise HTTPException(status_code=400, detail="Current password, new password, and confirmation are required.")
    if new_password != confirm_password:
        raise HTTPException(status_code=400, detail="New password and confirmation do not match.")
    from app.utils.security import verify_password
    users_col = get_db_collection("users")
    stored_user = await users_col.find_one({"email": current_user["email"]})
    if not stored_user or not verify_password(current_password, stored_user.get("hashed_password", "")):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters.")
    await users_col.update_one(
        {"email": current_user["email"]},
        {"$set": {"hashed_password": get_password_hash(new_password), "password_plain": "", "updated_at": datetime.utcnow().isoformat()}}
    )
    return {"success": True, "message": "Password updated successfully."}


@router.post("/profile/avatar")
async def upload_admin_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role(["admin"]))
):
    if not (file.content_type or "").startswith("image/"):
        raise HTTPException(status_code=400, detail="Profile image must be an image file.")
    content = await file.read()
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Profile image must be 5 MB or smaller.")
    avatar_url = f"data:{file.content_type};base64,{base64.b64encode(content).decode('utf-8')}"
    users_col = get_db_collection("users")
    await users_col.update_one({"email": current_user["email"]}, {"$set": {"avatarUrl": avatar_url, "updated_at": datetime.utcnow().isoformat()}})
    updated = await users_col.find_one({"email": current_user["email"]})
    return {"success": True, "data": _public_profile(updated or current_user)}


def _dept_key(dept_raw: str) -> str:
    """Normalize a department string to a short key."""
    d = (dept_raw or "").strip()
    if "Computer" in d or "CSE" in d:
        return "CSE"
    if "Electronics" in d or "ECE" in d:
        return "ECE"
    if "Mechanical" in d or "ME" in d:
        return "ME"
    if "Civil" in d or "CV" in d:
        return "CV"
    if "Information" in d or "ISE" in d:
        return "ISE"
    return "Other"


def _compute_analysis(students: list, attempts_count: int) -> dict:
    """Compute overallAnalysis dict for a given list of students."""
    total_students = len(students)
    active_students = len([s for s in students if s.get("is_active") is not False])

    sum_academics = sum_aptitude = sum_technical = sum_coding = sum_hr_comm = sum_skill = 0
    at_risk = placement_ready = 0

    dept_summary = {k: {"total": 0, "score_sum": 0} for k in ["CSE", "ECE", "ME", "CV", "ISE", "Other"]}

    for s in students:
        academics  = s.get("academics", 0)
        aptitude   = s.get("aptitude", 0)
        technical  = s.get("technical", 0)
        coding     = s.get("coding", 0)
        hr_comm    = s.get("hr_comm", 0)
        skill_score = s.get("skill_score") or s.get("skillScore") or round(
            (academics + aptitude + technical + coding + hr_comm) / 5, 1
        )

        sum_academics  += academics
        sum_aptitude   += aptitude
        sum_technical  += technical
        sum_coding     += coding
        sum_hr_comm    += hr_comm
        sum_skill      += skill_score

        if skill_score >= 75:
            placement_ready += 1
        if skill_score < 60 or s.get("riskScore", 0) > 60:
            at_risk += 1

        dk = _dept_key(s.get("department", ""))
        dept_summary[dk]["total"]     += 1
        dept_summary[dk]["score_sum"] += skill_score

    cnt = total_students if total_students > 0 else 1
    avg_skill = round(sum_skill / cnt, 1)

    DEPT_DEFAULTS = {key: 0 for key in dept_summary}

    return {
        "totalStudents":      total_students,
        "activeStudents":     active_students,
        "avgSkillScore":      avg_skill,
        "placementReadiness": round((placement_ready / cnt) * 100, 1) if total_students > 0 else 0,
        "atRiskStudents":     at_risk,
        "testsCompleted":     attempts_count,
        "categoryScores": {
            "academics": round(sum_academics / cnt, 1),
            "aptitude":  round(sum_aptitude  / cnt, 1),
            "technical": round(sum_technical / cnt, 1),
            "coding":    round(sum_coding    / cnt, 1),
            "hrComm":    round(sum_hr_comm   / cnt, 1),
            "overall":   avg_skill,
        },
        "departmentScores": [
            {
                "dept":  k,
                "score": round(v["score_sum"] / v["total"], 1) if v["total"] > 0 else DEPT_DEFAULTS[k]
            }
            for k, v in dept_summary.items()
        ],
        "topPerformers": sorted(
            [
                {
                    "name":  s.get("full_name") or "Student",
                    "usn":   s.get("student_id") or s.get("usn") or "",
                    "dept":  _dept_key(s.get("department", "")),
                    "score": s.get("skill_score") or s.get("skillScore") or round(
                        (s.get("academics", 0) + s.get("aptitude", 0) + s.get("technical", 0) +
                         s.get("coding", 0) + s.get("hr_comm", 0)) / 5, 1
                    )
                }
                for s in students
            ],
            key=lambda x: x["score"],
            reverse=True
        )[:10],
    }


@router.get("/dashboard/filtered")
async def get_admin_dashboard_filtered(
    branch:  Optional[str] = Query(None, description="Department/Branch filter, e.g. CSE"),
    year:    Optional[str] = Query(None, description="Year filter, e.g. 1,2,3,4"),
    semester: Optional[str] = Query(None, description="Semester filter, e.g. 1-8"),
    section: Optional[str] = Query(None, description="Section filter, e.g. A,B,C"),
    current_user: dict = Depends(require_role(["admin"]))
):
    """Return database-backed analytics for the selected student cohort."""
    users_col    = get_db_collection("users")
    attempts_col = get_db_collection("quiz_attempts")

    res_users = await users_col.find({"role": "student"})
    all_students = await res_users.to_list(length=5000) if hasattr(res_users, "to_list") else list(res_users)

    for doc in all_students:
        doc.pop("hashed_password", None)
        if "_id" in doc and not isinstance(doc["_id"], str):
            doc["_id"] = str(doc["_id"])

    analytics = await build_analytics(filters={
        "branch": branch, "year": year, "semester": semester, "section": section
    })
    analysis = legacy_analysis(analytics)
    filtered = [
        student for student in all_students
        if (not branch or _dept_key(student.get("department", "")) == branch.upper())
        and (not year or str(student.get("year", "")) == str(year))
        and (not semester or str(student.get("semester", "")) == str(semester))
        and (not section or str(student.get("section", "")).upper() == section.upper())
    ]

    return {
        "success": True,
        "message": "Filtered dashboard analytics loaded",
        "data": {
            "filters": {"branch": branch, "year": year, "semester": semester, "section": section},
            "totalStudentsInFilter": len(filtered),
            "overallAnalysis": analysis,
            "analytics": analytics,
            "recentStudents": filtered[:10],
        }
    }

@router.get("/dashboard")
async def get_admin_dashboard(current_user: dict = Depends(require_role(["admin"]))):
    users_col = get_db_collection("users")
    dept_col = get_db_collection("departments")
    assess_col = get_db_collection("assessments")
    activities_col = get_db_collection("activities")
    attempts_col = get_db_collection("quiz_attempts")

    res_users = await users_col.find({})
    all_users = await res_users.to_list(length=5000) if hasattr(res_users, "to_list") and callable(getattr(res_users, "to_list", None)) else list(res_users)

    students = [u for u in all_users if u.get("role") == "student"]
    faculty = [u for u in all_users if u.get("role") == "faculty"]
    admins = [u for u in all_users if u.get("role") == "admin"]

    res_dept = await dept_col.find({})
    departments = await res_dept.to_list(length=500) if hasattr(res_dept, "to_list") and callable(getattr(res_dept, "to_list", None)) else list(res_dept)

    res_assess = await assess_col.find({})
    assessments = await res_assess.to_list(length=500) if hasattr(res_assess, "to_list") and callable(getattr(res_assess, "to_list", None)) else list(res_assess)

    res_act = await activities_col.find({})
    activities = await res_act.to_list(length=1000) if hasattr(res_act, "to_list") and callable(getattr(res_act, "to_list", None)) else list(res_act)

    res_att = await attempts_col.find({})
    attempts = await res_att.to_list(length=5000) if hasattr(res_att, "to_list") and callable(getattr(res_att, "to_list", None)) else list(res_att)

    # Sanitize _id for JSON serialization across returned collections
    for doc in all_users:
        if "_id" in doc and not isinstance(doc["_id"], str):
            doc["_id"] = str(doc["_id"])
        doc.pop("hashed_password", None)

    for doc in departments:
        if "_id" in doc and not isinstance(doc["_id"], str):
            doc["_id"] = str(doc["_id"])

    for doc in assessments:
        if "_id" in doc and not isinstance(doc["_id"], str):
            doc["_id"] = str(doc["_id"])

    analytics = await build_analytics()
    overall_analysis = legacy_analysis(analytics)

    return {
        "success": True,
        "message": "Admin dashboard statistics loaded",
        "data": {
            "stats": {
                "totalUsers": len(all_users),
                "totalStudents": overall_analysis["totalStudents"],
                "totalFaculty": len(faculty),
                "totalAdmins": len(admins),
                "totalDepartments": len(departments),
                "totalAssessments": len(assessments),
                "totalActivities": len(activities),
                "testsCompleted": len(attempts)
            },
            "overallAnalysis": overall_analysis,
            "analytics": analytics,
            "recentUsers": all_users[:10],
            "recentStudents": students[:10],
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
    analytics = await build_analytics()
    return {
        "success": True,
        "data": {
            "departmentPerformance": [
                {
                    "department": item["group"],
                    "avgScore": item["average"],
                    "studentsContributing": item["students_contributing"],
                }
                for item in analytics["grouped_statistics"]["branch"]
            ],
            "monthlyParticipation": [],
            "skillDistribution": [
                {"skill": category, "count": details["students_contributing"]}
                for category, details in analytics["category_averages"].items()
            ],
            "summary": {
                "studentCount": analytics["student_count"],
                "submittedAttempts": analytics["submitted_attempts"],
                "participationPercentage": analytics["participation_percentage"],
                "overallAverage": analytics["overall_average"] or 0,
            },
        }
    }
