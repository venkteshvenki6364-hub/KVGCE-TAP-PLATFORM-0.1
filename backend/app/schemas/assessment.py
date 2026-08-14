from pydantic import BaseModel
from typing import Optional, List, Any

class QuestionSchema(BaseModel):
    id: Optional[str] = None
    question: str
    options: List[str]
    correct_answer: int # Index of correct option (0-3)
    explanation: Optional[str] = ""
    difficulty: Optional[str] = "Medium" # Easy, Medium, Hard
    category: Optional[str] = "Technical" # Aptitude, Technical, Coding
    topic: Optional[str] = "General"
    marks: int = 1

class AssessmentCreate(BaseModel):
    title: str
    description: str
    category: str # Aptitude, Technical Quiz, Coding
    department: Optional[str] = "All"
    duration_minutes: int = 30
    total_marks: int = 20
    pass_marks: int = 10
    questions: List[QuestionSchema] = []
    is_published: bool = True

class QuizAttemptSubmit(BaseModel):
    assessment_id: str
    answers: dict # {question_index: chosen_option_index}
    time_taken_seconds: int

class CodingSubmissionSubmit(BaseModel):
    problem_title: str
    language: str
    code: str
