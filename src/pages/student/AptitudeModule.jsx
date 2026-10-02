import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../services/api";
import "./AptitudeModule.css";

const getScoreColorClass = (pct) => {
  const num = Number(pct);
  if (num < 40) return "red";
  if (num < 60) return "orange";
  if (num < 85) return "blue";
  return "green";
};

const DEFAULT_APTITUDE_TESTS = [
  {
    _id: "default-quant-1",
    title: "Quantitative Aptitude Benchmark Test",
    description: "Benchmark test covering speed, time-distance, ages, work-time, and numerical problem solving.",
    category: "Quantitative Aptitude",
    duration_minutes: 20,
    total_marks: 8,
    questions: [
      {
        question: "A train 240 m long passes a pole in 24 seconds. How long will it take to pass a platform 650 m long?",
        options: ["65 sec", "89 sec", "100 sec", "150 sec"],
        correct_answer: 1,
        explanation: "Speed = 240/24 = 10 m/s. Total distance = 240 + 650 = 890 m. Time = 890 / 10 = 89 seconds.",
        category: "Quantitative Aptitude"
      },
      {
        question: "A father is twice as old as his son. 20 years ago, the father was 12 times as old as the son. What is the current age of the father?",
        options: ["44 years", "22 years", "48 years", "52 years"],
        correct_answer: 0,
        explanation: "Let son's age = x, father = 2x. 20 yrs ago: (2x - 20) = 12(x - 20) => 2x - 20 = 12x - 240 => 10x = 220 => x = 22. Father = 44.",
        category: "Quantitative Aptitude"
      },
      {
        question: "A car covers a distance of 432 km at a speed of 48 km/h. How much time will it take to cover the same distance at 72 km/h?",
        options: ["6 hours", "8 hours", "9 hours", "10 hours"],
        correct_answer: 0,
        explanation: "Time = Distance / Speed = 432 / 72 = 6 hours.",
        category: "Quantitative Aptitude"
      },
      {
        question: "If 15 men can complete a project in 20 days, how many days will 25 men take to complete the same project?",
        options: ["12 days", "15 days", "10 days", "18 days"],
        correct_answer: 0,
        explanation: "M1 * D1 = M2 * D2 => 15 * 20 = 25 * D2 => D2 = 300 / 25 = 12 days.",
        category: "Quantitative Aptitude"
      }
    ]
  },
  {
    _id: "default-logical-1",
    title: "Logical & Placement Reasoning Assessment",
    description: "Evaluates pattern recognition, coding-decoding, and logical series problem solving.",
    category: "Logical Reasoning",
    duration_minutes: 15,
    total_marks: 8,
    questions: [
      {
        question: "If CAT is coded as 3120, how is DOG coded in the same pattern?",
        options: ["4157", "41514", "41520", "3157"],
        correct_answer: 0,
        explanation: "Alphabet positions: C=3, A=1, T=20 -> 3120. D=4, O=15, G=7 -> 4157.",
        category: "Logical Reasoning"
      },
      {
        question: "Find the odd one out: 3, 5, 11, 14, 17, 21, 29",
        options: ["14", "21", "17", "11"],
        correct_answer: 0,
        explanation: "All other numbers except 14 are odd prime numbers.",
        category: "Logical Reasoning"
      },
      {
        question: "Look at this series: 2, 6, 12, 20, 30, ... What number should come next?",
        options: ["42", "36", "40", "48"],
        correct_answer: 0,
        explanation: "Differences increase by +2: +4, +6, +8, +10. Next addition is +12 => 30 + 12 = 42.",
        category: "Logical Reasoning"
      },
      {
        question: "Pointing to a photograph of a man, Rahul said, 'His mother is the only daughter of my mother.' How is Rahul related to the man in the photograph?",
        options: ["Maternal Uncle", "Father", "Brother", "Grandfather"],
        correct_answer: 0,
        explanation: "Rahul's mother's only daughter is Rahul's sister. The man's mother is Rahul's sister. Hence Rahul is his maternal uncle.",
        category: "Logical Reasoning"
      }
    ]
  }
];

