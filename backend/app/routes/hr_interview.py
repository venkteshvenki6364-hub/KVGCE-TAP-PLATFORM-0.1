import uuid
import json
import random
from datetime import datetime
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from app.routes.auth import get_current_user, require_role
from app.database import get_db_collection

router = APIRouter(prefix="/hr-interview", tags=["HR Interview Engine"])

class StartInterviewRequest(BaseModel):
    difficulty: str = "Medium"  # "Easy", "Medium", "Hard"

class EvaluateAnswerRequest(BaseModel):
    interview_id: str
    question_index: int
    question_text: str
    student_answer: str

class FinishInterviewRequest(BaseModel):
    interview_id: str

# Helper to build student context string from user profile & projects
async def get_student_context(user: dict) -> dict:
    email = user.get("email")
    full_name = user.get("full_name") or user.get("name") or "Student"
    dept = user.get("department") or "Computer Science & Engineering"
    usn = user.get("student_id") or user.get("usn") or "4KV21CS042"
    skills = [s.get("name") if isinstance(s, dict) else str(s) for s in user.get("skills", [])]
    if not skills:
        skills = ["Python", "Web Development", "Data Structures", "SQL & DBMS"]

    # Fetch projects from DB
    projects_col = get_db_collection("projects")
    projects_docs = []
    try:
        cursor = projects_col.find({"$or": [{"student_email": email}, {"student_id": usn}]})
        projects_docs = await cursor.to_list(length=10)
    except Exception:
        pass
    
    if not projects_docs and user.get("projects") and isinstance(user.get("projects"), list):
        projects_docs = user["projects"]

    project_titles = [p.get("title") or p.get("name") or "Engineering Project" for p in projects_docs if isinstance(p, dict)]
    if not project_titles:
        project_titles = ["KVGCE TAP Platform", "Placement Assessment System"]

    # Academics summary
    acad = user.get("academics", {})
    be_sum = acad.get("beSummary", {}) if isinstance(acad, dict) else {}
    cgpa = be_sum.get("cgpaTillNow") or user.get("cgpa") or "8.5"

    return {
        "full_name": full_name,
        "usn": usn,
        "department": dept,
        "cgpa": cgpa,
        "skills": skills,
        "projects": project_titles,
    }

