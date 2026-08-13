import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../services/api";
import "./AptitudeModule.css";

const fallbackQuestions = [
  {
    id: "q1",
    question: "A train 240 m long passes a pole in 24 seconds. How long will it take to pass a platform 650 m long?",
    options: ["65 sec", "89 sec", "100 sec", "150 sec"],
    correct_answer: 1,
    explanation: "Speed = 240/24 = 10 m/s. Total distance = 240 + 650 = 890 m. Time = 890 / 10 = 89 seconds.",
    category: "Quantitative Aptitude"
  },
  {
    id: "q2",
    question: "If CAT is coded as 3120, how is DOG coded in the same pattern?",
    options: ["4157", "41514", "41520", "3157"],
    correct_answer: 0,
    explanation: "Alphabet positions: C=3, A=1, T=20 -> 3120. D=4, O=15, G=7 -> 4157.",
    category: "Logical Reasoning"
  },
  {
    id: "q3",
    question: "Find the odd one out: 3, 5, 11, 14, 17, 21, 29",
    options: ["14", "21", "17", "11"],
    correct_answer: 0,
    explanation: "All other numbers except 14 are odd prime numbers.",
    category: "Logical Reasoning"
  },
  {
    id: "q4",
    question: "A father is twice as old as his son. 20 years ago, the father was 12 times as old as the son. What is the current age of the father?",
    options: ["44 years", "22 years", "48 years", "52 years"],
    correct_answer: 0,
    explanation: "Let son's age = x, father = 2x. 20 yrs ago: (2x - 20) = 12(x - 20) => 2x - 20 = 12x - 240 => 10x = 220 => x = 22. Father = 44.",
    category: "Quantitative Aptitude"
  }
];

function AptitudeModule() {
  const [questions, setQuestions] = useState(fallbackQuestions);
  const [assessmentId, setAssessmentId] = useState("assess-1");
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1800); // 30 minutes
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAssessment = async () => {
      try {
        const res = await api.get("/assessments?category=Aptitude");
        if (res.data && res.data.data && res.data.data.length > 0) {
          const assess = res.data.data[0];
          setAssessmentId(assess._id);
          if (assess.questions && assess.questions.length > 0) {
            setQuestions(assess.questions);
          }
          if (assess.duration_minutes) {
            setTimeLeft(assess.duration_minutes * 60);
          }
        }
      } catch (err) {
        console.error("Using fallback aptitude questions:", err);
      }
    };
    fetchAssessment();
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (isSubmitted || timeLeft <= 0) return;
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
  }, [isSubmitted, timeLeft]);

  const handleSelectOption = (qIdx, optionIdx) => {
    setAnswers({ ...answers, [qIdx]: optionIdx });
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await api.post(`/assessments/${assessmentId}/attempt`, {
        answers: answers,
        time_taken_seconds: 1800 - timeLeft,
      });

      if (res.data && res.data.data) {
        setResult(res.data.data);
      }
    } catch (err) {
      console.error("Local calculation fallback:", err);
      // Fallback local evaluation
      let correct = 0;
      questions.forEach((q, idx) => {
        if (answers[idx] === q.correct_answer) correct++;
      });
      setResult({
        total_questions: questions.length,
        correct_answers: correct,
        wrong_answers: Object.keys(answers).length - correct,
        unanswered: questions.length - Object.keys(answers).length,
        score: correct,
        total_marks: questions.length,
        percentage: ((correct / questions.length) * 100).toFixed(1),
        time_taken_seconds: 1800 - timeLeft,
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

  const currentQ = questions[currentIdx];

  return (
    <DashboardLayout title="Aptitude & Logical Reasoning Benchmark">
      <div className="aptitude-container">
        {!isSubmitted ? (
          <div className="test-interface">
            {/* TIMER & PROGRESS HEADER */}
            <div className="test-header">
              <div className="test-title">
                <h2>National Aptitude Assessment</h2>
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
                <span className="category-pill">{currentQ.category || "Aptitude"}</span>
                <h3 className="q-text">{currentIdx + 1}. {currentQ.question}</h3>

                <div className="options-grid">
                  {currentQ.options.map((opt, optIdx) => {
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
                      onClick={handleSubmit}
                      className="nav-btn submit"
                      disabled={loading}
                    >
                      {loading ? "Evaluating..." : "Submit Test 🚀"}
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
            <h2>🎉 Test Completed Successfully!</h2>
            <p className="result-subtitle">Here is your performance summary for this attempt:</p>

            <div className="score-summary-circle">
              <div className="big-score">{result?.percentage}%</div>
              <span>Score: {result?.score} / {result?.total_marks} Marks</span>
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
                <span className="res-val">{result?.time_taken_seconds || 120}s</span>
                <span className="res-lbl">Time Taken</span>
              </div>
            </div>

            {/* DETAILED EXPLANATIONS */}
            <div className="explanations-section">
              <h3>Answer Breakdown & Explanations</h3>
              {questions.map((q, idx) => {
                const userAns = answers[idx];
                const isCorrect = userAns === q.correct_answer;
                return (
                  <div key={idx} className={`exp-card ${isCorrect ? "correct" : "incorrect"}`}>
                    <h4>Q{idx + 1}: {q.question}</h4>
                    <p><strong>Your Answer:</strong> {userAns !== undefined ? q.options[userAns] : "Not Answered"}</p>
                    <p><strong>Correct Answer:</strong> {q.options[q.correct_answer]}</p>
                    <p className="exp-text"><strong>Explanation:</strong> {q.explanation}</p>
                  </div>
                );
              })}
            </div>

            <button onClick={() => window.location.reload()} className="retake-btn">
              🔄 Retake Test
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default AptitudeModule;
