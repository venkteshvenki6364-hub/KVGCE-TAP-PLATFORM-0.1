# KVGCE TAP — Database Schema Documentation

## Database Collections

### 1. `users` Collection
```json
{
  "_id": "ObjectId / UUID String",
  "email": "student@kvgce.edu.in",
  "full_name": "Student User",
  "role": "student",
  "department": "Computer Science & Engineering",
  "student_id": "4KV21CS042",
  "phone": "+91 9876543210",
  "hashed_password": "bcrypt_hash_string",
  "is_active": true,
  "created_at": "2026-08-13T10:00:00Z"
}
```

### 2. `departments` Collection
```json
{
  "_id": "dept-1",
  "name": "Computer Science & Engineering",
  "code": "CSE",
  "hod": "Dr. K. V. Gururaja"
}
```

### 3. `assessments` Collection
```json
{
  "_id": "assess-1",
  "title": "National Aptitude Assessment 2026",
  "category": "Aptitude",
  "duration_minutes": 30,
  "total_marks": 20,
  "is_published": true,
  "questions": [
    {
      "id": "q1",
      "question": "A train 240 m long passes a pole in 24 seconds...",
      "options": ["65 sec", "89 sec", "100 sec", "150 sec"],
      "correct_answer": 1,
      "explanation": "Speed = 240/24 = 10 m/s..."
    }
  ]
}
```

### 4. `activities` Collection
```json
{
  "_id": "act-1",
  "title": "VTU Hackathon 2026",
  "category": "Hackathon",
  "student_email": "student@kvgce.edu.in",
  "organizer": "VTU Belagavi",
  "status": "Verified",
  "points": 50
}
```
