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
        setSuccessMsg(`Account created successfully! Redirecting to ${role} home page...`);
        setTimeout(() => {
          if (role === "admin") navigate("/admin/home");
          else if (role === "faculty") navigate("/faculty/home");
          else navigate("/student/home");
        }, 1000);
      } else {
        setLocalError(res.message);
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
                  onClick={() => alert("Password reset link sent to your registered email.")}
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

        {/* COPYRIGHT FOOTER */}
        <footer className="login-copyright-footer">
          © 2025 KVG College of Engineering. All rights reserved.
        </footer>
      </div>
    </div>
  );
}

export default LoginPage;