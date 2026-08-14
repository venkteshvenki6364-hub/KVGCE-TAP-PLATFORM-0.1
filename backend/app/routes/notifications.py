from fastapi import APIRouter, Depends, HTTPException
from app.routes.auth import get_current_user
from app.database import get_db_collection

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("")
async def get_user_notifications(current_user: dict = Depends(get_current_user)):
    notif_col = get_db_collection("notifications")
    user_email = current_user["email"]
    items = await notif_col.find({"user_email": user_email})
    return {
        "success": True,
        "data": items
    }

@router.put("/{id}/read")
async def mark_notification_read(id: str, current_user: dict = Depends(get_current_user)):
    notif_col = get_db_collection("notifications")
    await notif_col.update_one({"_id": id}, {"$set": {"read": True}})
    return {
        "success": True,
        "message": "Notification marked as read"
    }
