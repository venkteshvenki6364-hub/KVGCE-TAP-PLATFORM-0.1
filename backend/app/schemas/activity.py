from pydantic import BaseModel
from typing import Optional

class ActivitySubmit(BaseModel):
    title: str
    category: str # Workshop, Seminar, Hackathon, Internship, Certification, Project, Competition, Sports, Club Activity, Technical Event
    description: str
    date: str
    organizer: str
    points: Optional[int] = 10
    certificate_url: Optional[str] = None

class CertificateSubmit(BaseModel):
    title: str
    organization: str
    issue_date: str
    credential_id: Optional[str] = None
    credential_url: Optional[str] = None

class FeedbackSubmit(BaseModel):
    student_email: str
    category: str
    feedback: str
    rating: int # 1 to 5
    recommendation: Optional[str] = None
