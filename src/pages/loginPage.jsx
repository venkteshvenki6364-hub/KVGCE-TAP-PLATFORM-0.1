import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./LoginPage.css";

function LoginPage() {
  const navigate = useNavigate();
  const { login, register, authError } = useAuth();

  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Field-level error messages
  const [fieldErrors, setFieldErrors] = useState({
    userId: "",
    password: "",
    confirmPassword: "",
  });

  // Forgot Password Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [showResetPassEye, setShowResetPassEye] = useState(false);
  const [showResetConfirmPassEye, setShowResetConfirmPassEye] = useState(false);
  const [resetData, setResetData] = useState({
    usnOrId: "",
    email: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [formData, setFormData] = useState({
    usn: "4KV23CE033",
    phone: "8904320976",
    userId: "4KV23CE033",
    dob: "28-02-2004",
    password: "28-02-2004",
    confirmPassword: "",
    name: "",
    email: "",
  });

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setIsSignup(false);
    setLocalError("");
    setSuccessMsg("");
    setFieldErrors({ userId: "", password: "", confirmPassword: "" });

    if (selectedRole === "student") {
      setFormData({
        usn: "4KV23CE033",
        phone: "9741234567",
        userId: "4KV23CE033",
        dob: "28-02-2004",
        password: "28-02-2004",
        confirmPassword: "",
        name: "",
        email: "student@kvgce.edu.in",
      });
    } else if (selectedRole === "faculty") {
      setFormData({
        usn: "8904320976",
        phone: "8904320976",
        userId: "8904320976",
        dob: "15-08-1985",
        password: "15-08-1985",
        confirmPassword: "",
        name: "",
        email: "faculty@kvgce.edu.in",
      });
    } else if (selectedRole === "admin") {
      setFormData({
        usn: "ADMIN-001",
        phone: "9845012345",
        userId: "ADMIN-001",
        dob: "10-01-1980",
        password: "Password@123",
        confirmPassword: "",
        name: "",
        email: "admin@kvgce.edu.in",
      });
    }
  };

  const handleToggleSignup = (signupMode) => {
    setIsSignup(signupMode);
    setLocalError("");
    setSuccessMsg("");
    setFieldErrors({ userId: "", password: "", confirmPassword: "" });
    if (signupMode) {
      setFormData((prev) => ({
        ...prev,
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
        usn: "",
        userId: "",
      }));
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "usn" || name === "userId" ? { usn: value, userId: value } : {})
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
      userId: name === "usn" || name === "userId" ? "" : prev.userId,
    }));
  };

  const handleOpenResetModal = () => {
    setShowResetModal(true);
    setResetError("");
    setResetSuccess("");
    setResetData({
      usnOrId: formData.userId || formData.usn || (role === "student" ? "4KV21CS042" : role === "faculty" ? "KVG-FAC-102" : "ADMIN-001"),
      newPassword: "",
      confirmPassword: ""
    });
  };

  const handleConfirmResetPassword = async (e) => {
    e.preventDefault();
    if (!resetData.usnOrId.trim()) {
      setResetError("Please enter your USN or User ID.");
      return;
    }
    if (!resetData.newPassword) {
      setResetError("Please enter an updated password.");
      return;
    }
    if (resetData.newPassword !== resetData.confirmPassword) {
      setResetError("Updated password and Confirm Password do not match.");
      return;
    }
    if (role !== "admin") {
      const dobRegex = /^(\d{2}[-/\.]\d{2}[-/\.]\d{4}|\d{4}[-/\.]\d{2}[-/\.]\d{2})$/;
      if (!dobRegex.test(resetData.newPassword.trim())) {
        setResetError("Only Date of Birth (DOB) format passwords (DD-MM-YYYY, e.g. 28-02-2004) are allowed.");
        return;
      }
    } else if (resetData.newPassword.length < 6) {
      setResetError("Admin password must be at least 6 characters long.");
      return;
    }

    setResetLoading(true);
    setResetError("");
    setResetSuccess("");

    try {
      const res = await api.post("/auth/request-password-reset", {
        usn_or_id: resetData.usnOrId.trim(),
        new_password: resetData.newPassword,
        confirm_password: resetData.confirmPassword
      });

      const successMsgText = res.data?.message || `🎉 Password reset request submitted for ${resetData.usnOrId.trim()}! Sent update to Admin for confirmation.`;
      setResetSuccess(successMsgText);
      
      setFormData(prev => ({
        ...prev,
        password: resetData.newPassword
      }));

      setTimeout(() => {
        setShowResetModal(false);
        setSuccessMsg("🎉 Password reset request sent to Admin for confirmation! Once approved, your updated password will be active for login.");
      }, 2000);
    } catch (err) {
      console.warn("Backend reset call issue, saving pending reset request locally:", err);
      
      // Store pending reset request locally for offline/fallback mode
      const existingResets = JSON.parse(localStorage.getItem("kvgce_pending_resets") || "[]");
      const newReset = {
        _id: "reset-" + Date.now(),
        user_id: resetData.usnOrId.trim().toUpperCase(),
        user_email: `${resetData.usnOrId.trim().toLowerCase()}@kvgce.edu.in`,
        full_name: `User (${resetData.usnOrId.trim().toUpperCase()})`,
        role: role || "student",
        new_password_plain: resetData.newPassword,
        status: "pending",
        created_at: new Date().toISOString()
      };
      existingResets.push(newReset);
      localStorage.setItem("kvgce_pending_resets", JSON.stringify(existingResets));

      setResetSuccess(`🎉 Password reset request submitted for ${resetData.usnOrId.trim()}! Sent update to Admin for confirmation.`);

      setFormData(prev => ({
        ...prev,
        password: resetData.newPassword
      }));

      setTimeout(() => {
        setShowResetModal(false);
        setSuccessMsg("🎉 Password reset request sent to Admin for confirmation! Once approved, your updated password will be active for login.");
      }, 2000);
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setSuccessMsg("");
    setFieldErrors({ userId: "", password: "", confirmPassword: "" });
    setLoading(true);

    if (isSignup) {
      // SIGN UP - NEW USER REGISTRATION
      if (!formData.name || !formData.email || (!formData.userId && !formData.usn)) {
        setLocalError("Please fill in all required fields (Name, Email, User ID / USN).");
        setLoading(false);
        return;
      }

      if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
        setFieldErrors((prev) => ({
          ...prev,
          confirmPassword: "Passwords do not match. Please re-enter.",
        }));
        setLoading(false);
        return;
      }

      let regData = {
        role: role,
        full_name: formData.name,
        email: formData.email,
        password: formData.password || formData.dob,
        student_id: formData.usn || formData.userId,
        faculty_id: role === "faculty" ? (formData.userId || formData.usn) : "",
        phone: formData.phone || "",
        dob: formData.dob || "",
      };

      const res = await register(regData);
      setLoading(false);

      if (res.success) {
        if (res.requiresApproval) {
          setSuccessMsg(res.message || "🎉 Registration request submitted! Your account has been sent for verification to Admin. You will be able to log in once an Administrator approves your registration.");
          setIsSignup(false);
        } else {
          setSuccessMsg(`Account created successfully! Redirecting to ${role} home page...`);
          setTimeout(() => {
            if (role === "admin") navigate("/admin/home");
            else if (role === "faculty") navigate("/faculty/home");
            else navigate("/student/home");
          }, 1000);
        }
      } else {
        setLocalError(res.message || "Registration failed. Please try again.");
      }
    } else {
      // LOGIN - EXISTING USER AUTHENTICATION
      let identifier = formData.userId || formData.usn || formData.email;
      let secret = formData.password || formData.dob;

      if (!identifier) {
        setFieldErrors((prev) => ({
          ...prev,
          userId: `Please enter your User ID / USN.`,
        }));
        setLoading(false);
        return;
      }

      if (!secret) {
        setFieldErrors((prev) => ({
          ...prev,
          password: "Please enter your password.",
        }));
        setLoading(false);
        return;
      }

      const res = await login(identifier, secret, role);
      setLoading(false);

      if (res.success) {
        const targetRole = res.role || role;
        setSuccessMsg(`Authentication successful! Redirecting to ${targetRole} home page...`);
        setTimeout(() => {
          if (targetRole === "admin") navigate("/admin/home");
          else if (targetRole === "faculty") navigate("/faculty/home");
          else navigate("/student/home");
        }, 800);
      } else {
        if (res.errorType === "user_id") {
          setFieldErrors({
            userId: "Incorrect USN / User ID",
            password: "",
            confirmPassword: ""
          });
        } else if (res.errorType === "password") {
          setFieldErrors({
            userId: "",
            password: "Incorrect Password",
            confirmPassword: ""
          });
        } else {
          const msg = (res.message || "").toLowerCase();
          if (msg.includes("usn") || msg.includes("id") || msg.includes("not found")) {
            setFieldErrors({
              userId: "Incorrect USN / User ID",
              password: "",
              confirmPassword: ""
            });
          } else {
            setFieldErrors({
              userId: "",
              password: "Incorrect Password",
              confirmPassword: ""
            });
          }
        }
      }
    }
  };

  return (
    <div className="login-root">
      {/* TOP BLUE ACCENT BAR */}
      <div className="top-accent-bar"></div>

      <div className="login-page-container">
        {/* BACK TO HOME NAV */}
        <div className="nav-back-row">
          <Link to="/" className="back-link">
            ← Back to Home
          </Link>
        </div>

        {/* EMBLEM LOGO */}
        <div className="college-logo-wrapper">
          <img
            src="/KVGCE_logo.png"
            alt="KVG College of Engineering Emblem"
            className="emblem-img"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/kvg_logo.png";
            }}
          />
        </div>

        {/* COLLEGE HEADINGS */}
        <h1 className="main-college-title">
          Welcome to KVG College of Engineering
        </h1>
        <p className="main-college-subtitle">
          Academy of Liberal Education (R), Sullia, Dakshina Kannada
        </p>

        {/* DECORATIVE LOGIN / SIGNUP DIVIDER */}
        <div className="divider-heading-row">
          <div className="line"></div>
          <h2>{isSignup ? "Sign Up" : "Login"}</h2>
          <div className="line"></div>
        </div>

        {/* ROLE SELECTION TABS BAR */}
        <div className="role-switcher-bar">
          <button
            type="button"
            className={`role-btn ${role === "student" ? "active" : ""}`}
            onClick={() => handleRoleChange("student")}
          >
            <svg className="role-svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 3L1 9l11 6 9-4.91V17h2V9L12 3zM5 13.18v4l7 3.82 7-3.82v-4L12 17l-7-3.82z" />
            </svg>
            Student
          </button>

          <button
            type="button"
            className={`role-btn ${role === "faculty" ? "active" : ""}`}
            onClick={() => handleRoleChange("faculty")}
          >
            <svg className="role-svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
            Faculty
          </button>

          <button
            type="button"
            className={`role-btn ${role === "admin" ? "active" : ""}`}
            onClick={() => handleRoleChange("admin")}
          >
            <svg className="role-svg" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
            </svg>
            Admin
          </button>
        </div>

        {/* COMPACT FORM CARD */}
        <div className="form-card-box">
          {successMsg && (
            <div className="alert-message success">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form-body">
            {/* SIGNUP FULL NAME & EMAIL FIELDS */}
            {isSignup && (
              <>
                <div className="field-group">
                  <label>Full Name</label>
                  <div className="input-rel-box">
                    <span className="icon-left">
                      <svg className="field-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <input
                      type="text"
                      name="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="field-group">
                  <label>Email Address</label>
                  <div className="input-rel-box">
                    <span className="icon-left">
                      <svg className="field-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                        <polyline points="22,6 12,13 2,6" />
                      </svg>
                    </span>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email address"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* ROLE-SPECIFIC IDENTIFIER FIELD */}
            <div className="field-group">
              <label>
                {role === "student"
                  ? "Student USN"
                  : role === "faculty"
                  ? "Faculty Phone Number"
                  : "Admin User ID"}
              </label>
              <div className={`input-rel-box ${fieldErrors.userId ? "has-error" : ""}`}>
                <span className="icon-left">
                  <svg className="field-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </span>
                <input
                  type="text"
                  name={role === "student" ? "usn" : "userId"}
                  placeholder={
                    role === "student"
                      ? "Enter Student USN (e.g. 4KV23CE033)"
                      : role === "faculty"
                      ? "Enter 10-digit Phone Number (e.g. 8904320976)"
                      : "Enter Admin User ID (e.g. ADMIN-001)"
                  }
                  value={role === "student" ? formData.usn : formData.userId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData(prev => ({
                      ...prev,
                      usn: val,
                      userId: val
                    }));
                    setFieldErrors(prev => ({ ...prev, userId: "" }));
                  }}
                  required
                />
              </div>
              {fieldErrors.userId && (
                <div className="field-error-small" style={{ color: "#dc2626", fontSize: "11px", fontWeight: "600", marginTop: "4px", display: "block" }}>
                  {fieldErrors.userId}
                </div>
              )}
            </div>

            {/* ROLE-SPECIFIC PASSWORD FIELD */}
            <div className="field-group">
              <label>
                {role === "admin" ? "Admin Password" : "Password (DOB dd-mm-yyyy)"}
              </label>
              <div className={`input-rel-box ${fieldErrors.password ? "has-error" : ""}`}>
                <span className="icon-left">
                  {/* Lock SVG Icon */}
                  <svg className="field-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder={
                    role === "admin"
                      ? "Enter Admin Password (e.g. Password@123)"
                      : role === "student"
                      ? "Enter Password (e.g. 28-02-2004)"
                      : "Enter Password (e.g. 15-08-1985)"
                  }
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="eye-btn"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password"
                >
                  <svg className="eye-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                        <line x1="1" y1="1" x2="23" y2="23" />
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                      </>
                    )}
                  </svg>
                </button>
              </div>
              {fieldErrors.password && (
                <div className="field-error-small" style={{ color: "#dc2626", fontSize: "11px", fontWeight: "600", marginTop: "4px", display: "block" }}>
                  {fieldErrors.password}
                </div>
              )}
            </div>

            {/* CONFIRM PASSWORD FOR SIGNUP WITH IDENTICAL LOCK & EYE ICONS */}
            {isSignup && (
              <div className="field-group">
                <label>Confirm Password</label>
                <div className={`input-rel-box ${fieldErrors.confirmPassword ? "has-error" : ""}`}>
                  <span className="icon-left">
                    {/* SAME Lock SVG Icon as Password field */}
                    <svg className="field-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="eye-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="Toggle confirm password"
                  >
                    {/* SAME Eye SVG Icon as Password field */}
                    <svg className="eye-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {showConfirmPassword ? (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
                {fieldErrors.confirmPassword && (
                  <div className="field-error-small" style={{ color: "#dc2626", fontSize: "11px", fontWeight: "600", marginTop: "4px", display: "block" }}>
                    {fieldErrors.confirmPassword}
                  </div>
                )}
              </div>
            )}

            {/* REMEMBER ME & FORGOT PASSWORD ROW */}
            {!isSignup && (
              <div className="options-flex-row">
                <label className="remember-lbl">
                  <input type="checkbox" defaultChecked />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="forgot-link"
                  onClick={handleOpenResetModal}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button type="submit" className="green-submit-btn" disabled={loading}>
              {loading ? (
                "AUTHENTICATING..."
              ) : (
                <>
                  <span className="btn-label-text">{isSignup ? "SIGN UP" : "LOGIN"}</span>
                  <svg className="btn-arrow-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* TOGGLE LOGIN / SIGNUP SWITCH */}
          <div className="auth-switch-text">
            {isSignup ? (
              <>
                Already have an account?{" "}
                <button type="button" onClick={() => handleToggleSignup(false)}>
                  Login
                </button>
              </>
            ) : (
              <>
                {role === "student" ? "Student" : role === "faculty" ? "Faculty" : "User"} doesn't have an account?{" "}
                <button
                  type="button"
                  onClick={() => handleToggleSignup(true)}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>

        {/* FORGOT & RESET PASSWORD MODAL */}
        {showResetModal && (
          <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.70)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: "1rem" }}>
            <div style={{ background: "#ffffff", width: "100%", maxWidth: "500px", borderRadius: "20px", padding: "2rem", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)", border: "1px solid #e2e8f0" }}>
              {/* MODAL HEADER */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                    Forgot / Reset Password
                  </h3>
                  <p style={{ margin: "2px 0 0 0", fontSize: "0.825rem", color: "#64748b" }}>
                    Submit updated password for Admin verification & approval
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  style={{ background: "#f1f5f9", border: "none", width: "32px", height: "32px", borderRadius: "50%", fontSize: "1.25rem", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  ×
                </button>
              </div>

              {resetError && (
                <div style={{ padding: "0.85rem 1rem", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "10px", fontSize: "0.875rem", marginBottom: "1rem", fontWeight: 500 }}>
                  ⚠️ {resetError}
                </div>
              )}

              {resetSuccess && (
                <div style={{ padding: "0.85rem 1rem", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "10px", fontSize: "0.875rem", marginBottom: "1rem", fontWeight: 600, lineHeight: 1.4 }}>
                  {resetSuccess}
                </div>
              )}

              <form onSubmit={handleConfirmResetPassword}>
                {/* 1. ROLE-SPECIFIC ID FIELD */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
                    {role === "student" ? "Student USN" : role === "faculty" ? "Faculty Phone Number" : "Admin User ID"} <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={
                      role === "student"
                        ? "Enter Student USN (e.g. 4KV23CE033)"
                        : role === "faculty"
                        ? "Enter 10-digit Phone Number (e.g. 8904320976)"
                        : "Enter Admin User ID (e.g. ADMIN-001)"
                    }
                    value={resetData.usnOrId}
                    onChange={(e) => setResetData({ ...resetData, usnOrId: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "10px", fontSize: "0.95rem", boxSizing: "border-box", background: "#f8fafc" }}
                  />
                </div>

                {/* 2. UPDATED PASSWORD FIELD */}
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
                    {role === "admin" ? "Updated Admin Password" : "Updated Password (DOB dd-mm-yyyy)"} <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showResetPassEye ? "text" : "password"}
                      required
                      placeholder={
                        role === "admin"
                          ? "Enter Admin password (e.g. Password@123)"
                          : role === "student"
                          ? "Enter new password (e.g. 28-02-2004)"
                          : "Enter new password (e.g. 15-08-1985)"
                      }
                      value={resetData.newPassword}
                      onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                      style={{ width: "100%", padding: "10px 40px 10px 14px", border: "1px solid #cbd5e1", borderRadius: "10px", fontSize: "0.95rem", boxSizing: "border-box" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPassEye(!showResetPassEye)}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "4px" }}
                      aria-label="Toggle password visibility"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                        {showResetPassEye ? (
                          <>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </>
                        ) : (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                {/* 4. CONFIRM PASSWORD FIELD */}
                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", fontSize: "0.85rem", fontWeight: 700, color: "#334155", marginBottom: "5px" }}>
                    Confirm Password <span style={{ color: "#dc2626" }}>*</span>
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      type={showResetConfirmPassEye ? "text" : "password"}
                      required
                      placeholder={
                        role === "admin"
                          ? "Confirm Admin password (e.g. Password@123)"
                          : role === "student"
                          ? "Confirm new password (e.g. 28-02-2004)"
                          : "Confirm new password (e.g. 15-08-1985)"
                      }
                      value={resetData.confirmPassword}
                      onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
                      style={{ width: "100%", padding: "10px 40px 10px 14px", border: "1px solid #cbd5e1", borderRadius: "10px", fontSize: "0.95rem", boxSizing: "border-box" }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetConfirmPassEye(!showResetConfirmPassEye)}
                      style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#64748b", padding: "4px" }}
                      aria-label="Toggle confirm password visibility"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: "block" }}>
                        {showResetConfirmPassEye ? (
                          <>
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                            <line x1="1" y1="1" x2="23" y2="23" />
                          </>
                        ) : (
                          <>
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <circle cx="12" cy="12" r="3" />
                          </>
                        )}
                      </svg>
                    </button>
                  </div>
                </div>

                {/* ACTIONS ROW */}
                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    style={{ padding: "10px 18px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", borderRadius: "10px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    style={{ padding: "10px 22px", background: "#16a34a", color: "#ffffff", border: "none", borderRadius: "10px", fontWeight: 700, cursor: "pointer", boxShadow: "0 4px 6px -1px rgba(22, 163, 74, 0.3)" }}
                  >
                    {resetLoading ? "Sending to Admin..." : "SUBMIT & SEND UPDATE TO ADMIN ➔"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* COPYRIGHT FOOTER */}
        <footer className="login-copyright-footer">
          © 2025 KVG College of Engineering. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

export default LoginPage;