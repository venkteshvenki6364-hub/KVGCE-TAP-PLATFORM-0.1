from fastapi import APIRouter, Depends, HTTPException, status
from typing import Optional
import uuid
from datetime import datetime
from app.routes.auth import get_current_user, require_role
from app.database import get_db_collection
from app.schemas.assessment import AssessmentCreate, QuizAttemptSubmit, CodingSubmissionSubmit

router = APIRouter(prefix="/assessments", tags=["Assessments"])

@router.get("")
async def list_assessments(
    category: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    assessments_col = get_db_collection("assessments")
    query = {"is_published": True} if current_user.get("role") == "student" else {}
    if category:
        query["category"] = category
    
    items = await assessments_col.find(query)
    return {
        "success": True,
        "data": items
    }

@router.post("")
async def create_assessment(
    assessment_in: AssessmentCreate,
    current_user: dict = Depends(require_role(["faculty", "admin"]))
):
    assessments_col = get_db_collection("assessments")
    doc = assessment_in.model_dump()
    doc["_id"] = str(uuid.uuid4())
    doc["created_by"] = current_user["email"]
    doc["created_at"] = datetime.utcnow().isoformat()
    
    await assessments_col.insert_one(doc)
    return {
        "success": True,
        "message": "Assessment created successfully",
        "data": doc
    }

@router.get("/{id}")
async def get_assessment_by_id(
    id: str,
    current_user: dict = Depends(get_current_user)
):
    assessments_col = get_db_collection("assessments")
    item = await assessments_col.find_one({"_id": id})
    if not item:
        raise HTTPException(status_code=404, detail="Assessment not found.")
    return {
        "success": True,
        "data": item
    }

@router.put("/{id}")
async def update_assessment(
    id: str,
    assessment_in: AssessmentCreate,
    current_user: dict = Depends(require_role(["faculty", "admin"]))
):
    assessments_col = get_db_collection("assessments")
    item = await assessments_col.find_one({"_id": id})
    if not item:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    update_doc = assessment_in.model_dump()
    await assessments_col.update_one({"_id": id}, {"$set": update_doc})
    return {
        "success": True,
        "message": "Assessment updated successfully"
    }

@router.delete("/{id}")
async def delete_assessment(
    id: str,
    current_user: dict = Depends(require_role(["faculty", "admin"]))
):
    assessments_col = get_db_collection("assessments")
    await assessments_col.delete_one({"_id": id})
    return {
        "success": True,
        "message": "Assessment deleted successfully"
    }

@router.post("/{id}/attempt")
async def submit_quiz_attempt(
    id: str,
    attempt_in: QuizAttemptSubmit,
    current_user: dict = Depends(require_role(["student", "admin"]))
):
    assessments_col = get_db_collection("assessments")
    attempts_col = get_db_collection("quiz_attempts")
    
    assessment = await assessments_col.find_one({"_id": id})
    if not assessment:
        raise HTTPException(status_code=404, detail="Assessment not found.")

    questions = assessment.get("questions", [])
    total_questions = len(questions)
    correct_count = 0
    wrong_count = 0
    unanswered_count = 0

    for idx, q in enumerate(questions):
        idx_str = str(idx)
        if idx_str in attempt_in.answers:
            chosen = attempt_in.answers[idx_str]
            if chosen == q.get("correct_answer"):
                correct_count += 1
            else:
                wrong_count += 1
        else:
            unanswered_count += 1

    score = correct_count * 1 # Assuming 1 mark per question
    total_marks = total_questions or 1
    percentage = round((correct_count / total_marks) * 100, 1)

    attempt_doc = {
        "_id": str(uuid.uuid4()),
        "assessment_id": id,
        "assessment_title": assessment.get("title"),
        "category": assessment.get("category"),
        "student_email": current_user["email"],
        "student_name": current_user.get("full_name"),
        "total_questions": total_questions,
        "correct_answers": correct_count,
        "wrong_answers": wrong_count,
        "unanswered": unanswered_count,
        "score": score,
        "total_marks": total_marks,
        "percentage": percentage,
        "time_taken_seconds": attempt_in.time_taken_seconds,
        "submitted_at": datetime.utcnow().isoformat()
    }

    await attempts_col.insert_one(attempt_doc)

    return {
        "success": True,
        "message": "Quiz attempt evaluated successfully",
        "data": attempt_doc
    }

@router.post("/coding/submit")
async def submit_coding_solution(
    sub_in: CodingSubmissionSubmit,
    current_user: dict = Depends(require_role(["student", "admin"]))
):
    coding_col = get_db_collection("coding_attempts")
    
    # Static sandbox logic simulation
    code_length = len(sub_in.code.strip())
    score = 100 if code_length > 30 else 50
    status_str = "Accepted" if score == 100 else "Wrong Answer"

    submission = {
        "_id": str(uuid.uuid4()),
        "problem_title": sub_in.problem_title,
        "student_email": current_user["email"],
        "language": sub_in.language,
        "code": sub_in.code,
        "status": status_str,
        "score": score,
        "testcases_passed": "5/5" if score == 100 else "2/5",
        "runtime": "12ms",
        "memory": "14.2 MB",
        "submitted_at": datetime.utcnow().isoformat()
    }

    await coding_col.insert_one(submission)

    return {
        "success": True,
        "message": f"Coding submission evaluated: {status_str}",
        "data": submission
    }
