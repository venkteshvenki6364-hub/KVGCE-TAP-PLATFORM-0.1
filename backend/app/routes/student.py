import base64
import random
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
        {"$set": {
            "activity_dates": activity_dates, 
            "signup_date": signup_date, 
            "score_history": score_history,
            "githubUrl": user_doc.get("githubUrl") or user_doc.get("github") or "",
            "linkedinUrl": user_doc.get("linkedinUrl") or user_doc.get("linkedin") or "",
            "portfolioUrl": user_doc.get("portfolioUrl") or user_doc.get("portfolio") or "",
            "github": user_doc.get("githubUrl") or user_doc.get("github") or "",
            "linkedin": user_doc.get("linkedinUrl") or user_doc.get("linkedin") or "",
            "portfolio": user_doc.get("portfolioUrl") or user_doc.get("portfolio") or ""
        }}
    )
    user_doc["activity_dates"] = activity_dates
    user_doc["signup_date"] = signup_date
    user_doc["score_history"] = score_history
    user_doc["githubUrl"] = user_doc.get("githubUrl") or user_doc.get("github") or ""
    user_doc["linkedinUrl"] = user_doc.get("linkedinUrl") or user_doc.get("linkedin") or ""
    user_doc["portfolioUrl"] = user_doc.get("portfolioUrl") or user_doc.get("portfolio") or ""
    user_doc["github"] = user_doc["githubUrl"]
    user_doc["linkedin"] = user_doc["linkedinUrl"]
    user_doc["portfolio"] = user_doc["portfolioUrl"]
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

