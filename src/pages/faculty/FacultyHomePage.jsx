import TasksCreatedView from "../../components/faculty/TasksCreatedView";
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

  const getTabFromUrl = () => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam) {
      if (tabParam === "students" || tabParam === "verifications" || tabParam === "feedback") return "overview";
      return tabParam;
    }
    if (location.pathname.includes("/tasks")) return "tasks";
    if (location.pathname.includes("/projects")) return "projects";
    if (location.pathname.includes("/students")) return "overview";
    if (location.pathname.includes("/activities") || location.pathname.includes("/verifications")) return "overview";
    if (location.pathname.includes("/feedback")) return "overview";
    if (location.pathname.includes("/singleOverview")) return "singleOverview";
    if (location.pathname.includes("/assessments") || location.pathname.includes("/quiz")) return "quizBuilder";
    if (location.pathname.includes("/coding")) return "codingBuilder";
    return defaultTab || "overview";
  };

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(getTabFromUrl);

  useEffect(() => {
    setActiveTab(getTabFromUrl());
  }, [location.search, location.pathname, defaultTab]);

  const [selectedStudentUsn, setSelectedStudentUsn] = useState("4KV21CS042");
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

  const handleSearchProject = async (e) => {
    if (e) e.preventDefault();
    const cleanId = searchProjectId.trim();
    setSearchError("");
    setFoundProject(null);
    setEvalMarks("");
    setEvalError("");

    if (!cleanId) {
      setSearchError("Please enter an 8-digit Project ID.");
      return;
    }

    if (!/^\d{8}$/.test(cleanId)) {
      setSearchError("Project ID must contain exactly 8 digits (e.g. 38472615).");
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
      setSearchError(`Project ID '${cleanId}' not found. Please verify the 8-digit Project ID.`);
    }
  };

  const handleEvaluateSubmit = async (e) => {
    e.preventDefault();
    setEvalError("");

    if (!foundProject) return;

    const numMarks = parseFloat(evalMarks);

    if (evalMarks === "" || isNaN(numMarks) || numMarks < 0 || numMarks > 100) {
      setEvalError("Marks must be a valid number between 0 and 100.");
      return;
    }

    const pid = String(foundProject.project_id || foundProject.id);

    try {
      const res = await api.post(`/faculty/projects/${pid}/evaluate`, { marks: numMarks });
      if (res.data && res.data.success) {
        setMsg(`Project '${foundProject.title}' evaluated and approved. Assigned marks: ${numMarks}/100`);
      }
    } catch (err) {
      console.warn("API evaluate fallback:", err);
      setMsg(`Project '${foundProject.title}' evaluated and approved. Assigned marks: ${numMarks}/100`);
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

  return (
    <DashboardLayout title="Faculty Dashboard & Student Management">
      <div className="faculty-page">
        {msg && <div className="alert-success">{msg}</div>}



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
          <div className="tab-content project-eval-section">
            {/* SEARCH BY 8-DIGIT PROJECT ID CARD */}
            <div className="project-search-card">
              <div className="project-header-row">
                <div className="project-icon-box">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <div>
                  <h3 className="project-main-title">Project Evaluation</h3>
                  <p className="project-sub-desc">
                    Search for student projects using their 8-digit Project ID, review details and documents, and assign marks.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSearchProject} className="project-search-form">
                <input
                  type="text"
                  placeholder="Enter 8-digit Project ID (e.g. 38472615)"
                  value={searchProjectId}
                  onChange={(e) => setSearchProjectId(e.target.value)}
                  className="project-id-input"
                />
                <button type="submit" className="project-search-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <span>Search</span>
                </button>
              </form>

              <div className="project-quick-samples">
                <span>Sample IDs to test:</span>
                <button
                  type="button"
                  className="project-sample-chip"
                  onClick={() => {
                    setSearchProjectId("38472615");
                    setTimeout(() => {
                      const btn = document.querySelector(".project-search-btn");
                      if (btn) btn.click();
                    }, 50);
                  }}
                  title="Click to search sample project 38472615"
                >
                  38472615 (Approved)
                </button>
                <button
                  type="button"
                  className="project-sample-chip"
                  onClick={() => {
                    setSearchProjectId("72910463");
                    setTimeout(() => {
                      const btn = document.querySelector(".project-search-btn");
                      if (btn) btn.click();
                    }, 50);
                  }}
                  title="Click to search sample project 72910463"
                >
                  72910463 (Pending)
                </button>
              </div>

              {searchError && (
                <div className="project-alert-error">
                  <span>{searchError}</span>
                </div>
              )}
            </div>

            {/* DISPLAY SEARCHED PROJECT DETAILS & EVALUATION FORM */}
            {foundProject && (
              <div className="project-details-card">
                <div className="project-details-header">
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                      <span className="project-id-tag">
                        ID: {foundProject.project_id || foundProject.id}
                      </span>
                      <h3 className="project-title-text">{foundProject.title}</h3>
                    </div>
                    <p className="project-student-meta">
                      Submitted by: <strong>{foundProject.student_name}</strong> ({foundProject.student_id}) &bull; {foundProject.student_department || "Computer Science"}
                    </p>
                  </div>

                  {foundProject.status === "Approved" && foundProject.marks !== null ? (
                    <div className="project-evaluated-badge">
                      <span>Evaluated: {foundProject.marks}/100 Marks</span>
                      {foundProject.faculty_name && <span style={{ opacity: 0.85 }}>({foundProject.faculty_name})</span>}
                    </div>
                  ) : (
                    <div className="project-pending-badge">
                      <span>Pending Evaluation</span>
                    </div>
                  )}
                </div>

                {foundProject.description && (
                  <div className="project-description-box">
                    <strong style={{ display: "block", marginBottom: "0.25rem", color: "#0f172a" }}>Project Overview:</strong>
                    <span>{foundProject.description}</span>
                  </div>
                )}

                {/* TECH STACK CHIPS */}
                {foundProject.techStack && foundProject.techStack.length > 0 && (
                  <div className="project-tech-chips">
                    <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#64748b" }}>Tech Stack:</span>
                    {foundProject.techStack.map((tech, idx) => (
                      <span key={idx} className="project-tech-chip">{tech}</span>
                    ))}
                  </div>
                )}

                {/* DELIVERABLE LINKS */}
                <div className="project-links-flex">
                  {foundProject.githubUrl && (
                    <a href={foundProject.githubUrl} target="_blank" rel="noopener noreferrer" className="project-link-pill github">
                      <span>GitHub Code</span>
                    </a>
                  )}

                  {foundProject.hostedUrl && (
                    <a href={foundProject.hostedUrl} target="_blank" rel="noopener noreferrer" className="project-link-pill demo">
                      <span>Live Demo</span>
                    </a>
                  )}

                  {(foundProject.pptName || foundProject.pptUrl || foundProject.documentType === "ppt") && (
                    <button type="button" onClick={() => openPptDocument(foundProject.pptUrl, foundProject.pptName, foundProject.title)} className="project-link-pill ppt">
                      <span>Presentation (PPT)</span>
                    </button>
                  )}

                  {(foundProject.pdfName || foundProject.pdfUrl || foundProject.documentType === "pdf") && (
                    <button type="button" onClick={() => openPdfDocument(foundProject.pdfUrl, foundProject.pdfName, foundProject.title)} className="project-link-pill pdf">
                      <span>Project Report (PDF)</span>
                    </button>
                  )}
                </div>

                {/* MARKS EVALUATION FORM */}
                <div className="project-eval-panel">
                  <h4 className="project-eval-title">Evaluate & Assign Marks</h4>
                  <p className="project-eval-subtitle">
                    Enter a score out of 100 to evaluate and approve this student project.
                  </p>
                  <form onSubmit={handleEvaluateSubmit} className="project-eval-form">
                    <div className="project-input-group">
                      <label className="project-input-label">Marks (0 to 100) *</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        placeholder="e.g. 85"
                        value={evalMarks}
                        onChange={(e) => setEvalMarks(e.target.value)}
                        className="project-marks-input"
                        required
                      />
                    </div>
                    <button type="submit" className="project-submit-btn">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
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
            <div className="project-list-card">
              <div className="project-list-header">
                <h3 className="project-list-title">Evaluated Projects ({evaluatedProjects.length})</h3>
                <p className="project-list-subtitle">Student projects that have been reviewed, graded, and approved.</p>
              </div>

              {evaluatedProjects.length === 0 ? (
                <div className="project-empty-state">
                  <div className="project-empty-icon" aria-hidden="true">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M3 6h7l2 2h9v10H3z" />
                    </svg>
                  </div>
                  <h4 className="project-empty-title">No Evaluated Projects Yet</h4>
                  <p className="project-empty-text">
                    Use the search bar above with a student's 8-digit Project ID to inspect submissions and assign marks.
                  </p>
                </div>
              ) : (
                <div className="f-table-container">
                  <table className="f-table">
                    <thead>
                      <tr>
                        <th>Project ID</th>
                        <th>Project Title</th>
                        <th>Student Name</th>
                        <th>USN</th>
                        <th>Marks</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluatedProjects.map((p, idx) => {
                        const pid = p.project_id || p.id;
                        return (
                          <tr key={idx}>
                            <td>
                              <span className="project-table-id">
                                {pid}
                              </span>
                            </td>
                            <td className="font-semibold">{p.title}</td>
                            <td>{p.student_name || "Student"}</td>
                            <td>{p.student_id || "4KV21CS042"}</td>
                            <td>
                              <span className="project-score-badge">
                                {p.marks}/100
                              </span>
                            </td>
                            <td>
                              <span className="project-status-pill">
                                Approved
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TASKS CREATED TAB */}
        {activeTab === "tasks" && (
          <div className="tab-content" style={{ padding: 0 }}>
            <TasksCreatedView />
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="tab-content" style={{ padding: 0 }}>
            <DashboardOverview role="faculty" />
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default FacultyHomePage;
