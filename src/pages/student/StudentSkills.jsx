import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import "./StudentSkills.css";
import "./StudentProfile.css";

function StudentSkills() {
  const { user, updateUser } = useAuth();

  const normalizeAcademics = (raw) => {
    if (raw && typeof raw === "object" && !Array.isArray(raw) && (raw.sslc || raw.puc || raw.beSemesters)) {
      return {
        sslc: {
          education: "SSLC (10th)",
          institute: raw.sslc?.institute || "St. Joseph's High School",
          board: raw.sslc?.board || "Karnataka SSLC Board",
          year: raw.sslc?.year || "2018",
          score: raw.sslc?.score || "94.20 %",
          documentUrl: raw.sslc?.documentUrl || null,
          documentName: raw.sslc?.documentName || null
        },
        puc: {
          education: "PUC (12th)",
          institute: raw.puc?.institute || "Govt. PU College",
          board: raw.puc?.board || "Karnataka PUE Board (Science)",
          year: raw.puc?.year || "2020",
          score: raw.puc?.score || "91.80 %",
          documentUrl: raw.puc?.documentUrl || null,
          documentName: raw.puc?.documentName || null
        },
        beSemesters: Array.isArray(raw.beSemesters) && raw.beSemesters.length > 0 ? raw.beSemesters : [
          { sem: "1st Sem", sgpa: "8.20", year: "2023", documentUrl: null, documentName: null },
          { sem: "2nd Sem", sgpa: "8.40", year: "2023", documentUrl: null, documentName: null },
          { sem: "3rd Sem", sgpa: "8.15", year: "2024", documentUrl: null, documentName: null },
          { sem: "4th Sem", sgpa: "8.50", year: "2024", documentUrl: null, documentName: null },
          { sem: "5th Sem", sgpa: "8.65", year: "2025", documentUrl: null, documentName: null }
        ]
      };
    }

    const defaultObj = {
      sslc: {
        education: "SSLC (10th)",
        institute: "St. Joseph's High School",
        board: "Karnataka SSLC Board",
        year: "2018",
        score: "94.20 %",
        documentUrl: null,
        documentName: null
      },
      puc: {
        education: "PUC (12th)",
        institute: "Govt. PU College",
        board: "Karnataka PUE Board (Science)",
        year: "2020",
        score: "91.80 %",
        documentUrl: null,
        documentName: null
      },
      beSemesters: [
        { sem: "1st Sem", sgpa: "8.20", year: "2023", documentUrl: null, documentName: null },
        { sem: "2nd Sem", sgpa: "8.40", year: "2023", documentUrl: null, documentName: null },
        { sem: "3rd Sem", sgpa: "8.15", year: "2024", documentUrl: null, documentName: null },
        { sem: "4th Sem", sgpa: "8.50", year: "2024", documentUrl: null, documentName: null },
        { sem: "5th Sem", sgpa: "8.65", year: "2025", documentUrl: null, documentName: null }
      ]
    };

    if (Array.isArray(raw)) {
      const sslcItem = raw.find((a) => (a.education || "").toLowerCase().includes("10th") || (a.education || "").toLowerCase().includes("sslc")) || raw[0];
      const pucItem = raw.find((a) => (a.education || "").toLowerCase().includes("12th") || (a.education || "").toLowerCase().includes("puc") || (a.education || "").toLowerCase().includes("diploma")) || raw[1];

      if (sslcItem) {
        defaultObj.sslc = {
          education: sslcItem.education || "SSLC (10th)",
          institute: sslcItem.institute || defaultObj.sslc.institute,
          board: sslcItem.board || defaultObj.sslc.board,
          year: sslcItem.year || defaultObj.sslc.year,
          score: sslcItem.score || defaultObj.sslc.score,
          documentUrl: sslcItem.documentUrl || null,
          documentName: sslcItem.documentName || null
        };
      }
      if (pucItem) {
        defaultObj.puc = {
          education: pucItem.education || "PUC (12th)",
          institute: pucItem.institute || defaultObj.puc.institute,
          board: pucItem.board || defaultObj.puc.board,
          year: pucItem.year || defaultObj.puc.year,
          score: pucItem.score || defaultObj.puc.score,
          documentUrl: pucItem.documentUrl || null,
          documentName: pucItem.documentName || null
        };
      }
    }

    return defaultObj;
  };

  const calculateAvgCGPA = (beSemesters = []) => {
    const validSgpas = (beSemesters || [])
      .map((s) => parseFloat(String(s.sgpa || "").replace(/[^0-9.]/g, "")))
      .filter((num) => !isNaN(num) && num > 0);
    if (validSgpas.length === 0) return "0.00";
    const sum = validSgpas.reduce((acc, curr) => acc + curr, 0);
    return (sum / validSgpas.length).toFixed(2);
  };

  const openPdfDocument = (dataUrl, fileName = "Marks_Card.pdf") => {
    if (!dataUrl) return;
    try {
      if (dataUrl.startsWith("data:application/pdf")) {
        const base64Data = dataUrl.split(",")[1];
        const binaryStr = atob(base64Data);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: "application/pdf" });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, "_blank");
      } else {
        window.open(dataUrl, "_blank");
      }
    } catch (e) {
      console.error("PDF preview error:", e);
      window.open(dataUrl, "_blank");
    }
  };

  const studentId = user?.student_id || user?.usn || "4KV23CS042";
  const customKey = `kvgce_student_profile_${studentId}`;

  const [academics, setAcademics] = useState(() => {
    const stored = localStorage.getItem(customKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.academics) return normalizeAcademics(parsed.academics);
      } catch (e) {
        console.error("Error reading stored academics:", e);
      }
    }
    return normalizeAcademics(user?.academics);
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempAcademics, setTempAcademics] = useState(() => normalizeAcademics(academics));
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/students/profile");
        if (res.data && res.data.data && res.data.data.academics) {
          const norm = normalizeAcademics(res.data.data.academics);
          setAcademics(norm);
        }
      } catch (err) {
        console.warn("Using local academic state:", err);
      }
    };
    fetchProfile();
  }, [user]);

  const openModal = () => {
    setTempAcademics(normalizeAcademics(academics));
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const handleAcademicFileUpload = (e, section, semIndex = null) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    if (!isPdf) {
      alert("⚠️ Only PDF document files (.pdf) are allowed for Marks Cards. Please select a PDF file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("⚠️ File size exceeds maximum 10MB limit. Please select a smaller PDF document.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const currentAcad = { ...normalizeAcademics(tempAcademics) };
      if (section === "sslc") {
        currentAcad.sslc = { ...currentAcad.sslc, documentUrl: reader.result, documentName: file.name };
      } else if (section === "puc") {
        currentAcad.puc = { ...currentAcad.puc, documentUrl: reader.result, documentName: file.name };
      } else if (section === "be" && semIndex !== null) {
        const newSems = [...(currentAcad.beSemesters || [])];
        newSems[semIndex] = { ...newSems[semIndex], documentUrl: reader.result, documentName: file.name };
        currentAcad.beSemesters = newSems;
      }
      setTempAcademics(currentAcad);
    };
    reader.readAsDataURL(file);
  };

  const removeAcademicFile = (section, semIndex = null) => {
    const currentAcad = { ...normalizeAcademics(tempAcademics) };
    if (section === "sslc") {
      currentAcad.sslc = { ...currentAcad.sslc, documentUrl: null, documentName: null };
    } else if (section === "puc") {
      currentAcad.puc = { ...currentAcad.puc, documentUrl: null, documentName: null };
    } else if (section === "be" && semIndex !== null) {
      const newSems = [...(currentAcad.beSemesters || [])];
      newSems[semIndex] = { ...newSems[semIndex], documentUrl: null, documentName: null };
      currentAcad.beSemesters = newSems;
    }
    setTempAcademics(currentAcad);
  };

  const handleSaveAcademics = async () => {
    setSaving(true);
    const normalized = normalizeAcademics(tempAcademics);
    setAcademics(normalized);

    // Save to localStorage student profile object
    const storedStr = localStorage.getItem(customKey);
    let profileObj = {};
    if (storedStr) {
      try {
        profileObj = JSON.parse(storedStr);
      } catch (e) {
        console.error(e);
      }
    }
    profileObj.academics = normalized;
    localStorage.setItem(customKey, JSON.stringify(profileObj));

    // Sync to backend DB
    try {
      await api.put("/students/profile", { academics: normalized });
    } catch (err) {
      console.warn("Backend API sync fallback:", err);
    }

    if (updateUser) {
      updateUser({ academics: normalized });
    }

    setSaving(false);
    setIsModalOpen(false);
    setMsg({ type: "success", text: "✅ Academic records and marks cards updated successfully!" });
    setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  };

  const avgCgpa = calculateAvgCGPA(academics.beSemesters);

  return (
    <DashboardLayout title="Academics">
      <div className="academics-page-container">
        {/* TOAST NOTIFICATION */}
        {msg.text && (
          <div className={`msg-alert ${msg.type}`}>
            <span>{msg.text}</span>
          </div>
        )}

        {/* HEADER TITLE & ACTION BUTTON */}
        <div className="academics-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 className="academics-heading">Academic Performance & Marks Cards</h2>
            <p className="academics-subheading">Manage and track SSLC, PUC, and B.E. Semester-wise marks and PDF documents</p>
          </div>
          <button className="section-edit-btn" onClick={openModal} style={{ background: "#003896", color: "#ffffff", border: "none", padding: "0.5rem 1.1rem" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit / Manage Academics
          </button>
        </div>

        {/* TOP SUMMARY CARDS (3 HORIZONTAL CARDS) */}
        <div className="academic-cards-grid">
          {/* CARD 1: SSLC (10th) */}
          <div className="academic-summary-card card-sslc">
            <div className="card-top-title-row text-blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                <path d="M6 12v5c3 3 9 3 12 0v-5" />
              </svg>
              <h3>SSLC (10th)</h3>
            </div>
            <div className="card-info-rows">
              <div className="info-row">
                <span className="info-label">School Name</span>
                <span className="info-value font-semibold">{academics.sslc?.institute || "St. Joseph's High School"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Board</span>
                <span className="info-value">{academics.sslc?.board || "Karnataka Board"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Passing Year</span>
                <span className="info-value">{academics.sslc?.year || "2018"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Score Percentage</span>
                <span className="info-value text-green font-bold">{academics.sslc?.score || "94.20 %"}</span>
              </div>
              <div className="info-row pdf-row">
                <span className="info-label">Marks Card (PDF)</span>
                {academics.sslc?.documentUrl ? (
                  <button
                    className="view-pdf-btn"
                    onClick={() => openPdfDocument(academics.sslc.documentUrl, academics.sslc.documentName || "SSLC_Marks_Card.pdf")}
                  >
                    <span>📄 View PDF</span>
                  </button>
                ) : (
                  <button className="view-pdf-btn" onClick={openModal}>
                    <span>📤 Upload PDF</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* CARD 2: PUC (12th) */}
          <div className="academic-summary-card card-puc">
            <div className="card-top-title-row text-green">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
                <path d="M9 22v-4h6v4" />
              </svg>
              <h3>PUC (12th / Diploma)</h3>
            </div>
            <div className="card-info-rows">
              <div className="info-row">
                <span className="info-label">College Name</span>
                <span className="info-value font-semibold">{academics.puc?.institute || "Govt. PU College"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Board / Stream</span>
                <span className="info-value">{academics.puc?.board || "PUE Board"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Passing Year</span>
                <span className="info-value">{academics.puc?.year || "2020"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Score Percentage</span>
                <span className="info-value text-green font-bold">{academics.puc?.score || "91.80 %"}</span>
              </div>
              <div className="info-row pdf-row">
                <span className="info-label">Marks Card (PDF)</span>
                {academics.puc?.documentUrl ? (
                  <button
                    className="view-pdf-btn"
                    onClick={() => openPdfDocument(academics.puc.documentUrl, academics.puc.documentName || "PUC_Marks_Card.pdf")}
                  >
                    <span>📄 View PDF</span>
                  </button>
                ) : (
                  <button className="view-pdf-btn" onClick={openModal}>
                    <span>📤 Upload PDF</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* CARD 3: B.E. Overall Performance */}
          <div className="academic-summary-card card-be">
            <div className="card-top-title-row text-purple">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2.5">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <h3>B.E. Engineering CGPA</h3>
            </div>
            <div className="be-stat-boxes-grid">
              <div className="be-stat-box">
                <span className="be-stat-lbl">Average B.E. CGPA</span>
                <span className="be-stat-val text-blue font-bold">{avgCgpa}</span>
              </div>
              <div className="be-stat-box">
                <span className="be-stat-lbl">Semesters Added</span>
                <span className="be-stat-val text-green font-bold">{academics.beSemesters?.length || 0} / 8</span>
              </div>
            </div>
            <div className="be-summary-row">
              <div className="be-sum-item">
                <span className="be-sum-lbl">Calculated Metric</span>
                <span className="be-sum-val text-purple font-bold">Average SGPA across Sem 1-8</span>
              </div>
            </div>
          </div>
        </div>

        {/* 1. SCHOOL & PRE-COLLEGE ACADEMICS CARD */}
        <div className="profile-section-card">
          <div className="section-card-header">
            <div className="header-title-flex">
              <div className="section-icon-badge blue-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2.5">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <h3 className="section-title">School & Pre-College Academics (SSLC & PUC)</h3>
            </div>
            <button className="section-edit-btn" onClick={openModal}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Details
            </button>
          </div>

          <div className="table-responsive-container">
            <table className="marks-table">
              <thead>
                <tr>
                  <th>Education Stage</th>
                  <th>School / College Name</th>
                  <th>University / Board</th>
                  <th>Year</th>
                  <th>Percentage (%)</th>
                  <th>Marks Card Document</th>
                </tr>
              </thead>
              <tbody>
                {[academics.sslc, academics.puc].filter(Boolean).map((row, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold">{row.education}</td>
                    <td>{row.institute}</td>
                    <td>{row.board}</td>
                    <td>{row.year}</td>
                    <td className="score-cell">
                      <span className="font-bold">{row.score}</span>
                    </td>
                    <td>
                      {row.documentUrl ? (
                        <button
                          type="button"
                          className="view-doc-btn"
                          onClick={() => openPdfDocument(row.documentUrl, row.documentName || `${row.education}_Marks_Card.pdf`)}
                          title={`View ${row.documentName || row.education + " Marks Card PDF"}`}
                        >
                          📄 View PDF
                        </button>
                      ) : (
                        <button className="upload-doc-badge-btn" onClick={openModal}>
                          📤 Upload PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 2. B.E. ENGINEERING SEMESTER ACADEMICS (SEM 1 TO 8) */}
        <div className="profile-section-card">
          <div className="section-card-header">
            <div className="header-title-flex">
              <div className="section-icon-badge green-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div>
                <h3 className="section-title" style={{ margin: 0 }}>B.E. Semester-wise Performance (Sem 1 - 8)</h3>
                <span style={{ fontSize: "0.76rem", fontWeight: "700", color: "#16a34a", background: "#dcfce7", padding: "0.15rem 0.55rem", borderRadius: "12px", marginTop: "0.25rem", display: "inline-block" }}>
                  🎓 Overall Average B.E. CGPA: {avgCgpa} CGPA ({academics.beSemesters?.length || 0} Semesters)
                </span>
              </div>
            </div>
            <button className="section-edit-btn" onClick={openModal}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Manage Semesters
            </button>
          </div>

          <div className="table-responsive-container">
            <table className="marks-table">
              <thead>
                <tr>
                  <th>Semester</th>
                  <th>Year</th>
                  <th>SGPA Score</th>
                  <th>Semester Marks Card</th>
                </tr>
              </thead>
              <tbody>
                {(academics.beSemesters || []).map((semRow, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold">{semRow.sem}</td>
                    <td>{semRow.year || "2023"}</td>
                    <td className="score-cell">
                      <span className="font-bold" style={{ color: "#003896" }}>{semRow.sgpa} CGPA</span>
                    </td>
                    <td>
                      {semRow.documentUrl ? (
                        <button
                          type="button"
                          className="view-doc-btn"
                          onClick={() => openPdfDocument(semRow.documentUrl, semRow.documentName || `${semRow.sem}_Marks_Card.pdf`)}
                          title={`View ${semRow.documentName || semRow.sem + " Marks Card PDF"}`}
                        >
                          📄 View PDF
                        </button>
                      ) : (
                        <button className="upload-doc-badge-btn" onClick={openModal}>
                          📤 Upload PDF
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* EDIT ACADEMICS MODAL */}
        {isModalOpen && (
          <div className="profile-modal-backdrop" onClick={closeModal}>
            <div className="profile-modal-container modal-large" onClick={(e) => e.stopPropagation()}>
              <div className="profile-modal-header">
                <h3>Manage Academic Details & Marks Cards</h3>
                <button className="modal-close-x" onClick={closeModal}>&times;</button>
              </div>

              <div className="profile-modal-body">
                {/* FIXED SECTION 1: SSLC / 10TH */}
                <div className="academic-row-edit-card" style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1rem", marginBottom: "1rem", background: "#f8fafc" }}>
                  <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.88rem", color: "#003896", fontWeight: 700 }}>
                    1️⃣ SSLC / 10th Standard (School)
                  </h4>
                  <div className="modal-form-grid">
                    <div className="modal-form-group">
                      <label>School Name</label>
                      <input
                        type="text"
                        placeholder="e.g. St. Joseph's High School"
                        value={tempAcademics?.sslc?.institute || ""}
                        onChange={(e) => {
                          const acad = normalizeAcademics(tempAcademics);
                          setTempAcademics({ ...acad, sslc: { ...acad.sslc, institute: e.target.value } });
                        }}
                      />
                    </div>
                    <div className="modal-form-group">
                      <label>Board Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Karnataka SSLC Board"
                        value={tempAcademics?.sslc?.board || ""}
                        onChange={(e) => {
                          const acad = normalizeAcademics(tempAcademics);
                          setTempAcademics({ ...acad, sslc: { ...acad.sslc, board: e.target.value } });
                        }}
                      />
                    </div>
                    <div className="modal-form-group">
                      <label>Passing Year</label>
                      <input
                        type="text"
                        placeholder="e.g. 2018"
                        value={tempAcademics?.sslc?.year || ""}
                        onChange={(e) => {
                          const acad = normalizeAcademics(tempAcademics);
                          setTempAcademics({ ...acad, sslc: { ...acad.sslc, year: e.target.value } });
                        }}
                      />
                    </div>
                    <div className="modal-form-group">
                      <label>Percentage (%)</label>
                      <input
                        type="text"
                        placeholder="e.g. 94.20 %"
                        value={tempAcademics?.sslc?.score || ""}
                        onChange={(e) => {
                          const acad = normalizeAcademics(tempAcademics);
                          setTempAcademics({ ...acad, sslc: { ...acad.sslc, score: e.target.value } });
                        }}
                      />
                    </div>
                    <div className="modal-form-group" style={{ gridColumn: "1 / -1" }}>
                      <label>Upload 10th SSLC Marks Card (PDF Only)</label>
                      {tempAcademics?.sslc?.documentUrl ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.5rem 0.75rem", borderRadius: "6px" }}>
                          <span style={{ fontSize: "0.8rem", color: "#166534", fontWeight: 700 }}>
                            📄 {tempAcademics.sslc.documentName || "SSLC Marks Card.pdf"}
                          </span>
                          <button
                            type="button"
                            onClick={() => openPdfDocument(tempAcademics.sslc.documentUrl, tempAcademics.sslc.documentName || "SSLC_Marks_Card.pdf")}
                            style={{ background: "none", border: "none", fontSize: "0.75rem", color: "#15803d", fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}
                          >
                            Preview PDF
                          </button>
                          <button type="button" style={{ marginLeft: "auto", background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", fontSize: "0.72rem", padding: "0.18rem 0.5rem", borderRadius: "4px", cursor: "pointer", fontWeight: 700 }} onClick={() => removeAcademicFile("sslc")}>
                            Remove
                          </button>
                        </div>
                      ) : (
                        <input type="file" accept="application/pdf,.pdf" style={{ fontSize: "0.8rem", padding: "0.45rem", border: "1px dashed #cbd5e1", borderRadius: "6px", width: "100%", background: "#ffffff" }} onChange={(e) => handleAcademicFileUpload(e, "sslc")} />
                      )}
                    </div>
                  </div>
                </div>

                {/* FIXED SECTION 2: PUC / 12TH */}
                <div className="academic-row-edit-card" style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1rem", marginBottom: "1rem", background: "#f8fafc" }}>
                  <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.88rem", color: "#003896", fontWeight: 700 }}>
                    2️⃣ PUC / 12th / Diploma (College)
                  </h4>
                  <div className="modal-form-grid">
                    <div className="modal-form-group">
                      <label>College Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Govt. PU College"
                        value={tempAcademics?.puc?.institute || ""}
                        onChange={(e) => {
                          const acad = normalizeAcademics(tempAcademics);
                          setTempAcademics({ ...acad, puc: { ...acad.puc, institute: e.target.value } });
                        }}
                      />
                    </div>
                    <div className="modal-form-group">
                      <label>Board / Stream</label>
                      <input
                        type="text"
                        placeholder="e.g. Karnataka PUE Board (Science)"
                        value={tempAcademics?.puc?.board || ""}
                        onChange={(e) => {
                          const acad = normalizeAcademics(tempAcademics);
                          setTempAcademics({ ...acad, puc: { ...acad.puc, board: e.target.value } });
                        }}
                      />
                    </div>
                    <div className="modal-form-group">
                      <label>Passing Year</label>
                      <input
                        type="text"
                        placeholder="e.g. 2020"
                        value={tempAcademics?.puc?.year || ""}
                        onChange={(e) => {
                          const acad = normalizeAcademics(tempAcademics);
                          setTempAcademics({ ...acad, puc: { ...acad.puc, year: e.target.value } });
                        }}
                      />
                    </div>
                    <div className="modal-form-group">
                      <label>Percentage (%)</label>
                      <input
                        type="text"
                        placeholder="e.g. 91.80 %"
                        value={tempAcademics?.puc?.score || ""}
                        onChange={(e) => {
                          const acad = normalizeAcademics(tempAcademics);
                          setTempAcademics({ ...acad, puc: { ...acad.puc, score: e.target.value } });
                        }}
                      />
                    </div>
                    <div className="modal-form-group" style={{ gridColumn: "1 / -1" }}>
                      <label>Upload PUC / 12th Marks Card (PDF Only)</label>
                      {tempAcademics?.puc?.documentUrl ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.5rem 0.75rem", borderRadius: "6px" }}>
                          <span style={{ fontSize: "0.8rem", color: "#166534", fontWeight: 700 }}>
                            📄 {tempAcademics.puc.documentName || "PUC Marks Card.pdf"}
                          </span>
                          <button
                            type="button"
                            onClick={() => openPdfDocument(tempAcademics.puc.documentUrl, tempAcademics.puc.documentName || "PUC_Marks_Card.pdf")}
                            style={{ background: "none", border: "none", fontSize: "0.75rem", color: "#15803d", fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}
                          >
                            Preview PDF
                          </button>
                          <button type="button" style={{ marginLeft: "auto", background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", fontSize: "0.72rem", padding: "0.18rem 0.5rem", borderRadius: "4px", cursor: "pointer", fontWeight: 700 }} onClick={() => removeAcademicFile("puc")}>
                            Remove
                          </button>
                        </div>
                      ) : (
                        <input type="file" accept="application/pdf,.pdf" style={{ fontSize: "0.8rem", padding: "0.45rem", border: "1px dashed #cbd5e1", borderRadius: "6px", width: "100%", background: "#ffffff" }} onChange={(e) => handleAcademicFileUpload(e, "puc")} />
                      )}
                    </div>
                  </div>
                </div>

                {/* DYNAMIC SECTION 3: B.E. SEMESTERS (SEM 1 TO 8) */}
                <div className="academic-row-edit-card" style={{ border: "1px solid #bbf7d0", borderRadius: "10px", padding: "1rem", marginBottom: "1rem", background: "#f0fdf4" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                    <h4 style={{ margin: 0, fontSize: "0.88rem", color: "#166534", fontWeight: 700 }}>
                      3️⃣ B.E. Semesters (Semester 1 to 8)
                    </h4>
                    <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#15803d", background: "#ffffff", padding: "0.2rem 0.6rem", borderRadius: "12px", border: "1px solid #86efac" }}>
                      Calculated Average CGPA: {calculateAvgCGPA(normalizeAcademics(tempAcademics).beSemesters)} CGPA
                    </span>
                  </div>

                  {(normalizeAcademics(tempAcademics).beSemesters || []).map((sem, sIdx) => (
                    <div key={sIdx} style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0.75rem", marginBottom: "0.75rem", background: "#ffffff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#003896" }}>
                          {sem.sem || `Semester ${sIdx + 1}`}
                        </span>
                        {normalizeAcademics(tempAcademics).beSemesters.length > 1 && (
                          <button
                            type="button"
                            style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.74rem", fontWeight: 700, cursor: "pointer" }}
                            onClick={() => {
                              const acad = normalizeAcademics(tempAcademics);
                              const updatedSems = acad.beSemesters.filter((_, idx) => idx !== sIdx);
                              setTempAcademics({ ...acad, beSemesters: updatedSems });
                            }}
                          >
                            🗑️ Delete Sem
                          </button>
                        )}
                      </div>

                      <div className="modal-form-grid">
                        <div className="modal-form-group">
                          <label>Semester Name</label>
                          <input
                            type="text"
                            placeholder="e.g. 1st Sem"
                            value={sem.sem || ""}
                            onChange={(e) => {
                              const acad = normalizeAcademics(tempAcademics);
                              const updatedSems = [...acad.beSemesters];
                              updatedSems[sIdx] = { ...updatedSems[sIdx], sem: e.target.value };
                              setTempAcademics({ ...acad, beSemesters: updatedSems });
                            }}
                          />
                        </div>

                        <div className="modal-form-group">
                          <label>Passing Year</label>
                          <input
                            type="text"
                            placeholder="e.g. 2023"
                            value={sem.year || ""}
                            onChange={(e) => {
                              const acad = normalizeAcademics(tempAcademics);
                              const updatedSems = [...acad.beSemesters];
                              updatedSems[sIdx] = { ...updatedSems[sIdx], year: e.target.value };
                              setTempAcademics({ ...acad, beSemesters: updatedSems });
                            }}
                          />
                        </div>

                        <div className="modal-form-group">
                          <label>SGPA Score</label>
                          <input
                            type="text"
                            placeholder="e.g. 8.25"
                            value={sem.sgpa || ""}
                            onChange={(e) => {
                              const acad = normalizeAcademics(tempAcademics);
                              const updatedSems = [...acad.beSemesters];
                              updatedSems[sIdx] = { ...updatedSems[sIdx], sgpa: e.target.value };
                              setTempAcademics({ ...acad, beSemesters: updatedSems });
                            }}
                          />
                        </div>

                        <div className="modal-form-group" style={{ gridColumn: "1 / -1" }}>
                          <label>Marks Card Document (PDF Only)</label>
                          {sem.documentUrl ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.4rem 0.6rem", borderRadius: "6px" }}>
                              <span style={{ fontSize: "0.78rem", color: "#166534", fontWeight: 700 }}>
                                📄 {sem.documentName || sem.sem + " Marks Card.pdf"}
                              </span>
                              <button
                                type="button"
                                onClick={() => openPdfDocument(sem.documentUrl, sem.documentName || `${sem.sem}_Marks_Card.pdf`)}
                                style={{ background: "none", border: "none", fontSize: "0.75rem", color: "#15803d", fontWeight: 700, textDecoration: "underline", cursor: "pointer" }}
                              >
                                Preview PDF
                              </button>
                              <button type="button" style={{ marginLeft: "auto", background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", fontSize: "0.7rem", padding: "0.15rem 0.45rem", borderRadius: "4px", cursor: "pointer", fontWeight: 700 }} onClick={() => removeAcademicFile("be", sIdx)}>
                                Remove
                              </button>
                            </div>
                          ) : (
                            <input type="file" accept="application/pdf,.pdf" style={{ fontSize: "0.78rem", padding: "0.4rem", border: "1px dashed #cbd5e1", borderRadius: "6px", width: "100%", background: "#f8fafc" }} onChange={(e) => handleAcademicFileUpload(e, "be", sIdx)} />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {normalizeAcademics(tempAcademics).beSemesters.length < 8 && (
                    <button
                      type="button"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        background: "#ffffff",
                        color: "#16a34a",
                        border: "1px solid #86efac",
                        padding: "0.45rem 0.9rem",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                      onClick={() => {
                        const acad = normalizeAcademics(tempAcademics);
                        const currentCount = acad.beSemesters.length;
                        const nextSemNum = currentCount + 1;
                        const ordinals = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
                        const semLabel = `${ordinals[nextSemNum - 1] || nextSemNum + "th"} Sem`;
                        const startYear = parseInt(acad.beSemesters[0]?.year || "2023", 10);
                        const newYear = isNaN(startYear) ? "2023" : String(startYear + Math.floor((nextSemNum - 1) / 2));
                        const newSems = [
                          ...acad.beSemesters,
                          { sem: semLabel, sgpa: "8.00", year: newYear, documentUrl: null, documentName: null }
                        ];
                        setTempAcademics({ ...acad, beSemesters: newSems });
                      }}
                    >
                      ➕ Add Semester ({normalizeAcademics(tempAcademics).beSemesters.length + 1} of 8)
                    </button>
                  )}
                </div>
              </div>

              <div className="profile-modal-footer">
                <button className="modal-cancel-btn" onClick={closeModal} disabled={saving}>Cancel</button>
                <button className="modal-save-btn" onClick={handleSaveAcademics} disabled={saving}>
                  {saving ? "Saving Changes..." : "Save Academic Details"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default StudentSkills;
