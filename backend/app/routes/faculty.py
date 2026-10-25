from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
import base64
from datetime import datetime
from typing import Optional
from app.routes.auth import require_role
from app.utils.security import get_password_hash, verify_password
from app.database import get_db_collection
from app.schemas.activity import FeedbackSubmit
from app.services.analytics import build_analytics, legacy_analysis

router = APIRouter(prefix="/faculty", tags=["Faculty"])


def _public_faculty_profile(user: dict) -> dict:
    profile = dict(user)
    profile.pop("hashed_password", None)
    profile.pop("password_plain", None)
    return profile


async def _faculty_assignments(faculty: dict) -> tuple[list, list]:
    assignments_col = get_db_collection("faculty_assignments")
    subjects_col = get_db_collection("subjects")
    students_col = get_db_collection("users")
    faculty_id = faculty.get("faculty_id") or faculty.get("user_id") or faculty.get("email")
    assignments = await assignments_col.find({"faculty_id": faculty_id})
    subjects, classes = [], []
    for assignment in assignments:
        assignment_type = str(assignment.get("type") or assignment.get("assignment_type") or "subject").lower()
        if assignment_type == "class":
            item = dict(assignment)
            query = {"role": "student"}
            for field in ("department", "year", "semester", "section"):
                if item.get(field) is not None:
                    query[field] = item[field]
            item["student_count"] = await students_col.count_documents(query)
            classes.append(item)
        else:
            subject = await subjects_col.find_one({"_id": assignment.get("subject_id")})
            subjects.append({**(subject or {}), **assignment})
    return subjects, classes


@router.get("/profile")
async def get_faculty_profile(current_user: dict = Depends(require_role(["faculty"]))):
    subjects, classes = await _faculty_assignments(current_user)
    return {
        "success": True,
        "data": {
            **_public_faculty_profile(current_user),
            "subjects": subjects,
            "classes": classes,
        },
    }


