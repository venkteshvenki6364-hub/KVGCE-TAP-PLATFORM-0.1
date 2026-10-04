from pydantic import BaseModel
from typing import Optional, List, Any, Dict

class QuestionSchema(BaseModel):
    id: Optional[Any] = None
    question: str
    options: List[Any]
    correct_answer: Optional[Any] = 0 # Index or string
    explanation: Optional[str] = ""
    difficulty: Optional[str] = "Medium" # Easy, Medium, Hard
    category: Optional[str] = "Technical" # Aptitude, Technical, Coding
    topic: Optional[str] = "General"
    type: Optional[str] = "MCQ (Single Correct)"
    marks: int = 1

class AssessmentCreate(BaseModel):
    title: str
    description: Optional[str] = "Assessment Created by Faculty / Admin"
    category: str # Aptitude, Technical, Coding
    department: Optional[str] = "All"
    duration_minutes: int = 30
    total_marks: int = 20
    pass_marks: int = 10
    questions: List[QuestionSchema] = []
    is_published: bool = True

class CodingProblemCreate(BaseModel):
    title: str
    difficulty: str = "Easy" # Easy, Medium, Hard
    category: Optional[str] = "Data Structures"
    description: str
    inputFormat: Optional[str] = "Standard Input"
    outputFormat: Optional[str] = "Standard Output"
    constraints: Optional[str] = ""
    exampleInput: Optional[str] = ""
    exampleOutput: Optional[str] = ""
    starterCode: Optional[Dict[str, str]] = {}
    testCases: Optional[List[Dict[str, str]]] = []
    is_published: bool = True

class QuizAttemptSubmit(BaseModel):
    assessment_id: Optional[str] = None
    answers: dict # {question_index: chosen_option_index}
    time_taken_seconds: int = 0
    camera_verified: Optional[bool] = True
    malpractice_strikes: Optional[int] = 0

class CodingSubmissionSubmit(BaseModel):
    problem_title: str
    language: str
    code: str
    stdin_input: Optional[str] = ""

