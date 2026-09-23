import base64
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from app.routes.auth import get_current_user, require_role
from app.database import get_db_collection
from app.schemas.user import UserProfileUpdate

router = APIRouter(prefix="/students", tags=["Students"])

async def record_user_daily_activity(email: str) -> dict:
    users_col = get_db_collection("users")
    user_doc = await users_col.find_one({"email": email})
    if not user_doc:
        return {}
    
    from datetime import datetime
    today_str = datetime.utcnow().strftime("%Y-%m-%d")
    activity_dates = list(user_doc.get("activity_dates") or [])
    signup_date = user_doc.get("approved_at") or user_doc.get("signup_date") or user_doc.get("created_at") or "2026-01-12"
    if isinstance(signup_date, str) and "T" in signup_date:
        signup_date = signup_date.split("T")[0]

    if signup_date not in activity_dates:
        activity_dates.append(signup_date)

    if today_str not in activity_dates:
        activity_dates.append(today_str)
        
    # Provide structured historical overall score points (0 to 100 with ups and downs)
    score_history = user_doc.get("score_history") or [
        {"date": "15 Jan", "day": "Thu", "score": 48.0, "change": "-4.0%", "trend": "down"},
        {"date": "10 Feb", "day": "Tue", "score": 56.5, "change": "+8.5%", "trend": "up"},
        {"date": "05 Mar", "day": "Thu", "score": 51.0, "change": "-5.5%", "trend": "down"},
        {"date": "22 Apr", "day": "Wed", "score": 67.0, "change": "+16.0%", "trend": "up"},
        {"date": "18 May", "day": "Mon", "score": 63.5, "change": "-3.5%", "trend": "down"},
        {"date": "12 Jun", "day": "Fri", "score": 75.0, "change": "+11.5%", "trend": "up"},
        {"date": "25 Jul", "day": "Sat", "score": 71.8, "change": "-3.2%", "trend": "down"},
        {"date": "14 Aug", "day": "Fri", "score": 79.5, "change": "+7.7%", "trend": "up"},
        {"date": "23 Sep", "day": "Wed", "score": 82.5, "change": "+3.0%", "trend": "up"}
    ]

    await users_col.update_one(
        {"email": email},
        {"$set": {"activity_dates": activity_dates, "signup_date": signup_date, "score_history": score_history}}
    )
    user_doc["activity_dates"] = activity_dates
    user_doc["signup_date"] = signup_date
    user_doc["score_history"] = score_history
    user_doc.pop("hashed_password", None)
    return user_doc

@router.get("/dashboard")
async def get_student_dashboard(current_user: dict = Depends(require_role(["student", "admin"]))):
    user_email = current_user["email"]
    
    # Auto-record daily login activity in DB
    user_profile = await record_user_daily_activity(user_email)
    if not user_profile:
        user_profile = current_user

    activities_col = get_db_collection("activities")
    assessments_col = get_db_collection("assessments")
    attempts_col = get_db_collection("quiz_attempts")
    notifs_col = get_db_collection("notifications")

    # Fetch student activities
    activities = await activities_col.find({"student_email": user_email})
    completed_activities_count = len(activities)

    # Fetch available assessments
    assessments = await assessments_col.find({"is_published": True})
    
    # Fetch student quiz attempts
    attempts = await attempts_col.find({"student_email": user_email})
    
    # Fetch notifications
    notifications = await notifs_col.find({"user_email": user_email})

    skills = user_profile.get("skills", [
        {"name": "Python", "category": "Programming", "score": 85, "level": "Advanced", "percentage": 85},
        {"name": "React.js", "category": "Web Development", "score": 80, "level": "Advanced", "percentage": 80},
        {"name": "SQL & DBMS", "category": "Database", "score": 70, "level": "Intermediate", "percentage": 70},
        {"name": "Quantitative Aptitude", "category": "Aptitude", "score": 82, "level": "Advanced", "percentage": 82}
    ])

    # Calculate average scores
    aptitude_scores = [a.get("percentage", 80) for a in attempts if a.get("category") == "Aptitude"]
    tech_scores = [a.get("percentage", 85) for a in attempts if a.get("category") == "Technical Quiz"]
    
    aptitude_avg = round(sum(aptitude_scores)/len(aptitude_scores), 1) if aptitude_scores else 82.0
    tech_avg = round(sum(tech_scores)/len(tech_scores), 1) if tech_scores else 85.0
    overall_score = round((aptitude_avg + tech_avg + 84) / 3, 1)

    ai_recommendations = [
        "Your Logical Reasoning score is strong (88%). Keep practicing high-level puzzles.",
        "Practice SQL subqueries and indexing to boost DBMS technical score.",
        "Complete 2 new coding challenges in Dynamic Programming to prepare for TCS Digital / Infosys SP placement drives."
    ]

    return {
        "success": True,
        "message": "Student dashboard data fetched",
        "data": {
            "profile": user_profile,
            "stats": {
                "overallScore": overall_score,
                "aptitudeScore": aptitude_avg,
                "technicalScore": tech_avg,
                "codingScore": 78.5,
                "activitiesCompleted": completed_activities_count,
                "certificates": len([a for a in activities if a.get("category") == "Certification"]),
                "achievements": len([a for a in activities if a.get("category") == "Hackathon"])
            },
            "skills": skills,
            "recentActivities": activities[:5],
            "upcomingAssessments": assessments[:5],
            "aiRecommendations": ai_recommendations,
            "notifications": notifications[:5]
        }
    }

