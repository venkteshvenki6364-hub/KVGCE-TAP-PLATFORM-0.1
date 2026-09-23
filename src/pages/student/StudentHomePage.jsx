import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./StudentHomePage.css";

function StudentHomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  // Retrieve custom saved profile for active student if present
  const customProfileKey = `kvgce_student_profile_${user?.student_id || user?.usn || "default"}`;
  const storedProfile = (() => {
    try {
      const raw = localStorage.getItem(customProfileKey);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  })();

  const profile = {
    full_name: storedProfile?.full_name || user?.full_name || data?.profile?.full_name || "Venkatesh R",
    student_id: storedProfile?.student_id || user?.student_id || user?.usn || data?.profile?.student_id || "4KV23CS042",
    department: storedProfile?.department || user?.department || data?.profile?.department || "Computer Science & Engineering",
    semester: storedProfile?.semester || user?.semester || data?.profile?.semester || "6th Semester (III Year)",
    year: user?.year || 3,
    avatarUrl: storedProfile?.avatarUrl || user?.avatarUrl || data?.profile?.avatarUrl || null,
  };

  const [activeView, setActiveView] = useState("calendar"); // "calendar" or "graph"

  const dbActivityDates = data?.profile?.activity_dates || user?.activity_dates || [];
  const signupDateStr = data?.profile?.signup_date || user?.signup_date || user?.created_at || "2026-01-12";

  // Activity Heatmap Grid Generator (Jan 2026 to Dec 2026)
  const renderActivityGrid = () => {
    const startDate = new Date(2026, 0, 1); // Jan 1, 2026
    const todayStr = new Date().toISOString().split("T")[0];
    const cleanSignup = String(signupDateStr).split("T")[0];

    const activeSet = new Set(dbActivityDates);
    activeSet.add(todayStr);
    if (cleanSignup) activeSet.add(cleanSignup);

    const cols = 26; // 26 columns for sleek, balanced full-year layout
    const rows = 7;
    const gridCols = [];

    for (let c = 0; c < cols; c++) {
      const colCells = [];
      for (let r = 0; r < rows; r++) {
        const dayOffset = c * 7 + r;
        const cellDate = new Date(startDate);
        cellDate.setDate(startDate.getDate() + dayOffset);
        
        const cellDateStr = cellDate.toISOString().split("T")[0];
        const is2026 = cellDate.getFullYear() === 2026;
        const isToday = cellDateStr === todayStr;
        const isAfterSignup = cellDateStr >= cleanSignup;
        const isLogged = activeSet.has(cellDateStr) || (isAfterSignup && cellDateStr <= todayStr);
        const isActive = is2026 && isLogged;

        const formattedDateStr = cellDate.toLocaleDateString("en-GB", {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric"
        });

        colCells.push(
          <div
            key={`${c}-${r}`}
            title={`${formattedDateStr}: ${isActive ? "Active Daily Login" : "No Login Activity"}`}
            className={`heatmap-cell ${isToday ? "active-today active-dark-blue" : isActive ? "active-dark-blue" : ""}`}
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

  // Helper for dynamic score color coding (Red for low/dips, Amber for mid, Green for high)
  const getScoreColor = (score) => {
    if (score >= 75) return "#16a34a"; // Bright Green
    if (score >= 60) return "#f59e0b"; // Amber/Orange
    return "#ef4444"; // Red
  };

  // Render Overall Score Graph (Y: 0 to 100%, X: Date Timeline with Red-to-Green ups & downs)
  const renderSkillGrowthGraph = () => {
    const pointsData = data?.profile?.score_history || user?.score_history || [
      {"date": "15 Jan", "day": "Thu", "score": 48.0, "change": "-4.0%", "trend": "down"},
      {"date": "10 Feb", "day": "Tue", "score": 56.5, "change": "+8.5%", "trend": "up"},
      {"date": "05 Mar", "day": "Thu", "score": 51.0, "change": "-5.5%", "trend": "down"},
      {"date": "22 Apr", "day": "Wed", "score": 67.0, "change": "+16.0%", "trend": "up"},
      {"date": "18 May", "day": "Mon", "score": 63.5, "change": "-3.5%", "trend": "down"},
      {"date": "12 Jun", "day": "Fri", "score": 75.0, "change": "+11.5%", "trend": "up"},
      {"date": "25 Jul", "day": "Sat", "score": 71.8, "change": "-3.2%", "trend": "down"},
      {"date": "14 Aug", "day": "Fri", "score": 79.5, "change": "+7.7%", "trend": "up"},
      {"date": "23 Sep", "day": "Wed", "score": 82.5, "change": "+3.0%", "trend": "up"}
    ];

    // Map Y from 0% (Y=155) to 100% (Y=15)
    const mapY = (score) => 155 - (score / 100) * 140;
    const mapX = (index) => 55 + index * (420 / (pointsData.length - 1));

    const pathD = pointsData.reduce((acc, pt, i) => {
      const x = mapX(i);
      const y = mapY(pt.score);
      return i === 0 ? `M ${x} ${y}` : `${acc} L ${x} ${y}`;
    }, "");

    const areaD = `${pathD} L ${mapX(pointsData.length - 1)} 155 L ${mapX(0)} 155 Z`;

    // Calculate average score of all points
    const avgScore = pointsData.length > 0
      ? pointsData.reduce((sum, p) => sum + p.score, 0) / pointsData.length
      : 0;
    const avgY = mapY(avgScore);

    return (
      <div className="growth-graph-container">
        <svg className="growth-svg" viewBox="0 0 500 175">
          <defs>
            <linearGradient id="scoreLineGradientHome" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="55%" stopColor="#f59e0b" />
              <stop offset="85%" stopColor="#16a34a" />
            </linearGradient>
            <linearGradient id="growthGradientHome" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#16a34a" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
            </linearGradient>
          </defs>

          {/* Grid lines for Y-axis (0%, 20%, 40%, 60%, 80%, 100%) */}
          {[0, 20, 40, 60, 80, 100].map((val) => {
            const y = mapY(val);
            return (
              <g key={val}>
                <line x1="45" y1={y} x2="480" y2={y} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="3 3" />
                <text x="38" y={y + 3} textAnchor="end" className="growth-y-label">{val}%</text>
              </g>
            );
          })}

          <path d={areaD} fill="url(#growthGradientHome)" />

          {/* Dotted Black Line for Average Score of All Data Points */}
          <g>
            <line
              x1="45"
              y1={avgY}
              x2="480"
              y2={avgY}
              stroke="#000000"
              strokeWidth="1.8"
              strokeDasharray="4 3"
            />
            <text
              x="478"
              y={avgY - 4}
              textAnchor="end"
              fill="#000000"
              fontWeight="700"
              fontSize="8.5"
            >
              Avg: {avgScore.toFixed(1)}%
            </text>
          </g>

          <path d={pathD} fill="none" stroke="url(#scoreLineGradientHome)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {pointsData.map((pt, i) => {
            const cx = mapX(i);
            const cy = mapY(pt.score);
            const pointColor = getScoreColor(pt.score);
            return (
              <g key={i}>
                <circle
                  cx={cx}
                  cy={cy}
                  r="5"
                  fill="#ffffff"
                  stroke={pointColor}
                  strokeWidth="2.5"
                  className="growth-graph-point"
                >
                  <title>{`${pt.day}, ${pt.date} 2026\nOverall Score: ${pt.score}%\nMovement: ${pt.change} (${pt.trend === "up" ? "📈 Growth" : "📉 Decline"})`}</title>
                </circle>
                <text x={cx} y="168" textAnchor="middle" className="growth-axis-label">{pt.date}</text>
              </g>
            );
          })}
        </svg>
      </div>
    );
  };

  return (
    <DashboardLayout title="Student Dashboard">
      <div className="student-dashboard-page">
        {/* 1. TOP HERO PROFILE CARD */}
        <div
          className="hero-banner-card"
          onClick={() => navigate("/student/profile")}
          style={{ cursor: "pointer" }}
          title="Click to view & edit Profile"
        >
          <div className="hero-left-meta">
            <div className="hero-avatar-outline">
              {profile.avatarUrl ? (
                <img
                  src={profile.avatarUrl}
                  alt={profile.full_name}
                  className="hero-avatar-img"
                  onError={(e) => {
                    e.target.style.display = "none";
                    if (e.target.nextElementSibling) {
                      e.target.nextElementSibling.style.display = "flex";
                    }
                  }}
                />
              ) : null}
              <div
                className="hero-avatar-icon-fallback"
                style={{ display: profile.avatarUrl ? "none" : "flex", alignItems: "center", justifyContent: "center" }}
              >
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </div>
            </div>
            <div className="hero-text-block">
              <h2 className="welcome-heading">Welcome back, {profile.full_name || "Student"}! 🎓</h2>
              <p className="student-id-details">
                <span>ID: {profile.student_id || "4KV21CS042"}</span>
                <span className="dot-sep">•</span>
                <span>Department: {profile.department || "CSE"}</span>
                <span className="dot-sep">•</span>
                <span>Semester: {typeof profile.semester === "string" ? profile.semester : `${profile.semester} (Year ${profile.year || 3})`}</span>
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
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <h3 className="card-title">Activity</h3>
                <div className="view-toggle-btn-group">
                  <button
                    className={`view-toggle-btn ${activeView === "calendar" ? "active" : ""}`}
                    onClick={() => setActiveView("calendar")}
                    title="View Daily Activity Calendar"
                  >
                    🗓️ Calendar
                  </button>
                  <button
                    className={`view-toggle-btn ${activeView === "graph" ? "active" : ""}`}
                    onClick={() => setActiveView("graph")}
                    title="View Overall Score Graph"
                  >
                    📊 Overall Score
                  </button>
                </div>
              </div>
              <span className="badge-private">PRIVATE</span>
            </div>

            {activeView === "calendar" ? (
              <div className="heatmap-container">
                <div className="heatmap-month-header">
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                  <span>Jul</span>
                  <span>Aug</span>
                  <span>Sep</span>
                  <span>Oct</span>
                  <span>Nov</span>
                  <span>Dec</span>
                </div>

                <div className="heatmap-grid-matrix">{renderActivityGrid()}</div>

                <p className="heatmap-footer-date">Jan 2026 - Dec 2026</p>
              </div>
            ) : (
              renderSkillGrowthGraph()
            )}
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