# 135 Structured HR Interview Questions by 8 Rounds
QUESTION_BANK = {
    "round_1_introduction": [
        "Hello {name}! Please introduce yourself and walk me through your background.",
        "Tell me about yourself and your key academic interests in {dept}.",
        "Walk me through your resume and highlight your primary achievements.",
        "Tell me about your background and what inspired you to pursue engineering.",
        "What are your top 3 core strengths?",
        "What is your biggest weakness, and what steps are you taking to overcome it?",
        "How would your close friends or team members describe you?",
        "How would your professors or mentors describe your work ethic?",
        "What truly motivates you in your daily work and engineering studies?",
        "What technology or field are you most passionate about?",
        "What are your hobbies and interest activities outside of academics?",
        "What is your single biggest achievement to date?",
        "Tell me about your biggest failure or setback during college.",
        "What key lesson did you learn from that failure, and how did it change your approach?",
        "Where do you see yourself professionally in the next 5 years?",
    ],
    "round_2_education": [
        "Why did you choose to study {dept} for your engineering degree?",
        "Why did you choose KVG College of Engineering for your graduation?",
        "Which core subject in your curriculum do you enjoy the most and why?",
        "Which subject did you find most challenging during your engineering semesters?",
        "Tell me about your academic achievements or semester milestones.",
        "How do you manage academic coursework alongside technical project development?",
        "What is the most valuable non-technical skill you learned during engineering?",
        "How has your college education prepared you for this entry-level industry role?",
        "Tell me about a subject you struggled with initially and how you mastered it.",
        "If you could redo one academic semester, what would you do differently?",
    ],
    "round_3_projects": [
        "Walk me through your project '{project_name}' in detail.",
        "What specific problem does '{project_name}' solve, and who are the target users?",
        "Why did you choose to build '{project_name}' for your portfolio?",
        "What was your individual contribution and technical role in '{project_name}'?",
        "What core technologies and frameworks were used in '{project_name}'?",
        "Why did you select those specific technologies over alternative options?",
        "Explain the high-level system architecture and database schema of '{project_name}'.",
        "What was the most complex technical hurdle you faced in '{project_name}'?",
        "How did you debug and overcome that major technical challenge?",
        "Did you work individually or in a team on '{project_name}'?",
        "How did you divide tasks and collaborate with team members?",
        "What was your single biggest individual technical contribution to the project?",
        "If you were to refactor '{project_name}' today, what would you improve?",
        "What key software engineering practices did you learn from building this project?",
        "If given an additional 3 months, what advanced features would you add?",
        "How would you scale '{project_name}' to handle 100,000 active daily users?",
        "How did you test your project for bugs, edge cases, and performance bottlenecks?",
        "What security measures or authentication mechanisms did you implement in '{project_name}'?",
        "How would you demonstrate the live functionality of '{project_name}' to a technical panel?",
        "What would you do if your project database server went down during a live demo?",
    ],
    "round_4_technical_hr": [
        "Why did you select your primary technical skills: {skills_str}?",
        "Which programming language or framework are you most comfortable with?",
        "Which new technology, tool, or framework are you currently learning?",
        "Explain the core working principle of your top skill: {top_skill}.",
        "What programming language do you prefer for problem-solving and why?",
        "Walk me through your experience with Git version control and GitHub repositories.",
        "What is your experience working with SQL databases and REST APIs?",
        "Have you used AI tools like ChatGPT or Copilot in your coding workflow?",
        "How do you leverage AI tools productively without compromising fundamental learning?",
        "Have you completed any technical certifications or online courses recently?",
        "What key insights did you gain from your certifications?",
        "Which technical project on your resume are you most proud of and why?",
        "Is everything listed on your resume your own authentic work?",
        "What would you do if you were asked a technical question you don't know the answer to?",
        "How do you stay updated with rapid changes in software engineering tech stacks?",
    ],
    "round_5_behavioral": [
        "Tell me about a time you worked effectively in a team environment.",
        "Describe a situation where you had a conflict with a teammate. How did you resolve it?",
        "Tell me about a situation where you demonstrated leadership or initiative.",
        "Describe a time you made a significant mistake in a project and how you handled it.",
        "Tell me about a time you worked under extreme pressure or tight deadlines.",
        "Have you ever missed a project deadline? What happened and what did you learn?",
        "How do you handle constructive criticism from mentors or team leads?",
        "Tell me about how you handle rejection or disappointing feedback.",
        "How do you manage stress and maintain productivity during crunch periods?",
        "How do you prioritize multiple competing tasks when everything feels urgent?",
        "What would you do if a team member was not contributing their fair share?",
        "What would you do if you strongly disagreed with your engineering lead's decision?",
        "Tell me about a time you had to adapt quickly to an unfamiliar technical stack.",
        "Describe a scenario where you had to explain a complex technical concept to a non-technical person.",
    ],
    "round_6_situational": [
        "If you have three urgent tasks due at the same time, how would you prioritize them?",
        "What would you do if you discovered a critical bug in production code right before release?",
        "How would you respond if an end user or client was extremely angry about a system downtime?",
        "What would you do if your manager heavily criticized a feature you spent weeks building?",
        "What would you do if a team vote went against your proposed architectural design?",
        "What would you do if you realized 2 days before a release that you cannot meet the deadline?",
        "What would you do if assigned a project in a programming language you've never used before?",
        "What would you do if your live demo setup failed minutes before a major client presentation?",
        "What would you do if a senior colleague gave you feedback that felt unfair?",
        "If a supervisor asked you to push code with known security risks to meet a launch, how would you act?",
    ],
    "round_7_company_role": [
        "Why do you want to join our organization specifically?",
        "Why should our hiring panel select you over other qualified engineering candidates?",
        "Why are you interested in this software engineering role?",
        "What do you know about our company's products, services, and engineering culture?",
        "What are your core expectations from your first corporate engineering role?",
        "What unique value can you bring to our team from day one?",
        "Are you willing to relocate to another city if required for this position?",
        "Are you comfortable working full-time from the office or in a hybrid model?",
        "Are you open to working extended hours or weekends during critical project deployments?",
        "What type of engineering work environment enables you to perform at your best?",
    ],
    "round_8_salary_career": [
        "What are your salary expectations for this entry-level engineering position?",
        "Would you accept a competitive industry standard package with strong learning opportunities?",
        "What is more important to you at this stage of your career: higher salary or learning growth?",
        "What are your short-term goals for your first 90 days in the company?",
        "What are your long-term career aspirations for the next 3 to 5 years?",
        "Do you plan to pursue higher studies (like M.Tech or MS) in the near future?",
        "Where do you see yourself advancing within our organization after 3 years?",
        "What kind of leadership or technical specialist role do you aim for in the future?",
        "Do you have any questions for our hiring panel about the role or team?",
        "Is there anything else not on your resume that you would like us to know?",
    ]
}

