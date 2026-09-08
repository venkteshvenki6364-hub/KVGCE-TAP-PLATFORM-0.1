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
  const [isSignup, setIsSignup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Forgot Password Modal State
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: Verify, 2: New Password
  const [resetLoading, setResetLoading] = useState(false);
  const [resetError, setResetError] = useState("");
  const [resetSuccess, setResetSuccess] = useState("");
  const [resetData, setResetData] = useState({
    identifier: "",
    dobOrPhone: "",
    newPassword: "",
    confirmPassword: ""
  });

  const [formData, setFormData] = useState({
    usn: "4KV21CS042",
    phone: "",
    userId: "",
    dob: "28-02-2004",
    password: "Password123!",
    confirmPassword: "",
    name: "",
    email: "",
  });

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setIsSignup(false);
    setLocalError("");
    setSuccessMsg("");

    if (selectedRole === "student") {
      setFormData({
        usn: "4KV21CS042",
        phone: "",
        userId: "",
        dob: "28-02-2004",
        password: "Password123!",
        confirmPassword: "",
        name: "",
        email: "",
      });
    } else if (selectedRole === "faculty") {
      setFormData({
        usn: "",
        phone: "9876543210",
        userId: "",
        dob: "15-08-1985",
        password: "Password123!",
        confirmPassword: "",
        name: "",
        email: "",
      });
    } else if (selectedRole === "admin") {
      setFormData({
        usn: "",
        phone: "",
        userId: "admin@kvgce.edu.in",
        dob: "",
        password: "Password123!",
        confirmPassword: "",
        name: "",
        email: "",
      });
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleOpenResetModal = () => {
    setShowResetModal(true);
    setResetError("");
    setResetSuccess("");
    setResetData({
      identifier: formData.usn || formData.userId || "4KV21CS042",
      dobOrPhone: formData.dob || formData.phone || "28-02-2004",
      newPassword: "",
      confirmPassword: ""
    });
  };

  const handleConfirmResetPassword = async (e) => {
    e.preventDefault();
    if (!resetData.identifier.trim()) {
      setResetError("Please enter your USN, Email, or User ID.");
      return;
    }
    if (!resetData.newPassword) {
      setResetError("Please enter a new password.");
      return;
    }
    if (resetData.newPassword !== resetData.confirmPassword) {
      setResetError("New password and Confirm Password do not match.");
      return;
    }
    if (resetData.newPassword.length < 6) {
      setResetError("Password must be at least 6 characters long.");
      return;
    }

    setResetLoading(true);
    setResetError("");
    setResetSuccess("");

    try {
      const res = await api.post("/auth/reset-password", {
        username_or_email: resetData.identifier,
        dob_or_phone: resetData.dobOrPhone,
        new_password: resetData.newPassword
      });

      if (res.data && res.data.success) {
        setResetSuccess(res.data.message || "🎉 Password reset successfully and changes accepted!");
        
        // Auto update current form fields with new password
        setFormData(prev => ({
          ...prev,
          password: resetData.newPassword
        }));

        setTimeout(() => {
          setShowResetModal(false);
          setSuccessMsg("Password updated automatically in database! You can now log in.");
        }, 1500);
      }
    } catch (err) {
      console.error(err);
      setResetError(err.response?.data?.detail || "Failed to update password. Please check your USN / Email.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setSuccessMsg("");
    setLoading(true);

    if (isSignup) {
      if (formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword) {
        setLocalError("Passwords do not match. Please re-enter.");
        setLoading(false);
        return;
      }

      let regData = {
        role: role,
        full_name: formData.name,
        email: formData.email,
        password: formData.password || formData.dob,
      };

      if (role === "student") {
        if (!formData.name || !formData.email || !formData.usn) {
          setLocalError("Please fill in all required student registration fields.");
          setLoading(false);
          return;
        }
        regData.student_id = formData.usn;
        regData.dob = formData.dob;
      } else if (role === "faculty") {
        if (!formData.name || !formData.email || !formData.phone) {
          setLocalError("Please fill in all required faculty registration fields.");
          setLoading(false);
          return;
        }
        regData.phone = formData.phone;
        regData.dob = formData.dob;
      } else if (role === "admin") {
        if (!formData.name || !formData.email) {
          setLocalError("Please fill in all required admin registration fields.");
          setLoading(false);
          return;
        }
      }

      const res = await register(regData);
      setLoading(false);

      if (res.success) {
        if (res.requiresApproval) {
          setSuccessMsg(res.message || "Registration request submitted! Your account is pending verification by Admin. You will be able to log in once an Administrator approves your account.");
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
      let identifier = "";
      let secret = "";

      if (role === "student") {
        identifier = formData.usn;
        secret = formData.dob || formData.password;
        if (!identifier) {
          setLocalError("Please enter your USN.");
          setLoading(false);
          return;
        }
      } else if (role === "faculty") {
        identifier = formData.phone;
        secret = formData.dob || formData.password;
        if (!identifier) {
          setLocalError("Please enter your Phone No.");
          setLoading(false);
          return;
        }
      } else if (role === "admin") {
        identifier = formData.userId;
        secret = formData.password;
        if (!identifier) {
          setLocalError("Please enter your User ID or Email.");
          setLoading(false);
          return;
        }
      }

      if (!secret) {
        setLocalError("Please enter your password / DOB.");
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
        setLocalError(res.message);
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
          {(localError || authError) && (
            <div className="alert-message error">
              ⚠️ {localError || authError}
            </div>
          )}

          {successMsg && (
            <div className="alert-message success">
              ✅ {successMsg}
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

            {/* ROLE SPECIFIC PRIMARY IDENTIFIER FIELDS */}
            {role === "student" && (
              <div className="field-group">
                <label>USN</label>
                <div className="input-rel-box">
                  <span className="icon-left">
                    <svg className="field-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="usn"
                    placeholder="Enter your USN (e.g. 4KV21CS042)"
                    value={formData.usn}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {role === "faculty" && (
              <div className="field-group">
                <label>Phone No</label>
                <div className="input-rel-box">
                  <span className="icon-left">
                    <svg className="field-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Enter your Phone No (e.g. 9876543210)"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {role === "admin" && (
              <div className="field-group">
                <label>User ID / Email</label>
                <div className="input-rel-box">
                  <span className="icon-left">
                    <svg className="field-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    type="text"
                    name="userId"
                    placeholder="Enter User ID or Email (e.g. admin@kvgce.edu.in)"
                    value={formData.userId}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {/* PASSWORD / DOB FIELD */}
            {(role === "student" || role === "faculty") ? (
              <div className="field-group">
                <label>DOB (Date of Birth)</label>
                <div className="input-rel-box">
                  <span className="icon-left">
                    <svg className="field-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="dob"
                    placeholder="Enter your DOB (DD-MM-YYYY)"
                    value={formData.dob}
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
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              <div className="field-group">
                <label>Password</label>
                <div className="input-rel-box">
                  <span className="icon-left">
                    <svg className="field-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Enter your Password"
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
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
              </div>
            )}

            {/* CONFIRM PASSWORD FOR SIGNUP */}
            {isSignup && (
              <div className="field-group">
                <label>Confirm Password</label>
                <div className="input-rel-box">
                  <span className="icon-left">
                    <svg className="field-svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  </span>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm your Password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
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
                <button type="button" onClick={() => setIsSignup(false)}>
                  Login
                </button>
              </>
            ) : (
              <>
                {role === "student" ? "Student" : role === "faculty" ? "Faculty" : "User"} doesn't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsSignup(true)}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>

        {/* FORGOT & RESET PASSWORD MODAL */}
        {showResetModal && (
          <div className="modal-overlay" style={{ position: "fixed", inset: 0, background: "rgba(15, 23, 42, 0.65)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 }}>
            <div style={{ background: "#ffffff", width: "90%", maxWidth: "460px", borderRadius: "16px", padding: "2rem", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.2)", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: 700, color: "#1e293b" }}>
                  🔐 Reset Account Password
                </h3>
                <button
                  type="button"
                  onClick={() => setShowResetModal(false)}
                  style={{ background: "none", border: "none", fontSize: "1.5rem", color: "#64748b", cursor: "pointer" }}
                >
                  ×
                </button>
              </div>

              {resetError && (
                <div style={{ padding: "0.75rem", background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px", fontSize: "0.875rem", marginBottom: "1rem" }}>
                  ⚠️ {resetError}
                </div>
              )}

              {resetSuccess && (
                <div style={{ padding: "0.75rem", background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "8px", fontSize: "0.875rem", marginBottom: "1rem" }}>
                  {resetSuccess}
                </div>
              )}

              <form onSubmit={handleConfirmResetPassword}>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    USN / Registered Email / Faculty ID
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 4KV21CS042 or student@kvgce.edu.in"
                    value={resetData.identifier}
                    onChange={(e) => setResetData({ ...resetData, identifier: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.95rem", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter new password (min 6 chars)"
                    value={resetData.newPassword}
                    onChange={(e) => setResetData({ ...resetData, newPassword: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.95rem", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ marginBottom: "1.5rem" }}>
                  <label style={{ display: "block", fontSize: "0.875rem", fontWeight: 600, color: "#334155", marginBottom: "6px" }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Re-enter new password"
                    value={resetData.confirmPassword}
                    onChange={(e) => setResetData({ ...resetData, confirmPassword: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", border: "1px solid #cbd5e1", borderRadius: "8px", fontSize: "0.95rem", boxSizing: "border-box" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setShowResetModal(false)}
                    style={{ padding: "10px 16px", border: "1px solid #cbd5e1", background: "#f8fafc", color: "#475569", borderRadius: "8px", fontWeight: 600, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={resetLoading}
                    style={{ padding: "10px 20px", background: "#16a34a", color: "#ffffff", border: "none", borderRadius: "8px", fontWeight: 700, cursor: "pointer" }}
                  >
                    {resetLoading ? "Updating Database..." : "RESET & ACCEPT CHANGES ✓"}
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