import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../services/api";
import "./StudentHistoryPage.css";

const DEFAULT_APTITUDE_TESTS = [
  {
    _id: "default-quant-1",
    title: "Quantitative Aptitude Benchmark",
    description: "Speed, time-distance, ages, work-time, and numerical problem solving.",
    category: "Aptitude",
    duration_minutes: 20,
    total_marks: 8,
    type: "aptitude"
  },
  {
    _id: "default-logical-1",
    title: "Logical & Placement Reasoning",
    description: "Pattern recognition, coding-decoding, logical deduction, and series sequence analysis.",
    category: "Aptitude",
    duration_minutes: 15,
    total_marks: 8,
    type: "aptitude"
  },
  {
    _id: "default-verbal-1",
    title: "Verbal & Vocabulary Skills",
    description: "Grammar accuracy, sentence completion, synonyms, antonyms, and comprehension.",
    category: "Aptitude",
    duration_minutes: 25,
    total_marks: 8,
    type: "aptitude"
  },
  {
    _id: "default-di-1",
    title: "Data Interpretation & Speed Math",
    description: "Data tables, chart analysis, ratios, averages, and rapid calculation techniques.",
    category: "Aptitude",
    duration_minutes: 30,
    total_marks: 8,
    type: "aptitude"
  },
  {
    _id: "default-tech-apt-1",
    title: "Technical & Pseudocode Aptitude",
    description: "Loop tracing, recursion depth, bitwise operations, and memory logic.",
    category: "Aptitude",
    duration_minutes: 20,
    total_marks: 8,
    type: "aptitude"
  },
  {
    _id: "default-spatial-1",
    title: "Spatial & Diagrammatic Reasoning",
    description: "3D cube rotation, edge coloring patterns, visual sequence, and geometric angles.",
    category: "Aptitude",
    duration_minutes: 15,
    total_marks: 8,
    type: "aptitude"
  },
  {
    _id: "default-probability-1",
    title: "Probability & Combinatorics",
    description: "Permutations, combinations, card draws, dice totals, and sample spaces.",
    category: "Aptitude",
    duration_minutes: 20,
    total_marks: 8,
    type: "aptitude"
  },
  {
    _id: "default-financial-1",
    title: "Commercial Math & Business Aptitude",
    description: "Simple and compound interest, profit & loss, discounts, and ratio mixtures.",
    category: "Aptitude",
    duration_minutes: 25,
    total_marks: 8,
    type: "aptitude"
  }
];

const getScoreColorClass = (pct) => {
  const num = parseFloat(pct || 0);
  if (num >= 85) return "pct-green";
  if (num >= 70) return "pct-blue";
  if (num >= 50) return "pct-orange";
  return "pct-red";
};

function StudentHistoryPage() {
  const navigate = useNavigate();
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHistoryData = async () => {
      setLoading(true);
      try {
        const [attemptsRes, testsRes] = await Promise.all([
          api.get("/assessments/attempts/my").catch(() => ({ data: { data: [] } })),
          api.get("/assessments").catch(() => ({ data: { data: [] } }))
        ]);

        let apiAttempts = attemptsRes.data?.data || [];
        let apiTests = testsRes.data?.data || [];

        const localAptAttempts = JSON.parse(localStorage.getItem("kvgce_aptitude_attempts") || "[]");
        const localQuizAttempts = JSON.parse(localStorage.getItem("kvgce_quiz_attempts") || "[]");
        const allLocalAttempts = [...localAptAttempts, ...localQuizAttempts];

        const attemptMap = {};
        apiAttempts.forEach((att) => {
          const id = att.assessment_id || att._id;
          if (id) attemptMap[id] = att;
        });
        allLocalAttempts.forEach((att) => {
          const id = att.assessment_id;
          if (id && !attemptMap[id]) {
            attemptMap[id] = att;
          }
        });

        let combinedTests = [...apiTests];
        DEFAULT_APTITUDE_TESTS.forEach((dt) => {
          if (!combinedTests.some((t) => t._id === dt._id || t.title === dt.title)) {
            combinedTests.push(dt);
          }
        });

        const rows = combinedTests
          .map((test) => {
            const attempt = attemptMap[test._id];
            const isCompleted = Boolean(attempt);
            const scoreVal = attempt?.score !== undefined ? attempt.score : null;
            const totalVal = attempt?.total_marks || test.total_marks || 8;
            let pctVal = attempt?.percentage !== undefined ? attempt.percentage : null;
            if (pctVal === null && scoreVal !== null) {
              pctVal = (scoreVal / totalVal) * 100;
            }

            return {
              id: test._id,
              title: test.title,
              description: test.description || "Talent and skills evaluation test.",
              category: test.category || "Aptitude Assessment",
              duration: test.duration_minutes || 20,
              type: test.type || "aptitude",
              isCompleted: isCompleted,
              attempt: attempt || null,
              score: scoreVal,
              totalMarks: totalVal,
              percentage: pctVal !== null ? parseFloat(pctVal).toFixed(2) : "0.00",
              submittedAt: attempt?.submitted_at || null
            };
          })
          .filter((item) => item.isCompleted);

        setHistoryItems(rows);
      } catch (err) {
        console.error("Error loading student history:", err);
      } finally {
        setLoading(false);
      }
    };

    loadHistoryData();
  }, []);

  const handleViewAnswerSheet = (item) => {
    navigate(`/student/aptitude?testId=${item.id}&viewResult=true`);
  };

  return (
    <DashboardLayout title="Assessment History & Result Sheets">
      <div className="history-container">
        <div className="history-header-banner">
          <h2>History</h2>
        </div>

        {loading ? (
          <div className="history-loading">Loading test history...</div>
        ) : (
          <div className="history-rows-list">
            {historyItems.length > 0 ? (
              historyItems.map((item) => {
                const colorClass = getScoreColorClass(item.percentage);
                return (
                  <div key={item.id} className="history-row-card">
                    {/* LEFT SIDE: TEST TITLE & META */}
                    <div className="history-left-col">
                      <span className="history-category-tag">{item.category}</span>
                      <h3 className="history-row-title">{item.title}</h3>
                      <p className="history-row-desc">{item.description}</p>
                      {item.submittedAt && (
                        <span className="history-date-text">
                          Completed on: {new Date(item.submittedAt).toLocaleString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      )}
                    </div>

                    {/* RIGHT SIDE: MARKS & VIEW RESULT BUTTON */}
                    <div className="history-right-col">
                      <div className="history-completed-box">
                        <div className="history-marks-display">
                          <span className={`marks-val ${colorClass}`}>{item.score} / {item.totalMarks}</span>
                          <span className={`marks-pct ${colorClass}`}>({item.percentage}%)</span>
                        </div>
                        <button
                          className="btn-view-answersheet"
                          onClick={() => handleViewAnswerSheet(item)}
                        >
                          View Result
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="history-empty">
                <p style={{ margin: "0 0 1rem 0", fontSize: "1rem", color: "#475569" }}>
                  You have not completed any assessments yet.
                </p>
                <button className="history-continue-btn" onClick={() => navigate("/student/aptitude")}>
                  Start an Aptitude Test
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default StudentHistoryPage;
