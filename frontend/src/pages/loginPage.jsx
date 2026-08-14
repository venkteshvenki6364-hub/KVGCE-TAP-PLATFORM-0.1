import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
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

  const [formData, setFormData] = useState({
    userId: "4KV21CS042",
    phone: "",
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
        userId: "4KV21CS042",
        phone: "",
        password: "Password123!",
        confirmPassword: "",
        name: "",
        email: "",
      });
    } else if (selectedRole === "faculty") {
      setFormData({
        userId: "",
        phone: "faculty@kvgce.edu.in",
        password: "Password123!",
        confirmPassword: "",
        name: "",
        email: "",
      });
    } else if (selectedRole === "admin") {
      setFormData({
        userId: "",
        phone: "admin@kvgce.edu.in",
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError("");
    setSuccessMsg("");
    setLoading(true);

    if (isSignup) {
      if (formData.password !== formData.confirmPassword) {
        setLocalError("Passwords do not match. Please re-enter.");
        setLoading(false);
        return;
      }
      if (!formData.name || !formData.email || !formData.userId) {
        setLocalError("Please fill in all required registration fields.");
        setLoading(false);
        return;
      }

      const res = await register({
        email: formData.email,
        full_name: formData.name,
        password: formData.password,
        student_id: formData.userId,
        role: "student",
      });

      setLoading(false);
      if (res.success) {
        setSuccessMsg("Account created successfully! Redirecting to dashboard...");
        setTimeout(() => navigate("/student/dashboard"), 1000);
      } else {
        setLocalError(res.message);
      }
    } else {
      const identifier = role === "student" ? formData.userId : formData.phone;
      if (!identifier || !formData.password) {
        setLocalError("Please enter your ID/Email and password.");
        setLoading(false);
        return;
      }

      const res = await login(identifier, formData.password);
      setLoading(false);

      if (res.success) {
        setSuccessMsg("Authentication successful! Redirecting...");
        setTimeout(() => {
          if (res.role === "admin") navigate("/admin/dashboard");
          else if (res.role === "faculty") navigate("/faculty/dashboard");
          else navigate("/student/dashboard");
        }, 800);
      } else {
        setLocalError(res.message);
      }
    }
  };

  const fillDemoCredentials = (targetRole) => {
    handleRoleChange(targetRole);
  };

  return (
    <div className="login-page">
      <div className="login-top-bg"></div>

      <main className="login-main">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", maxWidth: "480px", marginBottom: "1rem" }}>
          <Link to="/" style={{ color: "#ffffff", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "0.5rem", fontSize: "0.95rem", fontWeight: "500", background: "rgba(255,255,255,0.15)", padding: "0.4rem 0.9rem", borderRadius: "6px" }}>
            ← Back to Home
          </Link>
        </div>

        <img
          src="/KVGCE_logo.png"
          alt="KVG College of Engineering"
          className="login-logo"
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.display = "none";
          }}
        />

        <h1>KVG College of Engineering</h1>
        <p className="login-subtitle">
          TAP — Activity Tracking & Skill Management System
        </p>

        <div className="login-heading">
          <span></span>
          <h2>{isSignup ? "Student Sign Up" : "Portal Login"}</h2>
          <span></span>
        </div>

        {/* ROLE SELECTION TABS */}
        <div className="role-tabs">
          <button
            type="button"
            className={role === "student" ? "role-tab active" : "role-tab"}
            onClick={() => handleRoleChange("student")}
          >
            <span className="role-icon">🎓</span> Student
          </button>

          <button
            type="button"
            className={role === "faculty" ? "role-tab active" : "role-tab"}
            onClick={() => handleRoleChange("faculty")}
          >
            <span className="role-icon">👨‍🏫</span> Faculty
          </button>

          <button
            type="button"
            className={role === "admin" ? "role-tab active" : "role-tab"}
            onClick={() => handleRoleChange("admin")}
          >
            <span className="role-icon">🛡️</span> Admin
          </button>
        </div>

        {/* DEMO ACCESSIBILITY HELPER */}
        <div style={{ background: "#f1f5f9", padding: "0.6rem", borderRadius: "8px", marginBottom: "1rem", textAlign: "center", fontSize: "0.85rem", color: "#334155" }}>
          <strong>Quick Demo Fill:</strong>{" "}
          <button type="button" onClick={() => fillDemoCredentials("student")} style={{ background: "#1F2E6D", color: "#fff", border: "none", padding: "2px 8px", borderRadius: "4px", margin: "0 2px", cursor: "pointer", fontSize: "0.78rem" }}>Student</button>
          <button type="button" onClick={() => fillDemoCredentials("faculty")} style={{ background: "#0284c7", color: "#fff", border: "none", padding: "2px 8px", borderRadius: "4px", margin: "0 2px", cursor: "pointer", fontSize: "0.78rem" }}>Faculty</button>
          <button type="button" onClick={() => fillDemoCredentials("admin")} style={{ background: "#475569", color: "#fff", border: "none", padding: "2px 8px", borderRadius: "4px", margin: "0 2px", cursor: "pointer", fontSize: "0.78rem" }}>Admin</button>
        </div>

        {/* FORM CARD */}
        <div className="login-card">
          {(localError || authError) && (
            <div style={{ background: "#fee2e2", border: "1px solid #f87171", color: "#991b1b", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.9rem" }}>
              ⚠️ {localError || authError}
            </div>
          )}

          {successMsg && (
            <div style={{ background: "#dcfce7", border: "1px solid #4ade80", color: "#166534", padding: "0.75rem", borderRadius: "6px", marginBottom: "1rem", fontSize: "0.9rem" }}>
              ✅ {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isSignup && role === "student" && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <div className="input-wrapper">
                    <span className="input-icon">👤</span>
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

                <div className="form-group">
                  <label>Email Address</label>
                  <div className="input-wrapper">
                    <span className="input-icon">✉</span>
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

            {role === "student" && (
              <div className="form-group">
                <label>{isSignup ? "Student ID / USN" : "Student ID / USN or Email"}</label>
                <div className="input-wrapper">
                  <span className="input-icon">👤</span>
                  <input
                    type="text"
                    name="userId"
                    placeholder="e.g. 4KV21CS042 or student@kvgce.edu.in"
                    value={formData.userId}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {(role === "faculty" || role === "admin") && (
              <div className="form-group">
                <label>Email or Phone Number</label>
                <div className="input-wrapper">
                  <span className="input-icon">✉</span>
                  <input
                    type="text"
                    name="phone"
                    placeholder={role === "faculty" ? "faculty@kvgce.edu.in" : "admin@kvgce.edu.in"}
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label>Password</label>
              <div className="input-wrapper">
                <span className="input-icon">🔒</span>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "👁️" : "👁️‍🗨️"}
                </button>
              </div>
            </div>

            {isSignup && role === "student" && (
              <div className="form-group">
                <label>Confirm Password</label>
                <div className="input-wrapper">
                  <span className="input-icon">🔒</span>
                  <input
                    type="password"
                    name="confirmPassword"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {!isSignup && (
              <div className="form-options">
                <label className="remember">
                  <input type="checkbox" defaultChecked />
                  <span>Remember me</span>
                </label>
                <button type="button" className="forgot-password" onClick={() => alert("Password reset link will be sent to your registered email.")}>
                  Forgot Password?
                </button>
              </div>
            )}

            <button type="submit" className="main-login-btn" disabled={loading}>
              {loading ? (
                "AUTHENTICATING..."
              ) : (
                <>
                  <span className="submit-icon">→</span>
                  {isSignup ? "CREATE ACCOUNT" : `LOGIN AS ${role.toUpperCase()}`}
                </>
              )}
            </button>
          </form>

          <div className="switch-auth">
            {isSignup ? (
              <>
                Already have an account?{" "}
                <button type="button" onClick={() => setIsSignup(false)}>
                  Login
                </button>
              </>
            ) : (
              <>
                Student doesn't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setRole("student");
                    setIsSignup(true);
                  }}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>

        <footer className="login-footer">
          © 2026 KVG College of Engineering. All rights reserved.
        </footer>
      </main>
    </div>
  );
}

export default LoginPage;