def process_and_compute_academics_python(academics: dict) -> dict:
    """
    Python server-side calculation logic for Student Academics:
    1. Validates total_marks and obtained_marks are strictly numeric.
    2. Calculates percentage for SSLC, PUC, and each B.E. semester.
    3. Computes cumulative SGPA/CGPA and overall B.E. statistics.
    """
    if not isinstance(academics, dict):
        return academics

    # Process SSLC
    sslc = academics.get("sslc", {})
    if isinstance(sslc, dict):
        try:
            tot = float(sslc.get("totalMarks") or sslc.get("total_marks") or 625)
        except (ValueError, TypeError):
            tot = 625.0
        try:
            obt = float(sslc.get("obtainedMarks") or sslc.get("obtained_marks") or 0)
        except (ValueError, TypeError):
            obt = 0.0
        
        tot = max(1.0, tot)
        obt = max(0.0, min(tot, obt))
        sslc["totalMarks"] = tot
        sslc["obtainedMarks"] = obt
        sslc["score"] = f"{round((obt / tot) * 100, 2):.2f}%"
        academics["sslc"] = sslc

    # Process PUC
    puc = academics.get("puc", {})
    if isinstance(puc, dict):
        try:
            tot = float(puc.get("totalMarks") or puc.get("total_marks") or 600)
        except (ValueError, TypeError):
            tot = 600.0
        try:
            obt = float(puc.get("obtainedMarks") or puc.get("obtained_marks") or 0)
        except (ValueError, TypeError):
            obt = 0.0

        tot = max(1.0, tot)
        obt = max(0.0, min(tot, obt))
        puc["totalMarks"] = tot
        puc["obtainedMarks"] = obt
        puc["score"] = f"{round((obt / tot) * 100, 2):.2f}%"
        academics["puc"] = puc

    # Process B.E. Semesters
    be_sems = academics.get("beSemesters", [])
    if isinstance(be_sems, list):
        import re
        sem_ordinals = {1: "1st Semester", 2: "2nd Semester", 3: "3rd Semester", 4: "4th Semester", 5: "5th Semester", 6: "6th Semester", 7: "7th Semester", 8: "8th Semester"}

        def _get_sem_num(s_dict):
            if not isinstance(s_dict, dict):
                return 99
            if isinstance(s_dict.get("semNumber"), int) and 1 <= s_dict["semNumber"] <= 8:
                return s_dict["semNumber"]
            if isinstance(s_dict.get("sem_number"), int) and 1 <= s_dict["sem_number"] <= 8:
                return s_dict["sem_number"]
            m = re.search(r'\d+', str(s_dict.get("sem", "")))
            if m:
                n = int(m.group())
                if 1 <= n <= 8:
                    return n
            return 99

        # Deduplicate by sem_number and sort
        unique_sems_dict = {}
        for s in be_sems:
            if isinstance(s, dict):
                num = _get_sem_num(s)
                if num <= 8 and num not in unique_sems_dict:
                    unique_sems_dict[num] = s

        sorted_sem_nums = sorted(unique_sems_dict.keys())
        clean_sems = [unique_sems_dict[n] for n in sorted_sem_nums]

        processed_sems = []
        tot_be_marks = 0.0
        obt_be_marks = 0.0
        valid_sgpas = []
        running_sum = 0.0

        for idx, sem in enumerate(clean_sems):
            num = sorted_sem_nums[idx]
            try:
                t_marks = float(sem.get("totalMarks") or sem.get("total_marks") or 1000)
            except (ValueError, TypeError):
                t_marks = 1000.0
            
            try:
                sgpa_val = float(sem.get("sgpa") or 8.0)
            except (ValueError, TypeError):
                sgpa_val = 8.0
            sgpa_val = max(0.0, min(10.0, sgpa_val))

            try:
                o_marks = float(sem.get("obtainedMarks") or sem.get("obtained_marks") or 0)
            except (ValueError, TypeError):
                o_marks = round(t_marks * (sgpa_val / 10.0), 2)
            
            if o_marks == 0 and sgpa_val > 0:
                o_marks = round(t_marks * (sgpa_val / 10.0), 2)

            t_marks = max(1.0, t_marks)
            o_marks = max(0.0, min(t_marks, o_marks))

            pct_str = f"{round((o_marks / t_marks) * 100, 2):.2f}%"
            tot_be_marks += t_marks
            obt_be_marks += o_marks
            
            valid_sgpas.append(sgpa_val)
            running_sum += sgpa_val
            cgpa_val = round(running_sum / len(valid_sgpas), 2)

            sem["semNumber"] = num
            sem["sem_number"] = num
            sem["sem"] = sem_ordinals.get(num, sem.get("sem") or f"{num}th Semester")
            sem["totalMarks"] = t_marks
            sem["obtainedMarks"] = o_marks
            sem["percentage"] = pct_str
            sem["sgpa"] = f"{sgpa_val:.2f}"
            sem["cgpa"] = f"{cgpa_val:.2f}"
            processed_sems.append(sem)

        academics["beSemesters"] = processed_sems

        # Compute B.E. Summary
        be_summary = academics.get("beSummary", {})
        if not isinstance(be_summary, dict):
            be_summary = {}

        cgpa_final = round(sum(valid_sgpas) / len(valid_sgpas), 2) if valid_sgpas else 8.21
        overall_pct = f"{round((obt_be_marks / tot_be_marks) * 100, 2):.2f}%" if tot_be_marks > 0 else "0.00%"

        be_summary["cgpaTillNow"] = f"{cgpa_final:.2f}"
        be_summary["totalMarks"] = tot_be_marks
        be_summary["obtainedMarks"] = obt_be_marks
        be_summary["overallPercentage"] = overall_pct
        academics["beSummary"] = be_summary

    return academics

@router.put("/academics")
async def update_student_academics(
    academics_data: dict,
    current_user: dict = Depends(get_current_user)
):
    users_col = get_db_collection("users")
    computed_academics = process_and_compute_academics_python(academics_data)
    
    await users_col.update_one(
        {"email": current_user["email"]},
        {"$set": {"academics": computed_academics}}
    )
    
    updated_user = await users_col.find_one({"email": current_user["email"]})
    if updated_user:
        updated_user.pop("hashed_password", None)

    return {
        "success": True,
        "message": "Academic details updated and saved successfully",
        "data": computed_academics
    }

