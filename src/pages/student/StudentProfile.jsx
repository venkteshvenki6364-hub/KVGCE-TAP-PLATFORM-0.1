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

  // Helper for normalizing academics structure (Fixed SSLC, PUC, and dynamic B.E. Sem 1-8)
  const normalizeAcademics = (raw) => {
    if (raw && !Array.isArray(raw) && raw.sslc && raw.puc && raw.beSemesters) {
      return raw;
    }

    const defaultObj = {
      sslc: {
        education: "SSLC (10th)",
        institute: "Sunandha Academy, Mysuru",
        board: "Karnataka SSLC Board",
        year: "2020",
        score: "94.20 %",
        documentUrl: null,
        documentName: null
      },
      puc: {
        education: "PUC (12th)",
        institute: "Maharaja PU College, Mysore",
        board: "Karnataka PUE Board",
        year: "2022",
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
  const [activeModal, setActiveModal] = useState(null); // 'hero', 'objective', 'tech', 'soft', 'marks'
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
    if (p?.technicalSkills && p.technicalSkills.length > 0) score += 10;
    if (p?.softSkills && p.softSkills.length > 0) score += 5;
    if (p?.academics && p.academics.length > 0) score += 5;
    if (p?.avatarUrl && p.avatarUrl.trim() !== "") score += 5;
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
        objective: tempData.objective,
        technicalSkills: tempData.technicalSkills,
        softSkills: tempData.softSkills,
        academics: tempData.academics,
      });
    }

    setMsg({ type: "success", text: "✅ Profile details updated and saved successfully!" });
    setTimeout(() => setMsg({ type: "", text: "" }), 4000);
  };

  // Helper function to safely open base64 PDF in a new browser tab with native browser PDF viewer
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

        {/* 5. PRE-UNIVERSITY ACADEMICS CARD (SSLC 10th & PUC 12th) */}
        <div className="profile-section-card">
          <div className="section-card-header">
            <div className="header-title-flex">
              <div className="section-icon-badge blue-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#003896" strokeWidth="2.5">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <h3 className="section-title">School & Pre-College Academics (SSLC & PUC)</h3>
            </div>
            {canEditProfile && (
              <button className="section-edit-btn" onClick={() => openModal("marks")}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Edit Details
              </button>
            )}
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
                {[profile.academics.sslc, profile.academics.puc].filter(Boolean).map((row, idx) => (
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
                      ) : canEditProfile ? (
                        <button
                          className="upload-doc-badge-btn"
                          onClick={() => openModal("marks")}
                          title="Upload Marks Card PDF"
                        >
                          📤 Upload PDF
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.76rem", color: "#94a3b8" }}>No Document</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* 6. B.E. ENGINEERING SEMESTER ACADEMICS (SEM 1 TO 8) */}
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
                  🎓 Overall Average B.E. CGPA: {calculateAvgCGPA(profile.academics.beSemesters)} CGPA ({profile.academics.beSemesters?.length || 0} Semesters)
                </span>
              </div>
            </div>
            {canEditProfile && (
              <button className="section-edit-btn" onClick={() => openModal("marks")}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Manage Semesters
              </button>
            )}
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
                {(profile.academics.beSemesters || []).map((semRow, idx) => (
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
                      ) : canEditProfile ? (
                        <button
                          className="upload-doc-badge-btn"
                          onClick={() => openModal("marks")}
                          title="Upload Marks Card PDF"
                        >
                          📤 Upload PDF
                        </button>
                      ) : (
                        <span style={{ fontSize: "0.76rem", color: "#94a3b8" }}>No Document</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              {saving ? "Saving Profile..." : "Save Profile"}
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
                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "0.75rem", borderRadius: "8px", marginBottom: "1rem" }}>
                    <h4 style={{ margin: "0 0 0.25rem 0", color: "#1e40af", fontSize: "0.85rem", fontWeight: 700 }}>
                      🎓 Academic Details & Marks Cards
                    </h4>
                    <p style={{ margin: 0, fontSize: "0.78rem", color: "#1e3a8a", lineHeight: "1.4" }}>
                      Fill in School (10th), PUC (12th), and B.E. Semester 1 to 8 SGPA scores. Upload official marks card PDF/image documents for each.
                    </p>
                  </div>

                  {/* FIXED SECTION 1: SSLC (10TH) */}
                  <div className="academic-row-edit-card" style={{ border: "1px solid #e2e8f0", borderRadius: "10px", padding: "1rem", marginBottom: "1rem", background: "#f8fafc" }}>
                    <h4 style={{ margin: "0 0 0.75rem 0", fontSize: "0.88rem", color: "#003896", fontWeight: 700 }}>
                      1️⃣ SSLC / Class 10th (School)
                    </h4>
                    <div className="modal-form-grid">
                      <div className="modal-form-group">
                        <label>School Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Sunandha Academy"
                          value={tempData.academics?.sslc?.institute || ""}
                          onChange={(e) => {
                            const acad = normalizeAcademics(tempData.academics);
                            setTempData({ ...tempData, academics: { ...acad, sslc: { ...acad.sslc, institute: e.target.value } } });
                          }}
                        />
                      </div>
                      <div className="modal-form-group">
                        <label>Board Name</label>
                        <input
                          type="text"
                          placeholder="e.g. Karnataka SSLC Board"
                          value={tempData.academics?.sslc?.board || ""}
                          onChange={(e) => {
                            const acad = normalizeAcademics(tempData.academics);
                            setTempData({ ...tempData, academics: { ...acad, sslc: { ...acad.sslc, board: e.target.value } } });
                          }}
                        />
                      </div>
                      <div className="modal-form-group">
                        <label>Passing Year</label>
                        <input
                          type="text"
                          placeholder="e.g. 2020"
                          value={tempData.academics?.sslc?.year || ""}
                          onChange={(e) => {
                            const acad = normalizeAcademics(tempData.academics);
                            setTempData({ ...tempData, academics: { ...acad, sslc: { ...acad.sslc, year: e.target.value } } });
                          }}
                        />
                      </div>
                      <div className="modal-form-group">
                        <label>Percentage (%)</label>
                        <input
                          type="text"
                          placeholder="e.g. 94.20 %"
                          value={tempData.academics?.sslc?.score || ""}
                          onChange={(e) => {
                            const acad = normalizeAcademics(tempData.academics);
                            setTempData({ ...tempData, academics: { ...acad, sslc: { ...acad.sslc, score: e.target.value } } });
                          }}
                        />
                      </div>
                      <div className="modal-form-group" style={{ gridColumn: "1 / -1" }}>
                        <label>Upload 10th SSLC Marks Card (PDF Only)</label>
                        {tempData.academics?.sslc?.documentUrl ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.5rem 0.75rem", borderRadius: "6px" }}>
                            <span style={{ fontSize: "0.8rem", color: "#166534", fontWeight: 700 }}>
                              📄 {tempData.academics.sslc.documentName || "SSLC Marks Card.pdf"}
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
                          placeholder="e.g. Maharaja PU College"
                          value={tempData.academics?.puc?.institute || ""}
                          onChange={(e) => {
                            const acad = normalizeAcademics(tempData.academics);
                            setTempData({ ...tempData, academics: { ...acad, puc: { ...acad.puc, institute: e.target.value } } });
                          }}
                        />
                      </div>
                      <div className="modal-form-group">
                        <label>Board / Stream</label>
                        <input
                          type="text"
                          placeholder="e.g. Karnataka PUE Board (Science)"
                          value={tempData.academics?.puc?.board || ""}
                          onChange={(e) => {
                            const acad = normalizeAcademics(tempData.academics);
                            setTempData({ ...tempData, academics: { ...acad, puc: { ...acad.puc, board: e.target.value } } });
                          }}
                        />
                      </div>
                      <div className="modal-form-group">
                        <label>Passing Year</label>
                        <input
                          type="text"
                          placeholder="e.g. 2022"
                          value={tempData.academics?.puc?.year || ""}
                          onChange={(e) => {
                            const acad = normalizeAcademics(tempData.academics);
                            setTempData({ ...tempData, academics: { ...acad, puc: { ...acad.puc, year: e.target.value } } });
                          }}
                        />
                      </div>
                      <div className="modal-form-group">
                        <label>Percentage (%)</label>
                        <input
                          type="text"
                          placeholder="e.g. 91.80 %"
                          value={tempData.academics?.puc?.score || ""}
                          onChange={(e) => {
                            const acad = normalizeAcademics(tempData.academics);
                            setTempData({ ...tempData, academics: { ...acad, puc: { ...acad.puc, score: e.target.value } } });
                          }}
                        />
                      </div>
                      <div className="modal-form-group" style={{ gridColumn: "1 / -1" }}>
                        <label>Upload PUC / 12th Marks Card (PDF Only)</label>
                        {tempData.academics?.puc?.documentUrl ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "0.5rem 0.75rem", borderRadius: "6px" }}>
                            <span style={{ fontSize: "0.8rem", color: "#166534", fontWeight: 700 }}>
                              📄 {tempData.academics.puc.documentName || "PUC Marks Card.pdf"}
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

                  {/* DYNAMIC SECTION 3: B.E. SEMESTERS (SEM 1 TO 8) */}
                  <div className="academic-row-edit-card" style={{ border: "1px solid #bbf7d0", borderRadius: "10px", padding: "1rem", marginBottom: "1rem", background: "#f0fdf4" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                      <h4 style={{ margin: 0, fontSize: "0.88rem", color: "#166534", fontWeight: 700 }}>
                        3️⃣ B.E. Semesters (Semester 1 to 8)
                      </h4>
                      <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#15803d", background: "#ffffff", padding: "0.2rem 0.6rem", borderRadius: "12px", border: "1px solid #86efac" }}>
                        Calculated Average CGPA: {calculateAvgCGPA(normalizeAcademics(tempData.academics).beSemesters)} CGPA
                      </span>
                    </div>

                    {(normalizeAcademics(tempData.academics).beSemesters || []).map((sem, sIdx) => (
                      <div key={sIdx} style={{ border: "1px solid #cbd5e1", borderRadius: "8px", padding: "0.75rem", marginBottom: "0.75rem", background: "#ffffff" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#003896" }}>
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
                              placeholder="e.g. 1st Sem"
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
                            <label>Passing Year</label>
                            <input
                              type="text"
                              placeholder="e.g. 2023"
                              value={sem.year || ""}
                              onChange={(e) => {
                                const acad = normalizeAcademics(tempData.academics);
                                const updatedSems = [...acad.beSemesters];
                                updatedSems[sIdx] = { ...updatedSems[sIdx], year: e.target.value };
                                setTempData({ ...tempData, academics: { ...acad, beSemesters: updatedSems } });
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

                    {normalizeAcademics(tempData.academics).beSemesters.length < 8 && (
                      <button
                        type="button"
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          background: "#ffffff",
                          color: "#16a34a",
                          border: "1px solid #86efac",
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
                          const nextSemName = `${currentCount + 1}${currentCount === 0 ? "st" : currentCount === 1 ? "nd" : currentCount === 2 ? "rd" : "th"} Sem`;
                          const updatedSems = [
                            ...acad.beSemesters,
                            { sem: nextSemName, sgpa: "8.00", year: String(2023 + Math.floor(currentCount / 2)), documentUrl: null, documentName: null }
                          ];
                          setTempData({ ...tempData, academics: { ...acad, beSemesters: updatedSems } });
                        }}
                      >
                        ➕ Add Next Semester ({normalizeAcademics(tempData.academics).beSemesters.length + 1}th Sem)
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="modal-cancel-btn" onClick={closeModal}>Cancel</button>
              <button className="modal-save-btn" onClick={saveModalChanges}>Apply Changes</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default StudentProfile;
