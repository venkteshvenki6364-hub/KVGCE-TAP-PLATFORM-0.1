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
            {isSignup && role === "student" && (
              <>
                <div className="field-group">
                  <label>Full Name</label>
                  <div className="input-rel-box">
                    <span className="icon-left">👤</span>
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
                    <span className="icon-left">✉</span>
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
              <div className="field-group">
                <label>User ID</label>
                <div className="input-rel-box">
                  <span className="icon-left">👤</span>
                  <input
                    type="text"
                    name="userId"
                    placeholder="Enter your User ID"
                    value={formData.userId}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            )}

            {(role === "faculty" || role === "admin") && (
              <div className="field-group">
                <label>User ID / Email</label>
                <div className="input-rel-box">
                  <span className="icon-left">👤</span>
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

            <div className="field-group">
              <label>Password</label>
              <div className="input-rel-box">
                <span className="icon-left">🔒</span>
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
                  👁️
                </button>
              </div>
            </div>

            {isSignup && role === "student" && (
              <div className="field-group">
                <label>Confirm Password</label>
                <div className="input-rel-box">
                  <span className="icon-left">🔒</span>
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

            {!isSignup && (
              <div className="options-flex-row">
                <label className="remember-lbl">
                  <input type="checkbox" defaultChecked />
                  <span>Remember me</span>
                </label>
                <button
                  type="button"
                  className="forgot-link"
                  onClick={() => alert("Password reset link sent to your registered email.")}
                >
                  Forgot Password?
                </button>
              </div>
            )}

            <button type="submit" className="green-submit-btn" disabled={loading}>
              {loading ? (
                "AUTHENTICATING..."
              ) : (
                <>
                  <span className="arrow-icon">→</span>
                  {isSignup ? "SIGN UP" : "LOGIN"}
                </>
              )}
            </button>
          </form>

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

        {/* COPYRIGHT FOOTER */}
        <footer className="login-copyright-footer">
          © 2025 KVG College of Engineering. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

export default LoginPage;