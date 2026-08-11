import { useState } from "react";
import "./LoginPage.css";

function LoginPage() {
  const [role, setRole] = useState("student");
  const [showPassword, setShowPassword] = useState(false);
  const [isSignup, setIsSignup] = useState(false);

  const [formData, setFormData] = useState({
    userId: "",
    phone: "",
    password: "",
    confirmPassword: "",
    name: "",
    email: "",
  });

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setIsSignup(false);

    setFormData({
      userId: "",
      phone: "",
      password: "",
      confirmPassword: "",
      name: "",
      email: "",
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isSignup) {
      if (formData.password !== formData.confirmPassword) {
        alert("Passwords do not match");
        return;
      }

      console.log("Student Signup:", formData);
      return;
    }

    console.log("Login:", {
      role,
      userId: role === "student" ? formData.userId : formData.phone,
      password: formData.password,
    });
  };

  return (
    <div className="login-page">

      {/* =================================
          TOP BLUE AREA
      ================================= */}
      <div className="login-top-bg"></div>

      {/* =================================
          MAIN CARD
      ================================= */}
      <main className="login-main">

        {/* KVG LOGO */}
        <img
          src="/KVGCE_logo.png"
          alt="KVG College of Engineering"
          className="login-logo"
        />

        {/* COLLEGE TITLE */}
        <h1>Welcome to KVG College of Engineering</h1>

        <p className="login-subtitle">
          Academy of Liberal Education (R), Sullia, Dakshina Kannada
        </p>

        {/* =================================
            LOGIN / SIGN UP TITLE
        ================================= */}
        <div className="login-heading">

          <span></span>

          <h2>
            {isSignup ? "Sign Up" : "Login"}
          </h2>

          <span></span>

        </div>

        {/* =================================
            ROLE TABS
        ================================= */}
        <div className="role-tabs">

          <button
            type="button"
            className={role === "student" ? "role-tab active" : "role-tab"}
            onClick={() => handleRoleChange("student")}
          >
            <span className="role-icon">🎓</span>
            Student
          </button>

          <button
            type="button"
            className={role === "faculty" ? "role-tab active" : "role-tab"}
            onClick={() => handleRoleChange("faculty")}
          >
            <span className="role-icon">👨‍🏫</span>
            Faculty
          </button>

          <button
            type="button"
            className={role === "admin" ? "role-tab active" : "role-tab"}
            onClick={() => handleRoleChange("admin")}
          >
            <span className="role-icon">🛡️</span>
            Admin
          </button>

        </div>

        {/* =================================
            FORM CARD
        ================================= */}
        <div className="login-card">

          <form onSubmit={handleSubmit}>

            {/* =================================
                SIGN UP ONLY FIELDS
            ================================= */}
            {isSignup && role === "student" && (
              <>
                <div className="form-group">

                  <label>Full Name</label>

                  <div className="input-wrapper">

                    <span className="input-icon">
                      👤
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

                <div className="form-group">

                  <label>Email Address</label>

                  <div className="input-wrapper">

                    <span className="input-icon">
                      ✉
                    </span>

                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                    />

                  </div>

                </div>
              </>
            )}

            {/* =================================
                STUDENT USER ID
            ================================= */}
            {role === "student" && (
              <div className="form-group">

                <label>
                  {isSignup ? "Student User ID" : "User ID"}
                </label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    👤
                  </span>

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

            {/* =================================
                FACULTY / ADMIN PHONE
            ================================= */}
            {(role === "faculty" || role === "admin") && (
              <div className="form-group">

                <label>Phone Number</label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    📱
                  </span>

                  <input
                    type="tel"
                    name="phone"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />

                </div>

              </div>
            )}

            {/* =================================
                PASSWORD
            ================================= */}
            <div className="form-group">

              <label>Password</label>

              <div className="input-wrapper">

                <span className="input-icon">
                  🔒
                </span>

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
                  onClick={() =>
                    setShowPassword(!showPassword)
                  }
                >
                  {showPassword ? "◉" : "◉"}
                </button>

              </div>

            </div>

            {/* =================================
                CONFIRM PASSWORD
            ================================= */}
            {isSignup && role === "student" && (
              <div className="form-group">

                <label>Confirm Password</label>

                <div className="input-wrapper">

                  <span className="input-icon">
                    🔒
                  </span>

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

            {/* =================================
                REMEMBER + FORGOT
            ================================= */}
            {!isSignup && (
              <div className="form-options">

                <label className="remember">

                  <input type="checkbox" />

                  <span>
                    Remember me
                  </span>

                </label>

                <button
                  type="button"
                  className="forgot-password"
                >
                  Forgot Password?
                </button>

              </div>
            )}

            {/* =================================
                SUBMIT
            ================================= */}
            <button
              type="submit"
              className="main-login-btn"
            >

              <span className="submit-icon">
                →
              </span>

              {isSignup ? "CREATE ACCOUNT" : "LOGIN"}

            </button>

          </form>

          {/* =================================
              SIGNUP / LOGIN SWITCH
          ================================= */}
          <div className="switch-auth">

            {isSignup ? (
              <>
                Already have an account?

                <button
                  type="button"
                  onClick={() => setIsSignup(false)}
                >
                  Login
                </button>
              </>
            ) : (
              <>
                Student doesn't have an account?

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

        {/* =================================
            FOOTER
        ================================= */}
        <footer className="login-footer">
          © 2026 KVG College of Engineering. All rights reserved.
        </footer>

      </main>

    </div>
  );
}

export default LoginPage;