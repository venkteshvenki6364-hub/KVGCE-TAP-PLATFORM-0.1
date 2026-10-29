import React, { useState, useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../services/api";
import codingApi from "../../services/codingApi";
import "./CodingPracticeModule.css";

// Comprehensive Judge0 Language Map & Configuration
const DEFAULT_LANGUAGES = [
  { id: "java", name: "Java (OpenJDK 13.0.1)", judge0Id: 62, ext: "Main.java", monaco: "java" },
  { id: "python", name: "Python 3 (3.8.1)", judge0Id: 71, ext: "main.py", monaco: "python" },
  { id: "cpp", name: "C++ (GCC 9.2.0)", judge0Id: 54, ext: "main.cpp", monaco: "cpp" },
  { id: "c", name: "C (GCC 9.2.0)", judge0Id: 50, ext: "main.c", monaco: "c" },
  { id: "javascript", name: "JavaScript (Node.js 12.14.0)", judge0Id: 63, ext: "main.js", monaco: "javascript" },
  { id: "typescript", name: "TypeScript (3.7.4)", judge0Id: 74, ext: "main.ts", monaco: "typescript" },
  { id: "csharp", name: "C# (Mono 6.6.0.161)", judge0Id: 51, ext: "Program.cs", monaco: "csharp" },
  { id: "go", name: "Go (1.13.5)", judge0Id: 60, ext: "main.go", monaco: "go" },
  { id: "rust", name: "Rust (1.40.0)", judge0Id: 73, ext: "main.rs", monaco: "rust" },
  { id: "php", name: "PHP (7.4.1)", judge0Id: 68, ext: "index.php", monaco: "php" },
  { id: "kotlin", name: "Kotlin (1.3.70)", judge0Id: 78, ext: "Main.kt", monaco: "kotlin" },
  { id: "swift", name: "Swift (5.2.3)", judge0Id: 83, ext: "main.swift", monaco: "swift" },
  { id: "ruby", name: "Ruby (2.7.0)", judge0Id: 72, ext: "main.rb", monaco: "ruby" },
  { id: "r", name: "R (4.0.0)", judge0Id: 80, ext: "main.r", monaco: "r" },
  { id: "sql", name: "SQL (SQLite 3.27.2)", judge0Id: 82, ext: "query.sql", monaco: "sql" }
];

// Exact Starter Templates specified in Requirement 4
const STARTER_TEMPLATES = {
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);

        int a = sc.nextInt();
        int b = sc.nextInt();

        System.out.println(a + b);

        sc.close();
    }
}`,

  python: `a, b = map(int, input().split())
print(a + b)`,

  cpp: `#include <iostream>
using namespace std;

int main() {
    long long a, b;
    cin >> a >> b;
    cout << a + b << endl;
    return 0;
}`,

  c: `#include <stdio.h>

int main() {
    long long a, b;
    scanf("%lld %lld", &a, &b);
    printf("%lld\\n", a + b);
    return 0;
}`,

  javascript: `const fs = require('fs');
const input = fs.readFileSync(0, 'utf8').trim().split(/\\s+/);
const a = Number(input[0]);
const b = Number(input[1]);
console.log(a + b);`,

  typescript: `import * as fs from 'fs';
const input = fs.readFileSync(0, 'utf8').trim().split(/\\s+/);
const a: number = Number(input[0]);
const b: number = Number(input[1]);
console.log(a + b);`,

  csharp: `using System;

public class Program {
    public static void Main(string[] args) {
        string[] input = Console.ReadLine().Split();
        long a = long.Parse(input[0]);
        long b = long.Parse(input[1]);
        Console.WriteLine(a + b);
    }
}`,

  go: `package main

import (
    "fmt"
)

func main() {
    var a, b int64
    fmt.Scan(&a, &b)
    fmt.Println(a + b)
}`,

  rust: `use std::io;