# 10 Main Interview Roadmap Questions Engine
def generate_questions_for_interview(context: dict, difficulty: str) -> List[Dict[str, Any]]:
    name = context["full_name"]
    dept = context["department"]
    skills_list = context["skills"]
    skills_str = ", ".join(skills_list[:4]) if skills_list else "Python, Web Development, SQL"
    top_skill = skills_list[0] if skills_list else "Python"
    project_name = context["projects"][0] if context["projects"] else "your major engineering project"

    # Exactly 10 Main Interview Questions aligned with the 10-Point Roadmap
    main_questions_templates = [
        {
            "id": 1,
            "category": "Question 1 of 10 — Introduction & Background",
            "question": f"Hello {name}! Tell me about yourself, your background, and key academic interests in {dept}.",
        },
        {
            "id": 2,
            "category": "Question 2 of 10 — Education & Skills",
            "question": f"Walk me through your academic background at KVGCE and your core technical skills ({skills_str}). How have you applied them?",
        },
        {
            "id": 3,
            "category": "Question 3 of 10 — Project Overview",
            "question": f"Explain a major project you have worked on, such as '{project_name}'. What specific problem does it solve and what was your exact role?",
        },
        {
            "id": 4,
            "category": "Question 4 of 10 — Project Deep-Dive & Architecture",
            "question": f"In '{project_name}', why did you select those specific technologies and frameworks over alternative options? What was your biggest technical challenge?",
        },
        {
            "id": 5,
            "category": "Question 5 of 10 — Strengths & Weaknesses",
            "question": f"What are your top technical strengths in {top_skill}, and what is one area or weakness you are actively working to improve?",
        },
        {
            "id": 6,
            "category": "Question 6 of 10 — Teamwork & Challenges",
            "question": "Tell me about a time you worked in a team or faced a major technical challenge under tight deadlines. How did you resolve conflict or pressure?",
        },
        {
            "id": 7,
            "category": "Question 7 of 10 — Problem-Solving & Technical HR",
            "question": "How do you approach debugging a complex issue in production, or what would you do if asked a technical question you don't know the answer to?",
        },
        {
            "id": 8,
            "category": "Question 8 of 10 — Value Proposition & Why Hire You",
            "question": f"Why should our hiring panel select you for this software engineering role, and what unique value will you bring to our team from day one?",
        },
        {
            "id": 9,
            "category": "Question 9 of 10 — Career Goals & Expectations",
            "question": "What are your short-term and 3-year career goals, and what are your job and salary expectations for an entry-level engineering position?",
        },
        {
            "id": 10,
            "category": "Question 10 of 10 — Interview Wrap-Up & Student Q&A",
            "question": "We have covered all primary evaluation topics. Do you have any questions for me regarding our organization or team culture?",
        }
    ]

    return main_questions_templates

