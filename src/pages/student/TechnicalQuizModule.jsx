import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../services/api";
import "./TechnicalQuizModule.css";

const defaultQuizzes = [
  {
    id: "t1",
    title: "Python & Data Science Fundamentals",
    questionsCount: 15,
    duration: 20,
    category: "Programming",
    difficulty: "Intermediate",
    questions: [
      {
        question: "Which data structure in Python is mutable and ordered?",
        options: ["Tuple", "List", "Set", "Dictionary Keys"],
        correct_answer: 1,
        explanation: "Lists are mutable and maintain insertion order in Python.",
      },
      {
        question: "What is the output of len({'a': 1, 'b': 2, 'a': 3})?",
        options: ["3", "2", "1", "SyntaxError"],
        correct_answer: 1,
        explanation: "Duplicate key 'a' overwrites the previous value, leaving 2 unique keys.",
      },
    ],
  },
  {
    id: "t2",
    title: "DBMS & SQL Query Optimization",
    questionsCount: 12,
    duration: 15,
    category: "Database",
    difficulty: "Advanced",
    questions: [
      {
        question: "Which SQL command is used to remove a table and its structure permanently?",
        options: ["DELETE", "TRUNCATE", "DROP", "REMOVE"],
        correct_answer: 2,
        explanation: "DROP TABLE deletes both data and table structure from the database.",
      },
    ],
  },
  {
    id: "t3",
    title: "Data Structures & Algorithmic Complexity",
    questionsCount: 10,
    duration: 15,
    category: "Core CS",
    difficulty: "Hard",
    questions: [
      {
        question: "What is the average time complexity of QuickSort?",
        options: ["O(n log n)", "O(n^2)", "O(n)", "O(log n)"],
        correct_answer: 0,
        explanation: "Average time complexity of QuickSort is O(n log n).",
      },
    ],
  },
];

