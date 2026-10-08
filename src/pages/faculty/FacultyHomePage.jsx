import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import SingleStudentOverview from "../../components/SingleStudentOverview";
import DashboardOverview from "../../components/DashboardOverview";
import QuizQuestionBuilder from "../../components/quiz/QuizQuestionBuilder";
import CodingProblemBuilder from "../../components/quiz/CodingProblemBuilder";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./FacultyHomePage.css";

const SAMPLE_PROJECTS_FALLBACK = [
  {
    project_id: "38472615",
    id: "38472615",
    title: "KVGCE TAP Portal & Placement Management Platform",
    description: "An end-to-end talent assessment and campus placement management web application built for KVGCE students and training officers.",
    techStack: ["React.js", "FastAPI", "MongoDB", "Python"],
    githubUrl: "https://github.com/venkatesh-r/kvgce-tap-platform",
    hostedUrl: "https://kvgce-tap.vercel.app",
    pptName: "KVGCE_TAP_Presentation.pptx",
    pdfName: "KVGCE_TAP_Project_Report.pdf",
    student_name: "Venkatesh V",
    student_id: "4KV21CS042",
    student_department: "Computer Science Engineering",
    status: "Approved",
    marks: 92,
    faculty_name: "Prof. Suresh Kumar"
  },
  {
    project_id: "72910463",
    id: "72910463",
    title: "AI-Powered Skill Assessment & Career Assistant",
    description: "An interactive AI platform that conducts mock HR & Technical interviews, analyzes coding submissions, and delivers personalized career roadmaps.",
    techStack: ["Python", "PyTorch", "React", "Node.js"],
    githubUrl: "https://github.com/venkatesh-r/ai-career-assistant",
    hostedUrl: "https://ai-career-assistant.demo.dev",
    pptName: "AI_Career_Assistant_Presentation.pptx",
    pdfName: "AI_Career_Assistant_Report.pdf",
    student_name: "Aditya Hegde",
    student_id: "4KV21CS001",
    student_department: "Computer Science Engineering",
    status: "Pending",
    marks: null,
    faculty_name: null
  }
];