@router.get("/profile")
async def get_student_profile(current_user: dict = Depends(get_current_user)):
    user_doc = await record_user_daily_activity(current_user["email"])
    if user_doc:
        return {
            "success": True,
            "data": user_doc
        }
    return {
        "success": True,
        "data": current_user
    }

@router.put("/profile")
async def update_student_profile(
    profile_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    users_col = get_db_collection("users")
    update_dict = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    
    if update_dict:
        await users_col.update_one({"email": current_user["email"]}, {"$set": update_dict})
    
    updated_user = await users_col.find_one({"email": current_user["email"]})
    if updated_user:
        updated_user.pop("hashed_password", None)

    return {
        "success": True,
        "message": "Profile updated successfully",
        "data": updated_user
    }

MAX_AVATAR_SIZE_MB = 5
MAX_AVATAR_SIZE_BYTES = MAX_AVATAR_SIZE_MB * 1024 * 1024

@router.post("/upload-avatar")
async def upload_student_avatar(
    file: Optional[UploadFile] = File(None),
    avatar_url: Optional[str] = Form(None),
    current_user: dict = Depends(get_current_user)
):
    users_col = get_db_collection("users")
    user_email = current_user["email"]

    final_avatar = None

    if file:
        content = await file.read()
        if len(content) > MAX_AVATAR_SIZE_BYTES:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File size exceeds maximum allowed limit of {MAX_AVATAR_SIZE_MB}MB."
            )
        
        content_type = file.content_type or "image/png"
        b64_str = base64.b64encode(content).decode("utf-8")
        final_avatar = f"data:{content_type};base64,{b64_str}"
    elif avatar_url is not None:
        final_avatar = avatar_url
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No avatar file or URL provided."
        )

    await users_col.update_one({"email": user_email}, {"$set": {"avatarUrl": final_avatar}})
    updated_user = await users_col.find_one({"email": user_email})
    if updated_user:
        updated_user.pop("hashed_password", None)

    return {
        "success": True,
        "message": f"Profile image uploaded and saved successfully (Max limit: {MAX_AVATAR_SIZE_MB}MB)",
        "avatarUrl": final_avatar,
        "data": updated_user
    }

@router.get("/skills")
async def get_student_skills(current_user: dict = Depends(get_current_user)):
    return {
        "success": True,
        "data": current_user.get("skills", [])
    }

@router.put("/skills")
async def update_student_skills(skills: list, current_user: dict = Depends(get_current_user)):
    users_col = get_db_collection("users")
    await users_col.update_one({"email": current_user["email"]}, {"$set": {"skills": skills}})
    return {
        "success": True,
        "message": "Skills updated successfully",
        "data": skills
    }

@router.get("/results")
async def get_student_results(current_user: dict = Depends(get_current_user)):
    attempts_col = get_db_collection("quiz_attempts")
    results = await attempts_col.find({"student_email": current_user["email"]})
    return {
        "success": True,
        "data": results
    }

@router.get("/rankings")
async def get_student_rankings(current_user: dict = Depends(get_current_user)):
    sample_students = [
        {"rank": 1, "name": "Karthik M", "usn": "4KV21CS018", "department": "CSE", "semester": 6, "section": "A", "cgpa": 9.42, "overall_score": 94.2},
        {"rank": 2, "name": "Sahana P", "usn": "4KV21CS042", "department": "CSE", "semester": 6, "section": "A", "cgpa": 9.21, "overall_score": 92.1},
        {"rank": 3, "name": "Likith R", "usn": "4KV21EC027", "department": "ECE", "semester": 6, "section": "A", "cgpa": 9.13, "overall_score": 91.3},
        {"rank": 4, "name": "Ananya B", "usn": "4KV21IS033", "department": "ISE", "semester": 6, "section": "B", "cgpa": 9.07, "overall_score": 90.7},
        {"rank": 5, "name": "Vivek S", "usn": "4KV21ME021", "department": "ME", "semester": 6, "section": "A", "cgpa": 8.96, "overall_score": 89.6},
        {"rank": 6, "name": "Rohan K", "usn": "4KV21CS110", "department": "CSE", "semester": 6, "section": "B", "cgpa": 8.82, "overall_score": 88.2},
        {"rank": 7, "name": "Prajwal B", "usn": "4KV21EC056", "department": "ECE", "semester": 6, "section": "A", "cgpa": 8.75, "overall_score": 87.5},
        {"rank": 8, "name": "Nikhil M", "usn": "4KV21ME045", "department": "ME", "semester": 6, "section": "B", "cgpa": 8.68, "overall_score": 86.8},
        {"rank": 9, "name": "Arjun U", "usn": "4KV21CS128", "department": "CSE", "semester": 6, "section": "A", "cgpa": 8.52, "overall_score": 85.2},
        {"rank": 10, "name": "Deepika N", "usn": "4KV21IS059", "department": "ISE", "semester": 6, "section": "B", "cgpa": 8.47, "overall_score": 84.7},
    ]
    return {
        "success": True,
        "total": 1200,
        "data": sample_students
    }
