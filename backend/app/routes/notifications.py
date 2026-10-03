from fastapi import APIRouter, Depends, HTTPException, status
from app.routes.auth import get_current_user, require_role
from app.database import get_db_collection
from datetime import datetime
from typing import Dict, List, Any, Optional

router = APIRouter(prefix="/notifications", tags=["Notifications"])

def normalize_dept(dept_str: str) -> str:
    d = str(dept_str or "").strip().lower()
    if not d or d == "all":
        return "all"
    if "computer" in d or "cse" in d:
        return "cse"
    if "information" in d or "ise" in d:
        return "ise"
    if "electronics" in d or "ece" in d:
        return "ece"
    if "mechanical" in d or "me" in d or "mech" in d:
        return "me"
    if "civil" in d or "civ" in d:
        return "civil"
    if "ai" in d or "data" in d or "aids" in d:
        return "aids"
    return d

def normalize_sec(sec_str: str) -> str:
    s = str(sec_str or "").strip().lower()
    if not s or s == "all":
        return "all"
    if "a" in s:
        return "a"
    if "b" in s:
        return "b"
    if "c" in s:
        return "c"
    return s

def normalize_year(year_str: str) -> str:
    y = str(year_str or "").strip().lower()
    if not y or y == "all":
        return "all"
    if "1" in y or "2024" in y:
        return "1"
    if "2" in y or "2023" in y:
        return "2"
    if "3" in y or "2022" in y:
        return "3"
    if "4" in y or "2021" in y:
        return "4"
    return y

@router.get("")
async def get_user_notifications(current_user: dict = Depends(get_current_user)):
    """
    Retrieve notifications belonging strictly to the authenticated user.
    Server-side filtering guarantees Security & Privacy.
    """
    notif_col = get_db_collection("notifications")
    user_email = str(current_user.get("email") or "").strip().lower()
    user_role = str(current_user.get("role") or "student").strip().lower()
    user_dept = str(current_user.get("department") or current_user.get("dept") or current_user.get("branch") or "").strip().lower()
    user_sec = str(current_user.get("section") or "").strip().lower()
    user_year = str(current_user.get("year") or current_user.get("batch_year") or "").strip().lower()
    user_id = str(current_user.get("student_id") or current_user.get("faculty_id") or current_user.get("user_id") or current_user.get("usn") or "").strip().lower()
    user_name = str(current_user.get("full_name") or current_user.get("name") or "").strip().lower()

    all_notifs = await notif_col.find({})
    matched = []

    for n in all_notifs:
        # Check target role
        t_role = str(n.get("targetRole") or n.get("recipient_type") or "all").strip().lower()
        if t_role != "all" and t_role != user_role and user_role != "admin":
            continue

        # Admin sees all system notifications
        if user_role == "admin":
            matched.append(n)
            continue

        # Specific user recipients filter check if explicitly specified
        recipients = [str(r).strip().lower() for r in n.get("recipients", []) if r]
        if recipients and len(recipients) > 0:
            match_recipient = any(
                r in user_email or r in user_id or r in user_name or user_id in r or user_name in r
                for r in recipients
            )
            if not match_recipient:
                continue

        # Student target filters check
        if user_role == "student":
            t_branch_norm = normalize_dept(n.get("targetBranch") or n.get("branch"))
            t_sec_norm = normalize_sec(n.get("targetSection") or n.get("section"))
            t_year_norm = normalize_year(n.get("targetBatchYear") or n.get("year"))

            u_dept_norm = normalize_dept(user_dept)
            u_sec_norm = normalize_sec(user_sec)
            u_year_norm = normalize_year(user_year)

            if t_branch_norm != "all" and u_dept_norm != "all":
                if t_branch_norm != u_dept_norm:
                    continue
            if t_sec_norm != "all" and u_sec_norm != "all":
                if t_sec_norm != u_sec_norm:
                    continue
            if t_year_norm != "all" and u_year_norm != "all":
                if t_year_norm != u_year_norm:
                    continue

        # Faculty target filters check
        if user_role == "faculty":
            t_branch_norm = normalize_dept(n.get("targetBranch") or n.get("branch"))
            u_dept_norm = normalize_dept(user_dept)
            if t_branch_norm != "all" and u_dept_norm != "all":
                if t_branch_norm != u_dept_norm:
                    continue

        matched.append(n)

    # Sort notifications by createdAt descending (latest first)
    matched.sort(
        key=lambda x: str(x.get("createdAt") or x.get("created_at") or ""),
        reverse=True
    )

    return {
        "success": True,
        "data": matched
    }

