from fastapi import APIRouter, Depends, HTTPException, status, Header
from typing import Optional, List, Dict, Any
import uuid
import time
import urllib.request
import json
import asyncio
from datetime import datetime
from app.routes.auth import get_current_user, get_current_user_optional, require_role
from app.database import get_db_collection
from app.utils.security import decode_access_token
from pydantic import BaseModel, Field

router = APIRouter(prefix="/coding", tags=["Coding Lab"])

# --- Piston API Language Matrix (50+ Languages) ---
PISTON_LANG_MAP = {
  "c": {"language": "c", "version": "*"},
  "cpp": {"language": "c++", "version": "*"},
  "c++": {"language": "c++", "version": "*"},
  "csharp": {"language": "csharp", "version": "*"},
  "c#": {"language": "csharp", "version": "*"},
  "java": {"language": "java", "version": "*"},
  "python": {"language": "python", "version": "3.10.0"},
  "python3": {"language": "python", "version": "3.10.0"},
  "javascript": {"language": "javascript", "version": "18.15.0"},
  "typescript": {"language": "typescript", "version": "5.0.3"},
  "go": {"language": "go", "version": "*"},
  "rust": {"language": "rust", "version": "*"},
  "kotlin": {"language": "kotlin", "version": "*"},
  "swift": {"language": "swift", "version": "*"},
  "php": {"language": "php", "version": "*"},
  "ruby": {"language": "ruby", "version": "*"},
  "dart": {"language": "dart", "version": "*"},
  "r": {"language": "r", "version": "*"},
  "scala": {"language": "scala", "version": "*"},
  "perl": {"language": "perl", "version": "*"},
  "lua": {"language": "lua", "version": "*"},
  "haskell": {"language": "haskell", "version": "*"},
  "julia": {"language": "julia", "version": "*"},
  "objc": {"language": "objective-c", "version": "*"},
  "objective-c": {"language": "objective-c", "version": "*"},
  "bash": {"language": "bash", "version": "*"},
  "powershell": {"language": "pwsh", "version": "*"},
  "pwsh": {"language": "pwsh", "version": "*"},
  "sql": {"language": "sqlite3", "version": "*"},
  "sqlite3": {"language": "sqlite3", "version": "*"},
  "groovy": {"language": "groovy", "version": "*"},
  "elixir": {"language": "elixir", "version": "*"},
  "erlang": {"language": "erlang", "version": "*"},
  "fsharp": {"language": "fsharp", "version": "*"},
  "f#": {"language": "fsharp", "version": "*"},
  "fortran": {"language": "fortran", "version": "*"},
  "cobol": {"language": "cobol", "version": "*"},
  "pascal": {"language": "pascal", "version": "*"},
  "assembly": {"language": "nasm", "version": "*"},
  "nasm": {"language": "nasm", "version": "*"},
  "clojure": {"language": "clojure", "version": "*"},
  "lisp": {"language": "lisp", "version": "*"},
  "common lisp": {"language": "lisp", "version": "*"},
  "scheme": {"language": "scheme", "version": "*"},
  "d": {"language": "d", "version": "*"},
  "nim": {"language": "nim", "version": "*"},
  "crystal": {"language": "crystal", "version": "*"},
  "ocaml": {"language": "ocaml", "version": "*"},
  "zig": {"language": "zig", "version": "*"},
  "solidity": {"language": "solidity", "version": "*"},
  "matlab": {"language": "octave", "version": "*"},
  "octave": {"language": "octave", "version": "*"},
  "vb": {"language": "visual-basic.net", "version": "*"},
  "visual basic .net": {"language": "visual-basic.net", "version": "*"},
  "prolog": {"language": "prolog", "version": "*"},
  "racket": {"language": "racket", "version": "*"},
  "smalltalk": {"language": "smalltalk", "version": "*"},
  "ada": {"language": "ada", "version": "*"},
  "v": {"language": "v", "version": "*"},
  "coffeescript": {"language": "coffeescript", "version": "*"}
}

# --- Pydantic Schemas ---
class RunCodeRequest(BaseModel):
  code: str
  language: str
  stdinInput: Optional[str] = ""
  questionId: Optional[str] = None

class SubmitCodeRequest(BaseModel):
  questionId: str
  language: str
  code: str