function TechnicalQuizModule() {
  const [quizzes, setQuizzes] = useState(defaultQuizzes);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1200);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchQuizzes = async () => {
      let combined = [...defaultQuizzes];

      // 1. Fetch from Local Storage
      const localQuizzes = JSON.parse(localStorage.getItem("kvgce_published_quizzes") || "[]");
      const localTech = localQuizzes.filter((q) => q.category === "Technical" || q.category === "Technical Quiz");
      localTech.forEach((t) => {
        combined.unshift({
          id: t._id || "local-" + Date.now(),
          title: t.title,
          questionsCount: t.questions?.length || 5,
          duration: t.duration_minutes || 20,
          category: t.category || "Technical",
          difficulty: "Faculty Quiz",
          questions: t.questions,
        });
      });

      // 2. Fetch from Backend API
      try {
        const res = await api.get("/assessments?category=Technical");
        if (res.data && res.data.data && res.data.data.length > 0) {
          const apiTech = res.data.data;
          apiTech.forEach((t) => {
            if (!combined.some((c) => c.id === t._id || c.title === t.title)) {
              combined.unshift({
                id: t._id,
                title: t.title,
                questionsCount: t.questions?.length || 5,
                duration: t.duration_minutes || 20,
                category: t.category || "Technical",
                difficulty: "Published",
                questions: t.questions,
              });
            }
          });
        }
      } catch (err) {
        console.error("Loaded available quizzes:", err);
      }

      setQuizzes(combined);
    };
    fetchQuizzes();
  }, []);

  const handleStartQuiz = (q) => {
    setActiveQuiz(q);
    setCurrentIdx(0);
    setAnswers({});
    setTimeLeft((q.duration || 20) * 60);
    setIsSubmitted(false);
    setResult(null);
  };

  useEffect(() => {
    if (!activeQuiz || isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeQuiz, isSubmitted, timeLeft]);

  const handleSelectOption = (qIdx, optIdx) => {
    setAnswers({ ...answers, [qIdx]: optIdx });
  };

  const handleSubmit = async () => {
    if (!activeQuiz) return;
    setLoading(true);
    const questionsList = activeQuiz.questions || [];

    try {
      const res = await api.post(`/assessments/${activeQuiz.id}/attempt`, {
        assessment_id: activeQuiz.id,
        answers,
        time_taken_seconds: (activeQuiz.duration || 20) * 60 - timeLeft,
      });

      if (res.data && res.data.data) {
        setResult(res.data.data);
      }
    } catch (err) {
      console.warn("Calculating evaluation fallback:", err);
      let correct = 0;
      questionsList.forEach((q, idx) => {
        const userChoice = answers[idx];
        const correctAns = q.correct_answer;
        if (userChoice === correctAns) correct++;
      });
      const totalQ = questionsList.length || 1;
      setResult({
        total_questions: totalQ,
        correct_answers: correct,
        wrong_answers: Object.keys(answers).length - correct,
        unanswered: totalQ - Object.keys(answers).length,
        score: correct * 2,
        total_marks: totalQ * 2,
        percentage: ((correct / totalQ) * 100).toFixed(1),
        time_taken_seconds: (activeQuiz.duration || 20) * 60 - timeLeft,
      });
    } finally {
      setIsSubmitted(true);
      setLoading(false);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const activeQuestions = activeQuiz?.questions || [];
  const currentQ = activeQuestions[currentIdx];

  return (
    <DashboardLayout title="Technical Subject Quizzes">
      <div className="tech-quiz-page">
        {!activeQuiz ? (
          <>
            <div className="tech-quiz-header">
              <h2>Technical Domain Quizzes</h2>
              <p>Sharpen your core engineering skills with timed subject-wise quizzes created by faculty & admins.</p>
            </div>

            <div className="quiz-cards-grid">
              {quizzes.map((q) => (
                <div key={q.id} className="quiz-card">
                  <div className="quiz-card-top">
                    <span className="q-cat-tag">{q.category}</span>
                    <span className={`q-diff ${q.difficulty ? q.difficulty.toLowerCase().replace(" ", "-") : "intermediate"}`}>
                      {q.difficulty}
                    </span>
                  </div>

                  <h3>{q.title}</h3>
                  <p className="q-meta">{q.questionsCount} Questions • {q.duration} Minutes</p>

                  <button className="start-quiz-btn" onClick={() => handleStartQuiz(q)}>
                    Start Quiz 🚀
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : !isSubmitted ? (
          <div className="test-interface" style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", pb: "1rem" }}>
              <div>
                <button className="btn-outline-blue" onClick={() => setActiveQuiz(null)} style={{ marginBottom: "0.5rem" }}>
                  ← Exit Quiz
                </button>
                <h2 style={{ fontSize: "1.3rem", fontWeight: "700" }}>{activeQuiz.title}</h2>
              </div>
              <div style={{ background: "#eff6ff", color: "#1d4ed8", padding: "0.6rem 1.2rem", borderRadius: "8px", fontWeight: "700" }}>
                ⏱️ Time Left: {formatTime(timeLeft)}
              </div>
            </div>

            {currentQ ? (
              <div>
                <div style={{ marginBottom: "1rem", fontSize: "1.1rem", fontWeight: "600" }}>
                  Question {currentIdx + 1} of {activeQuestions.length}:
                </div>
                <h3 style={{ fontSize: "1.2rem", marginBottom: "1.2rem" }}>{currentQ.question}</h3>

                <div style={{ display: "grid", gap: "0.8rem", marginBottom: "1.5rem" }}>
                  {(currentQ.options || []).map((opt, optIdx) => {
                    const optText = typeof opt === "object" ? opt.text : opt;
                    const isSelected = answers[currentIdx] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(currentIdx, optIdx)}
                        style={{
                          textAlign: "left",
                          padding: "1rem 1.2rem",
                          borderRadius: "8px",
                          border: isSelected ? "2px solid #2563eb" : "1px solid #cbd5e1",
                          background: isSelected ? "#eff6ff" : "#ffffff",
                          fontWeight: isSelected ? "700" : "500",
                          cursor: "pointer",
                        }}
                      >
                        <span style={{ marginRight: "0.8rem", color: "#2563eb", fontWeight: "700" }}>
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        {optText}
                      </button>
                    );
                  })}
                </div>

                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <button
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx(currentIdx - 1)}
                    className="btn-outline-blue"
                  >
                    ← Previous
                  </button>

                  {currentIdx < activeQuestions.length - 1 ? (
                    <button onClick={() => setCurrentIdx(currentIdx + 1)} className="btn-solid-blue">
                      Next Question →
                    </button>
                  ) : (
                    <button onClick={handleSubmit} className="btn-solid-blue" disabled={loading} style={{ background: "#16a34a" }}>
                      {loading ? "Evaluating..." : "Submit Quiz 🚀"}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p>No questions available in this assessment.</p>
            )}
          </div>
        ) : (
          <div style={{ background: "#ffffff", padding: "2rem", borderRadius: "12px", textAlign: "center" }}>
            <h2>🎉 Quiz Completed!</h2>
            <div style={{ fontSize: "3rem", fontWeight: "800", color: "#16a34a", margin: "1rem 0" }}>
              {result?.percentage}%
            </div>
            <p style={{ fontSize: "1.1rem", marginBottom: "1.5rem" }}>
              Score: <strong>{result?.score}</strong> / {result?.total_marks} Marks ({result?.correct_answers} Correct, {result?.wrong_answers} Wrong)
            </p>

            <button onClick={() => setActiveQuiz(null)} className="btn-solid-blue">
              ← Back to Technical Quizzes
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default TechnicalQuizModule;
