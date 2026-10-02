import React, { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import "./StudentProjectsPage.css";

const DEFAULT_PROJECTS = [
  {
    id: "38472615",
    project_id: "38472615",
    title: "KVGCE TAP Portal & Placement Management Platform",
    description: "An end-to-end talent assessment and campus placement management web application built for KVGCE students and training officers. Features automated student rankings, aptitude tests, and real-time dashboard analytics.",
    githubUrl: "https://github.com/venkatesh-r/kvgce-tap-platform",
    hostedUrl: "https://kvgce-tap.vercel.app",
    techStack: ["React.js", "FastAPI", "MongoDB", "Python"],
    pptUrl: null,
    pptName: "KVGCE_TAP_Presentation.pptx",
    pdfUrl: null,
    pdfName: "KVGCE_TAP_Project_Report.pdf"
  },
  {
    id: "72910463",
    project_id: "72910463",
    title: "AI-Powered Skill Assessment & Career Assistant",
    description: "An interactive AI platform that conducts mock HR & Technical interviews, analyzes coding submissions, and delivers personalized career learning roadmaps for engineering graduates.",
    githubUrl: "https://github.com/venkatesh-r/ai-career-assistant",
    hostedUrl: "https://ai-career-assistant.demo.dev",
    techStack: ["Python", "PyTorch", "React", "Node.js"],
    pptUrl: null,
    pptName: "AI_Career_Assistant_Presentation.pptx",
    pdfUrl: null,
    pdfName: "AI_Career_Assistant_Report.pdf"
  }
];

function formatExternalUrl(url) {
  if (!url || !url.trim() || url.trim() === "#") return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

const generate8DigitProjectId = (existingProjects = []) => {
  const existingIds = new Set((existingProjects || []).map((p) => String(p.project_id || p.id)));
  let newId;
  do {
    newId = String(Math.floor(10000000 + Math.random() * 90000000));
  } while (existingIds.has(newId));
  return newId;
};

export default function StudentProjectsPage() {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(() => {
    const studentId = user?.student_id || user?.usn || "4KV23CS042";
    const saved = localStorage.getItem(`kvgce_student_profile_${studentId}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          projects: (parsed.projects || DEFAULT_PROJECTS).map((p) => ({
            ...p,
            project_id: String(p.project_id || p.id || generate8DigitProjectId()),
            id: String(p.project_id || p.id || generate8DigitProjectId())
          }))
        };
      } catch (e) {
        console.error(e);
      }
    }
    return {
      full_name: user?.full_name || "Venkatesh V",
      student_id: studentId,
      department: user?.department || "Computer Science Engineering",
      projects: DEFAULT_PROJECTS
    };
  });

  const [activeModal, setActiveModal] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [isEditingExisting, setIsEditingExisting] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Fetch latest projects from backend on mount
  useEffect(() => {
    api.get("/students/projects")
      .then((res) => {
        if (res.data && res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const apiProjects = res.data.data.map((p) => ({
            ...p,
            project_id: String(p.project_id || p.id),
            id: String(p.project_id || p.id)
          }));
          setProfile((prev) => {
            const updated = { ...prev, projects: apiProjects };
            const studentId = prev.student_id || user?.student_id || user?.usn || "4KV23CS042";
            localStorage.setItem(`kvgce_student_profile_${studentId}`, JSON.stringify(updated));
            return updated;
          });
        }
      })
      .catch((err) => console.warn("Backend projects fetch fallback:", err));
  }, [user]);

  const saveProjectsToStorage = (updatedProjects) => {
    const sanitizedProjects = updatedProjects.map((p) => {
      const pid = String(p.project_id || p.id || generate8DigitProjectId(updatedProjects));
      return { ...p, project_id: pid, id: pid };
    });

    const updatedProfile = { ...profile, projects: sanitizedProjects };
    setProfile(updatedProfile);

    const studentId = profile.student_id || user?.student_id || user?.usn || "4KV23CS042";
    localStorage.setItem(`kvgce_student_profile_${studentId}`, JSON.stringify(updatedProfile));

    if (updateUser) {
      updateUser({ projects: sanitizedProjects });
    }

    api.put("/students/profile", { projects: sanitizedProjects }).catch((err) => console.warn(err));
  };

  const handleOpenAddModal = () => {
    const newId = generate8DigitProjectId(profile.projects);
    setEditingProject({
      id: newId,
      project_id: newId,
      title: "",
      githubUrl: "",
      hostedUrl: "",
      description: "",
      techStackInput: "",
      techStack: [],
      pptUrl: null,
      pptName: null,
      pdfUrl: null,
      pdfName: null
    });
    setIsEditingExisting(false);
    setActiveModal(true);
  };

  const handleOpenEditModal = (proj) => {
    const projId = String(proj.project_id || proj.id || generate8DigitProjectId(profile.projects));
    setEditingProject({
      ...proj,
      id: projId,
      project_id: projId,
      techStackInput: proj.techStack ? proj.techStack.join(", ") : ""
    });
    setIsEditingExisting(true);
    setActiveModal(true);
  };

  const handleDeleteProject = (projId) => {
    const cleanId = String(projId);
    const updated = (profile.projects || []).filter((p) => String(p.project_id || p.id) !== cleanId);
    saveProjectsToStorage(updated);
    
    api.delete(`/students/projects/${cleanId}`).catch((err) => console.warn(err));

    setMsg({ type: "success", text: "✅ Project deleted successfully!" });
    setTimeout(() => setMsg({ type: "", text: "" }), 3500);
  };

  const handlePptFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const fileName = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      setEditingProject((prev) => ({
        ...prev,
        pptUrl: reader.result,
        pptName: fileName
      }));
    };
    reader.readAsDataURL(file);
  };

  const handlePdfFileUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const fileName = file.name;
    const reader = new FileReader();
    reader.onload = () => {
      setEditingProject((prev) => ({
        ...prev,
        pdfUrl: reader.result,
        pdfName: fileName
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProjectModal = async () => {
    if (!editingProject?.title || !editingProject.title.trim()) {
      setMsg({ type: "error", text: "⚠️ Please enter a Project Title." });
      setTimeout(() => setMsg({ type: "", text: "" }), 4000);
      return;
    }

    const projId = String(editingProject.project_id || editingProject.id || generate8DigitProjectId(profile.projects));

    const techArray = editingProject.techStackInput
      ? editingProject.techStackInput.split(",").map((s) => s.trim()).filter(Boolean)
      : editingProject.techStack || [];

    const cleanProject = {
      id: projId,
      project_id: projId,
      title: editingProject.title.trim(),
      githubUrl: formatExternalUrl(editingProject.githubUrl),
      hostedUrl: formatExternalUrl(editingProject.hostedUrl),
      description: editingProject.description ? editingProject.description.trim() : "",
      techStack: techArray,
      pptUrl: editingProject.pptUrl || null,
      pptName: editingProject.pptName || null,
      pdfUrl: editingProject.pdfUrl || null,
      pdfName: editingProject.pdfName || null,
      documentUrl: editingProject.pdfUrl || editingProject.pptUrl || null,
      documentName: editingProject.pdfName || editingProject.pptName || null,
      documentType: editingProject.pptName ? "ppt" : "pdf",
      status: editingProject.status || "Pending",
      marks: editingProject.marks !== undefined ? editingProject.marks : null,
      faculty_name: editingProject.faculty_name || null
    };

    const currentList = [...(profile.projects || [])];
    const idx = currentList.findIndex((p) => String(p.project_id || p.id) === projId);

    if (idx >= 0) {
      currentList[idx] = cleanProject;
    } else {
      currentList.push(cleanProject);
    }

    saveProjectsToStorage(currentList);

    // Call backend API
    try {
      if (isEditingExisting) {
        await api.put(`/students/projects/${projId}`, cleanProject);
      } else {
        await api.post("/students/projects", cleanProject);
      }
    } catch (err) {
      console.warn("API project save fallback:", err);
    }

    setActiveModal(false);
    setMsg({ type: "success", text: `✅ Project saved successfully! (Project ID: ${projId})` });
    setTimeout(() => setMsg({ type: "", text: "" }), 4500);
  };

  const openPdfDocument = (pdfUrl, pdfName, docTitle = "Project") => {
    if (pdfUrl && pdfUrl.startsWith("data:application/pdf")) {
      const win = window.open();
      if (win) {
        win.document.write(
          `<iframe src="${pdfUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`
        );
        win.document.title = pdfName || `${docTitle}_Report.pdf`;
        return;
      }
    }

    const content = `=====================================================
KVG COLLEGE OF ENGINEERING (KVGCE), SULLIA
DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
PROJECT REPORT (PDF)
=====================================================

Project Title: ${docTitle}
Student Name: ${profile.full_name}
USN: ${profile.student_id}

Document File: ${pdfName || `${docTitle}_Report.pdf`}
Generated Date: ${new Date().toLocaleDateString()}

-----------------------------------------------------
PROJECT SUMMARY:
-----------------------------------------------------
Full-stack engineering project documentation submitted by ${profile.full_name}.

=====================================================
KVGCE Training & Placement Cell (TAP)
=====================================================`;

    const blob = new Blob([content], { type: "application/pdf" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = pdfName || `${docTitle.replace(/\s+/g, "_")}_Report.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  };

  const openPptDocument = (pptUrl, pptName, docTitle = "Project") => {
    if (pptUrl) {
      const link = document.createElement("a");
      link.href = pptUrl;
      link.download = pptName || `${docTitle}_Presentation.pptx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    const content = `=====================================================
KVG COLLEGE OF ENGINEERING (KVGCE), SULLIA
DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
PROJECT PRESENTATION SLIDES (PPT)
=====================================================

Project Title: ${docTitle}
Student Name: ${profile.full_name}
USN: ${profile.student_id}

Presentation File: ${pptName || `${docTitle}_Presentation.pptx`}
Generated Date: ${new Date().toLocaleDateString()}

=====================================================
KVGCE TAP Cell
=====================================================`;

    const blob = new Blob([content], { type: "application/vnd.ms-powerpoint" });
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = pptName || `${docTitle.replace(/\s+/g, "_")}_Presentation.pptx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  };

  return (
    <DashboardLayout title="Projects & Portfolio">
      <div className="projects-page-container">
        {/* HEADER BAR */}
        <div className="projects-header-card">
          <div className="projects-header-left">
            <div className="projects-header-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <div>
              <h2 className="projects-header-title">Technical Projects & Portfolio</h2>
              <p className="projects-header-sub">Manage your software engineering projects, code repositories, live sites, and upload PPT & PDF documents.</p>
            </div>
          </div>
          <button className="btn-add-new-project" onClick={handleOpenAddModal}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>+ Add New Project</span>
          </button>
        </div>

        {msg.text && (
          <div style={{ padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.88rem", fontWeight: "600", background: msg.type === "error" ? "#fef2f2" : "#f0fdf4", color: msg.type === "error" ? "#dc2626" : "#16a34a", border: `1px solid ${msg.type === "error" ? "#fca5a5" : "#bbf7d0"}` }}>
            {msg.text}
          </div>
        )}

        {/* PROJECTS LIST (1 ROW PER PROJECT) */}
        <div className="projects-list-vertical">
          {(profile.projects || []).map((proj) => {
            const pid = String(proj.project_id || proj.id);
            const githubFormatted = formatExternalUrl(proj.githubUrl);
            const hostedFormatted = formatExternalUrl(proj.hostedUrl);

            return (
              <div key={pid} className="project-item-card">
                <div className="project-item-header">
                  <div className="project-item-title-group">
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                      <h3 className="project-item-title">{proj.title}</h3>
                      <span className="project-id-badge" style={{ padding: "0.2rem 0.55rem", borderRadius: "4px", background: "#f1f5f9", color: "#475569", border: "1px solid #cbd5e1", fontSize: "0.75rem", fontWeight: "700", fontFamily: "monospace" }}>
                        Project ID: {pid}
                      </span>
                    </div>

                    {proj.techStack && proj.techStack.length > 0 && (
                      <div className="project-tech-tags" style={{ marginTop: "0.35rem" }}>
                        {proj.techStack.map((tech, idx) => (
                          <span key={idx} className="project-tech-tag">{tech}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="project-action-btn-group">
                    <button className="btn-icon-action edit-btn" onClick={() => handleOpenEditModal(proj)} title="Edit Project">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button className="btn-icon-action delete-btn" onClick={() => handleDeleteProject(pid)} title="Delete Project">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>

                {proj.description && <p className="project-item-description">{proj.description}</p>}

                {/* ACTION LINKS & DUAL FILE BADGES ROW + BOTTOM RIGHT FACULTY MARKS */}
                <div className="project-item-links-row" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
                    {githubFormatted !== "" && (
                      <a href={githubFormatted} target="_blank" rel="noopener noreferrer" className="project-link-button github">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                        </svg>
                        <span>GitHub Code</span>
                      </a>
                    )}

                    {hostedFormatted !== "" && (
                      <a href={hostedFormatted} target="_blank" rel="noopener noreferrer" className="project-link-button hosted">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                          <polyline points="15 3 21 3 21 9"/>
                          <line x1="10" y1="14" x2="21" y2="3"/>
                        </svg>
                        <span>Hosted Website</span>
                      </a>
                    )}

                    {(proj.pptName || proj.pptUrl || (proj.documentType === "ppt" && proj.documentName)) && (
                      <button type="button" className="project-link-button ppt" onClick={() => openPptDocument(proj.pptUrl || proj.documentUrl, proj.pptName || proj.documentName, proj.title)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                          <line x1="8" y1="21" x2="16" y2="21" />
                          <line x1="12" y1="17" x2="12" y2="21" />
                        </svg>
                        <span>View PPT</span>
                      </button>
                    )}

                    {(proj.pdfName || proj.pdfUrl || (proj.documentType === "pdf" && proj.documentName)) && (
                      <button type="button" className="project-link-button pdf" onClick={() => openPdfDocument(proj.pdfUrl || proj.documentUrl, proj.pdfName || proj.documentName, proj.title)}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14 2 14 8 20 8"/>
                          <line x1="16" y1="13" x2="8" y2="13"/>
                          <line x1="16" y1="17" x2="8" y2="17"/>
                        </svg>
                        <span>View PDF</span>
                      </button>
                    )}
                  </div>

                  {/* BOTTOM-RIGHT FACULTY MARKS POSITION */}
                  {proj.marks !== undefined && proj.marks !== null ? (
                    <div className="project-marks-badge-container" style={{ marginLeft: "auto", textAlign: "right" }}>
                      <div className="project-marks-pill" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.75rem", borderRadius: "20px", background: "#f0fdf4", border: "1px solid #86efac", color: "#15803d", fontWeight: "800", fontSize: "0.85rem" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                        <span>Faculty Approved: <strong>{proj.marks}/100</strong></span>
                      </div>
                      {proj.faculty_name && (
                        <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.15rem" }}>
                          Approved by: {proj.faculty_name}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="project-marks-badge-container" style={{ marginLeft: "auto", textAlign: "right" }}>
                      <div className="project-marks-pill" style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.35rem 0.75rem", borderRadius: "20px", background: "#f8fafc", border: "1px solid #cbd5e1", color: "#64748b", fontWeight: "700", fontSize: "0.82rem" }}>
                        <span>Not Evaluated</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* ADD / EDIT PROJECT MODAL */}
        {activeModal && editingProject && (
          <div className="project-modal-overlay">
            <div className="project-modal-box">
              <div className="project-modal-header">
                <h3>{editingProject.id ? "Edit Technical Project" : "Add New Technical Project"}</h3>
                <button className="project-modal-close" onClick={() => setActiveModal(false)}>✕</button>
              </div>

              <div className="project-modal-body">
                {/* Project Title */}
                <div className="form-group-field">
                  <label>Project Title *</label>
                  <input
                    type="text"
                    placeholder="e.g. KVGCE TAP Portal & Placement Management Platform"
                    value={editingProject.title || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                  />
                </div>

                {/* Tech Stack */}
                <div className="form-group-field">
                  <label>Technologies / Tech Stack (Comma Separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. React.js, Python, FastAPI, MongoDB, Tailwind CSS"
                    value={editingProject.techStackInput !== undefined ? editingProject.techStackInput : (editingProject.techStack ? editingProject.techStack.join(", ") : "")}
                    onChange={(e) => setEditingProject({ ...editingProject, techStackInput: e.target.value })}
                  />
                </div>

                {/* GitHub & Hosted URLs */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div className="form-group-field">
                    <label>GitHub Project Link</label>
                    <input
                      type="url"
                      placeholder="https://github.com/username/project-repo"
                      value={editingProject.githubUrl || ""}
                      onChange={(e) => setEditingProject({ ...editingProject, githubUrl: e.target.value })}
                    />
                  </div>

                  <div className="form-group-field">
                    <label>Hosted Live Site Link</label>
                    <input
                      type="url"
                      placeholder="https://my-live-demo.vercel.app"
                      value={editingProject.hostedUrl || ""}
                      onChange={(e) => setEditingProject({ ...editingProject, hostedUrl: e.target.value })}
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="form-group-field">
                  <label>Project Description</label>
                  <textarea
                    rows={4}
                    placeholder="Describe key features, system architecture, database performance, and outcome of your project..."
                    value={editingProject.description || ""}
                    onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  />
                </div>

                {/* DUAL FILE UPLOAD CARD (PPT AND PDF BOTH) */}
                <div className="dual-file-upload-card">
                  <div style={{ fontSize: "0.85rem", fontWeight: "800", color: "#0f172a" }}>
                    📑 Upload Project Documents (PPT Slides & PDF Report)
                  </div>

                  {/* 1. PPT FILE UPLOAD */}
                  <div className="file-box-item">
                    <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#6b21a8" }}>📊 PowerPoint Presentation Slides (PPT / PPTX)</label>
                    {editingProject.pptName || editingProject.pptUrl ? (
                      <div className="file-uploaded-preview">
                        <span>📊 {editingProject.pptName || "Presentation.pptx"}</span>
                        <button type="button" className="btn-remove-file" onClick={() => setEditingProject({ ...editingProject, pptUrl: null, pptName: null })}>
                          Remove
                        </button>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept=".ppt,.pptx,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                        onChange={handlePptFileUpload}
                        style={{ fontSize: "0.8rem", padding: "0.4rem", border: "1px dashed #cbd5e1", borderRadius: "6px", background: "#ffffff", width: "100%" }}
                      />
                    )}
                  </div>

                  {/* 2. PDF FILE UPLOAD */}
                  <div className="file-box-item">
                    <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "#166534" }}>📄 Technical Project Report (PDF)</label>
                    {editingProject.pdfName || editingProject.pdfUrl ? (
                      <div className="file-uploaded-preview">
                        <span>📄 {editingProject.pdfName || "Project_Report.pdf"}</span>
                        <button type="button" className="btn-remove-file" onClick={() => setEditingProject({ ...editingProject, pdfUrl: null, pdfName: null })}>
                          Remove
                        </button>
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handlePdfFileUpload}
                        style={{ fontSize: "0.8rem", padding: "0.4rem", border: "1px dashed #cbd5e1", borderRadius: "6px", background: "#ffffff", width: "100%" }}
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="project-modal-footer">
                <button type="button" className="btn-modal-cancel" onClick={() => setActiveModal(false)}>
                  Cancel
                </button>
                <button type="button" className="btn-modal-save" onClick={handleSaveProjectModal}>
                  Save Project
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