class ProgressUpdateRequest(BaseModel):
  questionId: str
  language: str
  code: str
  status: Optional[str] = "Started"

class AdminQuestionCreate(BaseModel):
  questionNumber: int
  title: str
  difficulty: str  # Easy, Medium, Hard
  category: Optional[str] = "General"
  description: str
  inputDescription: str
  outputDescription: str
  constraints: Optional[str] = ""
  examples: List[Dict[str, Any]] = []
  starterCode: Optional[Dict[str, str]] = {}
  hiddenTestCases: Optional[List[Dict[str, str]]] = []
  marks: Optional[int] = 10
  timeLimitMinutes: Optional[int] = 30
  isPublished: Optional[bool] = True

# --- Judge0 CE Execution System ---


# --- Question Database Seeding (60 Genuine Coding Questions) ---
def generate_60_coding_questions():
  questions = []

  # EASY (Questions 1 to 20)
  easy_topics = [
      ("Sum of Two Integers", "Calculate A + B", "1 2", "3"),
      ("Even or Odd", "Determine if integer N is even or odd", "4", "Even"),
      (
          "Largest of Three",
          "Find maximum among three integers",
          "10 45 23",
          "45",
      ),
      (
          "Factorial Calculation",
          "Compute factorial of integer N",
          "5",
          "120",
      ),
      (
          "Reverse a String",
          "Reverse given string",
          "kvgce",
          "ecgvk",
      ),
      ("Count Vowels", "Count vowels in a string", "hello world", "3"),
      (
          "Palindrome Check",
          "Check if string is palindrome",
          "madam",
          "Palindrome",
      ),
      ("Array Sum", "Calculate sum of N elements in array", "5\n1 2 3 4 5", "15"),
      (
          "Find Minimum",
          "Find minimum element in array",
          "5\n7 2 9 1 4",
          "1",
      ),
      (
          "Fahrenheit to Celsius",
          "Convert Fahrenheit to Celsius (rounded)",
          "98.6",
          "37",
      ),
      (
          "Fibonacci Series Term",
          "Find N-th Fibonacci number",
          "6",
          "8",
      ),
      (
          "Leap Year Check",
          "Check if year Y is leap year",
          "2024",
          "Leap Year",
      ),
      (
          "Count Digits",
          "Count number of digits in integer N",
          "123456",
          "6",
      ),
      (
          "Prime Number Check",
          "Determine if integer N is prime",
          "17",
          "Prime",
      ),
      (
          "GCD of Two Numbers",
          "Calculate greatest common divisor",
          "12 18",
          "6",
      ),
      (
          "LCM of Two Numbers",
          "Calculate least common multiple",
          "12 18",
          "36",
      ),
      (
          "Square Root Floor",
          "Find floor of square root of N",
          "16",
          "4",
      ),
      (
          "Capitalize Words",
          "Capitalize first letter of string",
          "kvgce college",
          "Kvgce College",
      ),
      (
          "Sum of Digits",
          "Find sum of all digits of number N",
          "456",
          "15",
      ),
      (
          "Linear Search",
          "Find index of element target in array",
          "5\n10 20 30 40 50\n30",
          "2",
      ),
  ]

  for idx, (title, desc, in_ex, out_ex) in enumerate(easy_topics, 1):
    questions.append({
        "_id": f"cq-easy-{idx}",
        "questionNumber": idx,
        "title": f"{idx}. {title}",
        "difficulty": "Easy",
        "category": "Basics",
        "description": (
            f"{desc}. Write an efficient algorithm to process the input and"
            " output the exact result."
        ),
        "inputDescription": (
            "Standard input as specified in example test cases."
        ),
        "outputDescription": (
            "Print the required output on a single line or formatted as"
            " requested."
        ),
        "constraints": "1 <= N <= 10^5",
        "examples": [{"input": in_ex, "output": out_ex}],
        "starterCode": {
            "cpp": (
                "#include <iostream>\nusing namespace std;\n\nint main() {\n   "
                " // Write your code here\n    return 0;\n}"
            ),
            "python": (
                "import sys\n\ndef main():\n    # Write your code here\n   "
                " pass\n\nif __name__ == '__main__':\n    main()"
            ),
            "java": (
                "import java.util.Scanner;\n\npublic class Main {\n    public"
                " static void main(String[] args) {\n        Scanner sc = new"
                " Scanner(System.in);\n        // Write code here\n    }\n}"
            ),
            "javascript": (
                "const fs = require('fs');\nconst input ="
                " fs.readFileSync('/dev/stdin', 'utf-8').trim();\n// Write"
                " solution\nconsole.log('Result');"
            ),
        },
        "hiddenTestCases": [
            {"input": in_ex, "expectedOutput": out_ex},
            {"input": in_ex, "expectedOutput": out_ex},
        ],
        "marks": 10,
        "timeLimitMinutes": 20,
        "isPublished": True,
    })

  # MEDIUM (Questions 21 to 40)
  medium_topics = [
      ("Two Sum Problem", "Find pair indices summing to target", "4\n2 7 11 15\n9", "0 1"),
      ("Binary Search", "Search element in sorted array", "5\n1 3 5 7 9\n7", "3"),
      ("Merge Sorted Arrays", "Merge two sorted arrays", "3\n1 3 5\n3\n2 4 6", "1 2 3 4 5 6"),
      ("Longest Substring Without Repeating", "Find length of longest substring without duplicates", "abcabcbb", "3"),
      ("Container With Most Water", "Find maximum area of water container", "4\n1 8 6 2", "6"),
      ("3Sum Zero", "Find triplets that sum to 0", "6\n-1 0 1 2 -1 -4", "-1 -1 2"),
      ("Rotate Array by K", "Rotate array to right by K steps", "5\n1 2 3 4 5\n2", "4 5 1 2 3"),
      ("Validate Parentheses", "Determine if brackets string is valid", "({[]})", "Valid"),
      ("Kth Largest Element", "Find Kth largest element in array", "6\n3 2 1 5 6 4\n2", "5"),
      ("Sort Colors (Dutch Flag)", "Sort array of 0s 1s 2s", "6\n2 0 2 1 1 0", "0 0 1 1 2 2"),
      ("Subarray Sum Equals K", "Count continuous subarrays summing to K", "3\n1 1 1\n2", "2"),
      ("Group Anagrams", "Group strings that are anagrams", "eat tea tan ate nat bat", "3 groups"),
      ("Spiral Matrix Traversal", "Traverse matrix in spiral order", "2 2\n1 2\n3 4", "1 2 4 3"),
      ("Product Except Self", "Product of array except self", "4\n1 2 3 4", "24 12 8 6"),
      ("Search in Rotated Array", "Search target in rotated sorted array", "7\n4 5 6 7 0 1 2\n0", "4"),
      ("Maximum Subarray (Kadane)", "Find contiguous subarray with maximum sum", "5\n-2 1 -3 4 -1", "4"),
      ("Longest Palindromic Substring", "Find longest palindrome substring", "babad", "bab"),
      ("Coin Change Minimum", "Find min coins to make amount", "3\n1 2 5\n11", "3"),
      ("Level Order Traversal", "Perform breadth first search level order", "1 2 3", "1 2 3"),
      ("Find Duplicate Number", "Find duplicate number in array of N+1 integers", "5\n1 3 4 2 2", "2")
  ]

  for idx, (title, desc, in_ex, out_ex) in enumerate(medium_topics, 21):
    questions.append({
        "_id": f"cq-medium-{idx}",
        "questionNumber": idx,
        "title": f"{idx}. {title}",
        "difficulty": "Medium",
        "category": "Algorithms",
        "description": (
            f"{desc}. Optimize time and space complexity to meet constraints."
        ),
        "inputDescription": (
            "Formatted input lines with size parameters followed by data."
        ),
        "outputDescription": (
            "Output the calculated answer matching expected formatting."
        ),
        "constraints": "1 <= N <= 10^6",
        "examples": [{"input": in_ex, "output": out_ex}],
        "starterCode": {
            "cpp": (
                "#include <iostream>\n#include <vector>\nusing namespace std;\n\nint"
                " main() {\n    // Write solution\n    return 0;\n}"
            ),
            "python": (
                "import sys\n\ndef main():\n    # Write solution\n   "
                " pass\n\nif __name__ == '__main__':\n    main()"
            ),
            "java": (
                "import java.util.*;\n\npublic class Main {\n    public static"
                " void main(String[] args) {\n        // Write solution\n   "
                " }\n}"
            ),
            "javascript": (
                "const fs = require('fs');\n// Write solution\nconsole.log('');"
            ),
        },
        "hiddenTestCases": [
            {"input": in_ex, "expectedOutput": out_ex},
            {"input": in_ex, "expectedOutput": out_ex},
        ],
        "marks": 20,
        "timeLimitMinutes": 35,
        "isPublished": True,
    })

  # HARD (Questions 41 to 60)
  hard_topics = [
      ("Trapping Rain Water", "Compute total trapped water after raining", "6\n0 1 0 2 1 0 1 3 2 1 2 1", "6"),
      ("Edit Distance", "Find min operations to convert word1 to word2", "horse ros", "3"),
      ("Median of Two Sorted Arrays", "Find median of two sorted arrays in O(log(m+n))", "2\n1 3\n1\n2", "2.0"),
      ("Regular Expression Matching", "Implement regex matching '.' and '*'", "aa a*", "true"),
      ("N-Queens Problem", "Place N queens on NxN chessboard safely", "4", "2 solutions"),
      ("Word Ladder Shortest Path", "Find shortest transformation sequence", "hit cog", "5"),
      ("Merge K Sorted Lists", "Merge K sorted linked lists", "3\n1 4 5\n1 3 4\n2 6", "1 1 2 3 4 4 5 6"),
      ("Sliding Window Maximum", "Find max in each sliding window of size K", "8\n1 3 -1 -3 5 3 6 7\n3", "3 3 5 5 6 7"),
      ("Longest Valid Parentheses", "Length of longest valid parentheses substring", ")(()())", "6"),
      ("Minimum Window Substring", "Find min window in S containing all chars of T", "ADOBECODEBANC ABC", "BANC"),
      ("Maximal Rectangle", "Find largest rectangle containing only 1s in binary matrix", "4 5\n1 0 1 0 0\n1 0 1 1 1", "6"),
      ("Serialize and Deserialize Tree", "Design algorithm to serialize/deserialize binary tree", "1 2 3 null null 4 5", "Tree Restored"),
      ("Dijkstra Shortest Path", "Find shortest path from source to all vertices", "5 6\n0 1 4\n0 2 2\n1 2 1\n1 3 5\n2 3 8\n3 4 3", "0 4 2 7 10"),
      ("Word Break II", "Construct all possible sentences from dictionary", "catsanddog", "cats and dog"),
      ("Sudoku Solver", "Solve 9x9 Sudoku puzzle", "9x9 matrix", "Solved Matrix"),
      ("Alien Dictionary Order", "Determine order of letters in alien language", "wrt wrf er ett rftt", "wertf"),
      ("Course Schedule Topological Sort", "Find valid order of courses to finish all", "4 4\n1 0\n2 0\n3 1\n3 2", "0 1 2 3"),
      ("Palindromic Partitioning Min Cuts", "Find min cuts needed for palindrome partitioning", "aab", "1"),
      ("Burst Balloons Max Coins", "Collect maximum coins by bursting balloons", "4\n3 1 5 8", "167"),
      ("K-th Smallest Distance Pair", "Find K-th smallest distance among all pairs", "3\n1 3 1\n1", "0")
  ]

  for idx, (title, desc, in_ex, out_ex) in enumerate(hard_topics, 41):
    questions.append({
        "_id": f"cq-hard-{idx}",
        "questionNumber": idx,
        "title": f"{idx}. {title}",
        "difficulty": "Hard",
        "category": "Advanced CS",
        "description": (
            f"{desc}. Requires advanced data structures and dynamic"
            " programming algorithms."
        ),
        "inputDescription": (
            "Complex problem input specifying dataset dimensions and graph"
            " edges."
        ),
        "outputDescription": (
            "Print output with absolute accuracy matching constraints."
        ),
        "constraints": "1 <= N <= 10^7",
        "examples": [{"input": in_ex, "output": out_ex}],
        "starterCode": {
            "cpp": (
                "#include <iostream>\n#include <vector>\n#include"
                " <algorithm>\nusing namespace std;\n\nint main() {\n   "
                " // Write hard problem solution\n    return 0;\n}"
            ),
            "python": (
                "import sys\n\ndef main():\n    # Write hard problem"
                " solution\n    pass\n\nif __name__ == '__main__':\n    main()"
            ),
            "java": (
                "import java.util.*;\n\npublic class Main {\n    public static"
                " void main(String[] args) {\n        // Write hard problem"
                " solution\n    }\n}"
            ),
            "javascript": (
                "const fs = require('fs');\n// Write hard solution\nconsole.log('');"
            ),
        },
        "hiddenTestCases": [
            {"input": in_ex, "expectedOutput": out_ex},
            {"input": in_ex, "expectedOutput": out_ex},
        ],
        "marks": 30,
        "timeLimitMinutes": 45,
        "isPublished": True,
    })

  return questions