function AptitudeModule() {
  const [availableTests, setAvailableTests] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);

  // Active test state
  const [activeTest, setActiveTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1800); // seconds
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Load available tests and previous student attempts
  const fetchTestsAndAttempts = async () => {
    setLoadingTests(true);
    try {
      const [testsRes, attemptsRes] = await Promise.all([
        api.get("/assessments?category=Aptitude").catch(() => ({ data: { data: [] } })),
        api.get("/assessments/attempts/my").catch(() => ({ data: { data: [] } }))
      ]);

      let tests = testsRes.data?.data || [];
      let attempts = attemptsRes.data?.data || [];

      // Merge local storage attempts
      const localAttempts = JSON.parse(localStorage.getItem("kvgce_aptitude_attempts") || "[]");
      localAttempts.forEach((la) => {
        if (!attempts.some((a) => a.assessment_id === la.assessment_id)) {
          attempts.push(la);
        }
      });

      // Also check local storage published quizzes
      const localQuizzes = JSON.parse(localStorage.getItem("kvgce_published_quizzes") || "[]");
      const aptQuizzes = localQuizzes.filter((q) => q.category === "Aptitude" || q.category === "Aptitude Test");

      aptQuizzes.forEach((lq) => {
        if (!tests.some((t) => t._id === lq._id || t.title === lq.title)) {
          tests.push({
            _id: lq._id || "local_" + Date.now(),
            title: lq.title || "Aptitude Assessment",
            description: lq.description || "Talent Assessment test",
            category: lq.category || "Aptitude",
            duration_minutes: lq.duration_minutes || 30,
            total_marks: lq.total_marks || (lq.questions?.length * 2) || 10,
            questions: lq.questions || [],
            creator_name: "Faculty Member"
          });
        }
      });

      // If still no tests, use default fallback aptitude tests
      if (tests.length === 0) {
        tests = DEFAULT_APTITUDE_TESTS;
      }

      setAvailableTests(tests);
      setMyAttempts(attempts);
    } catch (err) {
      console.error("Error fetching aptitude tests:", err);
      setAvailableTests(DEFAULT_APTITUDE_TESTS);
    } finally {
      setLoadingTests(false);
    }
  };

  useEffect(() => {
    fetchTestsAndAttempts();
  }, []);

  // Countdown timer effect during test
  useEffect(() => {
    if (!activeTest || isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTest, isSubmitted, timeLeft]);

  // Start selected test
  const handleStartTest = (test) => {
    setActiveTest(test);
    setQuestions(test.questions || []);
    setCurrentIdx(0);
    setAnswers({});
    setTimeLeft((test.duration_minutes || 30) * 60);
    setIsSubmitted(false);
    setResult(null);
  };

  // Select Option
  const handleSelectOption = (qIdx, optionIdx) => {
    setAnswers({ ...answers, [qIdx]: optionIdx });
  };

  // Submit test
  const handleSubmitTest = async () => {
    if (submitting || !activeTest) return;
    setSubmitting(true);
    const durationTotal = (activeTest.duration_minutes || 30) * 60;
    const timeTaken = durationTotal - timeLeft;

    try {
      const res = await api.post(`/assessments/${activeTest._id}/attempt`, {
        answers: answers,
        time_taken_seconds: timeTaken
      });

      if (res.data && res.data.data) {
        setResult(res.data.data);
      }
    } catch (err) {
      console.warn("Backend evaluation fallback:", err);
      // Local fallback calculation
      let correct = 0;
      let evaluatedQs = [];
      questions.forEach((q, idx) => {
        const userChoice = answers[idx];
        const isCorrect = userChoice === q.correct_answer;
        if (isCorrect) correct++;
        evaluatedQs.push({
          ...q,
          user_choice: userChoice,
          is_correct: isCorrect
        });
      });

      const totalMarks = questions.length * 2;
      const score = correct * 2;
      const pct = roundNum((correct / (questions.length || 1)) * 100);

      setResult({
        assessment_title: activeTest.title,
        total_questions: questions.length,
        correct_answers: correct,
        wrong_answers: Object.keys(answers).length - correct,
        unanswered: questions.length - Object.keys(answers).length,
        score: score,
        total_marks: totalMarks,
        percentage: pct,
        time_taken_seconds: timeTaken,
        questions: evaluatedQs
      });
    } finally {
      setIsSubmitted(true);
      setSubmitting(false);

      // Save attempt locally so cards display status badge immediately
      const newAttemptRecord = {
        assessment_id: activeTest._id,
        assessment_title: activeTest.title,
        score: result?.score || (Object.values(answers).length * 2),
        total_marks: activeTest.total_marks || (questions.length * 2),
        percentage: result?.percentage || 100,
        submitted_at: new Date().toISOString()
      };

      const existingLocal = JSON.parse(localStorage.getItem("kvgce_aptitude_attempts") || "[]");
      const updatedLocal = [...existingLocal.filter(a => a.assessment_id !== activeTest._id), newAttemptRecord];
      localStorage.setItem("kvgce_aptitude_attempts", JSON.stringify(updatedLocal));

      setMyAttempts(prev => [...prev.filter(a => a.assessment_id !== activeTest._id), newAttemptRecord]);
      fetchTestsAndAttempts();
    }
  };

  const roundNum = (n) => Math.round(n * 10) / 10;

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getAttemptForTest = (testId) => {
    const matches = myAttempts.filter((a) => a.assessment_id === testId);
    if (matches.length === 0) return null;
    return matches.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))[0];
  };

  // Render Test Selection Grid if no test is selected
  if (!activeTest) {
    return (
      <DashboardLayout title="Aptitude & Placement Benchmark Tests">
        <div className="aptitude-container">
          <div className="aptitude-header-banner">
            <h2>🎯 National & Placement Aptitude Assessments</h2>
            <p>Select an aptitude evaluation test below to begin. Enforce time limits, instant scoring, and performance tracking.</p>
          </div>

          {loadingTests ? (
            <div style={{ textAlign: "center", padding: "3rem" }}>Loading available aptitude tests...</div>
          ) : (
            <div className="tests-grid">
              {availableTests.map((test) => {
                const prevAttempt = getAttemptForTest(test._id);
                const qCount = test.questions?.length || 5;
                const duration = test.duration_minutes || 20;
                const colorClass = prevAttempt ? getScoreColorClass(prevAttempt.percentage) : "neutral";

                return (
                  <div key={test._id} className="test-card">
                    <div className="test-card-top">
                      <span className="test-card-category">{test.category || "Aptitude"}</span>
                      <h3 className="test-card-title">{test.title}</h3>
                      <p className="test-card-desc">{test.description || "Assess numerical, logical, and placement reasoning skills."}</p>
                      
                      <div className="test-card-meta">
                        <span>❓ {qCount} Questions</span>
                        <span>⏱️ {duration} Mins</span>
                      </div>
                    </div>

                    <div className="test-card-bottom">
                      <div className="test-card-status">
                        <span style={{ fontSize: "0.85rem", color: "#64748b" }}>Status:</span>
                        {prevAttempt ? (
                          <span className={`status-badge-pill ${colorClass}`}>
                            Completed • {prevAttempt.score}/{prevAttempt.total_marks || (qCount * 2)} ({prevAttempt.percentage}%)
                          </span>
                        ) : (
                          <span className="status-badge-pill neutral">Not Attempted</span>
                        )}
                      </div>

                      <button
                        className="btn-start-test"
                        onClick={() => handleStartTest(test)}
                      >
                        {prevAttempt ? "🔄 Retake Test" : "🚀 Start Test"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Active Test or Results View
  const currentQ = questions[currentIdx] || {
    question: "Sample Question",
    options: ["Option A", "Option B", "Option C", "Option D"]
  };

  const scoreColor = getScoreColorClass(result?.percentage || 0);

  return (
    <DashboardLayout title={`Aptitude Test: ${activeTest.title}`}>
      <div className="aptitude-container">
        <button className="btn-back-link" onClick={() => setActiveTest(null)}>
          ← Back to Aptitude Tests
        </button>

        {!isSubmitted ? (
          <div className="test-interface">
            {/* TIMER & PROGRESS HEADER */}
            <div className="test-header">
              <div className="test-title">
                <h2>{activeTest.title}</h2>
                <span className="q-count-badge">
                  Question {currentIdx + 1} of {questions.length}
                </span>
              </div>
              <div className="timer-badge">
                ⏱️ Time Remaining: <strong>{formatTime(timeLeft)}</strong>
              </div>
            </div>

            <div className="test-body">
              {/* QUESTION CARD */}
              <div className="question-card">
                <span className="category-pill">{currentQ.category || activeTest.category || "Aptitude"}</span>
                <h3 className="q-text">{currentIdx + 1}. {currentQ.question}</h3>

                <div className="options-grid">
                  {(currentQ.options || []).map((opt, optIdx) => {
                    const isSelected = answers[currentIdx] === optIdx;
                    return (
                      <button
                        key={optIdx}
                        type="button"
                        className={`option-btn ${isSelected ? "selected" : ""}`}
                        onClick={() => handleSelectOption(currentIdx, optIdx)}
                      >
                        <span className="option-letter">{String.fromCharCode(65 + optIdx)}</span>
                        <span className="option-text">{opt}</span>
                      </button>
                    );
                  })}
                </div>

                {/* NAVIGATION BUTTONS */}
                <div className="q-nav-actions">
                  <button
                    disabled={currentIdx === 0}
                    onClick={() => setCurrentIdx(currentIdx - 1)}
                    className="nav-btn prev"
                  >
                    ← Previous
                  </button>

                  {currentIdx < questions.length - 1 ? (
                    <button
                      onClick={() => setCurrentIdx(currentIdx + 1)}
                      className="nav-btn next"
                    >
                      Next Question →
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmitTest}
                      className="nav-btn submit"
                      disabled={submitting}
                    >
                      {submitting ? "Evaluating..." : "Submit Test 🚀"}
                    </button>
                  )}
                </div>
              </div>

              {/* QUESTION PALETTE */}
              <div className="palette-card">
                <h4>Question Navigation Palette</h4>
                <div className="palette-grid">
                  {questions.map((_, idx) => {
                    const isAnswered = answers[idx] !== undefined;
                    const isCurrent = idx === currentIdx;
                    return (
                      <button
                        key={idx}
                        className={`palette-num ${isCurrent ? "current" : ""} ${isAnswered ? "answered" : ""}`}
                        onClick={() => setCurrentIdx(idx)}
                      >
                        {idx + 1}
                      </button>
                    );
                  })}
                </div>
                <div className="palette-legend">
                  <span><span className="legend-box answered"></span> Answered</span>
                  <span><span className="legend-box"></span> Unanswered</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* RESULT SCORE CARD */
          <div className="result-card">
            <h2>🎉 Test Completed: {activeTest.title}</h2>
            <p className="result-subtitle">Here is your performance summary for this attempt:</p>

            <div className={`score-summary-circle ${scoreColor}`}>
              <div className="big-score">{result?.percentage}%</div>
              <span style={{ fontSize: "0.85rem" }}>Score: {result?.score} / {result?.total_marks} Marks</span>
            </div>

            <div className="result-stats-grid">
              <div className="res-stat-item green">
                <span className="res-val">{result?.correct_answers}</span>
                <span className="res-lbl">Correct</span>
              </div>
              <div className="res-stat-item red">
                <span className="res-val">{result?.wrong_answers}</span>
                <span className="res-lbl">Wrong</span>
              </div>
              <div className="res-stat-item gray">
                <span className="res-val">{result?.unanswered}</span>
                <span className="res-lbl">Unanswered</span>
              </div>
              <div className="res-stat-item blue">
                <span className="res-val">{result?.time_taken_seconds || 60}s</span>
                <span className="res-lbl">Time Taken</span>
              </div>
            </div>

            {/* DETAILED EXPLANATIONS */}
            <div className="explanations-section">
              <h3>Answer Breakdown & Explanations</h3>
              {(result?.questions || questions).map((q, idx) => {
                const userAns = answers[idx] !== undefined ? answers[idx] : q.user_choice;
                const isCorrect = q.is_correct !== undefined ? q.is_correct : (userAns === q.correct_answer);
                const correctIdx = q.correct_answer !== undefined ? q.correct_answer : 0;
                
                return (
                  <div key={idx} className={`exp-card ${isCorrect ? "correct" : "incorrect"}`}>
                    <h4 style={{ margin: "0 0 0.5rem 0", color: "#1e293b" }}>Q{idx + 1}: {q.question}</h4>
                    <p style={{ margin: "0.25rem 0" }}>
                      <strong>Your Answer:</strong> {userAns !== undefined && q.options && q.options[userAns] ? q.options[userAns] : "Not Answered"}
                      {isCorrect ? " ✓" : " ✗"}
                    </p>
                    {q.options && q.options[correctIdx] && (
                      <p style={{ margin: "0.25rem 0", color: "#166534" }}>
                        <strong>Correct Answer:</strong> {q.options[correctIdx]}
                      </p>
                    )}
                    {q.explanation && (
                      <p className="exp-text" style={{ margin: "0.5rem 0 0 0", fontSize: "0.9rem", color: "#475569" }}>
                        <strong>Explanation:</strong> {q.explanation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div>
              <button onClick={() => handleStartTest(activeTest)} className="retake-btn">
                🔄 Retake Test
              </button>
              <button onClick={() => setActiveTest(null)} className="btn-secondary-action">
                ← Back to Tests List
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default AptitudeModule;

