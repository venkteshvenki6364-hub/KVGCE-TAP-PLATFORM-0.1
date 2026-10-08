import React, { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../services/api";
import codingApi from "../../services/codingApi";
import "./CodingPracticeModule.css";

// Popular & Family Languages List (Python, Java, JavaScript, C++, C, SQL, MongoDB, C#, Go, Rust)
const POPULAR_LANGUAGES = [
  { id: "python", name: "Python 3", ext: "main.py" },
  { id: "java", name: "Java 17", ext: "Main.java" },
  { id: "javascript", name: "JavaScript (Node)", ext: "main.js" },
  { id: "cpp", name: "C++ (g++ 17)", ext: "main.cpp" },
  { id: "c", name: "C (gcc 11)", ext: "main.c" },
  { id: "sql", name: "SQL (SQLite 3)", ext: "query.sql" },
  { id: "mongodb", name: "MongoDB (JS Query)", ext: "query.js" },
  { id: "typescript", name: "TypeScript", ext: "main.ts" },
  { id: "csharp", name: "C#", ext: "Program.cs" },
  { id: "go", name: "Go", ext: "main.go" },
  { id: "rust", name: "Rust", ext: "main.rs" }
];

// Default General Syntax Templates for Popular Programming Languages
const DEFAULT_GENERAL_SYNTAX = {
  python: `import sys

def main():
    # Python 3 General Syntax
    # Write your code logic here...
    print("Hello World!")

if __name__ == '__main__':
    main()`,

  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        // Java General Syntax
        // Write your code logic here...
        Scanner sc = new Scanner(System.in);
        System.out.println("Hello World!");
    }
}`,

  javascript: `// JavaScript (Node.js) General Syntax
// Write your code logic here...
console.log("Hello World!");`,

  cpp: `#include <iostream>
using namespace std;

int main() {
    // C++ General Syntax
    // Write your code logic here...
    cout << "Hello World!" << endl;
    return 0;
}`,

  c: `#include <stdio.h>

int main() {
    // C General Syntax
    // Write your code logic here...
    printf("Hello World!\\n");
    return 0;
}`,

  sql: `-- SQL Query General Syntax
SELECT 'Hello World' AS OutputMessage;`,

  mongodb: `// MongoDB Query Syntax
db.collection.find({});`,

  typescript: `// TypeScript General Syntax
const message: string = "Hello World!";
console.log(message);`,

  csharp: `using System;

public class Program {
    public static void Main(String[] args) {
        // C# General Syntax
        Console.WriteLine("Hello World!");
    }
}`,

  go: `package main

import "fmt"