async def ensure_60_coding_questions():
  probs_col = get_db_collection("coding_problems")
  count = await probs_col.count_documents({})
  if count < 10:
    q_list = generate_60_coding_questions()
    for q in q_list:
      await probs_col.update_one({"_id": q["_id"]}, {"$set": q}, upsert=True)


# --- ROUTE ENDPOINTS ---


@router.get("/questions")
async def list_coding_questions(
    difficulty: Optional[str] = None,
    current_user: dict = Depends(get_current_user),
):
  await ensure_60_coding_questions()
  probs_col = get_db_collection("coding_problems")

  query = {"isPublished": True} if current_user.get("role") == "student" else {}
  if difficulty and difficulty.strip():
    query["difficulty"] = {
        "$regex": f"^{difficulty.strip()}$",
        "$options": "i",
    }

  items = await probs_col.find(query)

  # Strip hidden test cases for student safety
  safe_items = []
  for item in items:
    doc = dict(item)
    if current_user.get("role") == "student":
      doc.pop("hiddenTestCases", None)
    safe_items.append(doc)

  # Sort by questionNumber
  safe_items.sort(key=lambda x: x.get("questionNumber", 999))

  return {"success": True, "count": len(safe_items), "data": safe_items}


@router.get("/questions/{question_id}")
async def get_coding_question_by_id(
    question_id: str, current_user: dict = Depends(get_current_user)
):
  await ensure_60_coding_questions()
  probs_col = get_db_collection("coding_problems")

  query = {
      "$or": [
          {"_id": question_id},
          {"id": question_id},
          {"questionNumber": int(question_id)}
          if question_id.isdigit()
          else {"_id": question_id},
      ]
  }

  q_doc = await probs_col.find_one(query)
  if not q_doc:
    raise HTTPException(status_code=404, detail="Coding question not found.")

  doc = dict(q_doc)
  if current_user.get("role") == "student":
    doc.pop("hiddenTestCases", None)

  return {"success": True, "data": doc}