@router.put("/profile")
async def update_student_profile(
    profile_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    users_col = get_db_collection("users")
    update_dict = {k: v for k, v in profile_data.model_dump().items() if v is not None}
    
    if "academics" in update_dict and isinstance(update_dict["academics"], dict):
        update_dict["academics"] = process_and_compute_academics_python(update_dict["academics"])

    if "githubUrl" in update_dict and "github" not in update_dict:
        update_dict["github"] = update_dict["githubUrl"]
    elif "github" in update_dict and "githubUrl" not in update_dict:
        update_dict["githubUrl"] = update_dict["github"]

    if "linkedinUrl" in update_dict and "linkedin" not in update_dict:
        update_dict["linkedin"] = update_dict["linkedinUrl"]
    elif "linkedin" in update_dict and "linkedinUrl" not in update_dict:
        update_dict["linkedinUrl"] = update_dict["linkedin"]

    if "portfolioUrl" in update_dict and "portfolio" not in update_dict:
        update_dict["portfolio"] = update_dict["portfolioUrl"]
    elif "portfolio" in update_dict and "portfolioUrl" not in update_dict:
        update_dict["portfolioUrl"] = update_dict["portfolio"]

    if update_dict:
        await users_col.update_one({"email": current_user["email"]}, {"$set": update_dict})
    
    updated_user = await users_col.find_one({"email": current_user["email"]})
    if updated_user:
        updated_user["githubUrl"] = updated_user.get("githubUrl") or updated_user.get("github") or ""
        updated_user["linkedinUrl"] = updated_user.get("linkedinUrl") or updated_user.get("linkedin") or ""
        updated_user["portfolioUrl"] = updated_user.get("portfolioUrl") or updated_user.get("portfolio") or ""
        updated_user["github"] = updated_user["githubUrl"]
        updated_user["linkedin"] = updated_user["linkedinUrl"]
        updated_user["portfolio"] = updated_user["portfolioUrl"]
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

def sort_students_by_academic_performance(students: list) -> list:
    """
    Python logic for Student Academic Rankings:
    1st Preference: CGPA (Descending)
    2nd Preference: Total Credits (Descending)
    3rd Preference: Percentage (Descending)
    4th Preference: Total Marks (Descending)
    5th Preference: Alphabetical Order by Name (Ascending A-Z) if all above match
    """
    def get_sort_key(s):
        cgpa = float(s.get("cgpa") or s.get("beSummary", {}).get("cgpaTillNow") or 0.0)
        credits_val = float(s.get("total_credits") or s.get("totalCredits") or s.get("beSummary", {}).get("totalCredits") or 0.0)
        
        pct_raw = s.get("percentage") or s.get("overall_score") or s.get("beSummary", {}).get("overallPercentage") or 0.0
        if isinstance(pct_raw, str):
            pct_raw = pct_raw.replace("%", "").strip()
        try:
            pct_val = float(pct_raw)
        except (ValueError, TypeError):
            pct_val = 0.0

        marks_raw = s.get("total_marks") or s.get("obtained_marks") or s.get("beSummary", {}).get("obtainedMarks") or 0.0
        try:
            marks_val = float(marks_raw)
        except (ValueError, TypeError):
            marks_val = 0.0

        name_val = str(s.get("name") or s.get("full_name") or "").strip().lower()

        # Multi-level priority tuple sorting key
        return (-cgpa, -credits_val, -pct_val, -marks_val, name_val)

    sorted_list = sorted(students, key=get_sort_key)
    
    # Assign rank numbers
    for idx, student in enumerate(sorted_list, start=1):
        student["rank"] = idx
    
    return sorted_list

SAMPLE_ACADEMIC_STUDENTS = [
    { "name": "Karthik M", "usn": "4KV21CS018", "batch": 2025, "department": "CSE", "semester": 6, "section": "A", "cgpa": 9.42, "total_credits": 160, "percentage": 94.20, "academics": 9.42, "aptitude": 92.0, "technical": 95.0, "hr_interview": 90.0, "overall_performance": 92.8, "total_marks": 7536, "overall_score": "92.8%" },
    { "name": "Venkatesh V", "usn": "4KV21CS042", "batch": 2025, "department": "CSE", "semester": 6, "section": "A", "cgpa": 9.21, "total_credits": 160, "percentage": 92.10, "academics": 9.21, "aptitude": 90.0, "technical": 93.0, "hr_interview": 88.0, "overall_performance": 90.8, "total_marks": 7368, "overall_score": "90.8%" },
    { "name": "Sahana P", "usn": "4KV21CS043", "batch": 2025, "department": "CSE", "semester": 6, "section": "A", "cgpa": 9.21, "total_credits": 160, "percentage": 92.10, "academics": 9.21, "aptitude": 89.0, "technical": 91.5, "hr_interview": 89.0, "overall_performance": 90.4, "total_marks": 7368, "overall_score": "90.4%" },
    { "name": "Aanand S", "usn": "4KV21CS003", "batch": 2025, "department": "CSE", "semester": 6, "section": "A", "cgpa": 9.21, "total_credits": 155, "percentage": 92.10, "academics": 9.21, "aptitude": 88.0, "technical": 90.0, "hr_interview": 87.0, "overall_performance": 89.3, "total_marks": 7137, "overall_score": "89.3%" },
    { "name": "Likith R", "usn": "4KV21EC027", "batch": 2025, "department": "ECE", "semester": 6, "section": "A", "cgpa": 9.13, "total_credits": 160, "percentage": 91.50, "academics": 9.13, "aptitude": 87.5, "technical": 89.0, "hr_interview": 86.0, "overall_performance": 88.5, "total_marks": 7320, "overall_score": "88.5%" },
    { "name": "Chetan V", "usn": "4KV21CS030", "batch": 2025, "department": "CSE", "semester": 6, "section": "B", "cgpa": 9.13, "total_credits": 160, "percentage": 91.30, "academics": 9.13, "aptitude": 86.0, "technical": 88.5, "hr_interview": 85.0, "overall_performance": 87.7, "total_marks": 7310, "overall_score": "87.7%" },
    { "name": "Abhay N", "usn": "4KV21IS002", "batch": 2025, "department": "ISE", "semester": 6, "section": "A", "cgpa": 9.13, "total_credits": 160, "percentage": 91.30, "academics": 9.13, "aptitude": 85.5, "technical": 87.0, "hr_interview": 86.5, "overall_performance": 87.6, "total_marks": 7304, "overall_score": "87.6%" },
    { "name": "Bhavana K", "usn": "4KV21EC015", "batch": 2025, "department": "ECE", "semester": 6, "section": "B", "cgpa": 9.13, "total_credits": 160, "percentage": 91.30, "academics": 9.13, "aptitude": 86.5, "technical": 86.0, "hr_interview": 84.0, "overall_performance": 87.0, "total_marks": 7304, "overall_score": "87.0%" },
    { "name": "Ananya B", "usn": "4KV21IS033", "batch": 2025, "department": "ISE", "semester": 6, "section": "B", "cgpa": 9.07, "total_credits": 160, "percentage": 90.70, "academics": 9.07, "aptitude": 84.0, "technical": 86.5, "hr_interview": 85.0, "overall_performance": 86.6, "total_marks": 7256, "overall_score": "86.6%" },
    { "name": "Anish K", "usn": "4KV21CS008", "batch": 2025, "department": "CSE", "semester": 6, "section": "A", "cgpa": 8.95, "total_credits": 160, "percentage": 89.50, "academics": 8.95, "aptitude": 85.0, "technical": 84.0, "hr_interview": 83.0, "overall_performance": 85.4, "total_marks": 7160, "overall_score": "85.4%" },
    { "name": "Vivek S", "usn": "4KV21ME021", "batch": 2025, "department": "ME", "semester": 6, "section": "A", "cgpa": 8.96, "total_credits": 160, "percentage": 89.60, "academics": 8.96, "aptitude": 83.0, "technical": 85.0, "hr_interview": 82.0, "overall_performance": 84.9, "total_marks": 7168, "overall_score": "84.9%" },
    { "name": "Rohan K", "usn": "4KV21CS110", "batch": 2025, "department": "CSE", "semester": 6, "section": "B", "cgpa": 8.82, "total_credits": 160, "percentage": 88.20, "academics": 8.82, "aptitude": 82.0, "technical": 83.5, "hr_interview": 81.0, "overall_performance": 83.7, "total_marks": 7056, "overall_score": "83.7%" },
    { "name": "Prajwal B", "usn": "4KV21EC056", "batch": 2025, "department": "ECE", "semester": 6, "section": "A", "cgpa": 8.75, "total_credits": 160, "percentage": 87.50, "academics": 8.75, "aptitude": 81.0, "technical": 82.0, "hr_interview": 80.0, "overall_performance": 82.6, "total_marks": 7000, "overall_score": "82.6%" },
    { "name": "Nikhil M", "usn": "4KV21ME045", "batch": 2025, "department": "ME", "semester": 6, "section": "B", "cgpa": 8.68, "total_credits": 160, "percentage": 86.80, "academics": 8.68, "aptitude": 80.0, "technical": 81.0, "hr_interview": 79.0, "overall_performance": 81.7, "total_marks": 6944, "overall_score": "81.7%" },
    { "name": "Arjun U", "usn": "4KV21CS128", "batch": 2025, "department": "CSE", "semester": 6, "section": "A", "cgpa": 8.52, "total_credits": 160, "percentage": 85.20, "academics": 8.52, "aptitude": 79.0, "technical": 80.0, "hr_interview": 78.0, "overall_performance": 80.6, "total_marks": 6816, "overall_score": "80.6%" },
    { "name": "Deepika N", "usn": "4KV21IS059", "batch": 2025, "department": "ISE", "semester": 6, "section": "B", "cgpa": 8.47, "total_credits": 160, "percentage": 84.70, "academics": 8.47, "aptitude": 78.0, "technical": 79.0, "hr_interview": 77.0, "overall_performance": 79.7, "total_marks": 6776, "overall_score": "79.7%" }
]

@router.get("/rankings")
async def get_student_rankings(current_user: dict = Depends(get_current_user)):
    sorted_rankings = sort_students_by_academic_performance(SAMPLE_ACADEMIC_STUDENTS)
    return {
        "success": True,
        "total": len(sorted_rankings),
        "data": sorted_rankings
    }

@router.get("/academic-rankings")
async def get_student_academic_rankings(current_user: dict = Depends(get_current_user)):
    users_col = get_db_collection("users")
    db_students = []
    
    try:
        cursor = users_col.find({"role": "student"})
        db_users = await cursor.to_list(length=200)
        for u in db_users:
            acad = u.get("academics", {})
            be_sum = acad.get("beSummary", {}) if isinstance(acad, dict) else {}
            cgpa_val = float(be_sum.get("cgpaTillNow") or u.get("cgpa") or 8.50)
            credits_val = float(be_sum.get("totalCredits") or u.get("total_credits") or 160)
            
            pct_raw = be_sum.get("overallPercentage") or u.get("percentage") or "85.00%"
            if isinstance(pct_raw, str):
                pct_raw = pct_raw.replace("%", "").strip()
            pct_val = float(pct_raw) if pct_raw else 85.00
            
            marks_val = float(be_sum.get("obtainedMarks") or u.get("total_marks") or 6800)

            apt_val = float(u.get("aptitude_score") or u.get("aptitude") or 82.0)
            tech_val = float(u.get("technical_score") or u.get("technical") or 85.0)
            hr_val = float(u.get("hr_score") or u.get("hr_interview") or 80.0)
            overall_val = round((pct_val + apt_val + tech_val + hr_val) / 4.0, 1)
            batch_val = int(u.get("batch") or 2025)

            db_students.append({
                "name": u.get("full_name") or u.get("name") or "Student",
                "usn": u.get("student_id") or u.get("usn") or "4KV21CS000",
                "batch": batch_val,
                "department": u.get("department") or "CSE",
                "semester": u.get("semester") or 6,
                "section": u.get("section") or "A",
                "cgpa": cgpa_val,
                "total_credits": credits_val,
                "percentage": pct_val,
                "academics": cgpa_val,
                "aptitude": apt_val,
                "technical": tech_val,
                "hr_interview": hr_val,
                "overall_performance": overall_val,
                "total_marks": marks_val,
                "overall_score": f"{overall_val:.1f}%"
            })
    except Exception as e:
        print("Database query fallback for academic rankings:", e)

    # MERGE db_students with SAMPLE_ACADEMIC_STUDENTS (keeping unique USNs & names)
    existing_usns = {s["usn"] for s in db_students}
    existing_names = {s["name"].lower() for s in db_students}
    
    for sample in SAMPLE_ACADEMIC_STUDENTS:
        if sample["usn"] not in existing_usns and sample["name"].lower() not in existing_names:
            db_students.append(sample)

    sorted_rankings = sort_students_by_academic_performance(db_students)
    
    return {
        "success": True,
        "total": len(sorted_rankings),
        "data": sorted_rankings
    }

# ---------------------------------------------------------
# STUDENT PROJECTS CRUD & AUTOMATIC 8-DIGIT PROJECT ID
# ---------------------------------------------------------
async def generate_8_digit_project_id():
    projects_col = get_db_collection("projects")
    users_col = get_db_collection("users")
    
    existing_ids = set()
    try:
        cursor = projects_col.find({})
        async for doc in cursor:
            if doc.get("project_id"):
                existing_ids.add(str(doc["project_id"]))
            if doc.get("id"):
                existing_ids.add(str(doc["id"]))
    except Exception:
        pass

    try:
        users = await users_col.find({"role": "student"})
        for u in users:
            for p in u.get("projects", []):
                if isinstance(p, dict):
                    if p.get("project_id"):
                        existing_ids.add(str(p["project_id"]))
                    if p.get("id"):
                        existing_ids.add(str(p["id"]))
    except Exception:
        pass

    while True:
        pid = str(random.randint(10000000, 99999999))
        if pid not in existing_ids:
            return pid

@router.get("/projects")
async def get_student_projects(current_user: dict = Depends(get_current_user)):
    projects_col = get_db_collection("projects")
    user_email = current_user.get("email")
    student_id = current_user.get("student_id") or current_user.get("usn")

    projects = []
    try:
        cursor = projects_col.find({"$or": [{"student_email": user_email}, {"student_id": student_id}]})
        projects = await cursor.to_list(length=100)
    except Exception:
        pass

    if not projects:
        user_projs = current_user.get("projects", [])
        if isinstance(user_projs, list):
            projects = user_projs

    for p in projects:
        if not p.get("project_id"):
            p["project_id"] = str(p.get("id")) if p.get("id") and len(str(p.get("id"))) == 8 else await generate_8_digit_project_id()
        p["id"] = p["project_id"]

    return {
        "success": True,
        "data": projects
    }

@router.post("/projects")
async def create_student_project(
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    title = (payload.get("title") or payload.get("name") or "").strip()
    if not title:
        raise HTTPException(status_code=400, detail="Project title is required.")

    project_id = await generate_8_digit_project_id()
    
    project_doc = {
        "project_id": project_id,
        "id": project_id,
        "title": title,
        "description": (payload.get("description") or "").strip(),
        "techStack": payload.get("techStack") or [],
        "githubUrl": payload.get("githubUrl") or payload.get("github") or "",
        "hostedUrl": payload.get("hostedUrl") or payload.get("hosted") or "",
        "pptUrl": payload.get("pptUrl") or None,
        "pptName": payload.get("pptName") or None,
        "pdfUrl": payload.get("pdfUrl") or None,
        "pdfName": payload.get("pdfName") or None,
        "documentUrl": payload.get("documentUrl") or payload.get("pdfUrl") or payload.get("pptUrl") or None,
        "documentName": payload.get("documentName") or payload.get("pdfName") or payload.get("pptName") or None,
        "documentType": payload.get("documentType") or ("ppt" if payload.get("pptName") else "pdf" if payload.get("pdfName") else None),
        "student_id": current_user.get("student_id") or current_user.get("usn") or "4KV21CS042",
        "student_name": current_user.get("full_name") or "Student",
        "student_email": current_user["email"],
        "student_department": current_user.get("department") or "Computer Science Engineering",
        "status": "Pending",
        "marks": None,
        "faculty_id": None,
        "faculty_name": None,
        "created_at": "2026-10-02T14:30:00"
    }

    projects_col = get_db_collection("projects")
    users_col = get_db_collection("users")

    await projects_col.insert_one(project_doc.copy())

    # Sync to user profile
    user_doc = await users_col.find_one({"email": current_user["email"]})
    existing_projects = user_doc.get("projects", []) if user_doc and isinstance(user_doc.get("projects"), list) else []
    existing_projects.append(project_doc)
    await users_col.update_one({"email": current_user["email"]}, {"$set": {"projects": existing_projects}})

    return {
        "success": True,
        "message": "Project created successfully",
        "data": project_doc
    }

@router.put("/projects/{project_id}")
async def update_student_project(
    project_id: str,
    payload: dict,
    current_user: dict = Depends(get_current_user)
):
    projects_col = get_db_collection("projects")
    users_col = get_db_collection("users")

    # Verify ownership
    user_email = current_user["email"]
    student_id = current_user.get("student_id") or current_user.get("usn")

    proj = await projects_col.find_one({"$or": [{"project_id": project_id}, {"id": project_id}]})
    
    if proj and proj.get("student_email") and proj["student_email"] != user_email and proj.get("student_id") != student_id:
        raise HTTPException(status_code=403, detail="Unauthorized: You can only edit your own projects.")

    updated_fields = {
        "title": (payload.get("title") or payload.get("name") or proj.get("title") if proj else "Project").strip(),
        "description": (payload.get("description") if payload.get("description") is not None else (proj.get("description") if proj else "")).strip(),
        "techStack": payload.get("techStack") if payload.get("techStack") is not None else (proj.get("techStack") if proj else []),
        "githubUrl": payload.get("githubUrl") if payload.get("githubUrl") is not None else (proj.get("githubUrl") if proj else ""),
        "hostedUrl": payload.get("hostedUrl") if payload.get("hostedUrl") is not None else (proj.get("hostedUrl") if proj else ""),
        "pptUrl": payload.get("pptUrl") if payload.get("pptUrl") is not None else (proj.get("pptUrl") if proj else None),
        "pptName": payload.get("pptName") if payload.get("pptName") is not None else (proj.get("pptName") if proj else None),
        "pdfUrl": payload.get("pdfUrl") if payload.get("pdfUrl") is not None else (proj.get("pdfUrl") if proj else None),
        "pdfName": payload.get("pdfName") if payload.get("pdfName") is not None else (proj.get("pdfName") if proj else None),
        "project_id": project_id, # PRESERVE ID
        "id": project_id # PRESERVE ID
    }

    if proj:
        await projects_col.update_one({"$or": [{"project_id": project_id}, {"id": project_id}]}, {"$set": updated_fields})
    else:
        # Create doc if missing in projects_col
        updated_fields.update({
            "student_id": student_id or "4KV21CS042",
            "student_name": current_user.get("full_name") or "Student",
            "student_email": user_email,
            "student_department": current_user.get("department") or "CSE",
            "status": "Pending",
            "marks": None,
            "faculty_id": None,
            "faculty_name": None
        })
        await projects_col.insert_one(updated_fields.copy())

    # Sync to user profile
    user_doc = await users_col.find_one({"email": user_email})
    if user_doc:
        existing_projects = user_doc.get("projects", [])
        if isinstance(existing_projects, list):
            updated_list = []
            found = False
            for p in existing_projects:
                p_id = str(p.get("project_id") or p.get("id"))
                if p_id == str(project_id):
                    merged = {**p, **updated_fields}
                    updated_list.append(merged)
                    found = True
                else:
                    updated_list.append(p)
            if not found:
                updated_list.append(updated_fields)
            await users_col.update_one({"email": user_email}, {"$set": {"projects": updated_list}})

    return {
        "success": True,
        "message": "Project updated successfully",
        "data": updated_fields
    }

@router.delete("/projects/{project_id}")
async def delete_student_project(
    project_id: str,
    current_user: dict = Depends(get_current_user)
):
    projects_col = get_db_collection("projects")
    users_col = get_db_collection("users")
    user_email = current_user["email"]

    proj = await projects_col.find_one({"$or": [{"project_id": project_id}, {"id": project_id}]})
    if proj and proj.get("student_email") and proj["student_email"] != user_email:
        raise HTTPException(status_code=403, detail="Unauthorized: You can only delete your own projects.")

    await projects_col.delete_one({"$or": [{"project_id": project_id}, {"id": project_id}]})

    user_doc = await users_col.find_one({"email": user_email})
    if user_doc:
        existing_projects = user_doc.get("projects", [])
        if isinstance(existing_projects, list):
            filtered = [p for p in existing_projects if str(p.get("project_id") or p.get("id")) != str(project_id)]
            await users_col.update_one({"email": user_email}, {"$set": {"projects": filtered}})

    return {
        "success": True,
        "message": "Project deleted successfully"
    }