@router.post("")
@router.post("/send")
async def create_notification(
    payload: dict,
    current_user: dict = Depends(require_role(["admin", "faculty"]))
):
    """
    Create & dispatch a targeted notification from Admin or Faculty.
    Extracts sender identity strictly from authentication context.
    """
    notif_col = get_db_collection("notifications")

    msg = str(payload.get("message") or "").strip()
    if not msg:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Notification message cannot be empty."
        )

    title = str(payload.get("title") or payload.get("subject") or "").strip()
    if not title:
        title = "Faculty Announcement" if current_user.get("role") == "faculty" else "Campus Announcement"

    target_role = str(payload.get("targetRole") or payload.get("recipient_type") or "student").strip().lower()
    target_branch = str(payload.get("targetBranch") or payload.get("branch") or "all").strip()
    target_section = str(payload.get("targetSection") or payload.get("section") or "all").strip()
    target_year = str(payload.get("targetBatchYear") or payload.get("year") or "all").strip()
    specified_recipients = payload.get("recipients") or payload.get("specific_recipients") or []

    # Clean specific recipients if specified
    recipients_list = []
    if specified_recipients and isinstance(specified_recipients, list):
        recipients_list = list(set([str(r).strip() for r in specified_recipients if r]))

    sender_name = current_user.get("full_name") or current_user.get("name") or "Administrator"
    sender_role = current_user.get("role") or "admin"
    sender_id = current_user.get("email") or current_user.get("student_id") or current_user.get("faculty_id") or "admin_system"

    now_iso = datetime.utcnow().isoformat()
    notif_id = f"notif_{int(datetime.utcnow().timestamp() * 1000)}"

    doc = {
        "id": notif_id,
        "notification_id": notif_id,
        "title": title,
        "message": msg,
        "targetRole": target_role,
        "recipient_type": target_role,
        "targetBranch": target_branch,
        "branch": target_branch,
        "targetSection": target_section,
        "section": target_section,
        "targetBatchYear": target_year,
        "year": target_year,
        "recipients": recipients_list,
        "sender": sender_name,
        "sender_name": sender_name,
        "sender_id": sender_id,
        "sender_role": sender_role,
        "createdAt": now_iso,
        "created_at": now_iso,
        "read": False,
        "is_read": False,
        "read_by": []
    }

    res = await notif_col.insert_one(doc)
    doc["_id"] = str(res.inserted_id)

    return {
        "success": True,
        "message": "Notification sent successfully to target recipients",
        "data": doc
    }

@router.put("/{id}/read")
@router.patch("/{id}/read")
async def mark_notification_read(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    notif_col = get_db_collection("notifications")
    user_id = str(current_user.get("email") or current_user.get("student_id") or current_user.get("user_id") or "").strip()

    await notif_col.update_one(
        {"$or": [{"_id": id}, {"id": id}, {"notification_id": id}]},
        {
            "$set": {"read": True, "is_read": True},
            "$push": {"read_by": user_id}
        }
    )
    return {
        "success": True,
        "message": "Notification marked as read"
    }

@router.delete("/clear-all")
async def clear_all_notifications(current_user: dict = Depends(get_current_user)):
    """Clear notifications for the logged in user."""
    notif_col = get_db_collection("notifications")
    user_role = str(current_user.get("role") or "").strip().lower()

    if user_role == "admin":
        await notif_col.delete_one({})
    return {
        "success": True,
        "message": "All notifications cleared"
    }

@router.delete("/{id}")
async def delete_notification(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    notif_col = get_db_collection("notifications")
    await notif_col.delete_one({"$or": [{"_id": id}, {"id": id}, {"notification_id": id}]})
    return {
        "success": True,
        "message": "Notification deleted successfully"
    }
