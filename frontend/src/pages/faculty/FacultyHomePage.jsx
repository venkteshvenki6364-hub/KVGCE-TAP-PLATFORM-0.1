import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../services/api";
import "./FacultyHomePage.css";

function FacultyHomePage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview"); // overview, students, verifications, feedback
  const [feedbackForm, setFeedbackForm] = useState({
    student_email: "student@kvgce.edu.in",
    category: "Technical Skills",
    feedback: "",
    rating: 4,
    recommendation: "Focus on Python Data Structures & Algorithmic Problem Solving.",
  });
  const [msg, setMsg] = useState("");

  const fetchFacultyDashboard = async () => {
    try {
      const res = await api.get("/faculty/dashboard");
      if (res.data && res.data.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Error loading faculty dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFacultyDashboard();
  }, []);

  const handleVerifyActivity = async (activityId, action) => {
    try {
      const res = await api.put(`/faculty/activities/${activityId}/verify?action=${action}`);
      if (res.data && res.data.success) {
        setMsg(`Activity ${action === "approve" ? "Verified ✅" : "Rejected ❌"} successfully!`);
        fetchFacultyDashboard();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/faculty/feedback", feedbackForm);
      if (res.data && res.data.success) {
        setMsg("Feedback sent successfully to student dashboard!");
        setFeedbackForm({ ...feedbackForm, feedback: "" });
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="Faculty Portal">
        <div style={{ textAlign: "center", padding: "3rem" }}>Loading Faculty Workspace...</div>
      </DashboardLayout>
    );
  }

  const stats = data?.stats || {
    totalStudents: 240,
    activeAssessments: 2,
    pendingVerifications: 1,
    avgBatchScore: 81.4,
  };
  const students = data?.recentStudents || [];
  const pendingActivities = data?.pendingActivities || [];

  return (
    <DashboardLayout title="Faculty Dashboard & Student Management">
      <div className="faculty-page">
        {msg && <div className="alert-success">✅ {msg}</div>}

        {/* TAB CONTROLS */}
        <div className="faculty-tabs">
          <button className={activeTab === "overview" ? "fac-tab active" : "fac-tab"} onClick={() => setActiveTab("overview")}>
            📊 Department Overview
          </button>
          <button className={activeTab === "students" ? "fac-tab active" : "fac-tab"} onClick={() => setActiveTab("students")}>
            🎓 Student Directory ({students.length})
          </button>
          <button className={activeTab === "verifications" ? "fac-tab active" : "fac-tab"} onClick={() => setActiveTab("verifications")}>
            ✅ Pending Verifications ({pendingActivities.length})
          </button>
          <button className={activeTab === "feedback" ? "fac-tab active" : "fac-tab"} onClick={() => setActiveTab("feedback")}>
            💬 Submit Student Feedback
          </button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="tab-content">
            <div className="stats-row">
              <div className="f-stat-card">
                <h3>Total Assigned Students</h3>
                <p className="f-num">{stats.totalStudents}</p>
                <span>Computer Science & Engineering</span>
              </div>
              <div className="f-stat-card">
                <h3>Active Tests & Quizzes</h3>
                <p className="f-num">{stats.activeAssessments}</p>
                <span>Published on TAP</span>
              </div>
              <div className="f-stat-card">
                <h3>Pending Approvals</h3>
                <p className="f-num gold">{stats.pendingVerifications}</p>
                <span>Student Activity Submissions</span>
              </div>
              <div className="f-stat-card">
                <h3>Batch Average Score</h3>
                <p className="f-num green">{stats.avgBatchScore}%</p>
                <span>Class Performance</span>
              </div>
            </div>

            <div className="fac-sec-card">
              <h3>Recent Student Performance Overview</h3>
              <table className="faculty-table">
                <thead>
                  <tr>
                    <th>Student Name & USN</th>
                    <th>Department</th>
                    <th>Semester</th>
                    <th>Skills Score</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.slice(0, 5).map((s) => (
                    <tr key={s._id}>
                      <td><strong>{s.full_name}</strong><br /><small>{s.student_id || s.email}</small></td>
                      <td>{s.department || "CSE"}</td>
                      <td>Semester {s.semester || 6}</td>
                      <td><span className="score-tag font-bold">82.5%</span></td>
                      <td><span className="active-badge">Active</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* STUDENTS DIRECTORY TAB */}
        {activeTab === "students" && (
          <div className="tab-content">
            <div className="fac-sec-card">
              <h3>Computer Science Department Students</h3>
              <table className="faculty-table">
                <thead>
                  <tr>
                    <th>Student ID</th>
                    <th>Full Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Semester</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s._id}>
                      <td><strong>{s.student_id || "4KV21CS042"}</strong></td>
                      <td>{s.full_name}</td>
                      <td>{s.email}</td>
                      <td>{s.phone || "+91 9741234567"}</td>
                      <td>Sem {s.semester || 6}</td>
                      <td>
                        <button className="small-action-btn" onClick={() => { setFeedbackForm({...feedbackForm, student_email: s.email}); setActiveTab("feedback"); }}>
                          Give Feedback
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VERIFICATIONS TAB */}
        {activeTab === "verifications" && (
          <div className="tab-content">
            <div className="fac-sec-card">
              <h3>Pending Student Activities & Certificate Approvals</h3>
              {pendingActivities.length === 0 ? (
                <p style={{ padding: "2rem", textAlign: "center", color: "#64748b" }}>No pending activities to verify.</p>
              ) : (
                <table className="faculty-table">
                  <thead>
                    <tr>
                      <th>Student Name</th>
                      <th>Activity Title</th>
                      <th>Category</th>
                      <th>Organizer</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingActivities.map((act) => (
                      <tr key={act._id}>
                        <td><strong>{act.student_name}</strong><br /><small>{act.student_email}</small></td>
                        <td>{act.title}<br /><small>{act.description}</small></td>
                        <td><span className="cat-pill">{act.category}</span></td>
                        <td>{act.organizer}</td>
                        <td>{act.date}</td>
                        <td>
                          <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button className="approve-btn" onClick={() => handleVerifyActivity(act._id, "approve")}>
                              Approve ✅
                            </button>
                            <button className="reject-btn" onClick={() => handleVerifyActivity(act._id, "reject")}>
                              Reject ❌
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* FEEDBACK TAB */}
        {activeTab === "feedback" && (
          <div className="tab-content">
            <div className="fac-sec-card max-600">
              <h3>Provide Individual Student Feedback</h3>
              <form onSubmit={handleFeedbackSubmit} className="feedback-form">
                <div className="f-group">
                  <label>Student Email / ID</label>
                  <input
                    type="email"
                    value={feedbackForm.student_email}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, student_email: e.target.value })}
                    required
                  />
                </div>

                <div className="f-group">
                  <label>Feedback Category</label>
                  <select
                    value={feedbackForm.category}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, category: e.target.value })}
                  >
                    <option value="Technical Skills">Technical Skills</option>
                    <option value="Aptitude & Speed">Aptitude & Speed</option>
                    <option value="Coding Competency">Coding Competency</option>
                    <option value="Placement Readiness">Placement Readiness</option>
                  </select>
                </div>

                <div className="f-group">
                  <label>Rating (1 to 5 Stars)</label>
                  <select
                    value={feedbackForm.rating}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, rating: Number(e.target.value) })}
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 - Outstanding)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 - Good)</option>
                    <option value={3}>⭐⭐⭐ (3 - Average)</option>
                    <option value={2}>⭐⭐ (2 - Needs Improvement)</option>
                  </select>
                </div>

                <div className="f-group">
                  <label>Faculty Comments</label>
                  <textarea
                    rows={4}
                    placeholder="Enter detailed feedback for the student..."
                    value={feedbackForm.feedback}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, feedback: e.target.value })}
                    required
                  />
                </div>

                <div className="f-group">
                  <label>Actionable Recommendation</label>
                  <input
                    type="text"
                    placeholder="e.g. Practice 5 LeetCode DP problems this weekend."
                    value={feedbackForm.recommendation}
                    onChange={(e) => setFeedbackForm({ ...feedbackForm, recommendation: e.target.value })}
                  />
                </div>

                <button type="submit" className="submit-fb-btn">
                  Send Feedback to Student 🚀
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default FacultyHomePage;