@router.put("/profile")
async def update_faculty_profile(
    payload: dict,
    current_user: dict = Depends(require_role(["faculty"]))
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
    if "summary" in payload:
        summary = str(payload["summary"]).strip()
        if len(summary) > 1000:
            raise HTTPException(status_code=400, detail="Summary must be 1000 characters or fewer.")
        allowed["summary"] = summary
    allowed["updated_at"] = datetime.utcnow().isoformat()
    users_col = get_db_collection("users")
    await users_col.update_one({"email": current_user["email"]}, {"$set": allowed})
    updated = await users_col.find_one({"email": current_user["email"]})
    subjects, classes = await _faculty_assignments(updated or current_user)
    return {"success": True, "data": {**_public_faculty_profile(updated or current_user), "subjects": subjects, "classes": classes}}


@router.put("/profile/password")
async def change_faculty_password(
    payload: dict,
    current_user: dict = Depends(require_role(["faculty"]))
):
    current_password = str(payload.get("current_password") or "")
    new_password = str(payload.get("new_password") or "")
    confirm_password = str(payload.get("confirm_password") or "")
    if not current_password or not new_password or not confirm_password:
        raise HTTPException(status_code=400, detail="Current password, new password, and confirmation are required.")
    if new_password != confirm_password:
        raise HTTPException(status_code=400, detail="New password and confirmation do not match.")
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
async def upload_faculty_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(require_role(["faculty"]))
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
    subjects, classes = await _faculty_assignments(updated or current_user)
    return {"success": True, "data": {**_public_faculty_profile(updated or current_user), "subjects": subjects, "classes": classes}}


@router.get("/subjects")
async def get_faculty_subjects(current_user: dict = Depends(require_role(["faculty"]))):
    subjects, _ = await _faculty_assignments(current_user)
    return {"success": True, "data": subjects}


@router.get("/classes")
async def get_faculty_classes(current_user: dict = Depends(require_role(["faculty"]))):
    _, classes = await _faculty_assignments(current_user)
    return {"success": True, "data": classes}

# ─── Helpers (mirrors admin.py) ───────────────────────────────────────────────

def _dept_key_fac(dept_raw: str) -> str:
    d = (dept_raw or "").strip()
    if "Computer" in d or "CSE" in d:  return "CSE"
    if "Electronics" in d or "ECE" in d: return "ECE"
    if "Mechanical" in d or "ME" in d:  return "ME"
    if "Civil" in d or "CV" in d:       return "CV"
    if "Information" in d or "ISE" in d: return "ISE"
    return "Other"


def _compute_fac(students: list, attempts_count: int) -> dict:
    total = len(students)
    active = len([s for s in students if s.get("is_active") is not False])
    sa = sp = st = sc = sh = ss = at_risk = ready = 0
    dept_s = {k: {"total": 0, "score_sum": 0} for k in ["CSE", "ECE", "ME", "CV", "ISE", "Other"]}
    DEPT_DEF = {key: 0 for key in dept_s}
    for s in students:
        a = s.get("academics", 0); p = s.get("aptitude", 0)
        t = s.get("technical", 0); c = s.get("coding", 0); h = s.get("hr_comm", 0)
        score = s.get("skill_score") or s.get("skillScore") or round((a+p+t+c+h)/5, 1)
        sa += a; sp += p; st += t; sc += c; sh += h; ss += score
        if score >= 75: ready += 1
        if score < 60 or s.get("riskScore", 0) > 60: at_risk += 1
        dk = _dept_key_fac(s.get("department", ""))
        dept_s[dk]["total"] += 1; dept_s[dk]["score_sum"] += score
    cnt = total or 1
    avg = round(ss / cnt, 1)
    return {
        "totalStudents": total, "activeStudents": active, "avgSkillScore": avg,
        "placementReadiness": round((ready/cnt)*100, 1) if total else 0,
        "atRiskStudents": at_risk, "testsCompleted": attempts_count,
        "categoryScores": {
            "academics": round(sa/cnt,1), "aptitude": round(sp/cnt,1),
            "technical": round(st/cnt,1), "coding": round(sc/cnt,1),
            "hrComm": round(sh/cnt,1), "overall": avg
        },
        "departmentScores": [
            {"dept": k, "score": round(v["score_sum"]/v["total"],1) if v["total"]>0 else DEPT_DEF[k]}
            for k, v in dept_s.items()
        ],
        "topPerformers": sorted(
            [{"name": s.get("full_name") or "Student",
              "usn": s.get("student_id") or s.get("usn") or "",
              "dept": _dept_key_fac(s.get("department", "")),
              "score": s.get("skill_score") or s.get("skillScore") or
                       round((s.get("academics",0)+s.get("aptitude",0)+s.get("technical",0)+
                              s.get("coding",0)+s.get("hr_comm",0))/5,1)}
             for s in students],
            key=lambda x: x["score"], reverse=True
        )[:10],
    }

# ─── Filtered dashboard endpoint ──────────────────────────────────────────────

@router.get("/dashboard/filtered")
async def get_faculty_dashboard_filtered(
    branch:  Optional[str] = Query(None, description="Department/Branch filter, e.g. CSE"),
    year:    Optional[str] = Query(None, description="Year filter 1-4"),
    semester: Optional[str] = Query(None, description="Semester filter 1-8"),
    section: Optional[str] = Query(None, description="Section filter A/B/C"),
    current_user: dict = Depends(require_role(["faculty", "admin"]))
):
    """Filtered dashboard analytics for faculty portal."""
    users_col    = get_db_collection("users")
    attempts_col = get_db_collection("quiz_attempts")

    res = await users_col.find({"role": "student"})
    all_students = await res.to_list(length=5000) if hasattr(res, "to_list") else list(res)
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
        if (not branch or _dept_key_fac(student.get("department", "")) == branch.upper())
        and (not year or str(student.get("year", "")) == str(year))
        and (not semester or str(student.get("semester", "")) == str(semester))
        and (not section or str(student.get("section", "")).upper() == section.upper())
    ]

    return {
        "success": True,
        "message": "Filtered faculty dashboard analytics loaded",
        "data": {
            "filters": {"branch": branch, "year": year, "semester": semester, "section": section},
            "totalStudentsInFilter": len(filtered),
            "overallAnalysis": analysis,
            "analytics": analytics,
            "recentStudents": filtered[:10],
        }
    }

# ─── Original faculty dashboard ───────────────────────────────────────────────

@router.get("/dashboard")
async def get_faculty_dashboard(current_user: dict = Depends(require_role(["faculty", "admin"]))):
    users_col = get_db_collection("users")
    assessments_col = get_db_collection("assessments")
    activities_col = get_db_collection("activities")

    students = await users_col.find({"role": "student"})
    assessments = await assessments_col.find({})
    activities = await activities_col.find({})

    pending_activities = [a for a in activities if a.get("status") == "Pending"]

    analytics = await build_analytics()
    analysis = legacy_analysis(analytics)
    return {
        "success": True,
        "message": "Faculty dashboard data loaded",
        "data": {
            "stats": {
                "totalStudents": len(students),
                "activeAssessments": len(assessments),
                "pendingVerifications": len(pending_activities),
                "avgBatchScore": analytics["overall_average"],
                "submittedAttempts": analytics["submitted_attempts"],
                "participationPercentage": analytics["participation_percentage"],
            },
            "overallAnalysis": analysis,
            "analytics": analytics,
            "students": students,
            "recentStudents": students[:10],
            "assessments": assessments,
            "pendingActivities": pending_activities
        }
    }