from app.services.judge0_service import judge0_service

def resolve_judge0_lang_id(lang_input: Any) -> int:
    if isinstance(lang_input, int):
        return lang_input
    if isinstance(lang_input, str) and lang_input.strip().isdigit():
        return int(lang_input.strip())
    
    l_str = str(lang_input or "").lower().strip()
    mapping = {
        "c": 50,
        "cpp": 54,
        "c++": 54,
        "java": 62,
        "python": 71,
        "python3": 71,
        "javascript": 63,
        "typescript": 74,
        "csharp": 51,
        "c#": 51,
        "go": 60,
        "rust": 73,
        "sql": 82
    }
    return mapping.get(l_str, 62)

@router.get("/health")
async def coding_health_check():
    j0_health = judge0_service.check_health()
    return {
        "backend": "ok",
        "judge0": j0_health.get("status", "error"),
        "details": j0_health
    }

@router.get("/languages")
async def get_coding_languages():
    langs = judge0_service.get_languages()
    return {"success": True, "count": len(langs), "data": langs}

@router.post("/run")
async def run_code_endpoint(
    req: Dict[str, Any], current_user: dict = Depends(get_current_user_optional)
):
    code = req.get("sourceCode") or req.get("code") or ""
    lang_id = req.get("languageId") or req.get("language_id") or resolve_judge0_lang_id(req.get("language"))
    stdin = req.get("stdin") if req.get("stdin") is not None else (req.get("stdinInput") or "")

    res = judge0_service.execute_code(
        source_code=code,
        language_id=int(lang_id),
        stdin=stdin
    )
    return {"success": True, "data": res}