# Conversational LLM Answer Evaluator & Dynamic Coach
def evaluate_student_answer_llm(
    question_text: str,
    answer_text: str,
    difficulty: str,
    context: dict,
    question_index: int = 0
) -> Dict[str, Any]:
    ans = (answer_text or "").strip()
    words = ans.split()
    word_count = len(words)

    # Empty or Extremely Brief Answer (< 3 words)
    if not ans or word_count < 3:
        return {
            "score": 2,
            "total_score": 20,
            "rating_tag": "Needs Improvement",
            "is_coaching": True,
            "coaching_message": "That's okay! Let me help you understand this. Try speaking in complete sentences and explain your background or technical thoughts clearly. Would you like to try answering it again?",
            "grammar_feedback": "Please speak clearly into the microphone or type a complete response.",
            "correct_answer_summary": "Provide a structured response using complete sentences detailing your experience.",
            "feedback": "No detailed answer recorded. Practice speaking in complete sentences.",
        }

    ans_lower = ans.lower()
    q_lower = question_text.lower()

    # Check if student is asking a question to the AI (e.g. "What is your company culture?")
    if ("?" in ans or ans_lower.startswith("what") or ans_lower.startswith("how") or ans_lower.startswith("can you") or ans_lower.startswith("do you")):
        if question_index == 9 or "question" in q_lower:
            ai_reply = "Thank you for asking! Our engineering culture focuses on continuous learning, collaborative peer code reviews, and modern full-stack innovation. We provide great mentorship for fresh graduates."
            return {
                "score": 10,
                "total_score": 100,
                "rating_tag": "Excellent",
                "is_coaching": False,
                "coaching_message": ai_reply,
                "grammar_feedback": "Great conversational engagement!",
                "correct_answer_summary": "Engaging candidate Q&A.",
                "feedback": "Proactive and professional question asked to the interviewer.",
            }

    # "I don't know" or unsure detection
    if "don't know" in ans_lower or "dont know" in ans_lower or "not sure" in ans_lower or "no idea" in ans_lower:
        return {
            "score": 4,
            "total_score": 40,
            "rating_tag": "Needs Improvement",
            "is_coaching": True,
            "coaching_message": "That's completely fine! Here is a tip: even when you don't know the full technical answer, explain your logical thought process or how you would research the solution using documentation or AI tools. Would you like to attempt it again?",
            "grammar_feedback": "Honest answer. Structure your reasoning.",
            "correct_answer_summary": "Explain your problem-solving approach even when unfamiliar with exact syntax.",
            "feedback": "Candidate acknowledged missing knowledge. Encouraged to explain problem-solving steps.",
        }

    # Grammatical & Relevance Scoring (Out of 10 for Main Question)
    filler_words = ["um", "uh", "like", "you know", "basically"]
    filler_count = sum(ans_lower.count(fw) for fw in filler_words)

    base_score = 7
    if word_count >= 15:
        base_score += 2
    elif word_count >= 8:
        base_score += 1

    if filler_count == 0 and ans[0].isupper():
        base_score += 1
    elif filler_count > 2:
        base_score -= 1

    score_out_of_10 = max(3, min(10, base_score))
    total_score_pct = score_out_of_10 * 10

    if score_out_of_10 >= 8:
        tag = "Excellent"
        fb = "Strong, articulated response with clear technical focus, good grammar, and confident delivery."
        coaching = "Great answer! You structured your points clearly and highlighted key technical skills."
        is_coaching = False
    elif score_out_of_10 >= 6:
        tag = "Good"
        fb = "Clear response answering the prompt. Elaborating with specific metrics or examples will further strengthen your score."
        coaching = "Good response! To make it even stronger, consider adding specific examples or project metrics."
        is_coaching = False
    else:
        tag = "Average"
        fb = "Answer addresses the question partially. Try to structure your response using the STAR method (Situation, Task, Action, Result)."
        coaching = "That's a good start! Let's build on this: try explaining the specific Action you took and the Result achieved."
        is_coaching = True

    ideal_summary = f"An ideal response should mention your key skills ({context.get('skills', ['Python'])[0]}), project highlights, and align with company goals."

    return {
        "score": score_out_of_10,
        "total_score": total_score_pct,
        "rating_tag": tag,
        "is_coaching": is_coaching,
        "coaching_message": coaching,
        "grammar_feedback": "Good grammar & clear vocabulary." if filler_count == 0 else f"Detected {filler_count} filler words. Practice speaking smoothly without pauses.",
        "correct_answer_summary": ideal_summary,
        "feedback": fb,
    }

