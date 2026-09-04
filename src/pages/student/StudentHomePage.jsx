import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../services/api";
import "./StudentHomePage.css";

function StudentHomePage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/students/dashboard");
        if (res.data && res.data.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Using default student dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const profile = data?.profile || {
    full_name: "Student",
    student_id: "4KV21CS042",
    department: "CSE",
    semester: 6,
    year: 3,
  };

  // Activity Heatmap Grid Generator
  const renderActivityGrid = () => {
    // 20 columns, 7 rows
    const cols = 20;
    const rows = 7;
    const activeCells = new Set([
      "18-4", "18-5", "19-1", "19-2", "19-3", "19-4", "17-6", "18-6", "19-6"
    ]);

    const gridCols = [];
    for (let c = 0; c < cols; c++) {
      const colCells = [];
      for (let r = 0; r < rows; r++) {
        const key = `${c}-${r}`;
        const isActive = activeCells.has(key);
        colCells.push(
          <div
            key={key}
            className={`heatmap-cell ${isActive ? "active-dark-blue" : ""}`}
          />
        );
      }
      gridCols.push(
        <div key={c} className="heatmap-col">
          {colCells}
        </div>
      );
    }
    return gridCols;
  };

  return (
    <DashboardLayout title="Student Dashboard">
      <div className="student-dashboard-page">
        {/* 1. TOP HERO PROFILE CARD */}
        <div className="hero-banner-card">
          <div
            className="hero-left-meta"
            onClick={() => navigate("/student/profile")}
            style={{ cursor: "pointer" }}
            title="Click to view & edit Profile"
          >
            <div className="hero-avatar-outline">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" />
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="hero-text-block">
              <h2 className="welcome-heading">Welcome back, {profile.full_name || "Student"}! 🎓</h2>
              <p className="student-id-details">
                <span>ID: {profile.student_id || "4KV21CS042"}</span>
                <span className="dot-sep">•</span>
                <span>Department: {profile.department || "CSE"}</span>
                <span className="dot-sep">•</span>
                <span>Semester: {profile.semester || 6} (Year {profile.year || 3})</span>
              </p>
            </div>
          </div>

          <div className="hero-right-score-box">
            <span className="overall-score-val">82.5%</span>
            <span className="overall-score-lbl">Overall Skill Score</span>
            <div className="score-growth-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3">
                <polyline points="18 15 12 9 6 15" />
              </svg>
              <span>6.2% from last month</span>
            </div>
          </div>
        </div>

        {/* 2. MIDDLE ROW: ACTIVITY HEATMAP & SKILL READINESS RADAR */}
        <div className="dashboard-middle-row">
          {/* ACTIVITY HEATMAP CARD */}
          <div className="middle-card activity-card">
            <div className="card-top-header">
              <h3 className="card-title">Activity</h3>
              <span className="badge-private">PRIVATE</span>
            </div>

            <div className="heatmap-container">
              <div className="heatmap-month-header">
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>
              </div>

              <div className="heatmap-grid-matrix">{renderActivityGrid()}</div>

              <p className="heatmap-footer-date">Feb 2026 - Aug 2026</p>
            </div>
          </div>

          {/* SKILL READINESS RADAR CHART CARD */}
          <div className="middle-card skill-readiness-card">
            <div className="card-top-header">
              <h3 className="card-title">Skill Readiness</h3>
            </div>

            <div className="radar-chart-container">
              <svg className="radar-svg" viewBox="0 0 340 240">
                {/* 5 Outer Axis Vertices:
                    Center: (170, 120), R = 75
                    Top: (170, 45) -> Technical
                    Top Right: (241, 97) -> Aptitude
                    Bottom Right: (214, 181) -> Coding
                    Bottom Left: (126, 181) -> Communication
                    Top Left: (99, 97) -> Activity/Profile
                */}

                {/* Grid Pentagons (5 concentric levels) */}
                <polygon points="170,45 241,97 214,181 126,181 99,97" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                <polygon points="170,60 227,102 205,169 135,169 113,102" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                <polygon points="170,75 213,106 196,157 144,157 127,106" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                <polygon points="170,90 198,111 187,144 153,144 142,111" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                <polygon points="170,105 184,115 178,132 162,132 156,115" fill="none" stroke="#e2e8f0" strokeWidth="1" />

                {/* Axis Radial Lines */}
                <line x1="170" y1="120" x2="170" y2="45" stroke="#e2e8f0" strokeWidth="1" />
                <line x1="170" y1="120" x2="241" y2="97" stroke="#e2e8f0" strokeWidth="1" />
                <line x1="170" y1="120" x2="214" y2="181" stroke="#e2e8f0" strokeWidth="1" />
                <line x1="170" y1="120" x2="126" y2="181" stroke="#e2e8f0" strokeWidth="1" />
                <line x1="170" y1="120" x2="99" y2="97" stroke="#e2e8f0" strokeWidth="1" />

                {/* Vertex Labels */}
                <text x="170" y="32" textAnchor="middle" className="radar-label">Technical Readiness</text>
                <text x="248" y="96" textAnchor="start" className="radar-label">Aptitude<tspan x="248" dy="11">Readiness</tspan></text>
                <text x="218" y="196" textAnchor="start" className="radar-label">Coding Readiness</text>
                <text x="122" y="196" textAnchor="end" className="radar-label">Communication<tspan x="122" dy="11">Readiness</tspan></text>
                <text x="92" y="96" textAnchor="end" className="radar-label">Activity/Profile<tspan x="92" dy="11">Readiness</tspan></text>

                {/* Your Score Polygon (Solid Blue) */}
                {/* Score ratios: Tech:0.85, Apt:0.88, Cod:0.75, Comm:0.68, Act:0.78 */}
                <polygon points="170,56 232,100 203,166 140,161 115,102" fill="rgba(37, 99, 235, 0.12)" stroke="#2563eb" strokeWidth="2" />
                <circle cx="170" cy="56" r="3.5" fill="#2563eb" />
                <circle cx="232" cy="100" r="3.5" fill="#2563eb" />
                <circle cx="203" cy="166" r="3.5" fill="#2563eb" />
                <circle cx="140" cy="161" r="3.5" fill="#2563eb" />
                <circle cx="115" cy="102" r="3.5" fill="#2563eb" />

                {/* Average Polygon (Dashed Orange) */}
                {/* Avg ratios: Tech:0.70, Apt:0.70, Cod:0.65, Comm:0.75, Act:0.65 */}
                <polygon points="170,68 220,104 199,160 137,166 124,105" fill="none" stroke="#f97316" strokeWidth="1.8" strokeDasharray="4 3" />
                <circle cx="170" cy="68" r="3" fill="#f97316" />
                <circle cx="220" cy="104" r="3" fill="#f97316" />
                <circle cx="199" cy="160" r="3" fill="#f97316" />
                <circle cx="137" cy="166" r="3" fill="#f97316" />
                <circle cx="124" cy="105" r="3" fill="#f97316" />
              </svg>

              <div className="radar-legend-row">
                <div className="legend-item">
                  <span className="legend-line blue-solid"></span>
                  <span>Your Score</span>
                </div>
                <div className="legend-item">
                  <span className="legend-line orange-dashed"></span>
                  <span>Average</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 3. GRID OF 6 MODULE PROGRESS CARDS */}
        <div className="modules-6-grid">
          {/* 1. Academics */}
          <div className="module-card" onClick={() => navigate("/student/skills")}>
            <div className="module-card-left">
              <div className="icon-circle icon-blue">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003896" strokeWidth="2">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <div className="module-details">
                <h4 className="module-name">Academics</h4>
                <div className="module-score-val color-blue">78%</div>
                <span className="module-subtext">CGPA: 7.10</span>
              </div>
            </div>
            <div className="module-arrow">&gt;</div>
          </div>

          {/* 2. Aptitude */}
          <div className="module-card" onClick={() => navigate("/student/aptitude")}>
            <div className="module-card-left">
              <div className="icon-circle icon-green">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <div className="module-details">
                <h4 className="module-name">Aptitude</h4>
                <div className="module-score-val color-green">85%</div>
                <span className="module-subtext">Tests Completed: 12</span>
              </div>
            </div>
            <div className="module-arrow">&gt;</div>
          </div>

          {/* 3. Technical Quiz */}
          <div className="module-card" onClick={() => navigate("/student/quiz")}>
            <div className="module-card-left">
              <div className="icon-circle icon-orange">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              </div>
              <div className="module-details">
                <h4 className="module-name">Technical Quiz</h4>
                <div className="module-score-val color-orange">80%</div>
                <span className="module-subtext">Quizzes Completed: 18</span>
              </div>
            </div>
            <div className="module-arrow">&gt;</div>
          </div>

          {/* 4. Coding Lab */}
          <div className="module-card" onClick={() => navigate("/student/coding")}>
            <div className="module-card-left">
              <div className="icon-circle icon-purple">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
              </div>
              <div className="module-details">
                <h4 className="module-name">Coding Lab</h4>
                <div className="module-score-val color-purple">75%</div>
                <span className="module-subtext">Problems Solved: 156</span>
              </div>
            </div>
            <div className="module-arrow">&gt;</div>
          </div>

          {/* 5. Projects */}
          <div className="module-card" onClick={() => navigate("/student/activities")}>
            <div className="module-card-left">
              <div className="icon-circle icon-pink">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#db2777" strokeWidth="2">
                  <path d="M9 18h6" />
                  <path d="M10 22h4" />
                  <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1.55.61 2.95 1.6 3.98.74.75 1.2 1.51 1.4 2.5" />
                </svg>
              </div>
              <div className="module-details">
                <h4 className="module-name">Projects</h4>
                <div className="module-score-val color-pink">70%</div>
                <span className="module-subtext">Projects Completed: 4</span>
              </div>
            </div>
            <div className="module-arrow">&gt;</div>
          </div>

          {/* 6. HR Interview */}
          <div className="module-card" onClick={() => navigate("/student/ai")}>
            <div className="module-card-left">
              <div className="icon-circle icon-teal">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="module-details">
                <h4 className="module-name">HR Interview</h4>
                <div className="module-score-val color-teal">1%</div>
                <div className="progress-mini-wrapper">
                  <span className="progress-lbl">Progress</span>
                  <div className="progress-mini-track">
                    <div className="progress-mini-dot" style={{ left: "1%" }} />
                  </div>
                </div>
              </div>
            </div>
            <div className="module-arrow">&gt;</div>
          </div>
        </div>

        {/* 4. BOTTOM HR INTERVIEW PROGRESS BANNER CARD */}
        <div className="bottom-hr-card">
          <div className="bottom-hr-left">
            <div className="bottom-hr-icon-circle">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#0d9488" strokeWidth="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M9 12l2 2 4-4" />
              </svg>
            </div>
            <div className="bottom-hr-text-block">
              <h4 className="bottom-hr-title">HR Interview Preparation Progress</h4>
              <p className="bottom-hr-subtitle">Keep practicing to improve your readiness.</p>
              <div className="bottom-hr-progress-row">
                <span className="bottom-hr-score">1%</span>
                <span className="bottom-hr-progress-lbl">Overall Progress</span>
                <div className="bottom-hr-track">
                  <div className="bottom-hr-dot" style={{ left: "1%" }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bottom-hr-right">
            <button className="continue-practice-btn" onClick={() => navigate("/student/ai")}>
              Continue Practice
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default StudentHomePage;

