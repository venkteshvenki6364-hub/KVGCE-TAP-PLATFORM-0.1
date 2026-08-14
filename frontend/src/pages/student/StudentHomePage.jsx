import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../services/api";
import "./StudentHomePage.css";

function StudentHomePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await api.get("/students/dashboard");
        if (res.data && res.data.data) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load student dashboard:", err);
        setError("Unable to load live dashboard metrics from API.");
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <DashboardLayout title="Student Overview">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Fetching student performance analytics...</p>
        </div>
      </DashboardLayout>
    );
  }

  const profile = data?.profile || {};
  const stats = data?.stats || {
    overallScore: 82.5,
    aptitudeScore: 85.0,
    technicalScore: 80.0,
    codingScore: 78.5,
    activitiesCompleted: 2,
    certificates: 1,
    achievements: 1,
  };
  const skills = data?.skills || [];
  const activities = data?.recentActivities || [];
  const assessments = data?.upcomingAssessments || [];
  const aiRecommendations = data?.aiRecommendations || [];

  return (
    <DashboardLayout title="Student Dashboard">
      <div className="student-home">
        {error && <div className="error-banner">⚠️ {error}</div>}

        {/* HERO PROFILE SUMMARY CARD */}
        <div className="student-hero-card">
          <div className="profile-hero-left">
            <div className="hero-avatar">
              {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "S"}
            </div>
            <div className="hero-info">
              <h2>Welcome back, {profile.full_name || "Student"}! 🎓</h2>
              <p className="student-meta">
                <span><strong>ID:</strong> {profile.student_id || "4KV21CS042"}</span>
                <span>•</span>
                <span><strong>Department:</strong> {profile.department || "CSE"}</span>
                <span>•</span>
                <span><strong>Semester:</strong> {profile.semester || 6} (Year {profile.year || 3})</span>
              </p>
            </div>
          </div>
          <div className="overall-score-pill">
            <span className="score-val">{stats.overallScore}%</span>
            <span className="score-lbl">Overall Skill Score</span>
          </div>
        </div>

        {/* STATS METRICS GRID */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon aptitude">🧩</div>
            <div className="stat-details">
              <h3>Aptitude Score</h3>
              <p className="stat-number">{stats.aptitudeScore}%</p>
              <div className="progress-bar-container">
                <div className="progress-bar-fill aptitude" style={{ width: `${stats.aptitudeScore}%` }}></div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon technical">💻</div>
            <div className="stat-details">
              <h3>Technical Score</h3>
              <p className="stat-number">{stats.technicalScore}%</p>
              <div className="progress-bar-container">
                <div className="progress-bar-fill technical" style={{ width: `${stats.technicalScore}%` }}></div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon coding">⚙️</div>
            <div className="stat-details">
              <h3>Coding Practice</h3>
              <p className="stat-number">{stats.codingScore}%</p>
              <div className="progress-bar-container">
                <div className="progress-bar-fill coding" style={{ width: `${stats.codingScore}%` }}></div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon activity">🎯</div>
            <div className="stat-details">
              <h3>Activities Completed</h3>
              <p className="stat-number">{stats.activitiesCompleted}</p>
              <span className="stat-subtext">{stats.certificates} Certifications • {stats.achievements} Awards</span>
            </div>
          </div>
        </div>

        {/* TWO-COLUMN GRID */}
        <div className="dashboard-grid">
          {/* LEFT COLUMN: UPCOMING ASSESSMENTS & SKILLS */}
          <div className="dash-col">
            <div className="dash-card">
              <div className="card-header">
                <h3>📝 Upcoming & Active Assessments</h3>
                <Link to="/student/assessments" className="view-all-link">View All</Link>
              </div>
              <div className="assessment-list">
                {assessments.length === 0 ? (
                  <p className="empty-msg">No active assessments right now.</p>
                ) : (
                  assessments.map((a) => (
                    <div key={a._id} className="assessment-item">
                      <div className="assess-info">
                        <h4>{a.title}</h4>
                        <span className="assess-category">{a.category} • {a.duration_minutes} Mins • {a.total_marks} Marks</span>
                      </div>
                      <Link to={`/student/aptitude`} className="start-btn">Start Test</Link>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="dash-card">
              <div className="card-header">
                <h3>⚡ Top Skill Matrix</h3>
                <Link to="/student/skills" className="view-all-link">Manage Skills</Link>
              </div>
              <div className="skills-summary-list">
                {skills.map((s, idx) => (
                  <div key={idx} className="skill-row">
                    <div className="skill-meta">
                      <span className="skill-name">{s.name}</span>
                      <span className="skill-level">{s.level} ({s.percentage || s.score}%)</span>
                    </div>
                    <div className="skill-bar-track">
                      <div className="skill-bar-progress" style={{ width: `${s.percentage || s.score}%` }}></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: AI RECOMMENDATIONS & RECENT ACTIVITIES */}
          <div className="dash-col">
            <div className="dash-card ai-recommend-card">
              <div className="card-header">
                <h3>🤖 AI Career Assistant Recommendations</h3>
                <Link to="/student/ai" className="view-all-link">Ask AI Assistant</Link>
              </div>
              <ul className="ai-rec-list">
                {aiRecommendations.map((rec, i) => (
                  <li key={i} className="ai-rec-item">
                    <span className="ai-sparkle">✨</span>
                    <p>{rec}</p>
                  </li>
                ))}
              </ul>
            </div>

            <div className="dash-card">
              <div className="card-header">
                <h3>🎯 Recent Student Activities</h3>
                <Link to="/student/activities" className="view-all-link">Log Activity</Link>
              </div>
              <div className="activity-list">
                {activities.length === 0 ? (
                  <p className="empty-msg">No activities recorded yet.</p>
                ) : (
                  activities.map((act) => (
                    <div key={act._id} className="activity-item">
                      <div className="act-status-icon">🏆</div>
                      <div className="act-details">
                        <h4>{act.title}</h4>
                        <span className="act-meta">{act.category} • {act.organizer} • {act.date}</span>
                      </div>
                      <span className={`status-tag ${act.status?.toLowerCase()}`}>{act.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default StudentHomePage;
