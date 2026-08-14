from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.routes.auth import get_current_user
from app.database import get_db_collection
from app.ai.recommendation_service import generate_student_ai_analysis

router = APIRouter(prefix="/ai", tags=["AI Career Assistant"])

class AIChatRequest(BaseModel):
    message: str

@router.post("/chat")
async def ai_chat_assistant(
    req: AIChatRequest,
    current_user: dict = Depends(get_current_user)
):
    msg = req.message.lower().strip()
    student_name = current_user.get("full_name", "Student")
    dept = current_user.get("department", "Engineering")

    if "python" in msg or "interview" in msg:
        reply = f"Hello {student_name}! For Python technical interviews in {dept}, focus on data structures (lists vs tuples, dict performance), decorators, generators, list comprehensions, and memory management. Here is a sample question: *Explain GIL (Global Interpreter Lock) in Python and how to bypass it for multi-core parallelism.*"
    elif "aptitude" in msg or "quantitative" in msg:
        reply = f"Hi {student_name}! To excel in Aptitude rounds, practice Speed-Distance-Time, Permutation & Combination, Syllogisms, and Data Interpretation. Practice taking 30-minute timed quizzes under the Aptitude section."
    elif "placement" in msg or "readiness" in msg or "prepare" in msg:
        reply = f"Based on your profile, your placement readiness is strong! Work on building 2 full-stack projects using React & FastAPI, participate in hackathons, and keep your GitHub repository updated with documented READMEs."
    elif "weak" in msg or "improve" in msg:
        reply = f"Looking at your score analytics: your SQL and DBMS knowledge could use a quick refresher. Focus on practicing complex queries involving GROUP BY, HAVING, and subqueries."
    else:
        reply = f"Hello {student_name}! I am your KVGCE TAP AI Career Assistant. I can help you prepare for campus placement drives, recommend target learning topics, evaluate your weak technical areas, or provide curated interview questions."

    return {
        "success": True,
        "reply": reply
    }

@router.get("/student-analysis")
async def get_ai_student_analysis(current_user: dict = Depends(get_current_user)):
    attempts_col = get_db_collection("quiz_attempts")
    activities_col = get_db_collection("activities")

    attempts = await attempts_col.find({"student_email": current_user["email"]})
    activities = await activities_col.find({"student_email": current_user["email"]})

    analysis = generate_student_ai_analysis(current_user, attempts, activities)

    return {
        "success": True,
        "data": analysis
    }