@router.get("/students")
async def list_faculty_students(current_user: dict = Depends(require_role(["faculty", "admin"]))):
    users_col = get_db_collection("users")
    students = await users_col.find({"role": "student"})
    for s in students:
        s.pop("hashed_password", None)
    return {
        "success": True,
        "data": students
    }

@router.post("/feedback")
async def submit_faculty_feedback(
    feedback_in: FeedbackSubmit,
    current_user: dict = Depends(require_role(["faculty", "admin"]))
):
    feedback_col = get_db_collection("feedback")
    notif_col = get_db_collection("notifications")

    feedback_doc = {
        "faculty_email": current_user["email"],
        "faculty_name": current_user.get("full_name", "Faculty Member"),
        "student_email": feedback_in.student_email,
        "category": feedback_in.category,
        "feedback": feedback_in.feedback,
        "rating": feedback_in.rating,
        "recommendation": feedback_in.recommendation or "",
        "created_at": "2026-08-13T10:20:00"
    }
    
    await feedback_col.insert_one(feedback_doc)

    # Notify student
    await notif_col.insert_one({
        "user_email": feedback_in.student_email,
        "title": "New Faculty Feedback Received",
        "message": f"{current_user.get('full_name')} provided feedback: '{feedback_in.feedback[:80]}...'",
        "type": "feedback",
        "read": False,
        "date": "2026-08-13T10:20:00"
    })

    return {
        "success": True,
        "message": "Feedback submitted successfully"
    }

@router.put("/activities/{activity_id}/verify")
async def verify_student_activity(
    activity_id: str,
    action: str = "approve", # approve or reject
    current_user: dict = Depends(require_role(["faculty", "admin"]))
):
    activities_col = get_db_collection("activities")
    notif_col = get_db_collection("notifications")

    act = await activities_col.find_one({"_id": activity_id})
    if not act:
        raise HTTPException(status_code=404, detail="Activity not found")

    new_status = "Verified" if action == "approve" else "Rejected"
    await activities_col.update_one({"_id": activity_id}, {"$set": {"status": new_status, "verified_by": current_user["email"]}})

    # Notify student
    await notif_col.insert_one({
        "user_email": act["student_email"],
        "title": f"Activity {new_status}",
        "message": f"Your activity '{act['title']}' has been {new_status.lower()} by faculty.",
        "type": "activity",
        "read": False,
        "date": "2026-08-13T10:20:00"
    })

    return {
        "success": True,
        "message": f"Activity status updated to {new_status}"
    }

# ---------------------------------------------------------
# FACULTY PROJECT SEARCH & EVALUATION BY 8-DIGIT PROJECT ID
# ---------------------------------------------------------
@router.get("/projects/search")
async def search_project_by_id(
    project_id: str,
    current_user: dict = Depends(require_role(["faculty", "admin"]))
):
    clean_id = project_id.strip()
    projects_col = get_db_collection("projects")
    users_col = get_db_collection("users")

    # Search in projects collection
    proj = await projects_col.find_one({"$or": [{"project_id": clean_id}, {"id": clean_id}]})
    
    if not proj:
        # Fallback search inside users collection
        cursor = users_col.find({"role": "student"})
        all_students = await cursor.to_list(length=200)
        for s in all_students:
            projs = s.get("projects", [])
            if isinstance(projs, list):
                for p in projs:
                    if isinstance(p, dict) and (str(p.get("project_id")) == clean_id or str(p.get("id")) == clean_id):
                        proj = p.copy()
                        if not proj.get("student_name"):
                            proj["student_name"] = s.get("full_name") or "Student"
                        if not proj.get("student_id"):
                            proj["student_id"] = s.get("student_id") or s.get("usn") or "4KV21CS042"
                        if not proj.get("student_email"):
                            proj["student_email"] = s.get("email")
                        if not proj.get("student_department"):
                            proj["student_department"] = s.get("department") or "CSE"
                        break
            if proj:
                break

    if not proj:
        raise HTTPException(
            status_code=404, 
            detail=f"Project ID '{clean_id}' not found. Please verify the 8-digit Project ID."
        )

    if "_id" in proj and not isinstance(proj["_id"], str):
        proj["_id"] = str(proj["_id"])

    return {
        "success": True,
        "data": proj
    }