func main() {
    // Go General Syntax
    fmt.Println("Hello World!")
}`,

  rust: `fn main() {
    // Rust General Syntax
    println!("Hello World!");
}`
};

// Rich Fallback Questions List (20 Questions with Defined Difficulty Levels)
const DEFAULT_QUESTIONS = [
  {
    _id: "q-1",
    questionNumber: 1,
    title: "1. Sum of Two Integers",
    difficulty: "Easy",
    description: "Write a program that takes two space-separated integers A and B and prints their sum.",
    inputDescription: "First line contains two space-separated integers A and B.",
    outputDescription: "Print the sum of A and B.",
    constraints: "-10^9 <= A, B <= 10^9",
    examples: [{ input: "10 20", output: "30" }],
    starterCode: {
      python: "import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if len(lines) >= 2:\n        a, b = int(lines[0]), int(lines[1])\n        print(a + b)\n\nif __name__ == '__main__':\n    main()",
      cpp: "#include <iostream>\nusing namespace std;\nint main() {\n    int a, b;\n    if(cin >> a >> b) cout << a + b << endl;\n    return 0;\n}",
      java: "import java.util.Scanner;\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if(sc.hasNextInt()) {\n            int a = sc.nextInt();\n            int b = sc.nextInt();\n            System.out.println(a + b);\n        }\n    }\n}",
      javascript: "const fs = require('fs');\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif(input.length >= 2) {\n    console.log(parseInt(input[0]) + parseInt(input[1]));\n}",
      sql: "-- SQL Query to select sum\nSELECT 10 + 20 AS TotalSum;",
      mongodb: "// MongoDB Query\ndb.numbers.aggregate([\n  { $group: { _id: null, total: { $sum: \"$value\" } } }\n]);"
    }
  },
  {
    _id: "q-2",
    questionNumber: 2,
    title: "2. Check Even or Odd",
    difficulty: "Easy",
    description: "Given an integer N, print 'Even' if N is divisible by 2, otherwise print 'Odd'.",
    inputDescription: "First line contains an integer N.",
    outputDescription: "Print 'Even' or 'Odd'.",
    constraints: "-10^9 <= N <= 10^9",
    examples: [{ input: "7", output: "Odd" }, { input: "12", output: "Even" }]
  },
  {
    _id: "q-3",
    questionNumber: 3,
    title: "3. Maximum of Three Numbers",
    difficulty: "Easy",
    description: "Write a program to find the largest of three given numbers.",
    inputDescription: "First line contains three space-separated integers A, B, and C.",
    outputDescription: "Print the maximum of the three numbers.",
    constraints: "-10^9 <= A, B, C <= 10^9",
    examples: [{ input: "15 42 9", output: "42" }]
  },
  {
    _id: "q-4",
    questionNumber: 4,
    title: "4. Reverse a String",
    difficulty: "Medium",
    description: "Given a string S, write a program to output the reversed string.",
    inputDescription: "First line contains a string S.",
    outputDescription: "Print the reversed string.",
    constraints: "1 <= |S| <= 1000",
    examples: [{ input: "kvgce", output: "ecgvk" }]
  },
  {
    _id: "q-5",
    questionNumber: 5,
    title: "5. Factorial of a Number",
    difficulty: "Easy",
    description: "Write a program to calculate the factorial of a given non-negative integer N.",
    inputDescription: "First line contains an integer N.",
    outputDescription: "Print N! (factorial of N).",
    constraints: "0 <= N <= 20",
    examples: [{ input: "5", output: "120" }]
  },
  {
    _id: "q-6",
    questionNumber: 6,
    title: "6. Check Prime Number",
    difficulty: "Easy",
    description: "Given an integer N, determine whether N is a prime number. Print 'Prime' or 'Not Prime'.",
    inputDescription: "First line contains an integer N.",
    outputDescription: "Print 'Prime' or 'Not Prime'.",
    constraints: "1 <= N <= 10^9",
    examples: [{ input: "13", output: "Prime" }, { input: "15", output: "Not Prime" }]
  },
  {
    _id: "q-7",
    questionNumber: 7,
    title: "7. Fibonacci Series Term",
    difficulty: "Easy",
    description: "Write a program to find the N-th Fibonacci number where Fib(0)=0 and Fib(1)=1.",
    inputDescription: "First line contains an integer N.",
    outputDescription: "Print the N-th Fibonacci number.",
    constraints: "0 <= N <= 50",
    examples: [{ input: "7", output: "13" }]
  },
  {
    _id: "q-8",
    questionNumber: 8,
    title: "8. Linear Search in Array",
    difficulty: "Medium",
    description: "Search for a target value X in an array of N integers. Print the 0-based index if found, else print -1.",
    inputDescription: "First line contains N and X. Second line contains N space-separated integers.",
    outputDescription: "Print the index of X or -1.",
    constraints: "1 <= N <= 1000",
    examples: [{ input: "5 30\n10 20 30 40 50", output: "2" }]
  },
  {
    _id: "q-9",
    questionNumber: 9,
    title: "9. Sum of Array Elements",
    difficulty: "Easy",
    description: "Given an array of N integers, calculate and print the sum of all elements.",
    inputDescription: "First line contains integer N. Second line contains N integers.",
    outputDescription: "Print the sum of array elements.",
    constraints: "1 <= N <= 1000",
    examples: [{ input: "4\n1 2 3 4", output: "10" }]
  },
  {
    _id: "q-10",
    questionNumber: 10,
    title: "10. Count Vowels in String",
    difficulty: "Easy",
    description: "Count the total number of vowels (a, e, i, o, u case-insensitive) in a given string S.",
    inputDescription: "First line contains a string S.",
    outputDescription: "Print the vowel count.",
    constraints: "1 <= |S| <= 1000",
    examples: [{ input: "Hello Placement", output: "5" }]
  },
  {
    _id: "q-11",
    questionNumber: 11,
    title: "11. Palindrome Check",
    difficulty: "Easy",
    description: "Determine if a given string S is a palindrome (reads same forward and backward). Print 'YES' or 'NO'.",
    inputDescription: "First line contains string S.",
    outputDescription: "Print 'YES' or 'NO'.",
    constraints: "1 <= |S| <= 1000",
    examples: [{ input: "racecar", output: "YES" }]
  },
  {
    _id: "q-12",
    questionNumber: 12,
    title: "12. Binary Search in Sorted Array",
    difficulty: "Medium",
    description: "Perform binary search on a sorted array of N integers to find target X. Print index or -1.",
    inputDescription: "First line contains N and X. Second line contains N sorted integers.",
    outputDescription: "Print index of X or -1.",
    constraints: "1 <= N <= 10^5",
    examples: [{ input: "6 25\n5 10 15 20 25 30", output: "4" }]
  },
  {
    _id: "q-13",
    questionNumber: 13,
    title: "13. Bubble Sort Implementation",
    difficulty: "Medium",
    description: "Sort an array of N integers in ascending order using Bubble Sort algorithm.",
    inputDescription: "First line contains N. Second line contains N integers.",
    outputDescription: "Print space-separated sorted array.",
    constraints: "1 <= N <= 500",
    examples: [{ input: "5\n64 34 25 12 22", output: "12 22 25 34 64" }]
  },
  {
    _id: "q-14",
    questionNumber: 14,
    title: "14. Matrix Addition",
    difficulty: "Medium",
    description: "Add two N x M matrices and print the resulting matrix.",
    inputDescription: "First line contains N and M. Followed by N lines for Matrix A and N lines for Matrix B.",
    outputDescription: "Print the sum matrix.",
    constraints: "1 <= N, M <= 50",
    examples: [{ input: "2 2\n1 2\n3 4\n5 6\n7 8", output: "6 8\n10 12" }]
  },
  {
    _id: "q-15",
    questionNumber: 15,
    title: "15. Find GCD of Two Numbers",
    difficulty: "Easy",
    description: "Calculate the Greatest Common Divisor (GCD / HCF) of two positive integers A and B.",
    inputDescription: "First line contains two integers A and B.",
    outputDescription: "Print the GCD of A and B.",
    constraints: "1 <= A, B <= 10^9",
    examples: [{ input: "48 18", output: "6" }]
  },
  {
    _id: "q-16",
    questionNumber: 16,
    title: "16. Find LCM of Two Numbers",
    difficulty: "Easy",
    description: "Calculate the Least Common Multiple (LCM) of two positive integers A and B.",
    inputDescription: "First line contains two integers A and B.",
    outputDescription: "Print the LCM of A and B.",
    constraints: "1 <= A, B <= 10^9",
    examples: [{ input: "12 18", output: "36" }]
  },
  {
    _id: "q-17",
    questionNumber: 17,
    title: "17. Merge Two Sorted Arrays",
    difficulty: "Medium",
    description: "Given two sorted arrays of size N and M, merge them into a single sorted array.",
    inputDescription: "First line: N and M. Second line: N sorted integers. Third line: M sorted integers.",
    outputDescription: "Print space-separated merged sorted array.",
    constraints: "1 <= N, M <= 1000",
    examples: [{ input: "3 3\n1 3 5\n2 4 6", output: "1 2 3 4 5 6" }]
  },
  {
    _id: "q-18",
    questionNumber: 18,
    title: "18. Second Largest Element in Array",
    difficulty: "Medium",
    description: "Find the second largest distinct element in an array of N integers. Print -1 if it does not exist.",
    inputDescription: "First line contains N. Second line contains N integers.",
    outputDescription: "Print second largest element or -1.",
    constraints: "1 <= N <= 1000",
    examples: [{ input: "5\n12 35 1 10 34", output: "34" }]
  },
  {
    _id: "q-19",
    questionNumber: 19,
    title: "19. Count Occurrences of Character",
    difficulty: "Easy",
    description: "Given string S and character C, count how many times C appears in S.",
    inputDescription: "First line: string S. Second line: character C.",
    outputDescription: "Print character count.",
    constraints: "1 <= |S| <= 1000",
    examples: [{ input: "programming\ng", output: "2" }]
  },
  {
    _id: "q-20",
    questionNumber: 20,
    title: "20. Check Armstrong Number",
    difficulty: "Hard",
    description: "Determine if N is an Armstrong number (sum of digits raised to number of digits equals N). Print 'YES' or 'NO'.",
    inputDescription: "First line contains integer N.",
    outputDescription: "Print 'YES' or 'NO'.",
    constraints: "1 <= N <= 10^9",
    examples: [{ input: "153", output: "YES" }, { input: "123", output: "NO" }]
  }
];

function CodingPracticeModule() {
  // Navigation Page View: "overview" (Page 1) or "workspace" (Page 2)
  const [currentPage, setCurrentPage] = useState("overview");

  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState("python");

  // Active Console Tab: "OUTPUT" (default), "STDIN", "TERMINAL", "PROBLEMS"
  const [terminalTab, setTerminalTab] = useState("OUTPUT");

  // Custom Stdin input typed by user
  const [customStdin, setCustomStdin] = useState("");
  
  // Ref for horizontally scrolling the questions palette
  const paletteScrollRef = useRef(null);

  // Mouse Drag Resizing State for Top Split (Left = Question, Right = Compiler)
  const [leftWidthPercent, setLeftWidthPercent] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  // Independent code storage per question & language
  const [userCodes, setUserCodes] = useState({});
  const [questionStates, setQuestionStates] = useState({});

  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [outputResult, setOutputResult] = useState(null);

  // Fetch questions from Backend API
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const res = await api.get("/coding/questions");
        if (res.data && res.data.data && res.data.data.length > 0) {
          setQuestions(res.data.data);
          setSelectedQuestionIndex(0);
        }
      } catch (err) {
        console.warn("Using default rich 20-questions list fallback:", err);
      }
    };
    fetchQuestions();
  }, []);

  // Sync custom stdin default when selected question changes
  useEffect(() => {
    const curQ = questions[selectedQuestionIndex] || DEFAULT_QUESTIONS[0];
    if (curQ && curQ.examples && curQ.examples.length > 0) {
      setCustomStdin(curQ.examples[0].input || "");
    } else {
      setCustomStdin("");
    }
  }, [selectedQuestionIndex, questions]);

  // Load saved student progress from Backend API
  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await api.get("/coding/progress");
        if (res.data && res.data.data && res.data.data.savedProgress) {
          const loadedCodes = {};
          const loadedStates = {};

          res.data.data.savedProgress.forEach(p => {
            if (p.questionId) {
              if (!loadedCodes[p.questionId]) loadedCodes[p.questionId] = {};
              loadedCodes[p.questionId][p.language || "python"] = p.sourceCode;
              loadedStates[p.questionId] = p.status || "Started";
            }
          });

          setUserCodes(prev => ({ ...prev, ...loadedCodes }));
          setQuestionStates(prev => ({ ...prev, ...loadedStates }));
        }
      } catch (err) {
        console.warn("Loaded local progress fallback:", err);
      }
    };
    fetchProgress();
  }, []);

  // Mouse Drag Resizer Handler for adjusting Left (Question) and Right (Compiler) panel widths
  const handleMouseDownResize = (e) => {
    e.preventDefault();
    setIsDragging(true);

    const handleMouseMove = (moveEvent) => {
      const container = document.getElementById("workspace-top-split");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newLeftPx = moveEvent.clientX - rect.left;
      let newPercent = (newLeftPx / rect.width) * 100;
      if (newPercent < 20) newPercent = 20;
      if (newPercent > 80) newPercent = 80;
      setLeftWidthPercent(newPercent);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
  };

  // Scroll Question Palette Left / Right with Arrow Buttons
  const scrollPalette = (direction) => {
    if (paletteScrollRef.current) {
      const scrollAmount = direction === "left" ? -180 : 180;
      paletteScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  // Navigate Previous / Next Question
  const handlePrevQuestion = () => {
    setSelectedQuestionIndex(prev => Math.max(0, prev - 1));
    setOutputResult(null);
  };

  const handleNextQuestion = () => {
    setSelectedQuestionIndex(prev => Math.min(questions.length - 1, prev + 1));
    setOutputResult(null);
  };

  const currentQuestion = questions[selectedQuestionIndex] || DEFAULT_QUESTIONS[0];
  const currentQId = currentQuestion._id || `q-${currentQuestion.questionNumber || selectedQuestionIndex + 1}`;

  // Get code for current question & language (Defaults to General Syntax Template)
  const getCurrentCode = () => {
    if (userCodes[currentQId] && userCodes[currentQId][selectedLanguage] !== undefined) {
      return userCodes[currentQId][selectedLanguage];
    }
    if (currentQuestion.starterCode && currentQuestion.starterCode[selectedLanguage]) {
      return currentQuestion.starterCode[selectedLanguage];
    }
    return DEFAULT_GENERAL_SYNTAX[selectedLanguage] || `// General Syntax for ${selectedLanguage}\n// Write your code here...`;
  };

  // Update current code independently
  const handleCodeChange = (newCode) => {
    setUserCodes(prev => ({
      ...prev,
      [currentQId]: {
        ...(prev[currentQId] || {}),
        [selectedLanguage]: newCode
      }
    }));
  };

  // Start Test & Open Next Page (Workspace)
  const handleStartTest = async (qIdx = 0) => {
    if (qIdx !== undefined) setSelectedQuestionIndex(qIdx);
    const targetQ = questions[qIdx] || currentQuestion;
    const targetQId = targetQ._id || `q-${targetQ.questionNumber || qIdx + 1}`;

    setQuestionStates(prev => ({ ...prev, [targetQId]: prev[targetQId] || "Started" }));
    setCurrentPage("workspace");

    try {
      await api.put(`/coding/progress/${targetQId}`, {
        questionId: targetQId,
        language: selectedLanguage,
        code: getCurrentCode(),
        status: "Started"
      });
    } catch (e) {
      console.warn("Saved started status locally:", e);
    }
  };

  const [accumulatedInputs, setAccumulatedInputs] = useState([]);
  const [currentInlineInput, setCurrentInlineInput] = useState("");
  const [isWaitingInput, setIsWaitingInput] = useState(false);
  const inlineInputRef = useRef(null);

  // Validate language vs code compatibility before execution
  const validateLanguageCodeMatch = (lang, code) => {
    const trimCode = (code || "").trim();
    if (!trimCode) return null;

    if (lang === "python") {
      if (trimCode.includes("public class ") || trimCode.includes("System.out.print") || trimCode.includes("import java.")) {
        return "Language Mismatch\n\nThe editor contains Java code, but Python 3 is selected.\n\nPlease select Java in the language dropdown.";
      }
      if (trimCode.includes("#include <") || trimCode.includes("using namespace std")) {
        return "Language Mismatch\n\nThe editor contains C++ code, but Python 3 is selected.\n\nPlease select C++ in the language dropdown.";
      }
    } else if (lang === "java") {
      if (trimCode.startsWith("def ") || (trimCode.includes("print(") && !trimCode.includes("System.out"))) {
        return "Language Mismatch\n\nThe editor contains Python code, but Java is selected.\n\nPlease select Python 3 in the language dropdown.";
      }
    }
    return null;
  };

  // Compile & Run Code against Real Judge0 CE Compiler Engine via Backend API
  const handleCompileAndRun = async (overrideInputs = null) => {
    setRunning(true);
    setTerminalTab("OUTPUT");

    const inputsToUse = overrideInputs !== null ? overrideInputs : accumulatedInputs;
    const stdinToUse = inputsToUse.join("\n");

    const codeToRun = getCurrentCode();

    // Validate Language vs Code Compatibility
    const mismatch = validateLanguageCodeMatch(selectedLanguage, codeToRun);
    if (mismatch) {
      setOutputResult({
        isError: true,
        status: "Language Mismatch",
        output: mismatch
      });
      setRunning(false);
      setIsWaitingInput(false);
      return;
    }

    try {
      const data = await codingApi.runCode({
        questionId: currentQId,
        language: selectedLanguage,
        sourceCode: codeToRun,
        stdin: stdinToUse
      });

      const execData = data?.data || data || {};
      const status = execData.status || "Accepted";
      const stdout = execData.stdout || "";
      const stderr = execData.stderr || "";
      const compileOutput = execData.compileOutput || "";
      const timeStr = execData.time || "0.01s";
      const memoryVal = execData.memory ? `${execData.memory} KB` : "12 MB";

      let displayOutput = "";
      if (stdout) displayOutput += stdout;
      if (stderr) displayOutput += (displayOutput ? "\n\nError:\n" : "") + stderr;
      if (compileOutput) displayOutput += (displayOutput ? "\n\nCompiler Output:\n" : "") + compileOutput;
      if (!displayOutput.trim()) displayOutput = "No stdout returned.";

      const isErr = status !== "Accepted" && status !== "Success" && status !== "Execution Completed";

      setOutputResult({
        isError: isErr,
        status: status,
        output: displayOutput,
        executionTime: timeStr,
        memory: memoryVal
      });
      setIsWaitingInput(false);
    } catch (err) {
      console.error("Compile & Run connection error:", err);
      let errDetail = "Failed to reach backend compiler service.";
      if (!err.response) {
        errDetail = "Compiler server is unavailable.\nPlease check that the TAP backend server is running on http://127.0.0.1:8000 and Judge0 service is reachable.";
      } else if (err.response.data?.detail) {
        errDetail = typeof err.response.data.detail === "string" ? err.response.data.detail : JSON.stringify(err.response.data.detail);
      } else {
        errDetail = `Compiler service error (${err.response.status}).`;
      }

      setOutputResult({
        isError: true,
        status: "Execution Error",
        output: `Compilation/Server Error\n\n${errDetail}`
      });
      setIsWaitingInput(false);
    } finally {
      setRunning(false);
    }
  };

  // Handle Enter key inside inline terminal prompt
  const handleInlineInputSubmit = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const val = currentInlineInput;
      const nextInputs = [...accumulatedInputs, val];
      setAccumulatedInputs(nextInputs);
      setCurrentInlineInput("");
      handleCompileAndRun(nextInputs);
    }
  };

  // Reset interactive terminal history on clear
  const handleClearOutput = () => {
    setOutputResult(null);
    setAccumulatedInputs([]);
    setCurrentInlineInput("");
    setIsWaitingInput(false);
  };

  // Submit Code against Hidden Test Cases & Store Submission in Database
  const handleSubmitCode = async () => {
    setSubmitting(true);
    setTerminalTab("OUTPUT");
    setOutputResult(null);

    const codeToSubmit = getCurrentCode();

    try {
      const data = await codingApi.submitCode({
        questionId: currentQId,
        language: selectedLanguage,
        sourceCode: codeToSubmit
      });

      const subData = data?.data || data || {};
      const status = subData.status || "Accepted";
      const passed = subData.passedTests !== undefined ? subData.passedTests : 0;
      const total = subData.totalTests !== undefined ? subData.totalTests : 0;
      const timeStr = subData.executionTime || "0.01s";
      const memoryVal = subData.memory ? `${subData.memory} KB` : "12 MB";
      const stdout = subData.stdout || "";
      const stderr = subData.stderr || "";

      let displayOutput = stdout;
      if (stderr) displayOutput += (displayOutput ? "\n\nError:\n" : "") + stderr;

      if (status === "Accepted" || passed === total) {
        setOutputResult({
          isError: false,
          status: "Accepted",
          output: `${displayOutput ? displayOutput + "\n\n" : ""}✓ Status: Accepted (${passed}/${total} Hidden Test Cases Passed)\nScore: ${subData.score || 100}%`,
          executionTime: timeStr,
          memory: memoryVal
        });
        setQuestionStates(prev => ({ ...prev, [currentQId]: "Submitted" }));
      } else {
        setOutputResult({
          isError: true,
          status: status,
          output: `${displayOutput ? displayOutput + "\n\n" : ""}✗ Status: ${status} (${passed}/${total} Hidden Test Cases Passed)\nScore: ${subData.score || 0}%`,
          executionTime: timeStr,
          memory: memoryVal
        });
        setQuestionStates(prev => ({ ...prev, [currentQId]: "In Progress" }));
      }
    } catch (err) {
      console.error("Submission error:", err);
      const errDetail = err.response?.data?.detail || err.message || "Submission service unavailable.";
      setOutputResult({
        isError: true,
        status: "Submission Error",
        output: `Submission Error\n\n${errDetail}`
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Helper for question palette state style
  const getPaletteStateClass = (q, idx) => {
    const qId = q._id || `q-${q.questionNumber || idx + 1}`;
    const isSelected = idx === selectedQuestionIndex;
    const qState = questionStates[qId];

    let classes = "palette-btn";
    if (isSelected) classes += " active";
    if (qState === "Submitted") classes += " state-submitted";
    else if (qState === "Started") classes += " state-started";
    else classes += " state-unvisited";

    return classes;
  };

  const lineCount = (getCurrentCode() || "").split("\n").length || 1;
  const lineNumbers = Array.from({ length: Math.max(lineCount, 16) }, (_, i) => i + 1);

  const activeLangObj = POPULAR_LANGUAGES.find(l => l.id === selectedLanguage) || POPULAR_LANGUAGES[0];

  return (
    <DashboardLayout title="TAP Coding Lab">
      <div className="coding-lab-container">
        {/* =========================================================================
            PAGE 1: CLEAN & SIMPLE "CODING LAB" OVERVIEW
            ========================================================================= */}
        {currentPage === "overview" && (
          <div className="coding-overview-page">
            {/* Header & Simple Paragraph */}
            <div className="cl-overview-card">
              <h2 className="cl-main-title">Coding Lab</h2>
              <p className="cl-instructions-paragraph">
                Welcome to Coding Lab. Select a problem below and click <strong>Start Test</strong> to solve questions on our live compiler workspace.
              </p>
            </div>

            {/* VERTICAL LIST OF QUESTION ROWS (ROW 1 = Q1 + LEVEL + START, ROW 2 = Q2 ...) */}
            <div className="questions-rows-list">
              {questions.map((q, idx) => {
                const diffLevel = (q.difficulty || "Easy").toLowerCase();
                return (
                  <div key={q._id || idx} className="question-item-row">
                    {/* Left: Question Badge, Title & Difficulty Level */}
                    <div className="q-item-info">
                      <span className="q-item-num">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <div className="q-item-title-wrap">
                        <strong className="q-item-title">{q.title}</strong>
                        {q.description && (
                          <p className="q-item-desc">{q.description}</p>
                        )}
                      </div>
                      <span className={`q-level-pill ${diffLevel}`}>
                        {q.difficulty || "Easy"}
                      </span>
                    </div>

                    {/* Right: Start Test Button */}
                    <div className="q-item-action">
                      <button
                        className="btn-start-row-action"
                        onClick={() => handleStartTest(idx)}
                      >
                        ▶ Start Test
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================================
            PAGE 2: WORKSPACE PAGE WITH AUTHENTIC VS CODE INTEGRATED TERMINAL
            ========================================================================= */}
        {currentPage === "workspace" && (
          <div className="coding-workspace-page">
            {/* TOP NAVIGATION & QUESTION SWITCHER BAR WITH ARROWS (< 01 02 ... 20 >) */}
            <div className="workspace-top-nav">
              <button className="btn-back-overview" onClick={() => setCurrentPage("overview")}>
                ‹ Back to Overview
              </button>

              <div className="nav-questions-row">
                {/* INNER LEFT SCROLL & PREV QUESTION ARROW BUTTON */}
                <button
                  className="arrow-scroll-btn"
                  onClick={() => {
                    scrollPalette("left");
                    handlePrevQuestion();
                  }}
                  disabled={selectedQuestionIndex === 0}
                  title="Previous Question (‹)"
                >
                  ‹
                </button>

                <div className="row-questions-palette-scroll" ref={paletteScrollRef}>
                  {questions.map((q, idx) => (
                    <button
                      key={q._id || idx}
                      className={getPaletteStateClass(q, idx)}
                      onClick={() => {
                        setSelectedQuestionIndex(idx);
                        setOutputResult(null);
                      }}
                      title={q.title}
                    >
                      {String(idx + 1).padStart(2, "0")}
                    </button>
                  ))}
                </div>

                {/* INNER RIGHT SCROLL & NEXT QUESTION ARROW BUTTON */}
                <button
                  className="arrow-scroll-btn"
                  onClick={() => {
                    scrollPalette("right");
                    handleNextQuestion();
                  }}
                  disabled={selectedQuestionIndex === questions.length - 1}
                  title="Next Question (›)"
                >
                  ›
                </button>
              </div>
            </div>

            {/* TOP ROW: MOUSE DRAG RESIZABLE SPLIT (LEFT = QUESTION, RIGHT = COMPILER) */}
            <div className="workspace-top-split" id="workspace-top-split">
              {/* LEFT DIV: QUESTION & PROBLEM SPECIFICATION */}
              <div
                className="panel-question-display"
                style={{ width: `${leftWidthPercent}%` }}
              >
                <div className="q-header-meta">
                  <span className="q-num-badge">Question {String(selectedQuestionIndex + 1).padStart(2, "0")}</span>
                  {currentQuestion.difficulty && (
                    <span className={`q-level-pill ${(currentQuestion.difficulty).toLowerCase()}`}>
                      {currentQuestion.difficulty}
                    </span>
                  )}
                </div>

                <h3 className="q-problem-title">{currentQuestion.title}</h3>

                <div className="q-scroll-content">
                  <p className="q-desc-text">{currentQuestion.description}</p>

                  {currentQuestion.inputDescription && (
                    <div className="q-section">
                      <h4 className="q-sec-heading">Input Format</h4>
                      <p className="q-sec-text">{currentQuestion.inputDescription}</p>
                    </div>
                  )}

                  {currentQuestion.outputDescription && (
                    <div className="q-section">
                      <h4 className="q-sec-heading">Output Format</h4>
                      <p className="q-sec-text">{currentQuestion.outputDescription}</p>
                    </div>
                  )}

                  {currentQuestion.constraints && (
                    <div className="q-section">
                      <h4 className="q-sec-heading">Constraints</h4>
                      <p className="q-sec-text code-font">{currentQuestion.constraints}</p>
                    </div>
                  )}

                  {currentQuestion.examples && currentQuestion.examples.map((ex, i) => (
                    <div key={i} className="q-section">
                      <h4 className="q-sec-heading">Example {i + 1}</h4>
                      <div className="ex-box">
                        <div className="ex-sub"><strong>Input:</strong> <pre className="ex-pre">{ex.input}</pre></div>
                        <div className="ex-sub"><strong>Output:</strong> <pre className="ex-pre">{ex.output}</pre></div>
                      </div>
                    </div>
                  ))}

                  {/* HINTS SECTION DIRECTLY BELOW EXAMPLE */}
                  <div className="q-section q-hint-section">
                    <h4 className="q-sec-heading">💡 Hint</h4>
                    <div className="q-hint-box">
                      {currentQuestion.hint || "Try breaking down the problem into smaller sub-problems. Handle edge cases like empty inputs or negative values."}
                    </div>
                  </div>
                </div>
              </div>

              {/* MOUSE DRAG RESIZER BAR */}
              <div
                className={`workspace-resizer-bar ${isDragging ? "dragging" : ""}`}
                onMouseDown={handleMouseDownResize}
                title="Drag left/right to adjust Question and Compiler panel widths"
              >
                <div className="resizer-handle-icon">⋮</div>
              </div>

              {/* RIGHT DIV: CODING WRITING COMPILER & EDITOR */}
              <div
                className="panel-code-editor-fixed"
                style={{ width: `calc(${100 - leftWidthPercent}% - 8px)` }}
              >
                {/* COMPACT EDITOR CONTROLS ROW WITH POPULAR FAMILY LANGUAGES */}
                <div className="editor-control-bar">
                  <div className="lang-select-wrap">
                    <label className="lang-label">Language:</label>
                    <select
                      className="lang-dropdown-select"
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                    >
                      {POPULAR_LANGUAGES.map((lang) => (
                        <option key={lang.id} value={lang.id}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="action-buttons-wrap">
                    <button
                      className="btn-compile-run"
                      onClick={handleCompileAndRun}
                      disabled={running}
                      title="Compile & Run code on custom input"
                    >
                      {running ? "Running..." : "Compile & Run"}
                    </button>
                    <button
                      className="btn-submit-code"
                      onClick={handleSubmitCode}
                      disabled={submitting}
                      title="Submit solution against hidden test cases"
                    >
                      {submitting ? "Submitting..." : "Submit"}
                    </button>
                  </div>
                </div>

                {/* CODE EDITOR TEXTAREA WITH FIXED HEIGHT AND INTERNAL SCROLLBAR */}
                <div className="editor-area-fixed-scroll">
                  <div className="line-numbers-sidebar">
                    {lineNumbers.map((num) => (
                      <div key={num} className="line-num-cell">{num}</div>
                    ))}
                  </div>
                  <textarea
                    className="code-textarea-input-scroll"
                    value={getCurrentCode()}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="Write your code solution here..."
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>

            {/* CONTINUOUS INTERACTIVE TERMINAL CONSOLE */}
            <div className="vscode-terminal-container">
              {/* CLEAN HEADER: ONLY "Output" */}
              <div className="vscode-term-header">
                <div className="vscode-term-tabs">
                  <span className="clean-output-header-title">Output</span>
                </div>

                <div className="vscode-term-actions">
                  {outputResult && (
                    <button className="btn-clear-output" onClick={handleClearOutput} title="Clear Output">
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* CONTINUOUS SINGLE TERMINAL SCREEN WITH INLINE INPUT */}
              <div className="vscode-term-body">
                <div className="continuous-terminal-screen" onClick={() => inlineInputRef.current?.focus()}>
                  {outputResult ? (
                    <pre className={`terminal-text-content ${outputResult.isError ? "red-error" : ""}`}>
                      {outputResult.output}
                      {(isWaitingInput || outputResult.status === "Waiting for input") && (
                        <span className="inline-terminal-input-wrap">
                          <input
                            ref={inlineInputRef}
                            type="text"
                            className="inline-terminal-input"
                            value={currentInlineInput}
                            onChange={(e) => setCurrentInlineInput(e.target.value)}
                            onKeyDown={handleInlineInputSubmit}
                            placeholder="[type number / text & press Enter]"
                            autoFocus
                          />
                        </span>
                      )}
                    </pre>
                  ) : (
                    <pre className="terminal-text-content placeholder-text">
                      Click Compile & Run or Submit to see program execution output.
                    </pre>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default CodingPracticeModule;