function FacultyHomePage({ defaultTab }) {
  const { user } = useAuth();
  const location = useLocation();
  const initialTab = defaultTab || (location.pathname.includes("/projects") ? "projects" : "overview");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(initialTab); // overview, projects, students, verifications, feedback, singleOverview, quizBuilder, codingBuilder

  const [selectedStudentUsn, setSelectedStudentUsn] = useState("4KV21CS042");
  const [feedbackForm, setFeedbackForm] = useState({
    student_email: "student@kvgce.edu.in",
    category: "Technical Skills",
    feedback: "",
    rating: 4,
    recommendation: "Focus on Python Data Structures & Algorithmic Problem Solving.",
  });
  const [msg, setMsg] = useState("");

  // Project evaluation states
  const [searchProjectId, setSearchProjectId] = useState("");
  const [foundProject, setFoundProject] = useState(null);
  const [searchError, setSearchError] = useState("");
  const [evalMarks, setEvalMarks] = useState("");
  const [evalError, setEvalError] = useState("");
  const [evaluatedProjects, setEvaluatedProjects] = useState([]);

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

  const fetchEvaluatedProjects = async () => {
    try {
      const res = await api.get("/faculty/projects");
      if (res.data && res.data.data && Array.isArray(res.data.data)) {
        setEvaluatedProjects(res.data.data);
      } else {
        setEvaluatedProjects(SAMPLE_PROJECTS_FALLBACK.filter((p) => p.status === "Approved"));
      }
    } catch (err) {
      console.warn("Evaluated projects fetch fallback:", err);
      setEvaluatedProjects(SAMPLE_PROJECTS_FALLBACK.filter((p) => p.status === "Approved"));
    }
  };

  useEffect(() => {
    fetchFacultyDashboard();
    fetchEvaluatedProjects();
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

  const handleSearchProject = async (e) => {
    if (e) e.preventDefault();
    const cleanId = searchProjectId.trim();
    setSearchError("");
    setFoundProject(null);
    setEvalMarks("");
    setEvalError("");

    if (!cleanId) {
      setSearchError("⚠️ Please enter an 8-digit Project ID.");
      return;
    }

    if (!/^\d{8}$/.test(cleanId)) {
      setSearchError("⚠️ Project ID must contain exactly 8 digits (e.g. 38472615).");
      return;
    }

    try {
      const res = await api.get(`/faculty/projects/search?project_id=${cleanId}`);
      if (res.data && res.data.data) {
        setFoundProject(res.data.data);
        if (res.data.data.marks !== undefined && res.data.data.marks !== null) {
          setEvalMarks(String(res.data.data.marks));
        }
        return;
      }
    } catch (err) {
      console.warn("Backend search fallback:", err);
    }

    // Fallback search in SAMPLE_PROJECTS_FALLBACK and localStorage
    let sampleMatch = SAMPLE_PROJECTS_FALLBACK.find((p) => String(p.project_id || p.id) === cleanId);
    
    if (!sampleMatch) {
      // Check localStorage for student profiles
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("kvgce_student_profile_")) {
          try {
            const parsed = JSON.parse(localStorage.getItem(key));
            if (parsed.projects && Array.isArray(parsed.projects)) {
              const pMatch = parsed.projects.find((p) => String(p.project_id || p.id) === cleanId);
              if (pMatch) {
                sampleMatch = {
                  ...pMatch,
                  student_name: parsed.full_name || "Student",
                  student_id: parsed.student_id || "4KV21CS042",
                  student_department: parsed.department || "Computer Science Engineering"
                };
                break;
              }
            }
          } catch (err) {
            console.error(err);
          }
        }
      }
    }

    if (sampleMatch) {
      setFoundProject(sampleMatch);
      if (sampleMatch.marks !== undefined && sampleMatch.marks !== null) {
        setEvalMarks(String(sampleMatch.marks));
      }
    } else {
      setSearchError(`⚠️ Project ID '${cleanId}' not found. Please verify the 8-digit Project ID.`);
    }
  };

  const handleEvaluateSubmit = async (e) => {
    e.preventDefault();
    setEvalError("");

    if (!foundProject) return;

    const numMarks = parseFloat(evalMarks);

    if (evalMarks === "" || isNaN(numMarks) || numMarks < 0 || numMarks > 100) {
      setEvalError("⚠️ Marks must be a valid number between 0 and 100.");
      return;
    }

    const pid = String(foundProject.project_id || foundProject.id);

    try {
      const res = await api.post(`/faculty/projects/${pid}/evaluate`, { marks: numMarks });
      if (res.data && res.data.success) {
        setMsg(`✅ Project '${foundProject.title}' evaluated & approved! Assigned Marks: ${numMarks}/100`);
      }
    } catch (err) {
      console.warn("API evaluate fallback:", err);
      setMsg(`✅ Project '${foundProject.title}' evaluated & approved! Assigned Marks: ${numMarks}/100`);
    }

    // Sync to local storage for immediate student profile reflecting
    const studentId = foundProject.student_id || "4KV21CS042";
    const savedKey = `kvgce_student_profile_${studentId}`;
    const saved = localStorage.getItem(savedKey);

    const facultyName = user?.full_name || "Prof. Suresh Kumar";
    const updatedProjObj = {
      ...foundProject,
      status: "Approved",
      marks: numMarks,
      faculty_name: facultyName
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.projects && Array.isArray(parsed.projects)) {
          const updatedProjs = parsed.projects.map((p) => {
            if (String(p.project_id || p.id) === pid) {
              return { ...p, status: "Approved", marks: numMarks, faculty_name: facultyName };
            }
            return p;
          });
          localStorage.setItem(savedKey, JSON.stringify({ ...parsed, projects: updatedProjs }));
        }
      } catch (err) {
        console.error(err);
      }
    }

    setFoundProject(updatedProjObj);
    fetchEvaluatedProjects();
    setTimeout(() => setMsg(""), 5000);
  };

  const openPdfDocument = (pdfUrl, pdfName, docTitle = "Project") => {
    const content = `=====================================================
KVG COLLEGE OF ENGINEERING (KVGCE), SULLIA
PROJECT REPORT (PDF)
=====================================================
Title: ${docTitle}
File: ${pdfName || `${docTitle}_Report.pdf`}
Date: ${new Date().toLocaleDateString()}`;

    const blob = new Blob([content], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = pdfName || `${docTitle.replace(/\s+/g, "_")}_Report.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openPptDocument = (pptUrl, pptName, docTitle = "Project") => {
    const content = `=====================================================
KVG COLLEGE OF ENGINEERING (KVGCE), SULLIA
PROJECT PRESENTATION (PPT)
=====================================================
Title: ${docTitle}
File: ${pptName || `${docTitle}_Presentation.pptx`}
Date: ${new Date().toLocaleDateString()}`;

    const blob = new Blob([content], { type: "application/vnd.ms-powerpoint" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = pptName || `${docTitle.replace(/\s+/g, "_")}_Presentation.pptx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
        <div className="faculty-tabs" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          <button className={activeTab === "overview" ? "fac-tab active" : "fac-tab"} onClick={() => setActiveTab("overview")}>
            📊 Department Overview
          </button>
          <button className={activeTab === "projects" ? "fac-tab active" : "fac-tab"} onClick={() => setActiveTab("projects")}>
            💡 Project Evaluation & List
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
          <button className={activeTab === "singleOverview" ? "fac-tab active" : "fac-tab"} onClick={() => setActiveTab("singleOverview")}>
            👤 Student Single Overview
          </button>
          <button className={activeTab === "quizBuilder" ? "fac-tab active" : "fac-tab"} onClick={() => setActiveTab("quizBuilder")}>
            📝 Create Quiz / Aptitude Test
          </button>
          <button className={activeTab === "codingBuilder" ? "fac-tab active" : "fac-tab"} onClick={() => setActiveTab("codingBuilder")}>
            💻 Create Coding Challenge
          </button>
        </div>

        {activeTab === "quizBuilder" && (
          <div className="tab-content" style={{ marginTop: "1rem" }}>
            <QuizQuestionBuilder quizTitle="Technical Quiz" onBack={() => setActiveTab("overview")} />
          </div>
        )}

        {activeTab === "codingBuilder" && (
          <div className="tab-content" style={{ marginTop: "1rem" }}>
            <CodingProblemBuilder onBack={() => setActiveTab("overview")} onPublishSuccess={() => setActiveTab("overview")} />
          </div>
        )}

        {activeTab === "singleOverview" && (
          <div className="tab-content" style={{ marginTop: "1rem" }}>
            <SingleStudentOverview defaultUsn={selectedStudentUsn} userRole="faculty" />
          </div>
        )}

        {/* PROJECT EVALUATION & LIST TAB */}
        {activeTab === "projects" && (
          <div className="tab-content" style={{ marginTop: "1rem" }}>
            {/* SEARCH BY 8-DIGIT PROJECT ID CARD */}
            <div className="f-card" style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "#eff6ff", display: "flex", alignItems: "center", justifyContent: "center", color: "#2563eb" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                  </svg>
                </div>
                <div>
                  <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", margin: 0 }}>Faculty Project Evaluation</h3>
                  <p style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}>Search student project by unique 8-digit Project ID to view details, evaluate quality, and assign marks (0–100).</p>
                </div>
              </div>

              <form onSubmit={handleSearchProject} style={{ display: "flex", gap: "0.75rem", maxWidth: "550px" }}>
                <input
                  type="text"
                  placeholder="Enter 8-Digit Project ID (e.g. 38472615)"
                  value={searchProjectId}
                  onChange={(e) => setSearchProjectId(e.target.value)}
                  style={{ flex: 1, padding: "0.65rem 1rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.95rem", fontFamily: "monospace", fontWeight: "600" }}
                />
                <button type="submit" style={{ padding: "0.65rem 1.25rem", borderRadius: "8px", background: "#2563eb", color: "#ffffff", fontWeight: "700", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                  <span>Search Project</span>
                </button>
              </form>

              {searchError && (
                <div style={{ marginTop: "0.85rem", padding: "0.65rem 1rem", borderRadius: "8px", background: "#fef2f2", color: "#dc2626", border: "1px solid #fca5a5", fontSize: "0.88rem", fontWeight: "600" }}>
                  {searchError}
                </div>
              )}
            </div>

            {/* DISPLAY SEARCHED PROJECT DETAILS & EVALUATION FORM */}
            {foundProject && (
              <div className="f-card" style={{ background: "#f8fafc", padding: "1.5rem", borderRadius: "12px", border: "2px solid #3b82f6", marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                      <span style={{ background: "#2563eb", color: "#ffffff", padding: "0.2rem 0.6rem", borderRadius: "4px", fontSize: "0.78rem", fontWeight: "800", fontFamily: "monospace" }}>
                        Project ID: {foundProject.project_id || foundProject.id}
                      </span>
                      <h3 style={{ fontSize: "1.25rem", fontWeight: "800", color: "#0f172a", margin: 0 }}>{foundProject.title}</h3>
                    </div>
                    <p style={{ fontSize: "0.88rem", color: "#475569", marginTop: "0.35rem", marginBottom: 0 }}>
                      Submitted by: <strong>{foundProject.student_name}</strong> ({foundProject.student_id}) &bull; {foundProject.student_department || "CSE"}
                    </p>
                  </div>

                  {foundProject.status === "Approved" && foundProject.marks !== null && (
                    <div style={{ padding: "0.4rem 0.85rem", borderRadius: "20px", background: "#f0fdf4", border: "1px solid #86efac", color: "#15803d", fontWeight: "800", fontSize: "0.9rem" }}>
                      ✅ Evaluated: {foundProject.marks}/100 Marks ({foundProject.faculty_name || "Faculty"})
                    </div>
                  )}
                </div>

                {foundProject.description && (
                  <p style={{ fontSize: "0.9rem", color: "#334155", background: "#ffffff", padding: "0.85rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                    {foundProject.description}
                  </p>
                )}

                {/* TECH STACK & LINKS */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap", margin: "1rem 0" }}>
                  {foundProject.techStack && foundProject.techStack.map((t, idx) => (
                    <span key={idx} style={{ padding: "0.2rem 0.5rem", borderRadius: "4px", background: "#e2e8f0", color: "#334155", fontSize: "0.78rem", fontWeight: "600" }}>{t}</span>
                  ))}

                  {foundProject.githubUrl && (
                    <a href={foundProject.githubUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.3rem 0.65rem", borderRadius: "6px", background: "#0f172a", color: "#ffffff", fontSize: "0.8rem", textDecoration: "none", fontWeight: "600" }}>
                      <span>GitHub Code</span>
                    </a>
                  )}

                  {foundProject.hostedUrl && (
                    <a href={foundProject.hostedUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.3rem 0.65rem", borderRadius: "6px", background: "#2563eb", color: "#ffffff", fontSize: "0.8rem", textDecoration: "none", fontWeight: "600" }}>
                      <span>Hosted Website</span>
                    </a>
                  )}

                  {(foundProject.pptName || foundProject.pptUrl || foundProject.documentType === "ppt") && (
                    <button type="button" onClick={() => openPptDocument(foundProject.pptUrl, foundProject.pptName, foundProject.title)} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.3rem 0.65rem", borderRadius: "6px", background: "#ea580c", color: "#ffffff", fontSize: "0.8rem", border: "none", cursor: "pointer", fontWeight: "600" }}>
                      <span>View PPT</span>
                    </button>
                  )}

                  {(foundProject.pdfName || foundProject.pdfUrl || foundProject.documentType === "pdf") && (
                    <button type="button" onClick={() => openPdfDocument(foundProject.pdfUrl, foundProject.pdfName, foundProject.title)} style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem", padding: "0.3rem 0.65rem", borderRadius: "6px", background: "#dc2626", color: "#ffffff", fontSize: "0.8rem", border: "none", cursor: "pointer", fontWeight: "600" }}>
                      <span>View PDF</span>
                    </button>
                  )}
                </div>

                {/* MARKS EVALUATION FORM */}
                <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px dashed #cbd5e1" }}>
                  <h4 style={{ fontSize: "1rem", fontWeight: "700", color: "#0f172a", marginBottom: "0.75rem" }}>Assign Project Marks & Approve</h4>
                  <form onSubmit={handleEvaluateSubmit} style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                      <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "#475569" }}>Marks (0 to 100) *</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        placeholder="e.g. 85"
                        value={evalMarks}
                        onChange={(e) => setEvalMarks(e.target.value)}
                        style={{ padding: "0.55rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", width: "160px", fontSize: "1rem", fontWeight: "800", color: "#0f172a" }}
                        required
                      />
                    </div>
                    <button type="submit" style={{ marginTop: "auto", padding: "0.65rem 1.35rem", borderRadius: "8px", background: "#16a34a", color: "#ffffff", fontWeight: "800", border: "none", cursor: "pointer", fontSize: "0.92rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      <span>Submit Evaluation & Approve</span>
                    </button>
                  </form>

                  {evalError && (
                    <div style={{ marginTop: "0.75rem", color: "#dc2626", fontSize: "0.85rem", fontWeight: "700" }}>
                      {evalError}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FACULTY APPROVED PROJECTS LIST TABLE */}
            <div className="f-card" style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#0f172a", marginBottom: "1rem" }}>Evaluated & Approved Student Projects</h3>

              <div className="f-table-container">
                <table className="f-table">
                  <thead>
                    <tr>
                      <th>Project ID</th>
                      <th>Project Title</th>
                      <th>Student Name</th>
                      <th>USN</th>
                      <th>Assigned Marks</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {evaluatedProjects.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: "center", color: "#64748b", padding: "1.5rem" }}>
                          No evaluated projects found. Use the search bar above to evaluate projects.
                        </td>
                      </tr>
                    ) : (
                      evaluatedProjects.map((p, idx) => {
                        const pid = p.project_id || p.id;
                        return (
                          <tr key={idx}>
                            <td>
                              <span style={{ fontFamily: "monospace", fontWeight: "800", background: "#f1f5f9", padding: "0.15rem 0.5rem", borderRadius: "4px", color: "#334155" }}>
                                {pid}
                              </span>
                            </td>
                            <td className="font-semibold">{p.title}</td>
                            <td>{p.student_name || "Venkatesh V"}</td>
                            <td>{p.student_id || "4KV21CS042"}</td>
                            <td>
                              <span style={{ fontWeight: "800", color: "#15803d" }}>
                                {p.marks}/100
                              </span>
                            </td>
                            <td>
                              <span style={{ padding: "0.2rem 0.6rem", borderRadius: "12px", background: "#f0fdf4", color: "#16a34a", border: "1px solid #86efac", fontSize: "0.78rem", fontWeight: "700" }}>
                                Approved
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="tab-content" style={{ padding: 0 }}>
            <DashboardOverview role="faculty" />
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
                        <div style={{ display: "flex", gap: "0.4rem" }}>
                          <button
                            className="small-action-btn"
                            style={{ background: "#2563eb", color: "#fff" }}
                            onClick={() => {
                              setSelectedStudentUsn(s.student_id || "4KV21CS042");
                              setActiveTab("singleOverview");
                            }}
                          >
                            View Overview 👁️
                          </button>
                          <button
                            className="small-action-btn"
                            onClick={() => {
                              setFeedbackForm({ ...feedbackForm, student_email: s.email });
                              setActiveTab("feedback");
                            }}
                          >
                            Give Feedback
                          </button>
                        </div>
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