fn main() {
    let mut input = String::new();
    io::stdin().read_line(&mut input).unwrap();
    let nums: Vec<i64> = input.split_whitespace().map(|s| s.parse().unwrap()).collect();
    if nums.len() >= 2 {
        println!("{}", nums[0] + nums[1]);
    }
}`,

  php: `<?php
$input = explode(" ", trim(file_get_contents("php://stdin")));
$a = intval($input[0] ?? 0);
$b = intval($input[1] ?? 0);
echo ($a + $b) . "\\n";
?>`,

  kotlin: `import java.util.Scanner

fun main() {
    val sc = Scanner(System.\`in\`)
    val a = sc.nextLong()
    val b = sc.nextLong()
    println(a + b)
}`,

  swift: `import Foundation

if let line = readLine() {
    let parts = line.split(separator: " ").compactMap { Int64($0) }
    if parts.count >= 2 {
        print(parts[0] + parts[1])
    }
}`,

  ruby: `a, b = gets.split.map(&:to_i)
puts a + b`,

  r: `input <- readLines("stdin", n=1)
nums <- as.numeric(strsplit(input, "\\\\s+")[[1]])
cat(nums[1] + nums[2], "\\n")`,

  sql: `SELECT 10 + 20 AS Result;`
};

// Rich Default Questions
const DEFAULT_QUESTIONS = [
  {
    _id: "q-1",
    questionNumber: 1,
    title: "1. Sum of Two Integers",
    difficulty: "Easy",
    description: "Write a program that takes two space-separated integers A and B from standard input and prints their sum.",
    inputDescription: "First line contains two space-separated integers A and B.",
    outputDescription: "Print the integer sum of A and B on a single line.",
    constraints: "-10^9 <= A, B <= 10^9",
    examples: [{ input: "10 20", output: "30" }, { input: "-5 2", output: "-3" }],
    starterCode: STARTER_TEMPLATES
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
  }
];

function CodingPracticeModule() {
  const [currentPage, setCurrentPage] = useState("overview");

  const [questions, setQuestions] = useState(DEFAULT_QUESTIONS);
  const [selectedQuestionIndex, setSelectedQuestionIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState("java");
  const [supportedLanguages, setSupportedLanguages] = useState(DEFAULT_LANGUAGES);

  // Stdin & Terminal Panel State
  const [stdinText, setStdinText] = useState("10 20");
  const [activeConsoleTab, setActiveConsoleTab] = useState("stdout"); // Default to stdout for clean output view
  const [outputResult, setOutputResult] = useState(null);

  // Mouse Drag Resizing State for Top Split (Left = Question, Right = Compiler)
  const [leftWidthPercent, setLeftWidthPercent] = useState(48);
  const [isDragging, setIsDragging] = useState(false);

  // Storage for user code per question & per language
  const [userCodes, setUserCodes] = useState({});
  const [questionStates, setQuestionStates] = useState({});

  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [copied, setCopied] = useState(false);

  const paletteScrollRef = useRef(null);

  // Fetch Questions and Judge0 Languages from Backend API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const qRes = await api.get("/coding/questions");
        if (qRes.data && qRes.data.data && qRes.data.data.length > 0) {
          setQuestions(qRes.data.data);
        }
      } catch (err) {
        console.warn("Using default questions list fallback:", err);
      }

      try {
        const langRes = await codingApi.getLanguages();
        if (langRes && langRes.data && langRes.data.length > 0) {
          const mapKeyToId = (name, key) => {
            const k = (key || name).toLowerCase();
            if (k.includes("java")) return "java";
            if (k.includes("python")) return "python";
            if (k.includes("c++") || k.includes("cpp")) return "cpp";
            if (k.includes("c#") || k.includes("csharp")) return "csharp";
            if (k.includes("c") && !k.includes("c++") && !k.includes("c#")) return "c";
            if (k.includes("javascript") || k.includes("node")) return "javascript";
            if (k.includes("typescript")) return "typescript";
            if (k.includes("go")) return "go";
            if (k.includes("rust")) return "rust";
            if (k.includes("php")) return "php";
            if (k.includes("kotlin")) return "kotlin";
            if (k.includes("swift")) return "swift";
            if (k.includes("ruby")) return "ruby";
            if (k.includes("r") && !k.includes("rust")) return "r";
            if (k.includes("sql")) return "sql";
            return k.replace(/[^a-z0-9]/g, "");
          };

          const formatted = langRes.data.map(l => {
            const idKey = mapKeyToId(l.name, l.key);
            const defaultMatch = DEFAULT_LANGUAGES.find(d => d.id === idKey) || {};
            return {
              id: idKey,
              name: l.name,
              judge0Id: l.id,
              ext: defaultMatch.ext || "file.txt",
              monaco: defaultMatch.monaco || "plaintext"
            };
          });

          // De-duplicate formatted list
          const uniqueLangs = [];
          const seenIds = new Set();
          formatted.forEach(item => {
            if (!seenIds.has(item.id)) {
              seenIds.add(item.id);
              uniqueLangs.push(item);
            }
          });

          if (uniqueLangs.length > 0) {
            setSupportedLanguages(uniqueLangs);
          }
        }
      } catch (err) {
        console.warn("Languages backend check used default list:", err);
      }
    };
    fetchData();
  }, []);

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
              if (p.sourceCode) {
                loadedCodes[p.questionId][p.language || "java"] = p.sourceCode;
              }
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

  const currentQuestion = questions[selectedQuestionIndex] || DEFAULT_QUESTIONS[0];
  const currentQId = currentQuestion._id || `q-${currentQuestion.questionNumber || selectedQuestionIndex + 1}`;

  // Update default stdin whenever question changes
  useEffect(() => {
    if (currentQuestion.examples && currentQuestion.examples.length > 0 && currentQuestion.examples[0].input) {
      setStdinText(currentQuestion.examples[0].input);
    } else {
      setStdinText("10 20");
    }
  }, [selectedQuestionIndex, currentQuestion]);

  // Code Accessor with Template Fallback
  const getCurrentCode = () => {
    if (userCodes[currentQId] && userCodes[currentQId][selectedLanguage] !== undefined) {
      return userCodes[currentQId][selectedLanguage];
    }
    if (currentQuestion.starterCode && currentQuestion.starterCode[selectedLanguage]) {
      return currentQuestion.starterCode[selectedLanguage];
    }
    return STARTER_TEMPLATES[selectedLanguage] || `// Write your ${selectedLanguage} code here...\n`;
  };

  const handleCodeChange = (newCode) => {
    setUserCodes(prev => ({
      ...prev,
      [currentQId]: {
        ...(prev[currentQId] || {}),
        [selectedLanguage]: newCode
      }
    }));
  };

  const handleResetToTemplate = () => {
    const template = STARTER_TEMPLATES[selectedLanguage] || `// Write your ${selectedLanguage} code here...\n`;
    handleCodeChange(template);
  };

  // Resizer Mouse Handler
  const handleMouseDownResize = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  // Scroll Question Palette
  const scrollPalette = (direction) => {
    if (paletteScrollRef.current) {
      const scrollAmount = direction === "left" ? -180 : 180;
      paletteScrollRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    }
  };

  const handlePrevQuestion = () => {
    setSelectedQuestionIndex(prev => Math.max(0, prev - 1));
    setOutputResult(null);
  };

  const handleNextQuestion = () => {
    setSelectedQuestionIndex(prev => Math.min(questions.length - 1, prev + 1));
    setOutputResult(null);
  };

  const handleStartTest = async (qIdx = 0) => {
    setSelectedQuestionIndex(qIdx);
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
      console.warn("Saved started status:", e);
    }
  };

  // Compile & Run Code
  const handleCompileAndRun = async () => {
    setRunning(true);

    const codeToRun = getCurrentCode();
    const activeLangObj = supportedLanguages.find(l => l.id === selectedLanguage) || DEFAULT_LANGUAGES[0];
    const j0Id = activeLangObj.judge0Id || 62;

    try {
      const data = await codingApi.runCode({
        questionId: currentQId,
        languageId: j0Id,
        language: selectedLanguage,
        sourceCode: codeToRun,
        stdin: stdinText
      });

      const execData = data?.data || data || {};
      const statusRaw = execData.status || "Accepted";
      const stdout = execData.stdout !== undefined ? execData.stdout : "";
      const stderr = execData.stderr !== undefined ? execData.stderr : "";
      const compileOutput = execData.compileOutput !== undefined ? execData.compileOutput : "";
      const timeStr = execData.time || "0.01s";
      const memoryVal = execData.memory ? `${execData.memory} KB` : "12 MB";

      let displayStatus = "Accepted";
      let isErr = false;

      if (statusRaw === "Compilation Error" || compileOutput) {
        displayStatus = "Compilation Error";
        isErr = true;
        setActiveConsoleTab("stderr");
      } else if (statusRaw === "Runtime Error" || stderr) {
        displayStatus = "Runtime Error";
        isErr = true;
        setActiveConsoleTab("stderr");
      } else if (statusRaw === "Time Limit Exceeded") {
        displayStatus = "Time Limit Exceeded";
        isErr = true;
        setActiveConsoleTab("diagnostics");
      } else if (statusRaw === "API Network Error") {
        displayStatus = "API Network Error";
        isErr = true;
        setActiveConsoleTab("stderr");
      } else {
        displayStatus = statusRaw;
        isErr = !execData.success;
        setActiveConsoleTab("stdout");
      }

      setOutputResult({
        isError: isErr,
        status: displayStatus,
        stdout: stdout,
        stderr: stderr,
        compileOutput: compileOutput,
        executionTime: timeStr,
        memory: memoryVal
      });
    } catch (err) {
      console.error("Compile & Run error:", err);
      let errDetail = "Failed to communicate with compiler backend API.";
      if (err.response?.data?.detail) {
        errDetail = typeof err.response.data.detail === "string" ? err.response.data.detail : JSON.stringify(err.response.data.detail);
      } else if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
        errDetail = "Cannot connect to KVGCE-TAP Backend server on http://127.0.0.1:8000.\nPlease verify that the FastAPI backend server is running:\n  cd backend\n  python -m uvicorn app.main:app --port 8000";
      } else if (err.message) {
        errDetail = err.message;
      }

      setOutputResult({
        isError: true,
        status: "API Network Error",
        stdout: "",
        stderr: errDetail,
        compileOutput: "",
        executionTime: "0.00s",
        memory: "0 KB"
      });
      setActiveConsoleTab("stderr");
    } finally {
      setRunning(false);
    }
  };

  // Submit Code against hidden test cases
  const handleSubmitCode = async () => {
    if (submitting) return;
    setSubmitting(true);
    setOutputResult(null);

    const codeToSubmit = getCurrentCode();
    const activeLangObj = supportedLanguages.find(l => l.id === selectedLanguage) || DEFAULT_LANGUAGES[0];
    const j0Id = activeLangObj.judge0Id || 62;

    try {
      const data = await codingApi.submitCode({
        questionId: currentQId,
        languageId: j0Id,
        language: selectedLanguage,
        sourceCode: codeToSubmit
      });

      const subData = data?.data || data || {};
      const statusRaw = subData.status || "Accepted";
      const passed = subData.passedTests !== undefined ? subData.passedTests : 0;
      const total = subData.totalTests !== undefined ? subData.totalTests : 0;
      const scoreVal = subData.score !== undefined ? subData.score : (passed === total ? 10 : 0);
      const timeStr = subData.executionTime || "0.01s";
      const memoryVal = subData.memory ? `${subData.memory} KB` : "12 MB";
      const stdout = subData.stdout || "";
      const stderr = subData.stderr || "";
      const compileOutput = subData.compileOutput || "";

      const isAccepted = statusRaw === "Accepted" || (total > 0 && passed === total);
      const finalStatus = isAccepted ? "Accepted" : statusRaw;

      setOutputResult({
        isSubmit: true,
        isError: !isAccepted,
        status: `${finalStatus} (${passed}/${total} Test Cases Passed)`,
        stdout: stdout || `Passed ${passed} / ${total} test cases. Marks awarded: ${scoreVal} pts`,
        stderr: stderr,
        compileOutput: compileOutput,
        executionTime: timeStr,
        memory: memoryVal,
        passedCount: passed,
        totalCount: total,
        score: scoreVal
      });

      setQuestionStates(prev => ({ ...prev, [currentQId]: isAccepted ? "Submitted" : "Started" }));
      setActiveConsoleTab("diagnostics");

      try {
        await codingApi.saveProgress(currentQId, {
          language: selectedLanguage,
          code: codeToSubmit,
          status: isAccepted ? "Accepted" : "Attempted"
        });
      } catch (e) {
        console.warn("Progress save notice:", e);
      }
    } catch (err) {
      console.error("Submission error:", err);
      let errDetail = "Submission service connection failed.";
      if (err.response?.data?.detail) {
        errDetail = typeof err.response.data.detail === "string" ? err.response.data.detail : JSON.stringify(err.response.data.detail);
      } else if (err.code === "ERR_NETWORK" || err.message === "Network Error") {
        errDetail = "Cannot connect to KVGCE-TAP Backend server on http://127.0.0.1:8000.\nPlease verify that the FastAPI backend server is running:\n  cd backend\n  python -m uvicorn app.main:app --port 8000";
      } else if (err.message) {
        errDetail = err.message;
      }
      setOutputResult({
        isSubmit: true,
        isError: true,
        status: "Submission Error",
        stdout: "",
        stderr: errDetail,
        compileOutput: "",
        executionTime: "0.00s",
        memory: "0 KB"
      });
      setActiveConsoleTab("stderr");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearOutput = () => {
    setOutputResult(null);
  };

  const handleCopyOutput = () => {
    let copyText = "";
    if (activeConsoleTab === "stdin") copyText = stdinText;
    else if (activeConsoleTab === "stdout") copyText = outputResult?.stdout || "";
    else if (activeConsoleTab === "stderr") copyText = outputResult?.stderr || outputResult?.compileOutput || "";
    else if (activeConsoleTab === "diagnostics") copyText = `Status: ${outputResult?.status || ""}\nTime: ${outputResult?.executionTime || ""}\nMemory: ${outputResult?.memory || ""}`;

    navigator.clipboard.writeText(copyText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getPaletteStateClass = (q, idx) => {
    const qId = q._id || `q-${q.questionNumber || idx + 1}`;
    const isSelected = idx === selectedQuestionIndex;
    const qState = questionStates[qId];

    let classes = "palette-btn";
    if (isSelected) classes += " active";
    if (qState === "Submitted" || qState === "Accepted") classes += " state-submitted";
    else if (qState === "Started" || qState === "Attempted") classes += " state-started";
    else classes += " state-unvisited";

    return classes;
  };

  const currentLangObj = supportedLanguages.find(l => l.id === selectedLanguage) || DEFAULT_LANGUAGES[0];

  return (
    <DashboardLayout title="TAP Coding Lab">
      {/* Full-screen drag backdrop to ensure panel slider moves smoothly without Monaco capturing mouse events */}
      {isDragging && (
        <div
          className="resizer-drag-overlay"
          onMouseMove={(e) => {
            const container = document.getElementById("workspace-top-split");
            if (!container) return;
            const rect = container.getBoundingClientRect();
            const newLeftPx = e.clientX - rect.left;
            let newPercent = (newLeftPx / rect.width) * 100;
            if (newPercent < 20) newPercent = 20;
            if (newPercent > 80) newPercent = 80;
            setLeftWidthPercent(newPercent);
          }}
          onMouseUp={() => setIsDragging(false)}
        />
      )}

      <div className="coding-lab-container">
        {/* PAGE 1: QUESTIONS OVERVIEW */}
        {currentPage === "overview" && (
          <div className="coding-overview-page">
            <div className="cl-overview-card">
              <h2 className="cl-main-title">Coding Lab Workspace</h2>
              <p className="cl-instructions-paragraph">
                Solve coding problems, compile & execute solution code using Judge0 multi-language compiler engine, enter standard input, and submit your code for evaluation.
              </p>
            </div>

            <div className="questions-rows-list">
              {questions.map((q, idx) => {
                const diffLevel = (q.difficulty || "Easy").toLowerCase();
                const qId = q._id || `q-${q.questionNumber || idx + 1}`;
                const qState = questionStates[qId];
                return (
                  <div key={qId} className="question-item-row">
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
                      {qState === "Submitted" && <span className="badge-solved-pill">✓ Solved</span>}
                    </div>

                    <div className="q-item-action">
                      <button
                        className="btn-start-row-action"
                        onClick={() => handleStartTest(idx)}
                      >
                        ▶ Solve Challenge
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PAGE 2: WORKSPACE */}
        {currentPage === "workspace" && (
          <div className="coding-workspace-page">
            {/* TOP NAVIGATION & QUESTION PALETTE */}
            <div className="workspace-top-nav">
              <button className="btn-back-overview" onClick={() => setCurrentPage("overview")}>
                ‹ Back to Questions
              </button>

              <div className="nav-questions-row">
                <button
                  className="arrow-scroll-btn"
                  onClick={() => {
                    scrollPalette("left");
                    handlePrevQuestion();
                  }}
                  disabled={selectedQuestionIndex === 0}
                  title="Previous Question"
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

                <button
                  className="arrow-scroll-btn"
                  onClick={() => {
                    scrollPalette("right");
                    handleNextQuestion();
                  }}
                  disabled={selectedQuestionIndex === questions.length - 1}
                  title="Next Question"
                >
                  ›
                </button>
              </div>
            </div>

            {/* TOP ROW: RESIZABLE SPLIT (QUESTION & MONACO EDITOR) */}
            <div className="workspace-top-split" id="workspace-top-split">
              {/* LEFT PANEL: QUESTION DESCRIPTION */}
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

                  <div className="q-section q-hint-section">
                    <h4 className="q-sec-heading">💡 Code Hint</h4>
                    <div className="q-hint-box">
                      {currentQuestion.hint || "Read inputs using standard scanner or sys.stdin. Process inputs according to constraints and print the exact required output format."}
                    </div>
                  </div>
                </div>
              </div>

              {/* MOUSE DRAG RESIZABLE DIVIDER */}
              <div
                className={`workspace-resizer-bar ${isDragging ? "dragging" : ""}`}
                onMouseDown={handleMouseDownResize}
                title="Drag left/right to adjust panel width"
              >
                <div className="resizer-handle-icon">⋮</div>
              </div>

              {/* RIGHT PANEL: CODE EDITOR & CONTROLS */}
              <div
                className="panel-code-editor-fixed"
                style={{ width: `calc(${100 - leftWidthPercent}% - 8px)` }}
              >
                {/* EDITOR CONTROLS TOOLBAR */}
                <div className="editor-control-bar">
                  <div className="lang-select-wrap">
                    <label className="lang-label">Language:</label>
                    <select
                      className="lang-dropdown-select"
                      value={selectedLanguage}
                      onChange={(e) => setSelectedLanguage(e.target.value)}
                    >
                      {supportedLanguages.map((lang) => (
                        <option key={lang.id} value={lang.id}>
                          {lang.name}
                        </option>
                      ))}
                    </select>
                    <span className="file-ext-tag">{currentLangObj.ext || "file.txt"}</span>
                  </div>

                  <div className="action-buttons-wrap">
                    <button
                      className="btn-reset-template"
                      onClick={handleResetToTemplate}
                      title="Reset code to default language template"
                    >
                      Reset Template
                    </button>
                    <button
                      className="btn-compile-run"
                      onClick={handleCompileAndRun}
                      disabled={running || submitting}
                      title="Compile & Run code on input stdin"
                    >
                      {running ? "Running..." : "▶ Compile & Run"}
                    </button>
                    <button
                      className="btn-submit-code"
                      onClick={handleSubmitCode}
                      disabled={running || submitting}
                      title="Submit solution against test cases"
                    >
                      {submitting ? "Submitting..." : "✓ Submit"}
                    </button>
                  </div>
                </div>

                {/* MONACO CODE EDITOR */}
                <div className="editor-area-monaco-wrap">
                  <Editor
                    height="100%"
                    language={currentLangObj.monaco || "plaintext"}
                    theme="vs-dark"
                    value={getCurrentCode()}
                    onChange={(val) => handleCodeChange(val || "")}
                    options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 4,
                      wordWrap: "on",
                      lineNumbers: "on",
                      bracketPairColorization: { enabled: true },
                      autoClosingBrackets: "always",
                      autoClosingQuotes: "always",
                      formatOnPaste: true
                    }}
                  />
                </div>
              </div>
            </div>

            {/* BOTTOM SECTION: TERMINAL CONSOLE & ALWAYS-EDITABLE STDIN */}
            <div className="terminal-console-container">
              {/* ALWAYS-EDITABLE STDIN BAR */}
              <div className="terminal-top-stdin-bar">
                <div className="stdin-bar-left">
                  <span className="stdin-bar-icon">⌨</span>
                  <label className="stdin-bar-label">Standard Input (stdin):</label>
                  <input
                    type="text"
                    className="terminal-stdin-inline-input"
                    value={stdinText}
                    onChange={(e) => setStdinText(e.target.value)}
                    placeholder="Enter input (e.g. 10 20)..."
                    title="Type custom program test input here"
                  />
                </div>
                <div className="stdin-bar-right">
                  <button
                    className="btn-use-sample"
                    onClick={() => {
                      if (currentQuestion.examples && currentQuestion.examples.length > 0) {
                        setStdinText(currentQuestion.examples[0].input);
                      }
                    }}
                    title="Load default sample input for this question"
                  >
                    Reset Input
                  </button>
                  <button
                    className="btn-run-from-stdin"
                    onClick={handleCompileAndRun}
                    disabled={running || submitting}
                  >
                    {running ? "Running..." : "▶ Run with Input"}
                  </button>
                </div>
              </div>

              {/* TERMINAL HEADER & TABS */}
              <div className="term-tabs-header">
                <div className="term-tabs-left">
                  <button
                    className={`term-tab-btn ${activeConsoleTab === "stdout" ? "active" : ""}`}
                    onClick={() => setActiveConsoleTab("stdout")}
                  >
                    Output (stdout)
                  </button>
                  <button
                    className={`term-tab-btn ${activeConsoleTab === "stdin" ? "active" : ""}`}
                    onClick={() => setActiveConsoleTab("stdin")}
                  >
                    Multiline Input (stdin)
                  </button>
                  <button
                    className={`term-tab-btn ${activeConsoleTab === "stderr" ? "active" : ""}`}
                    onClick={() => setActiveConsoleTab("stderr")}
                  >
                    Error Output (stderr)
                  </button>
                  <button
                    className={`term-tab-btn ${activeConsoleTab === "diagnostics" ? "active" : ""}`}
                    onClick={() => setActiveConsoleTab("diagnostics")}
                  >
                    Compiler Diagnostics
                  </button>
                </div>

                <div className="term-status-right">
                  {running ? (
                    <span className="badge-term-status running">Executing Code...</span>
                  ) : outputResult ? (
                    <span className={`badge-term-status ${outputResult.isError ? "error" : "success"}`}>
                      {outputResult.status}
                    </span>
                  ) : null}

                  {outputResult?.executionTime && (
                    <span className="badge-metrics">
                      Time: {outputResult.executionTime} | Memory: {outputResult.memory}
                    </span>
                  )}

                  <button className="btn-copy-term" onClick={handleCopyOutput}>
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  {outputResult && (
                    <button className="btn-clear-term" onClick={handleClearOutput}>Clear</button>
                  )}
                </div>
              </div>

              {/* TERMINAL TAB CONTENT */}
              <div className="term-body-content">
                {/* TAB 1: STDOUT OUTPUT */}
                {activeConsoleTab === "stdout" && (
                  <div className="tab-pane-stdout">
                    {outputResult ? (
                      <pre className="terminal-pre-text stdout-text">
                        {outputResult.stdout || "(Program execution produced no standard output)"}
                      </pre>
                    ) : (
                      <div className="term-placeholder">
                        Enter input in the bar above and click <strong>▶ Compile & Run</strong> to see standard output.
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: MULTILINE STDIN EDITOR */}
                {activeConsoleTab === "stdin" && (
                  <div className="tab-pane-stdin">
                    <p className="stdin-label-hint">
                      Edit multiline standard input values for your program:
                    </p>
                    <textarea
                      className="stdin-textarea"
                      value={stdinText}
                      onChange={(e) => setStdinText(e.target.value)}
                      placeholder="Type custom test input here (e.g. 10 20)..."
                      spellCheck={false}
                    />
                  </div>
                )}

                {/* TAB 3: STDERR / COMPILE ERROR */}
                {activeConsoleTab === "stderr" && (
                  <div className="tab-pane-stderr">
                    {outputResult && (outputResult.stderr || outputResult.compileOutput) ? (
                      <pre className="terminal-pre-text stderr-text">
                        {outputResult.compileOutput || outputResult.stderr}
                      </pre>
                    ) : outputResult ? (
                      <div className="no-error-text">✓ No compilation or runtime errors reported.</div>
                    ) : (
                      <div className="term-placeholder">
                        Compiler error messages and exception stack traces will appear here.
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 4: DIAGNOSTICS & METRICS */}
                {activeConsoleTab === "diagnostics" && (
                  <div className="tab-pane-diagnostics">
                    {outputResult ? (
                      <div className="diagnostics-summary-card">
                        <div className="diag-row">
                          <strong className="diag-label">Execution Status:</strong>
                          <span className={`diag-value ${outputResult.isError ? "text-error" : "text-success"}`}>
                            {outputResult.status}
                          </span>
                        </div>
                        <div className="diag-row">
                          <strong className="diag-label">Execution Time:</strong>
                          <span className="diag-value">{outputResult.executionTime || "0.01s"}</span>
                        </div>
                        <div className="diag-row">
                          <strong className="diag-label">Memory Usage:</strong>
                          <span className="diag-value">{outputResult.memory || "12 KB"}</span>
                        </div>
                        {outputResult.isSubmit && (
                          <>
                            <div className="diag-row">
                              <strong className="diag-label">Test Cases Evaluation:</strong>
                              <span className="diag-value">{outputResult.passedCount} / {outputResult.totalCount} Passed</span>
                            </div>
                            <div className="diag-row">
                              <strong className="diag-label">Score Awarded:</strong>
                              <span className="diag-value">{outputResult.score} Points</span>
                            </div>
                          </>
                        )}
                        {outputResult.compileOutput && (
                          <div className="diag-box">
                            <strong>Compilation Output:</strong>
                            <pre className="ex-pre">{outputResult.compileOutput}</pre>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="term-placeholder">
                        Run or Submit code to view compiler diagnostic summary and execution metrics.
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default CodingPracticeModule;
