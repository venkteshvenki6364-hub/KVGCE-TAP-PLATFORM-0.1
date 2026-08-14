import asyncio
from app.database import db_manager
from app.utils.security import get_password_hash

async def seed_database():
    await db_manager.connect_to_database()
    
    users_col = db_manager.get_collection("users")
    dept_col = db_manager.get_collection("departments")
    skills_col = db_manager.get_collection("skills")
    assessments_col = db_manager.get_collection("assessments")
    activities_col = db_manager.get_collection("activities")
    notifications_col = db_manager.get_collection("notifications")

    # Clear existing if any
    for col in [users_col, dept_col, skills_col, assessments_col, activities_col, notifications_col]:
        if hasattr(col, "data"):
            col.data.clear()

    dev_password_hash = get_password_hash("Password123!")

    # 1. Seed Users
    seed_users = [
        {
            "_id": "user-admin-1",
            "email": "admin@kvgce.edu.in",
            "full_name": "Dr. K. V. Gowda",
            "role": "admin",
            "hashed_password": dev_password_hash,
            "department": "Administration",
            "phone": "+91 9845012345",
            "is_active": True,
            "created_at": "2026-01-10T10:00:00"
        },
        {
            "_id": "user-faculty-1",
            "email": "faculty@kvgce.edu.in",
            "full_name": "Prof. Suresh Kumar",
            "role": "faculty",
            "faculty_id": "KVG-FAC-102",
            "hashed_password": dev_password_hash,
            "department": "Computer Science & Engineering",
            "phone": "+91 9448123456",
            "is_active": True,
            "created_at": "2026-01-11T10:00:00"
        },
        {
            "_id": "user-student-1",
            "email": "student@kvgce.edu.in",
            "full_name": "Aditya Hegde",
            "role": "student",
            "student_id": "4KV21CS042",
            "hashed_password": dev_password_hash,
            "department": "Computer Science & Engineering",
            "course": "B.E. Computer Science & Engineering",
            "semester": 6,
            "year": 3,
            "phone": "+91 9741234567",
            "github": "https://github.com/aditya-kvgce",
            "linkedin": "https://linkedin.com/in/aditya-kvgce",
            "portfolio": "https://aditya.kvgce.dev",
            "is_active": True,
            "created_at": "2026-01-12T10:00:00",
            "skills": [
                {"name": "Python", "category": "Programming", "score": 85, "level": "Advanced", "percentage": 85},
                {"name": "React.js", "category": "Web Development", "score": 80, "level": "Advanced", "percentage": 80},
                {"name": "SQL & DBMS", "category": "Database", "score": 70, "level": "Intermediate", "percentage": 70},
                {"name": "Data Structures", "category": "Problem Solving", "score": 78, "level": "Advanced", "percentage": 78},
                {"name": "Quantitative Aptitude", "category": "Aptitude", "score": 82, "level": "Advanced", "percentage": 82},
                {"name": "Logical Reasoning", "category": "Aptitude", "score": 88, "level": "Advanced", "percentage": 88}
            ]
        }
    ]

    for user in seed_users:
        await users_col.insert_one(user)

    # 2. Seed Departments
    departments = [
        {"_id": "dept-1", "name": "Computer Science & Engineering", "code": "CSE", "head": "Dr. Ujwal K", "total_students": 240, "total_faculty": 18},
        {"_id": "dept-2", "name": "Information Science & Engineering", "code": "ISE", "head": "Prof. S. R. Bhat", "total_students": 180, "total_faculty": 14},
        {"_id": "dept-3", "name": "Electronics & Communication", "code": "ECE", "head": "Dr. Savitha Rani", "total_students": 200, "total_faculty": 16},
        {"_id": "dept-4", "name": "Mechanical Engineering", "code": "ME", "head": "Dr. H. N. Sharma", "total_students": 120, "total_faculty": 12},
        {"_id": "dept-5", "name": "Civil Engineering", "code": "CIV", "head": "Prof. Ramesh Rai", "total_students": 110, "total_faculty": 10}
    ]

    for dept in departments:
        await dept_col.insert_one(dept)

    # 3. Seed Assessments & Questions
    sample_assessments = [
        {
            "_id": "assess-1",
            "title": "National Aptitude & Logical Reasoning Benchmark",
            "category": "Aptitude",
            "description": "Comprehensive test assessing Quantitative Ability, Logical Reasoning, and Data Interpretation.",
            "duration_minutes": 30,
            "total_marks": 10,
            "pass_marks": 6,
            "is_published": True,
            "questions": [
                {
                    "id": "q1",
                    "question": "A train 240 m long passes a pole in 24 seconds. How long will it take to pass a platform 650 m long?",
                    "options": ["65 sec", "89 sec", "100 sec", "150 sec"],
                    "correct_answer": 1,
                    "explanation": "Speed = 240/24 = 10 m/s. Total distance = 240 + 650 = 890 m. Time = 890 / 10 = 89 seconds.",
                    "difficulty": "Medium",
                    "category": "Aptitude",
                    "topic": "Quantitative Aptitude",
                    "marks": 1
                },
                {
                    "id": "q2",
                    "question": "If CAT is coded as 3120, how is DOG coded in the same pattern?",
                    "options": ["4157", "41514", "41520", "3157"],
                    "correct_answer": 0,
                    "explanation": "Alphabet positions: C=3, A=1, T=20 -> 3120. D=4, O=15, G=7 -> 4157.",
                    "difficulty": "Easy",
                    "category": "Aptitude",
                    "topic": "Logical Reasoning",
                    "marks": 1
                }
            ]
        },
        {
            "_id": "assess-2",
            "title": "Core Technical Computer Science Assessment",
            "category": "Technical Quiz",
            "description": "Evaluation of Python, Data Structures, OOPs, DBMS, and Networking fundamentals.",
            "duration_minutes": 40,
            "total_marks": 10,
            "pass_marks": 6,
            "is_published": True,
            "questions": [
                {
                    "id": "q3",
                    "question": "What is the worst-case time complexity of QuickSort?",
                    "options": ["O(N log N)", "O(N^2)", "O(N)", "O(1)"],
                    "correct_answer": 1,
                    "explanation": "QuickSort worst-case time complexity is O(N^2) when the pivot selected is consistently the smallest or largest element.",
                    "difficulty": "Medium",
                    "category": "Technical",
                    "topic": "Data Structures",
                    "marks": 1
                },
                {
                    "id": "q4",
                    "question": "Which HTTP method is idempotent and used for resource updates?",
                    "options": ["POST", "PUT", "DELETE", "PATCH"],
                    "correct_answer": 1,
                    "explanation": "PUT is idempotent, meaning multiple identical requests have the same effect as a single request.",
                    "difficulty": "Easy",
                    "category": "Technical",
                    "topic": "Web Architecture",
                    "marks": 1
                }
            ]
        }
    ]

    for assess in sample_assessments:
        await assessments_col.insert_one(assess)

    # 4. Seed Activities
    sample_activities = [
        {
            "_id": "act-1",
            "student_email": "student@kvgce.edu.in",
            "student_name": "Aditya Hegde",
            "title": "National Hackathon 2026 Winner — AI Innovation",
            "category": "Hackathon",
            "description": "Secured 1st Rank in 36-hour State Level Hackathon by building an AI-powered smart agriculture assistant.",
            "date": "2026-02-15",
            "organizer": "VTU Belagavi & IEEE Student Branch",
            "points": 50,
            "status": "Verified",
            "created_at": "2026-02-16T12:00:00"
        },
        {
            "_id": "act-2",
            "student_email": "student@kvgce.edu.in",
            "student_name": "Aditya Hegde",
            "title": "AWS Certified Cloud Practitioner",
            "category": "Certification",
            "description": "Completed AWS Cloud Practitioner Certification with 92% score.",
            "date": "2026-01-20",
            "organizer": "Amazon Web Services (AWS)",
            "points": 30,
            "status": "Verified",
            "created_at": "2026-01-22T09:30:00"
        }
    ]

    for act in sample_activities:
        await activities_col.insert_one(act)

    # 5. Seed System Notifications
    sample_notifications = [
        {
            "_id": "notif-1",
            "user_email": "student@kvgce.edu.in",
            "title": "Welcome to KVGCE TAP!",
            "message": "Your TAP student portal is active. Start practicing aptitude tests and exploring AI career recommendations.",
            "type": "info",
            "read": False,
            "date": "2026-08-13T10:00:00"
        },
        {
            "_id": "notif-2",
            "user_email": "student@kvgce.edu.in",
            "title": "New Assessment Published",
            "message": "National Aptitude & Logical Reasoning Benchmark test is now live under your Assessments tab.",
            "type": "assessment",
            "read": False,
            "date": "2026-08-13T10:15:00"
        }
    ]

    for n in sample_notifications:
        await notifications_col.insert_one(n)

    print("Database seeding completed successfully!")

if __name__ == "__main__":
    asyncio.run(seed_database())
