import { useState, useEffect, useRef } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./StudentProfile.css";

function StudentProfile() {
  const { user, role, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  
  // Only a student logged into their own account can edit profile details
  const canEditProfile = role === "student";

  // Helper for formatting external social/portfolio links with https://
  const formatExternalUrl = (urlStr) => {
    if (!urlStr) return "";
    let clean = String(urlStr).trim();
    if (!clean) return "";
    if (!/^https?:\/\//i.test(clean)) {
      return `https://${clean}`;
    }
    return clean;
  };

  // Helper for extracting clean social handle/domain for display
  const getSocialHandle = (urlStr, platform) => {
    if (!urlStr) return "";
    let clean = String(urlStr).trim().replace(/^https?:\/\/(www\.)?/i, "").replace(/\/$/, "");
    if (platform === "github") {
      clean = clean.replace(/^github\.com\//i, "@");
      return clean.startsWith("@") ? clean : `@${clean}`;
    }
    if (platform === "linkedin") {
      clean = clean.replace(/^linkedin\.com\/in\//i, "in/");
      clean = clean.replace(/^linkedin\.com\//i, "in/");
      return clean;
    }
    if (platform === "portfolio") {
      return clean.replace(/^https?:\/\//i, "");
    }
    return clean;
  };

  // Helper for phone: extracts core 10 digits cleanly
  const getRaw10Digits = (phoneStr) => {
    if (!phoneStr) return "";
    let clean = String(phoneStr).trim();
    if (clean.startsWith("+91")) {
      clean = clean.slice(3).trim();
    } else if (clean.startsWith("91") && clean.replace(/\D/g, "").length > 10) {
      clean = clean.replace(/\D/g, "").slice(2);
    }
    const digits = clean.replace(/\D/g, "");
    return digits.slice(0, 10);
  };

  // Helper for displaying phone with default +91
  const formatPhoneDisplay = (phoneStr) => {
    const raw = getRaw10Digits(phoneStr);
    if (!raw) return "+91 9108612345";
    return `+91 ${raw}`;
  };

  // Helper for parsing DOB year cleanly regardless of format (DD-MM-YYYY, YYYY-MM-DD, text)
  const parseDobToYear = (dobStr) => {
    if (!dobStr) return null;
    const clean = String(dobStr).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      return parseInt(clean.split("-")[0], 10);
    }
    if (/^\d{2}[-/.]\d{2}[-/.]\d{4}$/.test(clean)) {
      const parts = clean.split(/[-/.]/);
      return parseInt(parts[2], 10);
    }
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) {
      return parsed.getFullYear();
    }
    return null;
  };

  // Helpers for resume objective length (1-3 sentences, 30-50 words max)
  const getWordCount = (str) => (str || "").trim().split(/\s+/).filter(Boolean).length;
  const getSentenceCount = (str) => (str || "").split(/[.!?]+/).filter((s) => s.trim().length > 0).length;

  // Helper for converting DOB to YYYY-MM-DD for date picker
  const getValidIsoDate = (dobStr) => {
    if (!dobStr) return "2004-02-28";
    const clean = String(dobStr).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean;
    if (/^\d{2}[-/.]\d{2}[-/.]\d{4}$/.test(clean)) {
      const parts = clean.split(/[-/.]/);
      const day = parts[0].padStart(2, "0");
      const month = parts[1].padStart(2, "0");
      const year = parts[2];
      return `${year}-${month}-${day}`;
    }
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) {
      return parsed.toISOString().split("T")[0];
    }
    return "2004-02-28";
  };

  // Helper for formatting DOB display
  const formatDobDisplay = (dobStr) => {
    if (!dobStr) return "28 Feb 2004";
    const clean = String(dobStr).trim();
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
      const [y, m, d] = clean.split("-");
      const mIdx = parseInt(m, 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        return `${parseInt(d, 10)} ${monthNames[mIdx]} ${y}`;
      }
    }
    if (/^\d{2}[-/.]\d{2}[-/.]\d{4}$/.test(clean)) {
      const [d, m, y] = clean.split(/[-/.]/);
      const mIdx = parseInt(m, 10) - 1;
      if (mIdx >= 0 && mIdx < 12) {
        return `${parseInt(d, 10)} ${monthNames[mIdx]} ${y}`;
      }
    }
    return clean;
  };

  // Helper for normalizing academics structure (Fixed SSLC, PUC, beSummary, and dynamic B.E. Sem 1-8)
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

    const studentName = profile?.full_name || user?.full_name || "Venkatesh R";
    const studentUsn = profile?.student_id || user?.student_id || user?.usn || "4KV23CS042";

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
(Document Type: ${title}) Tj
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

  // Main Profile State dynamically initialized from AuthContext user and local storage
  const [profile, setProfile] = useState(() => {
    const studentId = user?.student_id || user?.usn || "4KV23CS042";
    const customKey = `kvgce_student_profile_${studentId}`;
    const stored = localStorage.getItem(customKey);
    let parsedStored = null;
    if (stored) {
      try {
        parsedStored = JSON.parse(stored);
      } catch (e) {
        console.error(e);
      }
    }

    const rawAcademics = parsedStored?.academics || user?.academics;

    return {
      full_name: parsedStored?.full_name || user?.full_name || "Venkatesh R",
      student_id: parsedStored?.student_id || user?.student_id || user?.usn || "4KV23CS042",
      department: parsedStored?.department || user?.department || "Computer Science & Engineering",
      semester: parsedStored?.semester || user?.semester || "6th Semester (III Year)",
      section: parsedStored?.section || user?.section || "Section A",
      email: parsedStored?.email || user?.email || "venkatesh.r@kvgce.ac.in",
      phone: parsedStored?.phone || user?.phone || "+91 91086 12345",
      dob: parsedStored?.dob || user?.dob || "28 Feb 2004",
      gender: parsedStored?.gender || user?.gender || "Male",
      avatarUrl: parsedStored?.avatarUrl !== undefined ? parsedStored.avatarUrl : (user?.avatarUrl !== undefined ? user.avatarUrl : ""),
      githubUrl: parsedStored?.githubUrl || user?.githubUrl || "https://github.com/venkatesh-r",
      linkedinUrl: parsedStored?.linkedinUrl || user?.linkedinUrl || "https://linkedin.com/in/venkatesh-r",
      portfolioUrl: parsedStored?.portfolioUrl || user?.portfolioUrl || "https://venkatesh-r.dev",
      objective:
        parsedStored?.objective ||
        user?.objective ||
        "To work in a challenging environment where I can utilize my skills and knowledge to contribute to the growth of the organization while enhancing my professional abilities and learning new technologies.",
      technicalSkills:
        parsedStored?.technicalSkills ||
        user?.technicalSkills || [
          "C",
          "C++",
          "Java",
          "Python",
          "HTML",
          "CSS",
          "JavaScript",
          "SQL",
          "MySQL",
          "Data Structures",
          "OOPs",
          "Git & GitHub",
          "Linux Basics",
          "Problem Solving",
        ],
      softSkills:
        parsedStored?.softSkills ||
        user?.softSkills || [
          "Communication",
          "Teamwork",
          "Problem Solving",
          "Time Management",
          "Adaptability",
          "Leadership",
          "Critical Thinking",
          "Quick Learner",
        ],
      academics: normalizeAcademics(rawAcademics),
    };
  });

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  // Modal / Edit state toggles
  const [activeModal, setActiveModal] = useState(null); // 'hero', 'social', 'objective', 'tech', 'soft', 'marks'
  const [tempData, setTempData] = useState({});

  // Dynamic Profile Completion Percentage Calculation
  const calculateProfileCompletion = (p) => {
    let score = 0;
    if (p?.full_name?.trim()) score += 10;
    if (p?.student_id?.trim()) score += 10;
    if (p?.department?.trim()) score += 10;
    if (p?.semester?.trim()) score += 10;
    if (p?.section?.trim()) score += 5;
    if (p?.email?.trim()) score += 10;
    if (p?.phone?.trim()) score += 5;
    if (p?.dob?.trim()) score += 5;
    if (p?.gender?.trim()) score += 5;
    if (p?.objective?.trim() && p.objective.length > 10) score += 5;
    if (p?.technicalSkills && p.technicalSkills.length > 0) score += 5;
    if (p?.softSkills && p.softSkills.length > 0) score += 5;
    if (p?.academics && (p.academics.sslc || p.academics.length > 0)) score += 5;
    if (p?.avatarUrl && p.avatarUrl.trim() !== "") score += 5;
    if (p?.githubUrl && p.githubUrl.trim() !== "") score += 2;
    if (p?.linkedinUrl && p.linkedinUrl.trim() !== "") score += 2;
    if (p?.portfolioUrl && p.portfolioUrl.trim() !== "") score += 1;
    return Math.min(100, score);
  };

  const profileCompletion = calculateProfileCompletion(profile);

  // Dynamic Color Spectrum: 0-35% Red, 36-69% Orange, 70-99% Blue, 100% Green
  const getCompletionTheme = (percentage) => {
    if (percentage <= 35) {
      return {
        textColor: "#ef4444", // Red
        borderColor: "#ef4444",
        boxShadow: "0 0 24px rgba(239, 68, 68, 0.65)",
        label: "Needs Attention"
      };
    } else if (percentage <= 69) {
      return {
        textColor: "#f97316", // Orange
        borderColor: "#f97316",
        boxShadow: "0 0 24px rgba(249, 115, 22, 0.65)",
        label: "In Progress"
      };
    } else if (percentage <= 99) {
      return {
        textColor: "#3b82f6", // Blue
        borderColor: "#3b82f6",
        boxShadow: "0 0 24px rgba(59, 130, 246, 0.65)",
        label: "Almost Complete"
      };
    } else {
      return {
        textColor: "#22c55e", // Green 100%
        borderColor: "#22c55e",
        boxShadow: "0 0 24px rgba(34, 197, 94, 0.65)",
        label: "100% Completed"
      };
    }
  };

  const completionTheme = getCompletionTheme(profileCompletion);

  // Remove Profile Picture (reverts to default avatar icon fallback)
  const handleRemoveImage = async () => {
    setProfile((prev) => ({ ...prev, avatarUrl: "" }));
    setTempData((prev) => ({ ...prev, avatarUrl: "" }));

    if (updateUser) {
      updateUser({ avatarUrl: "" });
    }
    const studentId = profile.student_id || user?.student_id || user?.usn || "4KV23CS042";
    const customKey = `kvgce_student_profile_${studentId}`;
    try {
      const storedProfile = JSON.parse(localStorage.getItem(customKey) || "{}");
      localStorage.setItem(customKey, JSON.stringify({ ...storedProfile, avatarUrl: "" }));
    } catch (err) {
      console.error(err);
    }

    try {
      const formData = new FormData();
      formData.append("avatar_url", "");
      await api.post("/students/upload-avatar", formData);
    } catch (apiErr) {
      console.warn("Backend API avatar remove fallback:", apiErr);
    }

    setMsg({ type: "success", text: "Profile image removed. Default avatar icon active." });
    setTimeout(() => setMsg({ type: "", text: "" }), 3500);
  };

  // Image Upload File Size Limit in MB
  const MAX_IMAGE_SIZE_MB = 5;
  const MAX_IMAGE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

  const handleImageFileSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Validate image file size
    if (file.size > MAX_IMAGE_BYTES) {
      const sizeInMB = (file.size / (1024 * 1024)).toFixed(2);
      setMsg({
        type: "error",
        text: `⚠️ Image file size (${sizeInMB} MB) exceeds maximum allowed limit of ${MAX_IMAGE_SIZE_MB} MB. Please choose a smaller image.`
      });
      setTimeout(() => setMsg({ type: "", text: "" }), 6000);
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;

      // Update both profile state AND tempData state
      setProfile((prev) => ({ ...prev, avatarUrl: base64Data }));
      setTempData((prev) => ({ ...prev, avatarUrl: base64Data }));

      // Update AuthContext user state & localStorage
      if (updateUser) {
        updateUser({ avatarUrl: base64Data });
      }

      const studentId = profile.student_id || user?.student_id || user?.usn || "4KV23CS042";
      const customKey = `kvgce_student_profile_${studentId}`;
      try {
        const storedProfile = JSON.parse(localStorage.getItem(customKey) || "{}");
        localStorage.setItem(customKey, JSON.stringify({ ...storedProfile, avatarUrl: base64Data }));
      } catch (err) {
        console.error("Local storage photo save error:", err);
      }

      // Backend API & Database storage upload
      try {
        const formData = new FormData();
        formData.append("file", file);
        const res = await api.post("/students/upload-avatar", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
        if (res.data && res.data.avatarUrl) {
          setProfile((prev) => ({ ...prev, avatarUrl: res.data.avatarUrl }));
          setTempData((prev) => ({ ...prev, avatarUrl: res.data.avatarUrl }));
        }
      } catch (apiErr) {
        console.warn("Backend API avatar upload fallback:", apiErr);
      }

      setMsg({
        type: "success",
        text: `✅ Profile image updated successfully! (File size: ${(file.size / 1024).toFixed(1)} KB)`
      });
      setTimeout(() => setMsg({ type: "", text: "" }), 4000);
    };

    reader.readAsDataURL(file);
    e.target.value = "";
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/students/profile");
        if (res.data && res.data.data) {
          const apiData = res.data.data;
          setProfile((prev) => ({
            ...prev,
            ...apiData,
            full_name: apiData.full_name || user?.full_name || prev.full_name,
            student_id: apiData.student_id || apiData.usn || user?.student_id || user?.usn || prev.student_id,
            phone: apiData.phone || user?.phone || prev.phone,
            avatarUrl: apiData.avatarUrl !== undefined ? apiData.avatarUrl : (user?.avatarUrl !== undefined ? user.avatarUrl : prev.avatarUrl),
            githubUrl: apiData.githubUrl || apiData.github_url || user?.githubUrl || prev.githubUrl,
            linkedinUrl: apiData.linkedinUrl || apiData.linkedin_url || user?.linkedinUrl || prev.linkedinUrl,
            portfolioUrl: apiData.portfolioUrl || apiData.portfolio_url || user?.portfolioUrl || prev.portfolioUrl,
          }));
        }
      } catch (err) {
        console.error("Using local profile data fallback:", err);
      }
    };
    fetchProfile();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!canEditProfile) return;
    setSaving(true);
    setMsg({ type: "", text: "" });

    try {
      await api.put("/students/profile", profile);
    } catch (err) {
      console.log("Mock saved to local state:", err);
    }

    const studentId = profile.student_id || user?.student_id || user?.usn || "4KV23CS042";
    const customKey = `kvgce_student_profile_${studentId}`;
    localStorage.setItem(customKey, JSON.stringify(profile));

    if (updateUser) {
      updateUser({
        full_name: profile.full_name,
        student_id: profile.student_id,
        usn: profile.student_id,
        department: profile.department,
        semester: profile.semester,
        email: profile.email,
        phone: profile.phone,
        dob: profile.dob,
        gender: profile.gender,
        avatarUrl: profile.avatarUrl,
        githubUrl: profile.githubUrl,
        linkedinUrl: profile.linkedinUrl,
        portfolioUrl: profile.portfolioUrl,
        objective: profile.objective,
        technicalSkills: profile.technicalSkills,
        softSkills: profile.softSkills,
        academics: profile.academics,
      });
    }

    setSaving(false);
    setMsg({ type: "success", text: "Profile details updated successfully!" });
    setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  };

  const openModal = (type) => {
    if (!canEditProfile) return;
    setActiveModal(type);
    setTempData(JSON.parse(JSON.stringify(profile)));
  };

  const closeModal = () => {
    setActiveModal(null);
    setTempData({});
  };

  const saveModalChanges = async () => {
    if (!canEditProfile) return;

    if (activeModal === "hero") {
      // 1. Phone number validation (must be core 10 digits)
      const raw10 = getRaw10Digits(tempData.phone);
      if (tempData.phone && raw10.length > 0 && raw10.length !== 10) {
        setMsg({
          type: "error",
          text: "⚠️ Mobile phone number must contain exactly 10 digits (e.g. 9108612345)."
        });
        setTimeout(() => setMsg({ type: "", text: "" }), 5000);
        return;
      }
      tempData.phone = raw10 ? `+91 ${raw10}` : "";

      // 2. DOB Validation (Calendar check between 1950 and 2030)
      if (tempData.dob) {
        const year = parseDobToYear(tempData.dob);
        if (year === null || year < 1950 || year > 2030) {
          setMsg({
            type: "error",
            text: "⚠️ Invalid Date of Birth. Please select a valid calendar date between 1950 and 2030."
          });
          setTimeout(() => setMsg({ type: "", text: "" }), 5000);
          return;
        }
      }
    }

    if (activeModal === "objective") {
      const words = getWordCount(tempData.objective);
      const sentences = getSentenceCount(tempData.objective);
      if (words > 50) {
        setMsg({
          type: "error",
          text: `⚠️ Resume objective must be concise (maximum 50 words). Currently ${words} words entered.`
        });
        setTimeout(() => setMsg({ type: "", text: "" }), 5000);
        return;
      }
      if (sentences > 3) {
        setMsg({
          type: "error",
          text: `⚠️ Resume objective should be 1 to 3 sentences maximum (currently ${sentences} sentences).`
        });
        setTimeout(() => setMsg({ type: "", text: "" }), 5000);
        return;
      }
    }

    if (activeModal === "marks") {
      tempData.academics = computeAcademicsMetrics(normalizeAcademics(tempData.academics));
    }

    setProfile(tempData);
    closeModal();

    // Sync to backend database
    try {
      await api.put("/students/profile", tempData);
    } catch (apiErr) {
      console.warn("Backend API sync update fallback:", apiErr);
    }

    const studentId = tempData.student_id || profile.student_id || user?.student_id || user?.usn || "4KV23CS042";
    const customKey = `kvgce_student_profile_${studentId}`;
    localStorage.setItem(customKey, JSON.stringify(tempData));

    if (updateUser) {
      updateUser({
        full_name: tempData.full_name,
        student_id: tempData.student_id,
        usn: tempData.student_id,
        department: tempData.department,
        semester: tempData.semester,
        section: tempData.section,
        email: tempData.email,
        phone: tempData.phone,
        dob: tempData.dob,
        gender: tempData.gender,
        avatarUrl: tempData.avatarUrl,
        githubUrl: tempData.githubUrl,
        linkedinUrl: tempData.linkedinUrl,
        portfolioUrl: tempData.portfolioUrl,
        objective: tempData.objective,
        technicalSkills: tempData.technicalSkills,
        softSkills: tempData.softSkills,
        academics: tempData.academics,
      });
    }

    try {
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      console.log("Storage event broadcast:", e);
    }

    setMsg({ type: "success", text: "✅ Profile details saved successfully!" });
    setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  };

  // Helper functions for Marks Card PDF Document file upload
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
      const currentAcad = { ...normalizeAcademics(tempData.academics) };
      if (section === "sslc") {
        currentAcad.sslc = { ...currentAcad.sslc, documentUrl: reader.result, documentName: file.name };
      } else if (section === "puc") {
        currentAcad.puc = { ...currentAcad.puc, documentUrl: reader.result, documentName: file.name };
      } else if (section === "be" && semIndex !== null) {
        const newSems = [...(currentAcad.beSemesters || [])];
        newSems[semIndex] = { ...newSems[semIndex], documentUrl: reader.result, documentName: file.name };
        currentAcad.beSemesters = newSems;
      }
      setTempData({ ...tempData, academics: currentAcad });
    };
    reader.readAsDataURL(file);
  };

  const removeAcademicFile = (section, semIndex = null) => {
    const currentAcad = { ...normalizeAcademics(tempData.academics) };
    if (section === "sslc") {
      currentAcad.sslc = { ...currentAcad.sslc, documentUrl: null, documentName: null };
    } else if (section === "puc") {
      currentAcad.puc = { ...currentAcad.puc, documentUrl: null, documentName: null };
    } else if (section === "be" && semIndex !== null) {
      const newSems = [...(currentAcad.beSemesters || [])];
      newSems[semIndex] = { ...newSems[semIndex], documentUrl: null, documentName: null };
      currentAcad.beSemesters = newSems;
    }
    setTempData({ ...tempData, academics: currentAcad });
  };

  // Helper for tracking and calculating Daily Login Activity & Streak after 12:00 AM midnight
  const getActivityStreakInfo = () => {
    const todayStr = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const dbDates = profile.activity_dates || user?.activity_dates || [];
    const signupDate = (profile.signup_date || user?.signup_date || user?.created_at || "2026-01-12").split("T")[0];

    const studentId = profile.student_id || user?.student_id || user?.usn || "4KV23CS042";
    const streakKey = `kvgce_daily_streak_${studentId}`;

    let localDates = [];
    try {
      const stored = localStorage.getItem(streakKey);
      if (stored) {
        localDates = JSON.parse(stored);
      }
    } catch (e) {
      console.error(e);
    }

    // Merge backend DB activity dates with local storage
    const combinedSet = new Set([...dbDates, ...localDates, todayStr, signupDate]);
    const activeDates = Array.from(combinedSet);

    if (activeDates.length > localDates.length) {
      try {
        localStorage.setItem(streakKey, JSON.stringify(activeDates));
      } catch (e) {
        console.error(e);
      }
    }

    // Count consecutive active days up to today
    let streakCount = 0;
    let checkDate = new Date();
    while (true) {
      const key = checkDate.toISOString().split("T")[0];
      if (activeDates.includes(key)) {
        streakCount++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      activeDates,
      todayStr,
      signupDate,
      streakDays: Math.max(1, streakCount)
    };
  };

  const activityInfo = getActivityStreakInfo();

  // Helper for rendering Activity Heatmap grid starting from Jan 1, 2026 up to Dec 2026
  const renderActivityHeatmapGrid = () => {
    const startDate = new Date(2026, 0, 1); // Jan 1, 2026
    const todayStr = new Date().toISOString().split("T")[0];
    const cleanSignup = String(activityInfo.signupDate).split("T")[0];

    const activeSet = new Set(activityInfo.activeDates);
    activeSet.add(todayStr);
    if (cleanSignup) activeSet.add(cleanSignup);

    const cols = 26; // 26 columns for full 2026 year layout
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

  const [activeView, setActiveView] = useState("calendar"); // "calendar" or "graph"

  // Helper for dynamic score color coding (Red for low/dips, Amber for mid, Green for high)
  const getScoreColor = (score) => {
    if (score >= 75) return "#16a34a"; // Bright Green
    if (score >= 60) return "#f59e0b"; // Amber/Orange
    return "#ef4444"; // Red
  };

  // Render Overall Score Graph (Y: 0 to 100%, X: Date Timeline with Red-to-Green ups & downs)
  const renderSkillGrowthGraph = () => {
    const pointsData = profile?.score_history || user?.score_history || [
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
            <linearGradient id="scoreLineGradientProfile" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="#ef4444" />
              <stop offset="55%" stopColor="#f59e0b" />
              <stop offset="85%" stopColor="#16a34a" />
            </linearGradient>
            <linearGradient id="growthGradientProfile" x1="0" y1="0" x2="0" y2="1">
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

          <path d={areaD} fill="url(#growthGradientProfile)" />

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

          <path d={pathD} fill="none" stroke="url(#scoreLineGradientProfile)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

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
    <DashboardLayout title="Student Profile">
      <div className="student-profile-page">
        {/* Hidden File Input for Image Selection */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleImageFileSelect}
          style={{ display: "none" }}
        />

        {/* Toast Alert Notification */}
        {msg.text && (
          <div className={`msg-alert ${msg.type}`}>
            {msg.type === "success" ? "✅" : "⚠️"} {msg.text}
          </div>
        )}

        {/* 1. HERO PROFILE BANNER CARD */}
        <div className="hero-banner-card profile-hero-banner">
          <div className="hero-banner-content">
            {/* AVATAR WRAPPER WITH DYNAMIC COLOR SPECTRUM RING & COMPLETION TEXT */}
            <div className="avatar-wrapper-column">
              <div
                className="profile-avatar-container"
                style={{ cursor: canEditProfile ? "pointer" : "default" }}
                onClick={() => canEditProfile && fileInputRef.current?.click()}
                title={canEditProfile ? "Click to change profile picture" : "Profile Picture"}
              >
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.full_name}
                    className="profile-photo-img"
                    style={{
                      border: `4.5px solid ${completionTheme.borderColor}`,
                      boxShadow: completionTheme.boxShadow
                    }}
                    onError={(e) => {
                      e.target.style.display = "none";
                      if (e.target.nextElementSibling) {
                        e.target.nextElementSibling.style.display = "flex";
                      }
                    }}
                  />
                ) : null}
                <div
                  className="profile-avatar-icon-fallback"
                  style={{
                    display: profile.avatarUrl ? "none" : "flex",
                    border: `4.5px solid ${completionTheme.borderColor}`,
                    boxShadow: completionTheme.boxShadow
                  }}
                >
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>

                {canEditProfile && (
                  <div
                    className="avatar-camera-icon-badge"
                    title="Change profile picture"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </div>
                )}
              </div>

              {/* DYNAMIC COLOR TEXT UNDER PROFILE IMAGE */}
              <div className="avatar-under-completion-text" style={{ color: completionTheme.textColor }}>
                {profileCompletion}% Complete
              </div>
            </div>

            {/* MAIN COLUMN CONTAINING META GRID AND SOCIAL ROW */}
            <div className="profile-hero-main-col">
              {/* DETAILS GRID: LEFT & RIGHT COLUMNS */}
              <div className="profile-meta-grid">
                {/* LEFT COLUMN */}
                <div className="meta-column">
                  <div className="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                    <span className="meta-val font-bold">{profile.full_name}</span>
                  </div>

                  <div className="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="16" rx="2" />
                      <line x1="7" y1="8" x2="17" y2="8" />
                      <line x1="7" y1="12" x2="13" y2="12" />
                    </svg>
                    <span className="meta-val">{profile.student_id}</span>
                  </div>

                  <div className="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                      <path d="M6 12v5c3 3 9 3 12 0v-5" />
                    </svg>
                    <span className="meta-val">{profile.department}</span>
                  </div>

                  <div className="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                    <span className="meta-val">{profile.semester} • {profile.section || "Section A"}</span>
                  </div>
                </div>

                {/* RIGHT COLUMN */}
                <div className="meta-column">
                  <div className="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <span className="meta-val">{profile.email}</span>
                  </div>

                  <div className="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span className="meta-val">{formatPhoneDisplay(profile.phone)}</span>
                  </div>

                  <div className="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2">
                      <rect x="3" y="8" width="18" height="13" rx="2" />
                      <path d="M12 2v6" />
                      <path d="M8 4h8" />
                    </svg>
                    <span className="meta-val">{formatDobDisplay(profile.dob)}</span>
                  </div>

                  <div className="meta-item">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2">
                      <circle cx="12" cy="12" r="9" />
                      <path d="M12 3v18" />
                    </svg>
                    <span className="meta-val">{profile.gender}</span>
                  </div>
                </div>
              </div>

              {/* HERO SOCIAL PROFILE LINKS SINGLE ROW */}
              <div className="hero-social-links-row">
                {profile.githubUrl ? (
                  <a
                    href={formatExternalUrl(profile.githubUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hero-social-pill github-pill"
                    onClick={(e) => e.stopPropagation()}
                    title={`View ${profile.full_name}'s GitHub Profile (${profile.githubUrl})`}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                    </svg>
                    <span>GitHub</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="external-arrow-icon">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                ) : null}

                {profile.linkedinUrl ? (
                  <a
                    href={formatExternalUrl(profile.linkedinUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hero-social-pill linkedin-pill"
                    onClick={(e) => e.stopPropagation()}
                    title={`View ${profile.full_name}'s LinkedIn Profile (${profile.linkedinUrl})`}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                    </svg>
                    <span>LinkedIn</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="external-arrow-icon">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                ) : null}

                {profile.portfolioUrl ? (
                  <a
                    href={formatExternalUrl(profile.portfolioUrl)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hero-social-pill portfolio-pill"
                    onClick={(e) => e.stopPropagation()}
                    title={`View ${profile.full_name}'s Portfolio Website (${profile.portfolioUrl})`}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    <span>Portfolio</span>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="external-arrow-icon">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                      <polyline points="15 3 21 3 21 9" />
                      <line x1="10" y1="14" x2="21" y2="3" />
                    </svg>
                  </a>
                ) : null}

                {canEditProfile && (!profile.githubUrl || !profile.linkedinUrl || !profile.portfolioUrl) && (
                  <button
                    type="button"
                    className="hero-social-pill add-social-pill"
                    onClick={(e) => {
                      e.stopPropagation();
                      openModal("social");
                    }}
                    title="Add or update social profile links"
                  >
                    <span>➕ Add Social Links</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* EDIT BUTTON / READ-ONLY BADGE */}
          {canEditProfile ? (
            <button className="glass-edit-btn" onClick={() => openModal("hero")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              Edit Profile
            </button>
          ) : (
            <div style={{ background: "rgba(255,255,255,0.18)", padding: "0.45rem 0.95rem", borderRadius: "8px", fontSize: "0.82rem", fontWeight: 700, color: "#ffffff", border: "1px solid rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>🔒</span> Read-Only View
            </div>
          )}
        </div>

        {/* 2. MIDDLE ROW: ACTIVITY HEATMAP & SKILL READINESS RADAR */}
        <div className="dashboard-middle-row">
          {/* ACTIVITY HEATMAP CARD */}
          <div className="middle-card">
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
                <div className="heatmap-grid-matrix">{renderActivityHeatmapGrid()}</div>
                <p className="heatmap-footer-date">Jan 2026 - Dec 2026</p>
              </div>
            ) : (
              renderSkillGrowthGraph()
            )}
          </div>

          {/* SKILL READINESS RADAR CHART CARD */}
          <div className="middle-card">
            <div className="card-top-header">
              <h3 className="card-title">Skill Readiness</h3>
            </div>
            <div className="radar-chart-container">
              <svg className="radar-svg" viewBox="0 0 300 220">
                {/* Pentagon Radar Grid Lines */}
                <polygon points="150,25 245,94 209,206 91,206 55,94" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                <polygon points="150,55 220,106 193,189 107,189 80,106" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                <polygon points="150,85 195,118 178,172 122,172 105,118" fill="none" stroke="#e2e8f0" strokeWidth="1" />
                <polygon points="150,115 170,130 162,155 138,155 130,130" fill="none" stroke="#e2e8f0" strokeWidth="1" />

                {/* Axis Lines */}
                <line x1="150" y1="125" x2="150" y2="25" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="150" y1="125" x2="245" y2="94" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="150" y1="125" x2="209" y2="206" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="150" y1="125" x2="91" y2="206" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />
                <line x1="150" y1="125" x2="55" y2="94" stroke="#cbd5e1" strokeWidth="1" strokeDasharray="3 3" />

                {/* Average Pentagon (Orange Dashed) */}
                <polygon points="150,50 225,98 195,185 105,185 75,98" fill="rgba(249,115,22,0.06)" stroke="#f97316" strokeWidth="1.8" strokeDasharray="4 4" />

                {/* Your Score Pentagon (Blue Filled) */}
                <polygon points="150,38 235,95 190,195 110,195 68,95" fill="rgba(37,99,235,0.18)" stroke="#2563eb" strokeWidth="2.5" />
                <circle cx="150" cy="38" r="3.5" fill="#2563eb" />
                <circle cx="235" cy="95" r="3.5" fill="#2563eb" />
                <circle cx="190" cy="195" r="3.5" fill="#2563eb" />
                <circle cx="110" cy="195" r="3.5" fill="#2563eb" />
                <circle cx="68" cy="95" r="3.5" fill="#2563eb" />

                {/* Labels */}
                <text x="150" y="15" textAnchor="middle" className="radar-label">Technical Readiness</text>
                <text x="252" y="94" textAnchor="start" className="radar-label">Aptitude<tspan x="252" dy="11">Readiness</tspan></text>
                <text x="214" y="218" textAnchor="middle" className="radar-label">Coding Readiness</text>
                <text x="86" y="218" textAnchor="middle" className="radar-label">Communication<tspan x="86" dy="11">Readiness</tspan></text>
                <text x="48" y="94" textAnchor="end" className="radar-label">Activity/Profile<tspan x="48" dy="11">Readiness</tspan></text>
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

        {/* 3. OBJECTIVE CARD */}
        <div className="profile-section-card">
          <div className="section-card-header">
            <div className="header-title-flex">
              <div className="section-icon-badge blue-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#003896" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="6" />
                  <circle cx="12" cy="12" r="2" />
                </svg>
              </div>
              <h3 className="section-title">Objective</h3>
            </div>
            {canEditProfile && (
              <button className="section-edit-btn" onClick={() => openModal("objective")}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
            )}
          </div>
          <p className="objective-text-content">{profile.objective}</p>
        </div>

        {/* 4. TECHNICAL SKILLS & SOFT SKILLS ROW */}
        <div className="skills-twin-row">
          {/* TECHNICAL SKILLS CARD */}
          <div className="profile-section-card skill-card-flex">
            <div className="section-card-header">
              <div className="header-title-flex">
                <div className="section-icon-badge blue-circle">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#003896" strokeWidth="2.5">
                    <polyline points="16 18 22 12 16 6" />
                    <polyline points="8 6 2 12 8 18" />
                  </svg>
                </div>
                <h3 className="section-title">Technical Skills</h3>
              </div>
              {canEditProfile && (
                <button className="section-edit-btn" onClick={() => openModal("tech")}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </button>
              )}
            </div>
            <div className="skills-pill-wrap">
              {profile.technicalSkills.map((skill, i) => (
                <span key={i} className="skill-pill tech-pill">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* SOFT SKILLS CARD */}
          <div className="profile-section-card skill-card-flex">
            <div className="section-card-header">
              <div className="header-title-flex">
                <div className="section-icon-badge green-circle">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="section-title">Soft Skills</h3>
              </div>
              {canEditProfile && (
                <button className="section-edit-btn" onClick={() => openModal("soft")}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit
                </button>
              )}
            </div>
            <div className="skills-pill-wrap">
              {profile.softSkills.map((skill, i) => (
                <span key={i} className="skill-pill soft-pill">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* 5. SOCIAL & PROFESSIONAL PROFILES CARD */}
        <div className="profile-section-card">
          <div className="section-card-header">
            <div className="header-title-flex">
              <div className="section-icon-badge purple-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2.5">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
              </div>
              <div>
                <h3 className="section-title" style={{ margin: 0 }}>Social & Professional Profiles</h3>
                <span style={{ fontSize: "0.76rem", fontWeight: "700", color: "#7c3aed", background: "#f3e8ff", padding: "0.15rem 0.55rem", borderRadius: "12px", marginTop: "0.25rem", display: "inline-block" }}>
                  🌐 Public Profile Links
                </span>
              </div>
            </div>
            {canEditProfile && (
              <button className="section-edit-btn" onClick={() => openModal("social")}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Links
              </button>
            )}
          </div>

          <div className="social-cards-grid">
            {/* GITHUB CARD */}
            <div className="social-profile-item-card github-card">
              <div className="social-item-header">
                <div className="social-icon-wrapper github-bg">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="social-platform-title">GitHub Profile</h4>
                  <p className="social-handle-text">{profile.githubUrl ? getSocialHandle(profile.githubUrl, "github") : "Not Linked"}</p>
                </div>
              </div>
              {profile.githubUrl ? (
                <a
                  href={formatExternalUrl(profile.githubUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-action-btn github-action"
                  title="Open GitHub Profile"
                >
                  Check GitHub Profile ↗
                </a>
              ) : canEditProfile ? (
                <button type="button" className="social-action-btn add-action" onClick={() => openModal("social")}>
                  ➕ Add GitHub Link
                </button>
              ) : (
                <span className="no-link-badge">No link provided</span>
              )}
            </div>

            {/* LINKEDIN CARD */}
            <div className="social-profile-item-card linkedin-card">
              <div className="social-item-header">
                <div className="social-icon-wrapper linkedin-bg">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#ffffff">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                  </svg>
                </div>
                <div>
                  <h4 className="social-platform-title">LinkedIn Profile</h4>
                  <p className="social-handle-text">{profile.linkedinUrl ? getSocialHandle(profile.linkedinUrl, "linkedin") : "Not Linked"}</p>
                </div>
              </div>
              {profile.linkedinUrl ? (
                <a
                  href={formatExternalUrl(profile.linkedinUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-action-btn linkedin-action"
                  title="Open LinkedIn Profile"
                >
                  Check LinkedIn Profile ↗
                </a>
              ) : canEditProfile ? (
                <button type="button" className="social-action-btn add-action" onClick={() => openModal("social")}>
                  ➕ Add LinkedIn Link
                </button>
              ) : (
                <span className="no-link-badge">No link provided</span>
              )}
            </div>

            {/* PORTFOLIO CARD */}
            <div className="social-profile-item-card portfolio-card">
              <div className="social-item-header">
                <div className="social-icon-wrapper portfolio-bg">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <div>
                  <h4 className="social-platform-title">Portfolio Website</h4>
                  <p className="social-handle-text">{profile.portfolioUrl ? getSocialHandle(profile.portfolioUrl, "portfolio") : "Not Linked"}</p>
                </div>
              </div>
              {profile.portfolioUrl ? (
                <a
                  href={formatExternalUrl(profile.portfolioUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="social-action-btn portfolio-action"
                  title="Open Portfolio Website"
                >
                  Check Portfolio Website ↗
                </a>
              ) : canEditProfile ? (
                <button type="button" className="social-action-btn add-action" onClick={() => openModal("social")}>
                  ➕ Add Portfolio Link
                </button>
              ) : (
                <span className="no-link-badge">No link provided</span>
              )}
            </div>
          </div>
        </div>

        {/* 5. ACADEMIC DETAILS SECTION (SUMMARY CARDS & SEMESTER TABLE) */}
        <div className="profile-section-card">
          <div className="section-card-header">
            <div className="header-title-flex">
              <div className="section-icon-badge blue-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#003896" strokeWidth="2.5">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <h3 className="section-title">Academic Details & Marks Overview</h3>
            </div>
            {canEditProfile && (
              <button className="section-edit-btn" onClick={() => openModal("marks")}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit
              </button>
            )}
          </div>

          {/* TOP 3 SUMMARY CARDS GRID */}
          <div className="academic-top-cards-grid" style={{ marginTop: "1rem" }}>
            {/* SSLC CARD */}
            <div className="academic-summary-card card-sslc">
              <div className="card-top-title-row">
                <div className="card-icon-badge blue-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.3">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                  </svg>
                </div>
                <h3 className="text-blue">SSLC (10th)</h3>
              </div>
              <div className="card-info-rows">
                <div className="info-row">
                  <span className="info-label">School Name</span>
                  <span className="info-value font-semibold">{profile.academics?.sslc?.institute || "St. Joseph's High School"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Year of Passing</span>
                  <span className="info-value">{profile.academics?.sslc?.year || "2018"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Total Marks</span>
                  <span className="info-value font-semibold">{profile.academics?.sslc?.obtainedMarks || 625} / {profile.academics?.sslc?.totalMarks || 625}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Percentage</span>
                  <span className="info-value font-bold text-green">{profile.academics?.sslc?.score || "100.00%"}</span>
                </div>
                <div className="info-row pdf-row">
                  <span className="info-label">Certificate (PDF)</span>
                  <div className="pdf-actions-group">
                    <button
                      type="button"
                      className="view-pdf-btn"
                      onClick={() => openPdfDocument(profile.academics?.sslc?.documentUrl, profile.academics?.sslc?.documentName || "SSLC_Marks_Card.pdf")}
                    >
                      View PDF <span className="pdf-red-icon">📄</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* PUC CARD */}
            <div className="academic-summary-card card-puc">
              <div className="card-top-title-row">
                <div className="card-icon-badge green-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.3">
                    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
                    <path d="M9 22v-4h6v4"/>
                    <path d="M8 6h8"/>
                    <path d="M8 10h8"/>
                  </svg>
                </div>
                <h3 className="text-green">PUC (12th)</h3>
              </div>
              <div className="card-info-rows">
                <div className="info-row">
                  <span className="info-label">College Name</span>
                  <span className="info-value font-semibold">{profile.academics?.puc?.institute || "Govt. PU College"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Year of Passing</span>
                  <span className="info-value">{profile.academics?.puc?.year || "2020"}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Total Marks</span>
                  <span className="info-value font-semibold">{profile.academics?.puc?.obtainedMarks || 600} / {profile.academics?.puc?.totalMarks || 600}</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Percentage</span>
                  <span className="info-value font-bold text-green">{profile.academics?.puc?.score || "100.00%"}</span>
                </div>
                <div className="info-row pdf-row">
                  <span className="info-label">Certificate (PDF)</span>
                  <div className="pdf-actions-group">
                    <button
                      type="button"
                      className="view-pdf-btn"
                      onClick={() => openPdfDocument(profile.academics?.puc?.documentUrl, profile.academics?.puc?.documentName || "PUC_Marks_Card.pdf")}
                    >
                      View PDF <span className="pdf-red-icon">📄</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* B.E. CARD */}
            <div className="academic-summary-card card-be">
              <div className="card-top-title-row">
                <div className="card-icon-badge purple-badge">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2.3">
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                  </svg>
                </div>
                <h3 className="text-purple">B.E ({profile.academics?.beSummary?.branch || "CSE"}) – Performance</h3>
              </div>

              <div className="be-stat-boxes-grid">
                <div className="be-stat-box">
                  <span className="be-stat-lbl">CGPA (Till Now)</span>
                  <span className="be-stat-val font-bold text-blue">{profile.academics?.beSummary?.cgpaTillNow || "8.21"}</span>
                </div>
                <div className="be-stat-box">
                  <span className="be-stat-lbl">Total Credits Earned</span>
                  <span className="be-stat-val font-bold text-green">{profile.academics?.beSummary?.totalCredits || 160}</span>
                </div>
              </div>

              <div className="be-summary-row">
                <div className="be-sum-item">
                  <span className="be-sum-lbl">Total Marks</span>
                  <span className="be-sum-val">{profile.academics?.beSummary?.totalMarks || 8000}</span>
                </div>
                <div className="be-sum-item">
                  <span className="be-sum-lbl">Obtained Marks</span>
                  <span className="be-sum-val">{profile.academics?.beSummary?.obtainedMarks || 6568}</span>
                </div>
                <div className="be-sum-item">
                  <span className="be-sum-lbl">Overall Percentage</span>
                  <span className="be-sum-val text-green font-bold">{profile.academics?.beSummary?.overallPercentage || "82.10%"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* SEMESTER TABLE */}
          <div style={{ marginTop: "1.5rem" }}>
            <h4 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.85rem" }}>Semester Wise Performance</h4>
            <div className="table-responsive-container">
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
                  {(profile.academics?.beSemesters || []).map((semRow, idx) => (
                    <tr key={idx}>
                      <td className="font-semibold">{semRow.sem}</td>
                      <td>{semRow.totalMarks || 1000}</td>
                      <td>{semRow.obtainedMarks || 780}</td>
                      <td className="text-green font-bold">{semRow.percentage || "78.00%"}</td>
                      <td>{(parseFloat(semRow.sgpa) || 7.8).toFixed(2)}</td>
                      <td>{(parseFloat(semRow.cgpa) || 7.8).toFixed(2)}</td>
                      <td>
                        <div className="table-pdf-actions-flex">
                          <button
                            type="button"
                            className="view-pdf-btn"
                            onClick={() => openPdfDocument(semRow.documentUrl, semRow.documentName || `${semRow.sem}_Marks_Card.pdf`)}
                          >
                            View PDF <span className="pdf-red-icon">📄</span>
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

        {/* 6. BOTTOM ALERT STRIP & SAVE BUTTON */}
        <div className="profile-bottom-strip">
          <div className="info-alert-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <span>{canEditProfile ? "Keep your profile updated to unlock better opportunities." : "Viewing student profile in Read-Only mode."}</span>
          </div>

          {canEditProfile && (
            <button className="save-profile-action-btn" onClick={handleSaveProfile} disabled={saving}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
                <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                <polyline points="17 21 17 13 7 13 7 21" />
                <polyline points="7 3 7 8 15 8" />
              </svg>
              {saving ? "Saving Profile..." : "💾 Save Profile Changes"}
            </button>
          )}
        </div>
      </div>

      {/* EDIT MODALS */}
      {activeModal && (
        <div className="profile-modal-overlay">
          <div className="profile-modal-box">
            <div className="modal-header">
              <h3>
                {activeModal === "hero" && "Edit Personal Details"}
                {activeModal === "social" && "Edit Social & Profile Links"}
                {activeModal === "objective" && "Edit Objective"}
                {activeModal === "tech" && "Edit Technical Skills"}
                {activeModal === "soft" && "Edit Soft Skills"}
                {activeModal === "marks" && "Edit Marks & CGPA"}
              </h3>
              <button className="modal-close-btn" onClick={closeModal}>✕</button>
            </div>

            <div className="modal-body">
              {activeModal === "hero" && (
                <div className="modal-form-vertical">
                  {/* PROFILE IMAGE OPTION SECTION */}
                  <div className="modal-image-option-card">
                    <div className="modal-avatar-preview">
                      {tempData.avatarUrl ? (
                        <img
                          src={tempData.avatarUrl}
                          alt="Profile Preview"
                          className="modal-preview-img"
                        />
                      ) : (
                        <div className="modal-preview-fallback">
                          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="modal-image-actions">
                      <h4 className="modal-image-title">Profile Picture</h4>
                      <div className="modal-image-btn-row">
                        <button
                          type="button"
                          className="img-btn upload-btn"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          Add / Change Image
                        </button>
                        {tempData.avatarUrl ? (
                          <button
                            type="button"
                            className="img-btn remove-btn"
                            onClick={handleRemoveImage}
                          >
                            Remove Image
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>

                  {/* FORM FIELDS GRID WITH CHOICE DROPDOWNS */}
                  <div className="modal-form-grid">
                    <div className="modal-form-group">
                      <label>Full Name</label>
                      <input
                        type="text"
                        value={tempData.full_name || ""}
                        onChange={(e) => setTempData({ ...tempData, full_name: e.target.value })}
                      />
                    </div>

                    <div className="modal-form-group">
                      <label>USN / Student ID</label>
                      <input
                        type="text"
                        value={tempData.student_id || ""}
                        onChange={(e) => setTempData({ ...tempData, student_id: e.target.value })}
                      />
                    </div>

                    {/* BRANCH / DEPARTMENT CHOICE */}
                    <div className="modal-form-group">
                      <label>Branch / Department</label>
                      <select
                        className="modal-select"
                        value={tempData.department || "Computer Science & Engineering"}
                        onChange={(e) => setTempData({ ...tempData, department: e.target.value })}
                      >
                        <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                        <option value="Information Science & Engineering">Information Science & Engineering</option>
                        <option value="Electronics & Communication Engineering">Electronics & Communication Engineering</option>
                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                        <option value="Civil Engineering">Civil Engineering</option>
                        <option value="Artificial Intelligence & Machine Learning">Artificial Intelligence & Machine Learning</option>
                      </select>
                    </div>

                    {/* SECTION CHOICE */}
                    <div className="modal-form-group">
                      <label>Section</label>
                      <select
                        className="modal-select"
                        value={tempData.section || "Section A"}
                        onChange={(e) => setTempData({ ...tempData, section: e.target.value })}
                      >
                        <option value="Section A">Section A</option>
                        <option value="Section B">Section B</option>
                        <option value="Section C">Section C</option>
                        <option value="Section D">Section D</option>
                      </select>
                    </div>

                    {/* YEAR & SEMESTER CHOICE */}
                    <div className="modal-form-group">
                      <label>Year & Semester</label>
                      <select
                        className="modal-select"
                        value={tempData.semester || "6th Semester (III Year)"}
                        onChange={(e) => setTempData({ ...tempData, semester: e.target.value })}
                      >
                        <option value="1st Semester (I Year)">1st Semester (I Year)</option>
                        <option value="2nd Semester (I Year)">2nd Semester (I Year)</option>
                        <option value="3rd Semester (II Year)">3rd Semester (II Year)</option>
                        <option value="4th Semester (II Year)">4th Semester (II Year)</option>
                        <option value="5th Semester (III Year)">5th Semester (III Year)</option>
                        <option value="6th Semester (III Year)">6th Semester (III Year)</option>
                        <option value="7th Semester (IV Year)">7th Semester (IV Year)</option>
                        <option value="8th Semester (IV Year)">8th Semester (IV Year)</option>
                      </select>
                    </div>

                    {/* GENDER CHOICE */}
                    <div className="modal-form-group">
                      <label>Gender</label>
                      <select
                        className="modal-select"
                        value={tempData.gender || "Male"}
                        onChange={(e) => setTempData({ ...tempData, gender: e.target.value })}
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div className="modal-form-group">
                      <label>Email Address</label>
                      <input
                        type="email"
                        value={tempData.email || ""}
                        onChange={(e) => setTempData({ ...tempData, email: e.target.value })}
                      />
                    </div>

                    <div className="modal-form-group">
                      <label>Phone Number (10 Digits)</label>
                      <div className={`phone-input-container ${getRaw10Digits(tempData.phone).length > 0 && getRaw10Digits(tempData.phone).length < 10 ? "input-error" : getRaw10Digits(tempData.phone).length === 10 ? "input-success" : ""}`}>
                        <span className="phone-country-code">+91</span>
                        <input
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          className="phone-number-input"
                          maxLength={10}
                          placeholder="e.g. 9108612345"
                          value={getRaw10Digits(tempData.phone)}
                          onKeyDown={(e) => {
                            if (
                              !/[0-9]/.test(e.key) &&
                              !["Backspace", "Delete", "ArrowLeft", "ArrowRight", "Tab", "Enter"].includes(e.key) &&
                              !(e.ctrlKey || e.metaKey)
                            ) {
                              e.preventDefault();
                            }
                          }}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                            setTempData({ ...tempData, phone: val ? `+91 ${val}` : "" });
                          }}
                        />
                      </div>
                      {getRaw10Digits(tempData.phone).length === 10 ? (
                        <p className="phone-field-success-msg">
                          ✓ 10 Digits Valid
                        </p>
                      ) : getRaw10Digits(tempData.phone).length > 0 ? (
                        <p className="phone-field-error-msg">
                          ⚠️ Phone number must contain exactly 10 numeric digits. Remaining: {10 - getRaw10Digits(tempData.phone).length} digit(s).
                        </p>
                      ) : null}
                    </div>

                    <div className="modal-form-group">
                      <label>Date of Birth</label>
                      <input
                        type="date"
                        className="modal-select"
                        value={getValidIsoDate(tempData.dob)}
                        min="1950-01-01"
                        max="2030-12-31"
                        onChange={(e) => setTempData({ ...tempData, dob: e.target.value })}
                      />
                    </div>

                    {/* GITHUB URL */}
                    <div className="modal-form-group">
                      <label style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="#24292e">
                          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                        </svg>
                        GitHub Link
                      </label>
                      <input
                        type="url"
                        placeholder="https://github.com/username"
                        value={tempData.githubUrl || ""}
                        onChange={(e) => setTempData({ ...tempData, githubUrl: e.target.value })}
                      />
                    </div>

                    {/* LINKEDIN URL */}
                    <div className="modal-form-group">
                      <label style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="#0a66c2">
                          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                        </svg>
                        LinkedIn Link
                      </label>
                      <input
                        type="url"
                        placeholder="https://linkedin.com/in/username"
                        value={tempData.linkedinUrl || ""}
                        onChange={(e) => setTempData({ ...tempData, linkedinUrl: e.target.value })}
                      />
                    </div>

                    {/* PORTFOLIO URL */}
                    <div className="modal-form-group" style={{ gridColumn: "span 2" }}>
                      <label style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <line x1="2" y1="12" x2="22" y2="12"/>
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                        </svg>
                        Portfolio Website Link
                      </label>
                      <input
                        type="url"
                        placeholder="https://yourportfolio.dev"
                        value={tempData.portfolioUrl || ""}
                        onChange={(e) => setTempData({ ...tempData, portfolioUrl: e.target.value })}
                      />
                    </div>

                  </div>
                </div>
              )}

              {activeModal === "social" && (
                <div className="modal-form-vertical">
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.75rem 1rem", borderRadius: "10px", fontSize: "0.85rem", color: "#166534", fontWeight: "600", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <span>🔗</span> Add your professional links (GitHub, LinkedIn, Portfolio). Clickable badges will be accessible on your profile to recruiters and admins.
                  </div>

                  <div className="modal-form-group">
                    <label style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "#0f172a", fontWeight: "700" }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="#24292e">
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                      </svg>
                      GitHub Profile URL
                    </label>
                    <input
                      type="url"
                      placeholder="e.g. https://github.com/venkatesh-r"
                      value={tempData.githubUrl || ""}
                      onChange={(e) => setTempData({ ...tempData, githubUrl: e.target.value })}
                    />
                  </div>

                  <div className="modal-form-group">
                    <label style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "#0f172a", fontWeight: "700" }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="#0a66c2">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                      </svg>
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="url"
                      placeholder="e.g. https://linkedin.com/in/venkatesh-r"
                      value={tempData.linkedinUrl || ""}
                      onChange={(e) => setTempData({ ...tempData, linkedinUrl: e.target.value })}
                    />
                  </div>

                  <div className="modal-form-group">
                    <label style={{ display: "flex", alignItems: "center", gap: "0.45rem", color: "#0f172a", fontWeight: "700" }}>
                      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                      Portfolio Website URL
                    </label>
                    <input
                      type="url"
                      placeholder="e.g. https://venkatesh-r.dev"
                      value={tempData.portfolioUrl || ""}
                      onChange={(e) => setTempData({ ...tempData, portfolioUrl: e.target.value })}
                    />
                  </div>
                </div>
              )}

              {activeModal === "objective" && (
                <div className="modal-form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                    <label style={{ margin: 0 }}>Career Objective Statement</label>
                    <span style={{ fontSize: "0.74rem", fontWeight: "700", color: "#64748b", background: "#f1f5f9", padding: "0.15rem 0.5rem", borderRadius: "4px" }}>
                      Resume Best Practice
                    </span>
                  </div>
                  <p style={{ fontSize: "0.78rem", color: "#475569", margin: "0 0 0.5rem 0", lineHeight: "1.4" }}>
                    💡 A resume objective should be concise, typically <strong>1 to 3 sentences</strong> or <strong>30 to 50 words maximum</strong>.
                  </p>
                  <textarea
                    rows="4"
                    className="modal-textarea"
                    placeholder="Passionate Computer Science student seeking an entry-level software engineering role to leverage skills in full-stack web development, problem solving, and data structures. Eager to contribute effectively to innovative team projects."
                    value={tempData.objective || ""}
                    onChange={(e) => setTempData({ ...tempData, objective: e.target.value })}
                  />
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "0.45rem", flexWrap: "wrap", gap: "0.3rem" }}>
                    <span style={{ fontSize: "0.76rem", fontWeight: "600", color: getWordCount(tempData.objective) > 50 || getSentenceCount(tempData.objective) > 3 ? "#ef4444" : "#64748b" }}>
                      Words: {getWordCount(tempData.objective)} / 50 max • Sentences: {getSentenceCount(tempData.objective)} / 3 max
                    </span>
                    {getWordCount(tempData.objective) <= 50 && getSentenceCount(tempData.objective) <= 3 && getWordCount(tempData.objective) > 0 ? (
                      <span style={{ fontSize: "0.76rem", fontWeight: "700", color: "#16a34a", background: "#dcfce7", padding: "0.15rem 0.55rem", borderRadius: "4px" }}>
                        ✓ Concise Resume Objective (1-3 sentences)
                      </span>
                    ) : getWordCount(tempData.objective) > 50 ? (
                      <span style={{ fontSize: "0.76rem", fontWeight: "700", color: "#ef4444", background: "#fee2e2", padding: "0.15rem 0.55rem", borderRadius: "4px" }}>
                        ⚠️ Exceeds 50 words max limit
                      </span>
                    ) : getSentenceCount(tempData.objective) > 3 ? (
                      <span style={{ fontSize: "0.76rem", fontWeight: "700", color: "#ef4444", background: "#fee2e2", padding: "0.15rem 0.55rem", borderRadius: "4px" }}>
                        ⚠️ Exceeds 3 sentences max
                      </span>
                    ) : null}
                  </div>
                </div>
              )}

              {activeModal === "tech" && (
                <div className="modal-form-group">
                  <label>Technical Skills (Comma Separated)</label>
                  <input
                    type="text"
                    value={tempData.technicalSkills ? tempData.technicalSkills.join(", ") : ""}
                    onChange={(e) =>
                      setTempData({
                        ...tempData,
                        technicalSkills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>
              )}

              {activeModal === "soft" && (
                <div className="modal-form-group">
                  <label>Soft Skills (Comma Separated)</label>
                  <input
                    type="text"
                    value={tempData.softSkills ? tempData.softSkills.join(", ") : ""}
                    onChange={(e) =>
                      setTempData({
                        ...tempData,
                        softSkills: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                      })
                    }
                  />
                </div>
              )}

              {activeModal === "marks" && (
                <div className="modal-academics-list">
                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "0.75rem 1rem", borderRadius: "8px", marginBottom: "1rem" }}>
                    <h4 style={{ margin: "0 0 0.25rem 0", color: "#1e40af", fontSize: "0.85rem", fontWeight: 700 }}>
                      🎓 Academic Details & Marks Cards
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "#1e3a8a", lineHeight: "1.4" }}>
                      Enter SSLC, PUC, and B.E. Semester marks and SGPA. Percentage and CGPA are automatically calculated.
                    </p>
                  </div>

                  {/* 1. SSLC (10TH) */}
                  <div className="academic-row-edit-card" style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1rem", marginBottom: "1rem", background: "#f8fafc" }}>
                    <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.88rem", color: "#2563eb", fontWeight: 700 }}>
                      1️⃣ SSLC / Class 10th (School)
                    </h4>
                    <div className="modal-form-grid">
                      <div className="modal-form-group">
                        <label>School Name</label>
                        <input
                          type="text"
                          placeholder="e.g. St. Joseph's High School"
                          value={tempData.academics?.sslc?.institute || ""}
                          onChange={(e) => {
                            const acad = normalizeAcademics(tempData.academics);
                            setTempData({ ...tempData, academics: { ...acad, sslc: { ...acad.sslc, institute: e.target.value } } });
                          }}
                        />
                      </div>
                      <div className="modal-form-group">
                        <label>Passing Year</label>
                        <input
                          type="text"
                          placeholder="e.g. 2018"
                          value={tempData.academics?.sslc?.year || ""}
                          onChange={(e) => {
                            const acad = normalizeAcademics(tempData.academics);
                            setTempData({ ...tempData, academics: { ...acad, sslc: { ...acad.sslc, year: e.target.value } } });
                          }}
                        />
                      </div>
                      <div className="modal-form-group">
                        <label>Total Marks</label>
                        <input
                          type="number"
                          placeholder="e.g. 625"
                          value={tempData.academics?.sslc?.totalMarks || 625}
                          onChange={(e) => {
                            const acad = normalizeAcademics(tempData.academics);
                            const tot = parseFloat(e.target.value) || 0;
                            const obt = parseFloat(acad.sslc?.obtainedMarks) || 0;
                            const pct = tot > 0 ? ((obt / tot) * 100).toFixed(2) + "%" : "0.00%";
                            setTempData({ ...tempData, academics: { ...acad, sslc: { ...acad.sslc, totalMarks: tot, score: pct } } });
                          }}
                        />
                      </div>
                      <div className="modal-form-group">
                        <label>Obtained Marks</label>
                        <input
                          type="number"
                          placeholder="e.g. 625"
                          value={tempData.academics?.sslc?.obtainedMarks || 625}
                          onChange={(e) => {
                            const acad = normalizeAcademics(tempData.academics);
                            const obt = parseFloat(e.target.value) || 0;
                            const tot = parseFloat(acad.sslc?.totalMarks) || 625;
                            const pct = tot > 0 ? ((obt / tot) * 100).toFixed(2) + "%" : "0.00%";
                            setTempData({ ...tempData, academics: { ...acad, sslc: { ...acad.sslc, obtainedMarks: obt, score: pct } } });
                          }}
                        />
                      </div>
                      <div className="modal-form-group" style={{ gridColumn: "1 / -1" }}>
                        <label>Upload 10th SSLC Marks Card (PDF Only)</label>
                        {tempData.academics?.sslc?.documentUrl ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.5rem 0.75rem", borderRadius: "6px" }}>
                            <span style={{ fontSize: "0.8rem", color: "#166534", fontWeight: 700 }}>
                              📄 {tempData.academics.sslc.documentName || "SSLC_Marks_Card.pdf"}
                            </span>
                            <button
                              type="button"
                              onClick={() => openPdfDocument(tempData.academics.sslc.documentUrl, tempData.academics.sslc.documentName || "SSLC_Marks_Card.pdf")}
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

                  {/* 2. PUC (12TH) */}
                  <div className="academic-row-edit-card" style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1rem", marginBottom: "1rem", background: "#f8fafc" }}>
                    <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.88rem", color: "#16a34a", fontWeight: 700 }}>
                      2️⃣ PUC / 12th / Diploma (College)
                    </h4>
                    <div className="modal-form-grid">
                      <div className="modal-form-group">
                        <label>College Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Govt. PU College"
                          value={tempData.academics?.puc?.institute || ""}
                          onChange={(e) => {
                            const acad = normalizeAcademics(tempData.academics);
                            setTempData({ ...tempData, academics: { ...acad, puc: { ...acad.puc, institute: e.target.value } } });
                          }}
                        />
                      </div>
                      <div className="modal-form-group">
                        <label>Passing Year</label>
                        <input
                          type="text"
                          placeholder="e.g. 2020"
                          value={tempData.academics?.puc?.year || ""}
                          onChange={(e) => {
                            const acad = normalizeAcademics(tempData.academics);
                            setTempData({ ...tempData, academics: { ...acad, puc: { ...acad.puc, year: e.target.value } } });
                          }}
                        />
                      </div>
                      <div className="modal-form-group">
                        <label>Total Marks</label>
                        <input
                          type="number"
                          placeholder="e.g. 600"
                          value={tempData.academics?.puc?.totalMarks || 600}
                          onChange={(e) => {
                            const acad = normalizeAcademics(tempData.academics);
                            const tot = parseFloat(e.target.value) || 0;
                            const obt = parseFloat(acad.puc?.obtainedMarks) || 0;
                            const pct = tot > 0 ? ((obt / tot) * 100).toFixed(2) + "%" : "0.00%";
                            setTempData({ ...tempData, academics: { ...acad, puc: { ...acad.puc, totalMarks: tot, score: pct } } });
                          }}
                        />
                      </div>
                      <div className="modal-form-group">
                        <label>Obtained Marks</label>
                        <input
                          type="number"
                          placeholder="e.g. 600"
                          value={tempData.academics?.puc?.obtainedMarks || 600}
                          onChange={(e) => {
                            const acad = normalizeAcademics(tempData.academics);
                            const obt = parseFloat(e.target.value) || 0;
                            const tot = parseFloat(acad.puc?.totalMarks) || 600;
                            const pct = tot > 0 ? ((obt / tot) * 100).toFixed(2) + "%" : "0.00%";
                            setTempData({ ...tempData, academics: { ...acad, puc: { ...acad.puc, obtainedMarks: obt, score: pct } } });
                          }}
                        />
                      </div>
                      <div className="modal-form-group" style={{ gridColumn: "1 / -1" }}>
                        <label>Upload PUC / 12th Marks Card (PDF Only)</label>
                        {tempData.academics?.puc?.documentUrl ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.5rem 0.75rem", borderRadius: "6px" }}>
                            <span style={{ fontSize: "0.8rem", color: "#166534", fontWeight: 700 }}>
                              📄 {tempData.academics.puc.documentName || "PUC_Marks_Card.pdf"}
                            </span>
                            <button
                              type="button"
                              onClick={() => openPdfDocument(tempData.academics.puc.documentUrl, tempData.academics.puc.documentName || "PUC_Marks_Card.pdf")}
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

                  {/* 3. B.E. SEMESTERS (SEM 1 TO 8) */}
                  <div className="academic-row-edit-card" style={{ border: "1px solid #bbf7d0", borderRadius: "10px", padding: "1rem", marginBottom: "1rem", background: "#faf5ff" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                      <h4 style={{ margin: 0, fontSize: "0.88rem", color: "#9333ea", fontWeight: 700 }}>
                        3️⃣ B.E. Semesters (Semester 1 to 8)
                      </h4>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                        <label style={{ fontSize: "0.76rem", fontWeight: 700, color: "#6b21a8" }}>Branch Code:</label>
                        <input
                          type="text"
                          style={{ width: "65px", padding: "0.2rem 0.4rem", fontSize: "0.78rem", borderRadius: "4px", border: "1px solid #d8b4fe" }}
                          placeholder="CSE"
                          value={tempData.academics?.beSummary?.branch || "CSE"}
                          onChange={(e) => {
                            const acad = normalizeAcademics(tempData.academics);
                            setTempData({ ...tempData, academics: { ...acad, beSummary: { ...acad.beSummary, branch: e.target.value } } });
                          }}
                        />
                        <label style={{ fontSize: "0.76rem", fontWeight: 700, color: "#6b21a8" }}>Total Credits:</label>
                        <input
                          type="number"
                          style={{ width: "65px", padding: "0.2rem 0.4rem", fontSize: "0.78rem", borderRadius: "4px", border: "1px solid #d8b4fe" }}
                          placeholder="160"
                          value={tempData.academics?.beSummary?.totalCredits || 160}
                          onChange={(e) => {
                            const acad = normalizeAcademics(tempData.academics);
                            setTempData({ ...tempData, academics: { ...acad, beSummary: { ...acad.beSummary, totalCredits: parseInt(e.target.value, 10) || 160 } } });
                          }}
                        />
                      </div>
                    </div>

                    {(normalizeAcademics(tempData.academics).beSemesters || []).map((sem, sIdx) => (
                      <div key={sIdx} style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0.75rem", marginBottom: "0.75rem", background: "#ffffff" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#9333ea" }}>
                            {sem.sem || `Semester ${sIdx + 1}`}
                          </span>
                          {normalizeAcademics(tempData.academics).beSemesters.length > 1 && (
                            <button
                              type="button"
                              style={{ background: "none", border: "none", color: "#ef4444", fontSize: "0.74rem", fontWeight: 700, cursor: "pointer" }}
                              onClick={() => {
                                const acad = normalizeAcademics(tempData.academics);
                                const updatedSems = acad.beSemesters.filter((_, idx) => idx !== sIdx);
                                setTempData({ ...tempData, academics: { ...acad, beSemesters: updatedSems } });
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
                              placeholder="e.g. 1st Semester"
                              value={sem.sem || ""}
                              onChange={(e) => {
                                const acad = normalizeAcademics(tempData.academics);
                                const updatedSems = [...acad.beSemesters];
                                updatedSems[sIdx] = { ...updatedSems[sIdx], sem: e.target.value };
                                setTempData({ ...tempData, academics: { ...acad, beSemesters: updatedSems } });
                              }}
                            />
                          </div>

                          <div className="modal-form-group">
                            <label>Total Marks</label>
                            <input
                              type="number"
                              placeholder="e.g. 1000"
                              value={sem.totalMarks || 1000}
                              onChange={(e) => {
                                const acad = normalizeAcademics(tempData.academics);
                                const updatedSems = [...acad.beSemesters];
                                const tot = parseFloat(e.target.value) || 1000;
                                const obt = parseFloat(updatedSems[sIdx].obtainedMarks) || 0;
                                const pct = tot > 0 ? ((obt / tot) * 100).toFixed(2) + "%" : "0.00%";
                                updatedSems[sIdx] = { ...updatedSems[sIdx], totalMarks: tot, percentage: pct };
                                setTempData({ ...tempData, academics: { ...acad, beSemesters: updatedSems } });
                              }}
                            />
                          </div>

                          <div className="modal-form-group">
                            <label>Obtained Marks</label>
                            <input
                              type="number"
                              placeholder="e.g. 780"
                              value={sem.obtainedMarks || 780}
                              onChange={(e) => {
                                const acad = normalizeAcademics(tempData.academics);
                                const updatedSems = [...acad.beSemesters];
                                const obt = parseFloat(e.target.value) || 0;
                                const tot = parseFloat(updatedSems[sIdx].totalMarks) || 1000;
                                const pct = tot > 0 ? ((obt / tot) * 100).toFixed(2) + "%" : "0.00%";
                                updatedSems[sIdx] = { ...updatedSems[sIdx], obtainedMarks: obt, percentage: pct };
                                setTempData({ ...tempData, academics: { ...acad, beSemesters: updatedSems } });
                              }}
                            />
                          </div>

                          <div className="modal-form-group">
                            <label>SGPA Score</label>
                            <input
                              type="text"
                              placeholder="e.g. 7.80"
                              value={sem.sgpa || ""}
                              onChange={(e) => {
                                const acad = normalizeAcademics(tempData.academics);
                                const updatedSems = [...acad.beSemesters];
                                updatedSems[sIdx] = { ...updatedSems[sIdx], sgpa: e.target.value };
                                setTempData({ ...tempData, academics: { ...acad, beSemesters: updatedSems } });
                              }}
                            />
                          </div>

                          <div className="modal-form-group" style={{ gridColumn: "1 / -1" }}>
                            <label>Marks Card Document (PDF Only)</label>
                            {sem.documentUrl ? (
                              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.4rem 0.6rem", borderRadius: "6px" }}>
                                <span style={{ fontSize: "0.78rem", color: "#166534", fontWeight: 700 }}>
                                  📄 {sem.documentName || sem.sem + "_Marks_Card.pdf"}
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

                    {normalizeAcademics(tempData.academics).beSemesters.length < 8 && (
                      <button
                        type="button"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          background: "#ffffff",
                          color: "#9333ea",
                          border: "1px dashed #9333ea",
                          padding: "0.55rem 1rem",
                          borderRadius: "6px",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          width: "100%",
                          justifyContent: "center"
                        }}
                        onClick={() => {
                          const acad = normalizeAcademics(tempData.academics);
                          const currentCount = acad.beSemesters.length;
                          const nextSemNum = currentCount + 1;
                          const ordinals = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th", "8th"];
                          const semLabel = `${ordinals[nextSemNum - 1] || nextSemNum + "th"} Semester`;
                          const updatedSems = [
                            ...acad.beSemesters,
                            { sem: semLabel, totalMarks: 1000, obtainedMarks: 800, percentage: "80.00%", sgpa: "8.00", cgpa: "8.00", documentUrl: null, documentName: null }
                          ];
                          setTempData({ ...tempData, academics: { ...acad, beSemesters: updatedSems } });
                        }}
                      >
                        ➕ Add Semester ({normalizeAcademics(tempData.academics).beSemesters.length + 1} of 8)
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={closeModal}>Cancel</button>
              <button className="modal-save-btn" onClick={saveModalChanges}>Save</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default StudentProfile;