@router.post("/projects/{project_id}/evaluate")
async def evaluate_student_project(
    project_id: str,
    payload: dict,
    current_user: dict = Depends(require_role(["faculty", "admin"]))
):
    clean_id = project_id.strip()
    raw_marks = payload.get("marks")
    
    try:
        marks = float(raw_marks)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Marks must be a valid number between 0 and 100.")

    if marks < 0 or marks > 100:
        raise HTTPException(status_code=400, detail="Marks must be between 0 and 100.")

    faculty_name = current_user.get("full_name") or current_user.get("name") or "Prof. Suresh Kumar"
    faculty_email = current_user.get("email") or "faculty@kvgce.edu.in"
    eval_time = "2026-10-02T14:30:00"

    projects_col = get_db_collection("projects")
    users_col = get_db_collection("users")

    eval_fields = {
        "status": "Approved",
        "marks": round(marks, 1),
        "faculty_id": faculty_email,
        "faculty_name": faculty_name,
        "evaluated_at": eval_time
    }

    proj = await projects_col.find_one({"$or": [{"project_id": clean_id}, {"id": clean_id}]})
    student_email = proj.get("student_email") if proj else None

    if proj:
        await projects_col.update_one({"$or": [{"project_id": clean_id}, {"id": clean_id}]}, {"$set": eval_fields})
        proj = await projects_col.find_one({"$or": [{"project_id": clean_id}, {"id": clean_id}]})
        if "_id" in proj and not isinstance(proj["_id"], str):
            proj["_id"] = str(proj["_id"])

    # Update student record in users collection
    cursor = users_col.find({"role": "student"})
    all_students = await cursor.to_list(length=200)
    for s in all_students:
        s_email = s.get("email")
        projs = s.get("projects", [])
        if isinstance(projs, list):
            updated_projs = []
            matched = False
            for p in projs:
                if isinstance(p, dict) and (str(p.get("project_id")) == clean_id or str(p.get("id")) == clean_id):
                    p_updated = {**p, **eval_fields}
                    updated_projs.append(p_updated)
                    matched = True
                    if not proj:
                        proj = p_updated
                else:
                    updated_projs.append(p)
            if matched:
                await users_col.update_one({"email": s_email}, {"$set": {"projects": updated_projs}})

    if not proj:
        proj = {
            "project_id": clean_id,
            "id": clean_id,
            "title": payload.get("title") or "Student Project",
            **eval_fields
        }

    # Notify student
    if student_email or (proj and proj.get("student_email")):
        notif_col = get_db_collection("notifications")
        await notif_col.insert_one({
            "user_email": student_email or proj.get("student_email"),
            "title": "Project Evaluation Completed",
            "message": f"Your project '{proj.get('title', 'Project')}' has been evaluated by {faculty_name}. Marks: {marks}/100.",
            "type": "project",
            "read": False,
            "date": eval_time
        })

    return {
        "success": True,
        "message": f"Project successfully evaluated and approved by {faculty_name} with {marks}/100 marks!",
        "data": proj
    }

@router.get("/projects")
async def get_faculty_evaluated_projects(
    current_user: dict = Depends(require_role(["faculty", "admin"]))
):
    projects_col = get_db_collection("projects")
    users_col = get_db_collection("users")
    faculty_email = current_user.get("email")
    faculty_name = current_user.get("full_name")

    evaluated = []
    try:
        cursor = projects_col.find({"status": "Approved"})
        evaluated = await cursor.to_list(length=100)
    except Exception:
        pass

    # Also search users collection for approved projects
    cursor = users_col.find({"role": "student"})
    all_students = await cursor.to_list(length=200)
    seen_ids = {str(p.get("project_id") or p.get("id")) for p in evaluated}

    for s in all_students:
        projs = s.get("projects", [])
        if isinstance(projs, list):
            for p in projs:
                if isinstance(p, dict) and p.get("status") == "Approved":
                    p_id = str(p.get("project_id") or p.get("id"))
                    if p_id not in seen_ids:
                        p_copy = p.copy()
                        if not p_copy.get("student_name"):
                            p_copy["student_name"] = s.get("full_name") or "Student"
                        if not p_copy.get("student_id"):
                            p_copy["student_id"] = s.get("student_id") or s.get("usn") or "4KV21CS042"
                        evaluated.append(p_copy)
                        seen_ids.add(p_id)

    for p in evaluated:
        if "_id" in p and not isinstance(p["_id"], str):
            p["_id"] = str(p["_id"])

    return {
        "success": True,
        "data": evaluated
    }
