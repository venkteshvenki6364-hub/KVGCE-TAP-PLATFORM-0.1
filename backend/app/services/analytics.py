from collections import defaultdict
from typing import Any, Optional

from app.database import get_db_collection


CATEGORY_KEYS = {
    "aptitude": "Aptitude",
    "technical": "Technical",
    "coding": "Coding",
    "hr": "HR Interview",
}


def normalize_branch(value: Any) -> str:
    text = str(value or "").strip().upper()
    if "COMPUTER" in text or text == "CSE" or "C.S.E" in text:
        return "CSE"
    if "ELECTRONIC" in text or text == "ECE" or "E.C.E" in text:
        return "ECE"
    if "ELECTRICAL" in text or text == "EEE":
        return "EEE"
    if "MECHANICAL" in text or text in {"ME", "MECH"}:
        return "ME"
    if "CIVIL" in text or text in {"CV", "CE"}:
        return "CV"
    if "INFORMATION" in text or text == "ISE":
        return "ISE"
    return text or "Other"


def _matches_filter(student: dict, filters: dict) -> bool:
    branch = filters.get("branch")
    if branch and branch.lower() not in {"all", "none"}:
        if normalize_branch(student.get("department")) != normalize_branch(branch):
            return False

    for field in ("year", "semester"):
        value = filters.get(field)
        if value and str(value).lower() not in {"all", "none"}:
            if str(student.get(field, "")).strip() != str(value).strip():
                return False

    section = filters.get("section")
    if section and section.lower() not in {"all", "none"}:
        if str(student.get("section") or "").strip().upper() != section.strip().upper():
            return False
    return True


def _valid_percentage(attempt: dict) -> Optional[float]:
    if attempt.get("status") in {"invalid", "draft", "in_progress", "not_started"}:
        return None
    if attempt.get("submitted_at") is None:
        return None
    try:
        total = float(attempt.get("total_marks", 0))
        score = float(attempt.get("score"))
        if total <= 0 or score < 0:
            return None
        return max(0.0, min(100.0, score / total * 100))
    except (TypeError, ValueError):
        return None


