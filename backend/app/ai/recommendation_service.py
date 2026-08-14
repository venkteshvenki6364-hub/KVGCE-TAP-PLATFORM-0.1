def generate_student_ai_analysis(user: dict, attempts: list, activities: list) -> dict:
    skills = user.get("skills", [])
    
    # Calculate Scores
    aptitude_scores = [a.get("percentage", 80) for a in attempts if a.get("category") == "Aptitude"]
    tech_scores = [a.get("percentage", 85) for a in attempts if a.get("category") == "Technical Quiz"]
    
    aptitude_avg = round(sum(aptitude_scores)/len(aptitude_scores), 1) if aptitude_scores else 82.0
    tech_avg = round(sum(tech_scores)/len(tech_scores), 1) if tech_scores else 85.0
    coding_score = 78.5
    communication_score = 80.0
    activity_score = min(len(activities) * 15, 100)

    readiness_score = round(
        (aptitude_avg * 0.25) +
        (tech_avg * 0.30) +
        (coding_score * 0.25) +
        (communication_score * 0.10) +
        (activity_score * 0.10),
        1
    )

    recommendations = [
        {
            "category": "Skill Enhancement",
            "text": "Your Python and Data Structures performance is solid. Focus on practicing Advanced Dynamic Programming and Graph algorithms."
        },
        {
            "category": "Placement Readiness",
            "text": f"Your current placement readiness score is {readiness_score}%. Target mock technical interviews for product-based company drives."
        },
        {
            "category": "Database & Web",
            "text": "Improve SQL query optimization and indexing questions. SQL joins and normalization are high-frequency interview topics."
        }
    ]

    interview_questions = [
        "What is the difference between processes and threads in Operating Systems?",
        "Explain ACID properties in Database Management Systems with a real-world banking example.",
        "How do React hooks like useEffect and useMemo work under the hood?",
        "Solve: Given an array of integers, return indices of two numbers such that they add up to a target sum."
    ]

    return {
        "readiness": {
            "overall": readiness_score,
            "technical": tech_avg,
            "aptitude": aptitude_avg,
            "coding": coding_score,
            "communication": communication_score,
            "activity": activity_score
        },
        "recommendations": recommendations,
        "recommended_interview_questions": interview_questions
    }
