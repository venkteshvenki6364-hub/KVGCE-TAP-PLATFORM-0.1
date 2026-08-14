from fastapi import APIRouter, Depends, HTTPException, status
import uuid
from datetime import datetime
from app.routes.auth import get_current_user, require_role
from app.database import get_db_collection
from app.schemas.activity import ActivitySubmit, CertificateSubmit

router = APIRouter(prefix="/activities", tags=["Activities & Certificates"])

@router.get("")
async def list_activities(current_user: dict = Depends(get_current_user)):
    activities_col = get_db_collection("activities")
    query = {"student_email": current_user["email"]} if current_user.get("role") == "student" else {}
    items = await activities_col.find(query)
    return {
        "success": True,
        "data": items
    }

@router.post("")
async def submit_activity(
    activity_in: ActivitySubmit,
    current_user: dict = Depends(require_role(["student", "admin"]))
):
    activities_col = get_db_collection("activities")
    doc = activity_in.model_dump()
    doc["_id"] = str(uuid.uuid4())
    doc["student_email"] = current_user["email"]
    doc["student_name"] = current_user.get("full_name", "Student")
    doc["status"] = "Pending"
    doc["created_at"] = datetime.utcnow().isoformat()

    await activities_col.insert_one(doc)
    return {
        "success": True,
        "message": "Activity submitted for faculty review",
        "data": doc
    }

@router.delete("/{id}")
async def delete_activity(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    activities_col = get_db_collection("activities")
    item = await activities_col.find_one({"_id": id})
    if not item:
        raise HTTPException(status_code=404, detail="Activity not found.")

    if current_user.get("role") == "student" and item.get("student_email") != current_user["email"]:
        raise HTTPException(status_code=403, detail="Unauthorized to delete this activity.")

    await activities_col.delete_one({"_id": id})
    return {
        "success": True,
        "message": "Activity removed successfully"
    }

@router.post("/certificates")
async def add_certificate(
    cert_in: CertificateSubmit,
    current_user: dict = Depends(require_role(["student", "admin"]))
):
    activities_col = get_db_collection("activities")
    doc = {
        "_id": str(uuid.uuid4()),
        "student_email": current_user["email"],
        "student_name": current_user.get("full_name"),
        "title": cert_in.title,
        "category": "Certification",
        "organizer": cert_in.organization,
        "date": cert_in.issue_date,
        "description": f"Credential ID: {cert_in.credential_id or 'N/A'}",
        "certificate_url": cert_in.credential_url or "",
        "points": 25,
        "status": "Verified",
        "created_at": datetime.utcnow().isoformat()
    }
    await activities_col.insert_one(doc)
    return {
        "success": True,
        "message": "Certificate added to student profile",
        "data": doc
    }