async def build_analytics(
    *,
    filters: Optional[dict] = None,
    allowed_student_ids: Optional[set[str]] = None,
) -> dict:
    filters = filters or {}
    users_cursor = await get_db_collection("users").find({"role": "student"})
    students = await users_cursor.to_list(length=10000) if hasattr(users_cursor, "to_list") else list(users_cursor)
    students = [
        student for student in students
        if _matches_filter(student, filters)
        and (
            allowed_student_ids is None
            or str(student.get("_id") or student.get("email")) in allowed_student_ids
            or str(student.get("email")) in allowed_student_ids
        )
    ]

    student_keys = {
        str(student.get("email")): student
        for student in students
        if student.get("email")
    }
    attempts_cursor = await get_db_collection("quiz_attempts").find({})
    attempts = await attempts_cursor.to_list(length=50000) if hasattr(attempts_cursor, "to_list") else list(attempts_cursor)

    valid_attempts = []
    for attempt in attempts:
        student = student_keys.get(str(attempt.get("student_email")))
        percentage = _valid_percentage(attempt)
        if not student or percentage is None:
            continue
        category = str(attempt.get("category") or "").strip()
        if filters.get("category") and filters["category"].lower() not in {"all", category.lower()}:
            continue
        valid_attempts.append((attempt, student, percentage, category))

    category_by_student: dict[str, dict[str, list[float]]] = defaultdict(lambda: defaultdict(list))
    for _, student, percentage, category in valid_attempts:
        category_by_student[str(student.get("email"))][category].append(percentage)

    category_averages = {}
    for category in sorted({item[3] for item in valid_attempts}):
        student_values = [
            sum(values) / len(values)
            for student_categories in category_by_student.values()
            if (values := student_categories.get(category))
        ]
        if student_values:
            category_averages[category] = {
                "average": round(sum(student_values) / len(student_values), 2),
                "students_contributing": len(student_values),
                "attempts": sum(
                    len(values)
                    for student_categories in category_by_student.values()
                    for key, values in student_categories.items()
                    if key == category
                ),
            }

    available_averages = [item["average"] for item in category_averages.values()]
    submitted_student_ids = {str(student.get("email")) for _, student, _, _ in valid_attempts}
    overall = round(sum(available_averages) / len(available_averages), 2) if available_averages else None
    student_overalls = []
    for student in students:
        category_values = category_by_student.get(str(student.get("email")), {})
        averages = [sum(values) / len(values) for values in category_values.values() if values]
        if averages:
            student_overalls.append((student, sum(averages) / len(averages)))

    distribution_ranges = (
        ("90_plus", 90, 101),
        ("75_90", 75, 90),
        ("60_75", 60, 75),
        ("40_60", 40, 60),
        ("below_40", 0, 40),
    )
    distribution = {
        key: sum(1 for _, percentage in student_overalls if lower <= percentage < upper)
        for key, lower, upper in distribution_ranges
    }
    placement_ready = sum(1 for _, percentage in student_overalls if percentage >= 80)
    at_risk = sum(1 for _, percentage in student_overalls if percentage < 60)
    recent_activity = [
        {
            "title": attempt.get("assessment_title") or "Assessment submission",
            "category": attempt.get("category") or "Assessment",
            "student": student.get("full_name") or student.get("email"),
            "time": attempt.get("submitted_at"),
        }
        for attempt, student, _, _ in sorted(
            valid_attempts,
            key=lambda item: str(item[0].get("submitted_at") or ""),
            reverse=True,
        )[:5]
    ]

    def group_average(key: str) -> list[dict]:
        groups: dict[str, list[float]] = defaultdict(list)
        for student in students:
            student_categories = category_by_student.get(str(student.get("email")), {})
            values = [
                sum(scores) / len(scores)
                for scores in student_categories.values()
                if scores
            ]
            if values:
                group = normalize_branch(student.get(key)) if key == "department" else str(student.get(key) or "Unknown")
                groups[group].append(sum(values) / len(values))
        return [
            {"group": group, "average": round(sum(values) / len(values), 2), "students_contributing": len(values)}
            for group, values in sorted(groups.items())
        ]

    return {
        "student_count": len(students),
        "eligible_students": len(students),
        "submitted_students": len(submitted_student_ids),
        "submitted_attempts": len(valid_attempts),
        "participation_percentage": round(len(submitted_student_ids) / len(students) * 100, 2) if students else 0,
        "overall_average": overall,
        "placement_readiness": round(placement_ready / len(student_overalls) * 100, 2) if student_overalls else 0,
        "at_risk_students": at_risk,
        "score_distribution": distribution,
        "top_performers": [
            {
                "name": student.get("full_name") or "Student",
                "usn": student.get("student_id") or student.get("usn") or "—",
                "dept": normalize_branch(student.get("department")),
                "score": round(percentage, 2),
            }
            for student, percentage in sorted(student_overalls, key=lambda item: item[1], reverse=True)[:10]
        ],
        "at_risk_student_list": [
            {
                "name": student.get("full_name") or "Student",
                "usn": student.get("student_id") or student.get("usn") or "—",
                "score": round(percentage, 2),
                "reason": "Below 60% submitted-attempt average",
            }
            for student, percentage in sorted(student_overalls, key=lambda item: item[1])[:10]
            if percentage < 60
        ],
        "recent_activity": recent_activity,
        "category_averages": category_averages,
        "grouped_statistics": {
            "branch": group_average("department"),
            "year": group_average("year"),
            "semester": group_average("semester"),
            "section": group_average("section"),
        },
        "filters": filters,
    }


def legacy_analysis(analytics: dict) -> dict:
    category = analytics["category_averages"]
    score = lambda name: category.get(name, {}).get("average")
    return {
        "totalStudents": analytics["student_count"],
        "activeStudents": analytics["student_count"],
        "avgSkillScore": analytics["overall_average"] or 0,
        "placementReadiness": analytics["placement_readiness"],
        "atRiskStudents": analytics["at_risk_students"],
        "testsCompleted": analytics["submitted_attempts"],
        "categoryScores": {
            "academics": None,
            "aptitude": score(CATEGORY_KEYS["aptitude"]) or 0,
            "technical": score(CATEGORY_KEYS["technical"]) or 0,
            "coding": score(CATEGORY_KEYS["coding"]) or 0,
            "hrComm": score(CATEGORY_KEYS["hr"]) or 0,
            "overall": analytics["overall_average"] or 0,
        },
        "departmentScores": [
            {"dept": item["group"], "score": item["average"]}
            for item in analytics["grouped_statistics"]["branch"]
        ],
        "topPerformers": analytics["top_performers"],
        "scoreDistribution": analytics["score_distribution"],
        "recentActivity": analytics["recent_activity"],
        "placementReadiness": analytics["placement_readiness"],
        "atRiskStudents": analytics["at_risk_students"],
        "atRiskStudentList": analytics["at_risk_student_list"],
        "participation": {
            "eligibleStudents": analytics["eligible_students"],
            "submittedStudents": analytics["submitted_students"],
            "percentage": analytics["participation_percentage"],
        },
        "categoryAverages": category,
    }