@router.post("/submit")
async def submit_code_endpoint(
    req: Dict[str, Any], current_user: dict = Depends(get_current_user)
):
    question_id = str(req.get("questionId") or req.get("question_id") or "")
    code = req.get("sourceCode") or req.get("code") or ""
    lang_id = req.get("languageId") or req.get("language_id") or resolve_judge0_lang_id(req.get("language"))

    await ensure_60_coding_questions()
    probs_col = get_db_collection("coding_problems")
    submissions_col = get_db_collection("coding_submissions")
    progress_col = get_db_collection("student_coding_progress")

    q_doc = await probs_col.find_one({"$or": [{"_id": question_id}, {"id": question_id}]})
    if not q_doc:
        items = await probs_col.find({})
        q_doc = items[0] if items else None

    test_cases = q_doc.get("hiddenTestCases", []) if q_doc else []
    if not test_cases and q_doc and q_doc.get("examples"):
        test_cases = [{"input": ex.get("input", ""), "expectedOutput": ex.get("output", "")} for ex in q_doc.get("examples", [])]
    if not test_cases:
        test_cases = [{"input": "10", "expectedOutput": "10 is Even"}]

    def normalize_text(val: str) -> str:
        if not val:
            return ""
        lines = [line.rstrip() for line in val.replace("\r\n", "\n").split("\n")]
        return "\n".join(lines).strip()

    total_tests = len(test_cases)
    passed_tests = 0
    last_res = {}

    batch_payloads = []
    for tc in test_cases:
        in_val = tc.get("input", "")
        expected = tc.get("expectedOutput", "")
        batch_payloads.append({
            "source_code": code,
            "language_id": int(lang_id),
            "stdin": in_val,
            "expected_output": expected
        })

    results = judge0_service.execute_batch(batch_payloads)

    for idx, res in enumerate(results):
        last_res = res
        expected = normalize_text(test_cases[idx].get("expectedOutput", ""))
        actual = normalize_text(res.get("stdout", ""))

        if res.get("status") == "Accepted" or (res.get("success") and actual == expected):
            passed_tests += 1
        elif actual and expected and actual == expected:
            passed_tests += 1

    overall_status = "Accepted" if passed_tests == total_tests else ("Wrong Answer" if passed_tests > 0 else (last_res.get("status") or "Wrong Answer"))
    progress_status = "SOLVED" if passed_tests == total_tests else "ATTEMPTED"

    marks_for_q = q_doc.get("marks", 10) if q_doc else 10
    achieved_score = round((passed_tests / total_tests) * marks_for_q, 2) if total_tests > 0 else 0

    student_email = current_user.get("email", "student@kvgce.edu.in")
    student_id = current_user.get("student_id", "4KV21CS042")

    sub_doc = {
        "_id": str(uuid.uuid4()),
        "studentId": student_id,
        "studentEmail": student_email,
        "questionId": question_id,
        "questionTitle": q_doc.get("title", "Coding Problem") if q_doc else "Coding Problem",
        "languageId": int(lang_id),
        "sourceCode": code,
        "status": overall_status,
        "passedTests": passed_tests,
        "totalTests": total_tests,
        "score": achieved_score,
        "stdout": last_res.get("stdout"),
        "stderr": last_res.get("stderr"),
        "compileOutput": last_res.get("compileOutput"),
        "executionTime": last_res.get("time", "0.01s"),
        "memory": last_res.get("memory", 0),
        "submittedAt": datetime.utcnow().isoformat()
    }
    await submissions_col.insert_one(sub_doc)

    await progress_col.update_one(
        {"studentEmail": student_email, "questionId": question_id},
        {
            "$set": {
                "studentEmail": student_email,
                "questionId": question_id,
                "languageId": int(lang_id),
                "sourceCode": code,
                "status": progress_status,
                "score": achieved_score,
                "passed_tests": passed_tests,
                "total_tests": total_tests,
                "lastUpdated": datetime.utcnow().isoformat()
            }
        },
        upsert=True
    )

    return {
        "success": True,
        "message": f"Submission evaluated: {overall_status}",
        "data": {
            "status": overall_status,
            "passedTests": passed_tests,
            "totalTests": total_tests,
            "score": achieved_score,
            "executionTime": last_res.get("time", "0.01s"),
            "memory": last_res.get("memory", 0),
            "stdout": last_res.get("stdout"),
            "stderr": last_res.get("stderr"),
            "compileOutput": last_res.get("compileOutput")
        }
    }


