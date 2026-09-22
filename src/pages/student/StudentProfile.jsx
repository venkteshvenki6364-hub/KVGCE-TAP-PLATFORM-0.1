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
      nationality: parsedStored?.nationality || user?.nationality || "Indian",
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
      academics:
        parsedStored?.academics ||
        user?.academics || [
          {
            education: "SSLC (10th)",
            institute: "Sunandha Academy, Mysuru",
            board: "Karnataka SSLC",
            year: "2020",
            score: "70.00 %",
            badge: null,
          },
          {
            education: "PUC (12th)",
            institute: "Maharaja PU College, Mysore",
            board: "Karnataka PUE",
            year: "2022",
            score: "63.00 %",
            badge: null,
          },
          {
            education: "B.E (CSE)",
            institute: "KVG College of Engineering, Sullia",
            board: "VTU, Belagavi",
            year: "2023 - 2027",
            score: "7.85 CGPA",
            badge: "Till 5th Sem",
          },
        ],
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
    if (p?.nationality?.trim()) score += 5;
    if (p?.avatarUrl?.trim()) score += 10;
    if (p?.objective?.trim() && p.objective.length > 10) score += 5;
    if (p?.technicalSkills && p.technicalSkills.length > 0) score += 5;
    if (p?.softSkills && p.softSkills.length > 0) score += 5;
    return Math.min(100, score);
  };

  const profileCompletion = calculateProfileCompletion(profile);

  // Dynamic Color Spectrum: 0-35% Red, 36-69% Orange, 70-99% Blue, 100% Green
  const getCompletionTheme = (percentage) => {
    if (percentage <= 35) {
      return {
        textColor: "#ef4444", // Red
        borderColor: "#ef4444",
        boxShadow: "0 0 24px rgba(239, 68, 68, 0.65)"
      };
    } else if (percentage <= 69) {
      return {
        textColor: "#f97316", // Orange
        borderColor: "#f97316",
        boxShadow: "0 0 24px rgba(249, 115, 22, 0.65)"
      };
    } else if (percentage <= 99) {
      return {
        textColor: "#3b82f6", // Blue
        borderColor: "#3b82f6",
        boxShadow: "0 0 24px rgba(59, 130, 246, 0.65)"
      };
    } else {
      return {
        textColor: "#22c55e", // Green 100%
        borderColor: "#22c55e",
        boxShadow: "0 0 24px rgba(34, 197, 94, 0.65)"
      };
    }
  };

  const completionTheme = getCompletionTheme(profileCompletion);

  // Remove Profile Picture (reverts to default avatar icon fallback)
  const handleRemoveImage = () => {
    setProfile((prev) => ({ ...prev, avatarUrl: "" }));
    if (tempData && activeModal) {
      setTempData((prev) => ({ ...prev, avatarUrl: "" }));
    }
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

      // Update local profile state
      setProfile((prev) => ({ ...prev, avatarUrl: base64Data }));

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
            full_name: user?.full_name || apiData.full_name || prev.full_name,
            student_id: user?.student_id || user?.usn || apiData.student_id || prev.student_id,
            avatarUrl: user?.avatarUrl || apiData.avatarUrl || prev.avatarUrl,
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
        nationality: profile.nationality,
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
      // 1. Phone number validation (must be exactly 10 digits)
      const rawPhone = tempData.phone ? String(tempData.phone).trim() : "";
      const cleanedPhone = rawPhone.replace(/\D/g, "");
      if (cleanedPhone.length !== 10) {
        setMsg({
          type: "error",
          text: "⚠️ Mobile phone number must contain exactly 10 digits (e.g. 9108612345)."
        });
        setTimeout(() => setMsg({ type: "", text: "" }), 5000);
        return;
      }

      // 2. DOB Validation (Calendar check)
      if (tempData.dob) {
        const dobDate = new Date(tempData.dob);
        const today = new Date();
        if (isNaN(dobDate.getTime()) || dobDate >= today || dobDate.getFullYear() < 1950) {
          setMsg({
            type: "error",
            text: "⚠️ Invalid Date of Birth. Please select a valid calendar date."
          });
          setTimeout(() => setMsg({ type: "", text: "" }), 5000);
          return;
        }
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
        nationality: tempData.nationality,
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

  // Helper for matrix heatmap rendering
  const renderHeatmapGrid = () => {
    const cols = 20;
    const rows = 7;
    const activeCells = new Set([
      "18-0", "18-1", "18-2", "18-3", "18-4", "18-5", "18-6",
      "19-0", "19-1", "19-2", "19-3", "19-4", "19-5"
    ]);

    const gridCols = [];
    for (let c = 0; c < cols; c++) {
      const colCells = [];
      for (let r = 0; r < rows; r++) {
        const key = `${c}-${r}`;
        const isActive = activeCells.has(key);
        colCells.push(
          <div
            key={key}
            className={`heatmap-cell ${isActive ? "active-dark-blue" : ""}`}
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
                title={canEditProfile ? "Click to change profile picture (Max 5MB)" : "Profile Picture"}
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
                  <button
                    type="button"
                    className="camera-overlay-btn"
                    title="Upload profile picture from device file (Max 5MB)"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </button>
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
                  <span className="meta-val">{profile.phone}</span>
                </div>

                <div className="meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2">
                    <rect x="3" y="8" width="18" height="13" rx="2" />
                    <path d="M12 2v6" />
                    <path d="M8 4h8" />
                  </svg>
                  <span className="meta-val">{profile.dob}</span>
                </div>

                <div className="meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2">
                    <circle cx="12" cy="12" r="9" />
                    <path d="M12 3v18" />
                  </svg>
                  <span className="meta-val">{profile.gender}</span>
                </div>

                <div className="meta-item">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                  <span className="meta-val">{profile.nationality}</span>
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
              <h3 className="card-title">Activity</h3>
              <span className="badge-private">PRIVATE</span>
            </div>
            <div className="heatmap-container">
              <div className="heatmap-month-header">
                <span>Mar</span>
                <span>Apr</span>
                <span>May</span>
                <span>Jun</span>
                <span>Jul</span>
                <span>Aug</span>
              </div>
              <div className="heatmap-grid-matrix">{renderHeatmapGrid()}</div>
              <p className="heatmap-footer-date">Feb 2026 - Aug 2026</p>
            </div>
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

        {/* 5. MARKS AND CGPA CARD */}
        <div className="profile-section-card">
          <div className="section-card-header">
            <div className="header-title-flex">
              <div className="section-icon-badge blue-circle">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#003896" strokeWidth="2.5">
                  <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                  <path d="M6 12v5c3 3 9 3 12 0v-5" />
                </svg>
              </div>
              <h3 className="section-title">Marks and CGPA</h3>
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

          <div className="table-responsive-container">
            <table className="marks-table">
              <thead>
                <tr>
                  <th>Education</th>
                  <th>Institute / Board</th>
                  <th>University / Board</th>
                  <th>Year</th>
                  <th>% / CGPA</th>
                </tr>
              </thead>
              <tbody>
                {profile.academics.map((row, idx) => (
                  <tr key={idx}>
                    <td className="font-semibold">{row.education}</td>
                    <td>{row.institute}</td>
                    <td>{row.board}</td>
                    <td>{row.year}</td>
                    <td className="score-cell">
                      <span className="font-bold">{row.score}</span>
                      {row.badge && <span className="cgpa-sub-badge">{row.badge}</span>}
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
                          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#003896" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="modal-image-actions">
                      <h4 className="modal-image-title">Profile Picture Options</h4>
                      <p className="modal-image-desc">Upload a photo from device file (Max 5MB) or remove custom picture to use default avatar icon.</p>
                      <div className="modal-image-btn-row">
                        <button
                          type="button"
                          className="img-btn upload-btn"
                          onClick={() => fileInputRef.current?.click()}
                        >
                          📷 Add / Change Image
                        </button>
                        {tempData.avatarUrl ? (
                          <button
                            type="button"
                            className="img-btn remove-btn"
                            onClick={() => setTempData({ ...tempData, avatarUrl: "" })}
                          >
                            🗑️ Remove Image (No Image)
                          </button>
                        ) : (
                          <span className="no-img-tag">✓ Default Avatar Active</span>
                        )}
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
                      <input
                        type="tel"
                        maxLength={10}
                        placeholder="e.g. 9108612345"
                        value={tempData.phone || ""}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "");
                          setTempData({ ...tempData, phone: val });
                        }}
                      />
                    </div>

                    <div className="modal-form-group">
                      <label>Date of Birth (Calendar Select)</label>
                      <input
                        type="date"
                        className="modal-select"
                        value={
                          tempData.dob && tempData.dob.includes("-") && tempData.dob.split("-")[0].length === 4
                            ? tempData.dob
                            : "2004-02-28"
                        }
                        max={new Date(new Date().setFullYear(new Date().getFullYear() - 14)).toISOString().split("T")[0]}
                        min="1970-01-01"
                        onChange={(e) => setTempData({ ...tempData, dob: e.target.value })}
                      />
                    </div>

                    <div className="modal-form-group">
                      <label>Nationality</label>
                      <input
                        type="text"
                        value={tempData.nationality || "Indian"}
                        onChange={(e) => setTempData({ ...tempData, nationality: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              )}

              {activeModal === "objective" && (
                <div className="modal-form-group">
                  <label>Career Objective Statement</label>
                  <textarea
                    rows="4"
                    className="modal-textarea"
                    value={tempData.objective || ""}
                    onChange={(e) => setTempData({ ...tempData, objective: e.target.value })}
                  />
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
                  {tempData.academics &&
                    tempData.academics.map((row, i) => (
                      <div key={i} className="academic-row-edit-box">
                        <div className="modal-form-group">
                          <label>{row.education} - Institute</label>
                          <input
                            type="text"
                            value={row.institute}
                            onChange={(e) => {
                              const newAcad = [...tempData.academics];
                              newAcad[i].institute = e.target.value;
                              setTempData({ ...tempData, academics: newAcad });
                            }}
                          />
                        </div>
                        <div className="modal-form-group">
                          <label>Score / CGPA</label>
                          <input
                            type="text"
                            value={row.score}
                            onChange={(e) => {
                              const newAcad = [...tempData.academics];
                              newAcad[i].score = e.target.value;
                              setTempData({ ...tempData, academics: newAcad });
                            }}
                          />
                        </div>
                      </div>
                    ))}
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
