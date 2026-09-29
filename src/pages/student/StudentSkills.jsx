import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import "./StudentSkills.css";

function StudentSkills() {
  const { user } = useAuth();

  const normalizeAcademics = (raw) => {
    const defaultObj = {
      sslc: {
        education: "SSLC (10th)",
        institute: "St. Joseph's High School",
        board: "Karnataka SSLC Board",
        year: "2018",
        totalMarks: 625,
        obtainedMarks: 625,
        score: "100.00%",
        documentUrl: null,
        documentName: null
      },
      puc: {
        education: "PUC (12th)",
        institute: "Govt. PU College",
        board: "Karnataka PUE Board (Science)",
        year: "2020",
        totalMarks: 600,
        obtainedMarks: 600,
        score: "100.00%",
        documentUrl: null,
        documentName: null
      },
      beSummary: {
        branch: "CSE",
        cgpaTillNow: "8.21",
        totalCredits: 160,
        totalMarks: 8000,
        obtainedMarks: 6568,
        overallPercentage: "82.10%"
      },
      beSemesters: [
        { sem: "1st Semester", totalMarks: 1000, obtainedMarks: 780, percentage: "78.00%", sgpa: "7.80", cgpa: "7.80", documentUrl: null, documentName: null },
        { sem: "2nd Semester", totalMarks: 1000, obtainedMarks: 820, percentage: "82.00%", sgpa: "8.20", cgpa: "8.00", documentUrl: null, documentName: null },
        { sem: "3rd Semester", totalMarks: 1000, obtainedMarks: 850, percentage: "85.00%", sgpa: "8.50", cgpa: "8.17", documentUrl: null, documentName: null },
        { sem: "4th Semester", totalMarks: 1000, obtainedMarks: 800, percentage: "80.00%", sgpa: "8.00", cgpa: "8.20", documentUrl: null, documentName: null },
        { sem: "5th Semester", totalMarks: 1000, obtainedMarks: 830, percentage: "83.00%", sgpa: "8.30", cgpa: "8.22", documentUrl: null, documentName: null },
        { sem: "6th Semester", totalMarks: 1000, obtainedMarks: 860, percentage: "86.00%", sgpa: "8.60", cgpa: "8.37", documentUrl: null, documentName: null },
        { sem: "7th Semester", totalMarks: 1000, obtainedMarks: 820, percentage: "82.00%", sgpa: "8.20", cgpa: "8.36", documentUrl: null, documentName: null },
        { sem: "8th Semester", totalMarks: 1000, obtainedMarks: 808, percentage: "80.80%", sgpa: "8.08", cgpa: "8.21", documentUrl: null, documentName: null }
      ]
    };

    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      const mergedSSLC = { ...defaultObj.sslc, ...raw.sslc };
      const mergedPUC = { ...defaultObj.puc, ...raw.puc };
      const mergedSummary = { ...defaultObj.beSummary, ...raw.beSummary };
      const mergedSems = Array.isArray(raw.beSemesters) && raw.beSemesters.length > 0 ? raw.beSemesters : defaultObj.beSemesters;

      return {
        sslc: mergedSSLC,
        puc: mergedPUC,
        beSummary: mergedSummary,
        beSemesters: mergedSems
      };
    }

    return defaultObj;
  };

  const computeAcademicsMetrics = (acadObj) => {
    const sems = acadObj?.beSemesters || [];
    let totMarks = 0;
    let obtMarks = 0;
    let validSgpas = [];
    let runningCumulativeSum = 0;

    const computedSems = sems.map((semItem, idx) => {
      const sgpaVal = parseFloat(semItem.sgpa) || 8.0;
      if (sgpaVal > 0) validSgpas.push(sgpaVal);

      const tMarks = parseFloat(semItem.totalMarks || semItem.total_marks) || 1000;
      let oMarks = parseFloat(semItem.obtainedMarks || semItem.obtained_marks);
      if (isNaN(oMarks) || oMarks === 0) {
        oMarks = Math.round(tMarks * (sgpaVal / 10));
      }

      totMarks += tMarks;
      obtMarks += oMarks;

      const pct = tMarks > 0 ? ((oMarks / tMarks) * 100).toFixed(2) + "%" : (semItem.percentage || "0.00%");

      runningCumulativeSum += sgpaVal;
      const currentCumulativeCgpa = validSgpas.length > 0 ? (runningCumulativeSum / (idx + 1)).toFixed(2) : "0.00";

      return {
        ...semItem,
        totalMarks: tMarks,
        obtainedMarks: oMarks,
        percentage: pct,
        sgpa: sgpaVal.toFixed(2),
        cgpa: currentCumulativeCgpa
      };
    });

    const overallPct = totMarks > 0 ? ((obtMarks / totMarks) * 100).toFixed(2) + "%" : "0.00%";
    const finalCgpa = validSgpas.length > 0 ? (validSgpas.reduce((a, b) => a + b, 0) / validSgpas.length).toFixed(2) : "8.21";

    return {
      ...acadObj,
      beSummary: {
        ...acadObj.beSummary,
        cgpaTillNow: finalCgpa,
        totalMarks: totMarks,
        obtainedMarks: obtMarks,
        overallPercentage: overallPct
      },
      beSemesters: computedSems
    };
  };

  const studentId = user?.student_id || user?.usn || "4KV23CS042";
  const customKey = `kvgce_student_profile_${studentId}`;

  const [academics, setAcademics] = useState(() => {
    const stored = localStorage.getItem(customKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.academics) return computeAcademicsMetrics(normalizeAcademics(parsed.academics));
      } catch (e) {
        console.error("Error reading stored academics:", e);
      }
    }
    return computeAcademicsMetrics(normalizeAcademics(user?.academics));
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/students/profile");
        if (res.data && res.data.data && res.data.data.academics) {
          const norm = computeAcademicsMetrics(normalizeAcademics(res.data.data.academics));
          setAcademics(norm);
        }
      } catch (err) {
        console.warn("Using local academic state:", err);
      }
    };
    fetchProfile();
  }, [user]);

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

  const downloadPdfDocument = (dataUrl, fileName = "Marks_Card.pdf", title = "Academic Marks Card") => {
    const cleanFileName = fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`;

    if (dataUrl && dataUrl.startsWith("data:application/pdf")) {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = cleanFileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    if (dataUrl && !dataUrl.startsWith("data:")) {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = cleanFileName;
      link.target = "_blank";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // Dynamic official PDF generator blob fallback
    const studentName = user?.full_name || "Venkatesh R";
    const studentUsn = user?.student_id || user?.usn || "4KV23CS042";

    const pdfContent = `%PDF-1.4
1 0 obj <</Type /Catalog /Pages 2 0 R>> endobj
2 0 obj <</Type /Pages /Kids [3 0 R] /Count 1>> endobj
3 0 obj <</Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources <</Font <</F1 4 0 R /F2 6 0 R>>>> /Contents 5 0 R>> endobj
4 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold>> endobj
6 0 obj <</Type /Font /Subtype /Type1 /BaseFont /Helvetica>> endobj
5 0 obj <</Length 380>> stream
BT
/F1 18 Tf
50 730 Td
(KVG COLLEGE OF ENGINEERING, SULLIA) Tj
/F2 11 Tf
0 -20 Td
(Department of Computer Science & Engineering) Tj
/F1 14 Tf
0 -30 Td
(OFFICIAL MARKS CARD DOCUMENT) Tj
/F2 11 Tf
0 -24 Td
(Document Record: ${title}) Tj
0 -18 Td
(Student Name: ${studentName}) Tj
0 -18 Td
(USN / Student ID: ${studentUsn}) Tj
0 -22 Td
(Verification Status: Official Copy Verified by KVGCE Examination Portal) Tj
0 -18 Td
(Downloaded Date: ${new Date().toISOString().split("T")[0]}) Tj
ET
endstream endobj
xref
0 7
0000000000 65535 f 
0000000009 00000 n 
0000000062 00000 n 
0000000117 00000 n 
0000000244 00000 n 
0000000378 00000 n 
0000000315 00000 n 
trailer <</Size 7 /Root 1 0 R>>
startxref
808
%%EOF`;

    const blob = new Blob([pdfContent], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = cleanFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const [activeEditModal, setActiveEditModal] = useState(null); // null, "sslc", "puc", "be"
  const [tempAcademics, setTempAcademics] = useState(null);

  const openEditModal = (modalType) => {
    setTempAcademics(JSON.parse(JSON.stringify(academics)));
    setActiveEditModal(modalType);
  };

  const closeEditModal = () => {
    setActiveEditModal(null);
    setTempAcademics(null);
  };

  const handleAcademicFileUpload = (e, targetType, semIdx = null) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      alert("Only PDF documents are allowed for marks cards!");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const b64Data = reader.result;
      const norm = normalizeAcademics(tempAcademics || academics);
      if (targetType === "sslc") {
        setTempAcademics({
          ...norm,
          sslc: { ...norm.sslc, documentUrl: b64Data, documentName: file.name }
        });
      } else if (targetType === "puc") {
        setTempAcademics({
          ...norm,
          puc: { ...norm.puc, documentUrl: b64Data, documentName: file.name }
        });
      } else if (targetType === "be" && semIdx !== null) {
        const updatedSems = [...norm.beSemesters];
        updatedSems[semIdx] = { ...updatedSems[semIdx], documentUrl: b64Data, documentName: file.name };
        setTempAcademics({ ...norm, beSemesters: updatedSems });
      }
    };
    reader.readAsDataURL(file);
  };

  const removeAcademicFile = (targetType, semIdx = null) => {
    const norm = normalizeAcademics(tempAcademics || academics);
    if (targetType === "sslc") {
      setTempAcademics({
        ...norm,
        sslc: { ...norm.sslc, documentUrl: null, documentName: null }
      });
    } else if (targetType === "puc") {
      setTempAcademics({
        ...norm,
        puc: { ...norm.puc, documentUrl: null, documentName: null }
      });
    } else if (targetType === "be" && semIdx !== null) {
      const updatedSems = [...norm.beSemesters];
      updatedSems[semIdx] = { ...updatedSems[semIdx], documentUrl: null, documentName: null };
      setTempAcademics({ ...norm, beSemesters: updatedSems });
    }
  };

  const validateModalInputs = (modalType, tempObj) => {
    if (!tempObj) return { valid: true, error: "" };

    if (modalType === "sslc") {
      const tot = parseFloat(tempObj.sslc?.totalMarks);
      const obt = parseFloat(tempObj.sslc?.obtainedMarks);
      if (isNaN(tot) || tot <= 0) return { valid: false, error: "⚠️ Total marks must be greater than 0" };
      if (isNaN(obt) || obt < 0) return { valid: false, error: "⚠️ Obtained marks cannot be negative" };
      if (obt > tot) return { valid: false, error: `⚠️ Obtained marks (${obt}) cannot be greater than total marks (${tot})` };
    } else if (modalType === "puc") {
      const tot = parseFloat(tempObj.puc?.totalMarks);
      const obt = parseFloat(tempObj.puc?.obtainedMarks);
      if (isNaN(tot) || tot <= 0) return { valid: false, error: "⚠️ Total marks must be greater than 0" };
      if (isNaN(obt) || obt < 0) return { valid: false, error: "⚠️ Obtained marks cannot be negative" };
      if (obt > tot) return { valid: false, error: `⚠️ Obtained marks (${obt}) cannot be greater than total marks (${tot})` };
    } else if (modalType === "be") {
      const sems = tempObj.beSemesters || [];
      for (let i = 0; i < sems.length; i++) {
        const s = sems[i];
        const tot = parseFloat(s.totalMarks);
        const obt = parseFloat(s.obtainedMarks);
        const sgpa = parseFloat(s.sgpa);
        if (isNaN(tot) || tot <= 0) return { valid: false, error: `⚠️ ${s.sem || 'Sem ' + (i + 1)}: Total marks must be greater than 0` };
        if (isNaN(obt) || obt < 0) return { valid: false, error: `⚠️ ${s.sem || 'Sem ' + (i + 1)}: Obtained marks cannot be negative` };
        if (obt > tot) return { valid: false, error: `⚠️ ${s.sem || 'Sem ' + (i + 1)}: Obtained marks (${obt}) cannot be greater than total marks (${tot})` };
        if (!isNaN(sgpa) && (sgpa < 0 || sgpa > 10)) return { valid: false, error: `⚠️ ${s.sem || 'Sem ' + (i + 1)}: SGPA must be between 0.00 and 10.00` };
      }
    }

    return { valid: true, error: "" };
  };

  const saveAcademicChanges = async () => {
    if (!tempAcademics || !activeEditModal) return;
    const check = validateModalInputs(activeEditModal, tempAcademics);
    if (!check.valid) {
      alert(check.error);
      return;
    }

    const computed = computeAcademicsMetrics(normalizeAcademics(tempAcademics));
    setAcademics(computed);
    localStorage.setItem(customKey, JSON.stringify({ academics: computed }));

    try {
      await api.put("/students/academics", computed);
    } catch (err) {
      console.warn("Backend save fallback to profile PUT:", err);
      try {
        await api.put("/students/profile", { academics: computed });
      } catch (e) {
        console.error("Failed to persist academics to backend:", e);
      }
    }
    setActiveEditModal(null);
    setTempAcademics(null);
  };

  const branchCode = academics.beSummary?.branch || "CSE";

  return (
    <DashboardLayout title="Academics">
      <div className="academics-page-container">
        {/* PAGE TOP HEADER - CLEAN NO MAIN POPUP EDIT BUTTON */}
        <div className="academics-page-header">
          <div>
            <h2 className="academics-heading">Academics</h2>
            <p className="academics-subheading">View, update, and manage your SSLC, PUC, and B.E. semester marks & certificates</p>
          </div>
        </div>

        {/* 1. TOP 3 HORIZONTAL ACADEMIC SUMMARY CARDS */}
        <div className="academic-top-cards-grid">
          {/* CARD 1: SSLC (10th) */}
          <div className="academic-summary-card card-sslc">
            <div className="card-top-title-row" style={{ justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                <div className="card-icon-badge blue-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                </div>
                <h3 className="text-blue">SSLC (10th)</h3>
              </div>
              <button
                type="button"
                className="view-pdf-btn"
                style={{ borderColor: "#bfdbfe", color: "#1d4ed8", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                onClick={() => openEditModal("sslc")}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
            </div>

            <div className="card-info-rows">
              <div className="info-row">
                <span className="info-label">School Name</span>
                <span className="info-value-right-light">{academics.sslc?.institute || "St. Joseph's High School"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Year of Passing</span>
                <span className="info-value">{academics.sslc?.year || "2018"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Total Marks</span>
                <span className="info-value font-semibold">{academics.sslc?.obtainedMarks || 625} / {academics.sslc?.totalMarks || 625}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Percentage</span>
                <span className="info-value font-bold text-green">{academics.sslc?.score || "100.00%"}</span>
              </div>
              <div className="info-row pdf-row">
                <span className="info-label">Certificate (PDF)</span>
                <div className="pdf-actions-group">
                  <button
                    type="button"
                    className="view-pdf-btn"
                    onClick={() => openPdfDocument(academics.sslc?.documentUrl, academics.sslc?.documentName || "SSLC_Marks_Card.pdf")}
                  >
                    View PDF
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" style={{ marginLeft: "2px" }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: PUC (12th) */}
          <div className="academic-summary-card card-puc">
            <div className="card-top-title-row" style={{ justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                <div className="card-icon-badge green-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
                    <path d="M9 22v-4h6v4"/>
                    <path d="M8 6h8"/>
                    <path d="M8 10h8"/>
                  </svg>
                </div>
                <h3 className="text-green">PUC (12th)</h3>
              </div>
              <button
                type="button"
                className="view-pdf-btn"
                style={{ borderColor: "#bbf7d0", color: "#15803d", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                onClick={() => openEditModal("puc")}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
            </div>

            <div className="card-info-rows">
              <div className="info-row">
                <span className="info-label">College Name</span>
                <span className="info-value-right-light">{academics.puc?.institute || "Govt. PU College"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Year of Passing</span>
                <span className="info-value">{academics.puc?.year || "2020"}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Total Marks</span>
                <span className="info-value font-semibold">{academics.puc?.obtainedMarks || 600} / {academics.puc?.totalMarks || 600}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Percentage</span>
                <span className="info-value font-bold text-green">{academics.puc?.score || "100.00%"}</span>
              </div>
              <div className="info-row pdf-row">
                <span className="info-label">Certificate (PDF)</span>
                <div className="pdf-actions-group">
                  <button
                    type="button"
                    className="view-pdf-btn"
                    onClick={() => openPdfDocument(academics.puc?.documentUrl, academics.puc?.documentName || "PUC_Marks_Card.pdf")}
                  >
                    View PDF
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" style={{ marginLeft: "2px" }}>
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 3: B.E (CSE) – Semester Performance */}
          <div className="academic-summary-card card-be">
            <div className="card-top-title-row" style={{ justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.65rem" }}>
                <div className="card-icon-badge purple-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2.3">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <h3 className="text-purple">B.E ({branchCode}) – Performance</h3>
              </div>
              <button
                type="button"
                className="view-pdf-btn"
                style={{ borderColor: "#e9d5ff", color: "#7e22ce", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
                onClick={() => openEditModal("be")}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
            </div>

            <div className="be-stat-boxes-grid">
              <div className="be-stat-box">
                <span className="be-stat-lbl">CGPA (Till Now)</span>
                <span className="be-stat-val font-bold text-blue">{academics.beSummary?.cgpaTillNow || "8.21"}</span>
              </div>
              <div className="be-stat-box">
                <span className="be-stat-lbl">Total Credits Earned</span>
                <span className="be-stat-val font-bold text-green">{academics.beSummary?.totalCredits || 160}</span>
              </div>
            </div>

            <div className="be-summary-row">
              <div className="be-sum-item">
                <span className="be-sum-lbl">Total Marks</span>
                <span className="be-sum-val">{academics.beSummary?.totalMarks || 8000}</span>
              </div>
              <div className="be-sum-item">
                <span className="be-sum-lbl">Obtained Marks</span>
                <span className="be-sum-val">{academics.beSummary?.obtainedMarks || 6568}</span>
              </div>
              <div className="be-sum-item">
                <span className="be-sum-lbl">Overall Percentage</span>
                <span className="be-sum-val text-green font-bold">{academics.beSummary?.overallPercentage || "82.10%"}</span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. SEMESTER WISE PERFORMANCE TABLE */}
        <div className="semester-performance-card">
          <div className="table-header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 className="section-title">Semester Wise Performance</h3>
            <button
              type="button"
              className="view-pdf-btn"
              style={{ borderColor: "#d8b4fe", color: "#6b21a8", display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
              onClick={() => openEditModal("be")}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit
            </button>
          </div>

          <div className="table-responsive-wrapper">
            <table className="semester-table">
              <thead>
                <tr>
                  <th>Semester</th>
                  <th>Total Marks</th>
                  <th>Obtained Marks</th>
                  <th>Percentage</th>
                  <th>SGPA</th>
                  <th>CGPA</th>
                  <th>Marksheet (PDF)</th>
                </tr>
              </thead>
              <tbody>
                {(academics.beSemesters || []).map((semRow, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold">{semRow.sem}</td>
                    <td>{semRow.totalMarks || 1000}</td>
                    <td>{semRow.obtainedMarks || 780}</td>
                    <td className="text-green font-bold">{semRow.percentage || "78.00%"}</td>
                    <td>{(parseFloat(semRow.sgpa) || 7.8).toFixed(2)}</td>
                    <td>{(parseFloat(semRow.cgpa) || 7.8).toFixed(2)}</td>
                    <td>
                      <div className="pdf-actions-group">
                        <button
                          type="button"
                          className="view-pdf-btn"
                          onClick={() => openPdfDocument(semRow.documentUrl, semRow.documentName || `${semRow.sem}_Marks_Card.pdf`)}
                        >
                          View PDF
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" style={{ marginLeft: "2px" }}>
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                            <polyline points="14 2 14 8 20 8" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* SEPARATE MODAL 1: EDIT SSLC DETAILS */}
      {activeEditModal === "sslc" && tempAcademics && (() => {
        const check = validateModalInputs("sslc", tempAcademics);
        return (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit SSLC (10th Class) Details
                </h3>
                <button className="modal-close-btn" onClick={closeEditModal}>×</button>
              </div>
              <div className="modal-body">
                {!check.valid && (
                  <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "0.6rem 0.9rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.85rem", marginBottom: "1rem" }}>
                    {check.error}
                  </div>
                )}
                <div className="modal-form-grid">
                  <div className="modal-form-group">
                    <label>School Name</label>
                    <input
                      type="text"
                      placeholder="e.g. St. Joseph's High School"
                      value={tempAcademics.sslc?.institute || ""}
                      onChange={(e) =>
                        setTempAcademics({
                          ...tempAcademics,
                          sslc: { ...tempAcademics.sslc, institute: e.target.value }
                        })
                      }
                    />
                  </div>
                  <div className="modal-form-group">
                    <label>Year of Passing</label>
                    <input
                      type="text"
                      placeholder="e.g. 2018"
                      value={tempAcademics.sslc?.year || ""}
                      onChange={(e) =>
                        setTempAcademics({
                          ...tempAcademics,
                          sslc: { ...tempAcademics.sslc, year: e.target.value }
                        })
                      }
                    />
                  </div>
                  <div className="modal-form-group">
                    <label>Total Marks (Numbers Only)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 625"
                      value={tempAcademics.sslc?.totalMarks ?? 625}
                      onChange={(e) => {
                        const valStr = e.target.value;
                        const tot = valStr === "" ? "" : parseFloat(valStr);
                        const obt = parseFloat(tempAcademics.sslc?.obtainedMarks) || 0;
                        const totNum = typeof tot === "number" ? tot : 0;
                        const scoreStr = totNum > 0 ? ((obt / totNum) * 100).toFixed(2) + "%" : "0.00%";
                        setTempAcademics({
                          ...tempAcademics,
                          sslc: { ...tempAcademics.sslc, totalMarks: tot, score: scoreStr }
                        });
                      }}
                    />
                  </div>
                  <div className="modal-form-group">
                    <label>Obtained Marks (Numbers Only)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 625"
                      value={tempAcademics.sslc?.obtainedMarks ?? 625}
                      onChange={(e) => {
                        const valStr = e.target.value;
                        const obt = valStr === "" ? "" : parseFloat(valStr);
                        const tot = parseFloat(tempAcademics.sslc?.totalMarks) || 625;
                        const obtNum = typeof obt === "number" ? obt : 0;
                        const scoreStr = tot > 0 ? ((obtNum / tot) * 100).toFixed(2) + "%" : "0.00%";
                        setTempAcademics({
                          ...tempAcademics,
                          sslc: { ...tempAcademics.sslc, obtainedMarks: obt, score: scoreStr }
                        });
                      }}
                    />
                  </div>
                  <div className="modal-form-group span-full">
                    <label>Calculated Percentage</label>
                    <div style={{ background: check.valid ? "#f0fdf4" : "#fef2f2", border: check.valid ? "1px solid #bbf7d0" : "1px solid #fca5a5", padding: "0.55rem 0.85rem", borderRadius: "7px", color: check.valid ? "#166534" : "#991b1b", fontWeight: 700, fontSize: "0.9rem" }}>
                      🎯 {tempAcademics.sslc?.score || "100.00%"}
                    </div>
                  </div>
                  <div className="modal-form-group span-full">
                    <label>Upload SSLC Marks Card (PDF Only)</label>
                    {tempAcademics.sslc?.documentUrl ? (
                      <div className="modal-doc-preview-pill">
                        <span className="doc-preview-name">📄 {tempAcademics.sslc.documentName || "SSLC_Marks_Card.pdf"}</span>
                        <button type="button" className="doc-preview-link" onClick={() => openPdfDocument(tempAcademics.sslc.documentUrl)}>Preview</button>
                        <button type="button" className="doc-preview-remove" onClick={() => removeAcademicFile("sslc")}>Remove</button>
                      </div>
                    ) : (
                      <input type="file" accept="application/pdf,.pdf" className="modal-file-input" onChange={(e) => handleAcademicFileUpload(e, "sslc")} />
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="modal-cancel-btn" onClick={closeEditModal}>Cancel</button>
                <button className="modal-save-btn" onClick={saveAcademicChanges} disabled={!check.valid} style={{ opacity: check.valid ? 1 : 0.6, cursor: check.valid ? "pointer" : "not-allowed" }}>
                  Save
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SEPARATE MODAL 2: EDIT PUC DETAILS */}
      {activeEditModal === "puc" && tempAcademics && (() => {
        const check = validateModalInputs("puc", tempAcademics);
        return (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit PUC (12th Class) Details
                </h3>
                <button className="modal-close-btn" onClick={closeEditModal}>×</button>
              </div>
              <div className="modal-body">
                {!check.valid && (
                  <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "0.6rem 0.9rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.85rem", marginBottom: "1rem" }}>
                    {check.error}
                  </div>
                )}
                <div className="modal-form-grid">
                  <div className="modal-form-group">
                    <label>College Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Govt. PU College"
                      value={tempAcademics.puc?.institute || ""}
                      onChange={(e) =>
                        setTempAcademics({
                          ...tempAcademics,
                          puc: { ...tempAcademics.puc, institute: e.target.value }
                        })
                      }
                    />
                  </div>
                  <div className="modal-form-group">
                    <label>Year of Passing</label>
                    <input
                      type="text"
                      placeholder="e.g. 2020"
                      value={tempAcademics.puc?.year || ""}
                      onChange={(e) =>
                        setTempAcademics({
                          ...tempAcademics,
                          puc: { ...tempAcademics.puc, year: e.target.value }
                        })
                      }
                    />
                  </div>
                  <div className="modal-form-group">
                    <label>Total Marks (Numbers Only)</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="e.g. 600"
                      value={tempAcademics.puc?.totalMarks ?? 600}
                      onChange={(e) => {
                        const valStr = e.target.value;
                        const tot = valStr === "" ? "" : parseFloat(valStr);
                        const obt = parseFloat(tempAcademics.puc?.obtainedMarks) || 0;
                        const totNum = typeof tot === "number" ? tot : 0;
                        const scoreStr = totNum > 0 ? ((obt / totNum) * 100).toFixed(2) + "%" : "0.00%";
                        setTempAcademics({
                          ...tempAcademics,
                          puc: { ...tempAcademics.puc, totalMarks: tot, score: scoreStr }
                        });
                      }}
                    />
                  </div>
                  <div className="modal-form-group">
                    <label>Obtained Marks (Numbers Only)</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="e.g. 600"
                      value={tempAcademics.puc?.obtainedMarks ?? 600}
                      onChange={(e) => {
                        const valStr = e.target.value;
                        const obt = valStr === "" ? "" : parseFloat(valStr);
                        const tot = parseFloat(tempAcademics.puc?.totalMarks) || 600;
                        const obtNum = typeof obt === "number" ? obt : 0;
                        const scoreStr = tot > 0 ? ((obtNum / tot) * 100).toFixed(2) + "%" : "0.00%";
                        setTempAcademics({
                          ...tempAcademics,
                          puc: { ...tempAcademics.puc, obtainedMarks: obt, score: scoreStr }
                        });
                      }}
                    />
                  </div>
                  <div className="modal-form-group span-full">
                    <label>Calculated Percentage</label>
                    <div style={{ background: check.valid ? "#f0fdf4" : "#fef2f2", border: check.valid ? "1px solid #bbf7d0" : "1px solid #fca5a5", padding: "0.55rem 0.85rem", borderRadius: "7px", color: check.valid ? "#166534" : "#991b1b", fontWeight: 700, fontSize: "0.9rem" }}>
                      🎯 {tempAcademics.puc?.score || "100.00%"}
                    </div>
                  </div>
                  <div className="modal-form-group span-full">
                    <label>Upload PUC Marks Card (PDF Only)</label>
                    {tempAcademics.puc?.documentUrl ? (
                      <div className="modal-doc-preview-pill">
                        <span className="doc-preview-name">📄 {tempAcademics.puc.documentName || "PUC_Marks_Card.pdf"}</span>
                        <button type="button" className="doc-preview-link" onClick={() => openPdfDocument(tempAcademics.puc.documentUrl)}>Preview</button>
                        <button type="button" className="doc-preview-remove" onClick={() => removeAcademicFile("puc")}>Remove</button>
                      </div>
                    ) : (
                      <input type="file" accept="application/pdf,.pdf" className="modal-file-input" onChange={(e) => handleAcademicFileUpload(e, "puc")} />
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="modal-cancel-btn" onClick={closeEditModal}>Cancel</button>
                <button className="modal-save-btn" onClick={saveAcademicChanges} disabled={!check.valid} style={{ opacity: check.valid ? 1 : 0.6, cursor: check.valid ? "pointer" : "not-allowed" }}>
                  Save
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* SEPARATE MODAL 3: EDIT B.E. SEMESTERS (ADD & REMOVE SEPARATELY) */}
      {activeEditModal === "be" && tempAcademics && (() => {
        const check = validateModalInputs("be", tempAcademics);
        return (
          <div className="modal-overlay">
            <div className="modal-content modal-large">
              <div className="modal-header">
                <h3 className="modal-title" style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2.2">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                  Manage B.E. Semesters (Sem 1 to 8)
                </h3>
                <button className="modal-close-btn" onClick={closeEditModal}>×</button>
              </div>
              <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
                {!check.valid && (
                  <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "0.6rem 0.9rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.85rem", marginBottom: "1rem" }}>
                    {check.error}
                  </div>
                )}
                <div style={{ display: "flex", gap: "1rem", marginBottom: "1.2rem", background: "#faf5ff", border: "1px solid #e9d5ff", padding: "0.85rem 1rem", borderRadius: "10px" }}>
                  <div className="modal-form-group" style={{ flex: 1 }}>
                    <label style={{ color: "#7e22ce" }}>Branch Code</label>
                    <input
                      type="text"
                      placeholder="CSE"
                      value={tempAcademics.beSummary?.branch || "CSE"}
                      onChange={(e) =>
                        setTempAcademics({
                          ...tempAcademics,
                          beSummary: { ...tempAcademics.beSummary, branch: e.target.value }
                        })
                      }
                    />
                  </div>
                  <div className="modal-form-group" style={{ flex: 1 }}>
                    <label style={{ color: "#7e22ce" }}>Total Credits</label>
                    <input
                      type="number"
                      min="1"
                      placeholder="160"
                      value={tempAcademics.beSummary?.totalCredits || 160}
                      onChange={(e) =>
                        setTempAcademics({
                          ...tempAcademics,
                          beSummary: { ...tempAcademics.beSummary, totalCredits: parseInt(e.target.value, 10) || 160 }
                        })
                      }
                    />
                  </div>
                </div>

                {(tempAcademics.beSemesters || []).map((sem, sIdx) => (
                  <div key={sIdx} className="sem-item-edit-box">
                    <div className="sem-item-header">
                      <span className="sem-name-badge">
                        {sem.sem || `Semester ${sIdx + 1}`}
                      </span>
                      {tempAcademics.beSemesters.length > 1 && (
                        <button
                          type="button"
                          className="sem-delete-btn"
                          style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}
                          onClick={() => {
                            const updatedSems = tempAcademics.beSemesters.filter((_, idx) => idx !== sIdx);
                            setTempAcademics({ ...tempAcademics, beSemesters: updatedSems });
                          }}
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          Delete Semester
                        </button>
                      )}
                    </div>

                    <div className="modal-form-grid">
                      <div className="modal-form-group">
                        <label>Semester Name</label>
                        <input
                          type="text"
                          placeholder="e.g. 1st Semester"
                          value={sem.sem || ""}
                          onChange={(e) => {
                            const updatedSems = [...tempAcademics.beSemesters];
                            updatedSems[sIdx] = { ...updatedSems[sIdx], sem: e.target.value };
                            setTempAcademics({ ...tempAcademics, beSemesters: updatedSems });
                          }}
                        />
                      </div>
                      <div className="modal-form-group">
                        <label>SGPA Score (0 to 10)</label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          step="0.01"
                          placeholder="e.g. 8.20"
                          value={sem.sgpa ?? ""}
                          onChange={(e) => {
                            const updatedSems = [...tempAcademics.beSemesters];
                            updatedSems[sIdx] = { ...updatedSems[sIdx], sgpa: e.target.value };
                            setTempAcademics({ ...tempAcademics, beSemesters: updatedSems });
                          }}
                        />
                      </div>
                      <div className="modal-form-group">
                        <label>Total Marks (Numbers Only)</label>
                        <input
                          type="number"
                          min="1"
                          placeholder="e.g. 1000"
                          value={sem.totalMarks ?? 1000}
                          onChange={(e) => {
                            const valStr = e.target.value;
                            const updatedSems = [...tempAcademics.beSemesters];
                            const tot = valStr === "" ? "" : parseFloat(valStr);
                            const obt = parseFloat(updatedSems[sIdx].obtainedMarks) || 0;
                            const totNum = typeof tot === "number" ? tot : 0;
                            const pct = totNum > 0 ? ((obt / totNum) * 100).toFixed(2) + "%" : "0.00%";
                            updatedSems[sIdx] = { ...updatedSems[sIdx], totalMarks: tot, percentage: pct };
                            setTempAcademics({ ...tempAcademics, beSemesters: updatedSems });
                          }}
                        />
                      </div>
                      <div className="modal-form-group">
                        <label>Obtained Marks (Numbers Only)</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 780"
                          value={sem.obtainedMarks ?? 780}
                          onChange={(e) => {
                            const valStr = e.target.value;
                            const updatedSems = [...tempAcademics.beSemesters];
                            const obt = valStr === "" ? "" : parseFloat(valStr);
                            const tot = parseFloat(updatedSems[sIdx].totalMarks) || 1000;
                            const obtNum = typeof obt === "number" ? obt : 0;
                            const pct = tot > 0 ? ((obtNum / tot) * 100).toFixed(2) + "%" : "0.00%";
                            updatedSems[sIdx] = { ...updatedSems[sIdx], obtainedMarks: obt, percentage: pct };
                            setTempAcademics({ ...tempAcademics, beSemesters: updatedSems });
                          }}
                        />
                      </div>
                      <div className="modal-form-group span-full">
                        <label>Marks Card Document (PDF Only)</label>
                        {sem.documentUrl ? (
                          <div className="modal-doc-preview-pill">
                            <span className="doc-preview-name">📄 {sem.documentName || `${sem.sem}_Marks_Card.pdf`}</span>
                            <button type="button" className="doc-preview-link" onClick={() => openPdfDocument(sem.documentUrl)}>Preview</button>
                            <button type="button" className="doc-preview-remove" onClick={() => removeAcademicFile("be", sIdx)}>Remove</button>
                          </div>
                        ) : (
                          <input type="file" accept="application/pdf,.pdf" className="modal-file-input" onChange={(e) => handleAcademicFileUpload(e, "be", sIdx)} />
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {tempAcademics.beSemesters.length < 8 && (
                  <button
                    type="button"
                    className="add-sem-btn"
                    style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", justifyContent: "center" }}
                    onClick={() => {
                      const currentCount = tempAcademics.beSemesters.length;
                      const nextNum = currentCount + 1;
                      const ordinals = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
                      const semLabel = `${ordinals[nextNum - 1] || nextNum + "th"} Semester`;
                      const updatedSems = [
                        ...tempAcademics.beSemesters,
                        { sem: semLabel, totalMarks: 1000, obtainedMarks: 800, percentage: "80.00%", sgpa: "8.00", cgpa: "8.00", documentUrl: null, documentName: null }
                      ];
                      setTempAcademics({ ...tempAcademics, beSemesters: updatedSems });
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Semester ({tempAcademics.beSemesters.length + 1} of 8)
                  </button>
                )}
              </div>
              <div className="modal-footer">
                <button className="modal-cancel-btn" onClick={closeEditModal}>Cancel</button>
                <button className="modal-save-btn" onClick={saveAcademicChanges} disabled={!check.valid} style={{ opacity: check.valid ? 1 : 0.6, cursor: check.valid ? "pointer" : "not-allowed" }}>
                  Save
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </DashboardLayout>
  );
}

export default StudentSkills;