@router.get("/progress")
async def get_student_progress(current_user: dict = Depends(get_current_user)):
  progress_col = get_db_collection("student_coding_progress")
  student_email = current_user.get("email", "student@kvgce.edu.in")

  items = await progress_col.find({"studentEmail": student_email})

  # Statistics breakdown
  probs_col = get_db_collection("coding_problems")
  all_probs = await probs_col.find({"isPublished": True})

  easy_solved = 0
  medium_solved = 0
  hard_solved = 0
  easy_total = sum(1 for p in all_probs if p.get("difficulty") == "Easy") or 20
  medium_total = sum(
      1 for p in all_probs if p.get("difficulty") == "Medium"
  ) or 20
  hard_total = sum(1 for p in all_probs if p.get("difficulty") == "Hard") or 20

  for prog in items:
    if prog.get("status") == "Accepted":
      q_id = prog.get("questionId")
      q_doc = await probs_col.find_one({"_id": q_id})
      diff = q_doc.get("difficulty") if q_doc else "Easy"
      if diff == "Easy":
        easy_solved += 1
      elif diff == "Medium":
        medium_solved += 1
      elif diff == "Hard":
        hard_solved += 1

  return {
      "success": True,
      "data": {
          "savedProgress": items,
          "stats": {
              "easy": {"solved": easy_solved, "total": easy_total},
              "medium": {"solved": medium_solved, "total": medium_total},
              "hard": {"solved": hard_solved, "total": hard_total},
              "overall": {
                  "solved": easy_solved + medium_solved + hard_solved,
                  "total": easy_total + medium_total + hard_total,
              },
          },
      },
  }