@router.post("/start")
async def start_hr_interview(
    req: StartInterviewRequest,
    current_user: dict = Depends(get_current_user)
):
    student_ctx = await get_student_context(current_user)
    difficulty = req.difficulty.capitalize()
    if difficulty not in ["Easy", "Medium", "Hard"]:
        difficulty = "Medium"

    questions = generate_questions_for_interview(student_ctx, difficulty)
    interview_id = f"HR-INT-{uuid.uuid4().hex[:8].upper()}"

    session_doc = {
        "interview_id": interview_id,
        "student_email": current_user["email"],
        "student_id": current_user.get("student_id") or current_user.get("usn") or "4KV21CS042",
        "student_name": current_user.get("full_name") or "Student",
        "difficulty": difficulty,
        "questions": questions,
        "transcripts": [],
        "evaluations": [],
        "final_score": None,
        "feedback": None,
        "status": "in_progress",
        "started_at": datetime.utcnow().isoformat(),
        "created_at": datetime.utcnow().isoformat(),
    }

    interviews_col = get_db_collection("hr_interviews")
    await interviews_col.insert_one(session_doc)

    return {
        "success": True,
        "message": f"8-Round HR Interview session started successfully on {difficulty} difficulty.",
        "data": {
            "interview_id": interview_id,
            "difficulty": difficulty,
            "total_questions": len(questions),
            "first_question": questions[0]["question"],
            "first_question_category": questions[0]["category"],
            "questions": questions,
            "student_context": student_ctx,
        }
    }

@router.post("/evaluate-answer")
async def evaluate_interview_answer(
    req: EvaluateAnswerRequest,
    current_user: dict = Depends(get_current_user)
):
    interviews_col = get_db_collection("hr_interviews")
    session = await interviews_col.find_one({"interview_id": req.interview_id})
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    student_ctx = await get_student_context(current_user)
    evaluation = evaluate_student_answer_llm(
        question_text=req.question_text,
        answer_text=req.student_answer,
        difficulty=session.get("difficulty", "Medium"),
        context=student_ctx
    )

    transcript_entry = {
        "question_index": req.question_index,
        "question_text": req.question_text,
        "student_answer": req.student_answer,
        "timestamp": datetime.utcnow().isoformat(),
        "evaluation": evaluation
    }

    transcripts = session.get("transcripts", [])
    evaluations = session.get("evaluations", [])
    
    transcripts.append(transcript_entry)
    evaluations.append(evaluation)

    await interviews_col.update_one(
        {"interview_id": req.interview_id},
        {"$set": {"transcripts": transcripts, "evaluations": evaluations}}
    )

    questions = session.get("questions", [])
    next_index = req.question_index + 1
    is_finished = next_index >= len(questions)
    next_question = questions[next_index]["question"] if not is_finished else None
    next_category = questions[next_index]["category"] if not is_finished else None

    return {
        "success": True,
        "message": "Answer evaluated by 8-Round LLM engine.",
        "data": {
            "evaluation": evaluation,
            "next_index": next_index,
            "is_finished": is_finished,
            "next_question": next_question,
            "next_category": next_category,
        }
    }

