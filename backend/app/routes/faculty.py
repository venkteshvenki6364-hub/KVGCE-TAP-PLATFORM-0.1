from fastapi import APIRouter, Depends, HTTPException, status
from app.routes.auth import require_role
from app.database import get_db_collection
from app.schemas.activity import FeedbackSubmit

router = APIRouter(prefix="/faculty", tags=["Faculty"])

@router.get("/dashboard")
async def get_faculty_dashboard(current_user: dict = Depends(require_role(["faculty", "admin"]))):
    users_col = get_db_collection("users")
    assessments_col = get_db_collection("assessments")
    activities_col = get_db_collection("activities")

    students = await users_col.find({"role": "student"})
    assessments = await assessments_col.find({})
    activities = await activities_col.find({})

    pending_activities = [a for a in activities if a.get("status") == "Pending"]

    return {
        "success": True,
        "message": "Faculty dashboard data loaded",
        "data": {
            "stats": {
                "totalStudents": len(students),
                "activeAssessments": len(assessments),
                "pendingVerifications": len(pending_activities),
                "avgBatchScore": 81.4
            },
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