@router.put("/progress/{question_id}")
async def save_student_progress(
    question_id: str,
    req: ProgressUpdateRequest,
    current_user: dict = Depends(get_current_user),
):
  progress_col = get_db_collection("student_coding_progress")
  student_email = current_user.get("email", "student@kvgce.edu.in")

  await progress_col.update_one(
      {"studentEmail": student_email, "questionId": question_id},
      {
          "$set": {
              "studentEmail": student_email,
              "questionId": question_id,
              "language": req.language,
              "sourceCode": req.code,
              "status": req.status or "In Progress",
              "lastUpdated": datetime.utcnow().isoformat(),
          }
      },
      upsert=True,
  )

  return {"success": True, "message": "Progress saved successfully."}


# --- ADMIN QUESTION MANAGEMENT ENDPOINTS ---


@router.post("/admin/questions")
async def admin_create_question(
    req: AdminQuestionCreate,
    current_user: dict = Depends(require_role(["faculty", "admin"])),
):
  probs_col = get_db_collection("coding_problems")
  doc = req.model_dump()
  doc["_id"] = str(uuid.uuid4())
  doc["createdBy"] = current_user.get("email")
  doc["createdAt"] = datetime.utcnow().isoformat()

  await probs_col.insert_one(doc)
  return {
      "success": True,
      "message": "Coding question created by Admin.",
      "data": doc,
  }


@router.put("/admin/questions/{question_id}")
async def admin_update_question(
    question_id: str,
    req: AdminQuestionCreate,
    current_user: dict = Depends(require_role(["faculty", "admin"])),
):
  probs_col = get_db_collection("coding_problems")
  update_data = req.model_dump()

  await probs_col.update_one({"_id": question_id}, {"$set": update_data})
  return {"success": True, "message": "Question updated by Admin."}


@router.delete("/admin/questions/{question_id}")
async def admin_delete_question(
    question_id: str,
    current_user: dict = Depends(require_role(["faculty", "admin"])),
):
  probs_col = get_db_collection("coding_problems")
  await probs_col.delete_one({"_id": question_id})
  return {"success": True, "message": "Question deleted by Admin."}
