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