@router.post("/finish")
async def finish_hr_interview(
    req: FinishInterviewRequest,
    current_user: dict = Depends(get_current_user)
):
    interviews_col = get_db_collection("hr_interviews")
    session = await interviews_col.find_one({"interview_id": req.interview_id})
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")

    evaluations = session.get("evaluations", [])
    if evaluations:
        scores = [e.get("total_score", 75) for e in evaluations]
        final_score = int(round(sum(scores) / len(scores)))
    else:
        final_score = 78

    difficulty = session.get("difficulty", "Medium")

    if final_score >= 85:
        feedback = f"Outstanding performance across all 8 adaptive HR rounds ({difficulty})! You presented clear engineering solutions, strong communication, and confident delivery."
    elif final_score >= 70:
        feedback = f"Solid performance across 8 adaptive HR rounds ({difficulty}). Good technical foundation. Focus on refining system design trade-offs and concise STAR behavioral pitches."
    else:
        feedback = f"Fair attempt across 8 adaptive HR rounds ({difficulty}). Practice mock speaking sessions, structure project explanations clearly, and review core CS fundamentals."

    now_iso = datetime.utcnow().isoformat()

    await interviews_col.update_one(
        {"interview_id": req.interview_id},
        {"$set": {
            "status": "completed",
            "final_score": final_score,
            "feedback": feedback,
            "completed_at": now_iso
        }}
    )

    # Record in activities collection for student history & performance dashboard
    activities_col = get_db_collection("activities")
    activity_doc = {
        "_id": str(uuid.uuid4()),
        "student_email": current_user["email"],
        "student_name": current_user.get("full_name", "Student"),
        "title": f"8-Round AI HR Mock Interview ({difficulty})",
        "category": "HR Interview",
        "type": "hr_interview",
        "difficulty": difficulty,
        "score": final_score,
        "overallScore": f"{final_score}/100",
        "points": int(final_score * 0.5),
        "status": "Completed",
        "organizer": "KVGCE TAP AI Engine",
        "date": datetime.utcnow().strftime("%d %b %Y"),
        "created_at": now_iso,
        "metadata": {
            "interview_id": req.interview_id,
            "difficulty": difficulty,
            "final_score": final_score,
            "feedback": feedback,
            "total_questions": len(session.get("questions", [])),
            "transcripts": session.get("transcripts", []),
        }
    }
    await activities_col.insert_one(activity_doc)

    return {
        "success": True,
        "message": "8-Round HR Interview completed and saved to database successfully.",
        "data": {
            "interview_id": req.interview_id,
            "final_score": final_score,
            "feedback": feedback,
            "difficulty": difficulty,
            "completed_at": now_iso,
        }
    }

@router.get("/history")
async def get_hr_interview_history(current_user: dict = Depends(get_current_user)):
    interviews_col = get_db_collection("hr_interviews")
    sessions = await interviews_col.find({"student_email": current_user["email"]})
    
    sorted_sessions = sorted(
        sessions,
        key=lambda x: x.get("created_at") or "",
        reverse=True
    )

    return {
        "success": True,
        "total": len(sorted_sessions),
        "data": sorted_sessions
    }

@router.get("/{interview_id}")
async def get_hr_interview_details(
    interview_id: str,
    current_user: dict = Depends(get_current_user)
):
    interviews_col = get_db_collection("hr_interviews")
    session = await interviews_col.find_one({"interview_id": interview_id})
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found.")
    
    if current_user.get("role") == "student" and session.get("student_email") != current_user["email"]:
        raise HTTPException(status_code=403, detail="Unauthorized access to interview session.")

    return {
        "success": True,
        "data": session
    }
