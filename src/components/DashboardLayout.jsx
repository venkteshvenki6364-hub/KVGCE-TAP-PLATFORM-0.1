import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./DashboardLayout.css";

const DashboardLayout = ({ children, title }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getNavLinks = () => {
    if (role === "student") {
      return [
        { path: "/student/dashboard", label: "Overview", icon: "📊" },
        { path: "/student/profile", label: "My Profile", icon: "👤" },
        { path: "/student/skills", label: "Skills Matrix", icon: "⚡" },
        { path: "/student/aptitude", label: "Aptitude Tests", icon: "🧩" },
        { path: "/student/quiz", label: "Technical Quiz", icon: "💻" },
        { path: "/student/coding", label: "Coding Practice", icon: "⚙️" },
        { path: "/student/activities", label: "Activities", icon: "🎯" },
        { path: "/student/assessments", label: "Assessments", icon: "📝" },
        { path: "/student/achievements", label: "Achievements", icon: "🏆" },
        { path: "/student/certificates", label: "Certificates", icon: "🎓" },
        { path: "/student/performance", label: "Performance", icon: "📈" },
        { path: "/student/ai", label: "AI Career Assistant", icon: "🤖" },
      ];
    } else if (role === "faculty") {
      return [
        { path: "/faculty/dashboard", label: "Overview", icon: "📊" },
        { path: "/faculty/students", label: "Student List", icon: "👥" },
        { path: "/faculty/assessments", label: "Assessments", icon: "📝" },
        { path: "/faculty/questions", label: "Question Bank", icon: "❓" },
        { path: "/faculty/activities", label: "Activity Verification", icon: "✅" },
        { path: "/faculty/performance", label: "Analytics", icon: "📈" },
        { path: "/faculty/feedback", label: "Student Feedback", icon: "💬" },
      ];
    } else if (role === "admin") {
      return [
        { path: "/admin/dashboard", label: "Overview", icon: "📊" },
        { path: "/admin/students", label: "Students", icon: "🎓" },
        { path: "/admin/faculty", label: "Faculty", icon: "👨‍🏫" },
        { path: "/admin/users", label: "User Management", icon: "👤" },
        { path: "/admin/departments", label: "Departments", icon: "🏢" },
        { path: "/admin/assessments", label: "Assessments", icon: "📝" },
        { path: "/admin/questions", label: "Question Management", icon: "❓" },
        { path: "/admin/activities", label: "Activities & Verification", icon: "🎯" },
        { path: "/admin/reports", label: "Reports", icon: "📄" },
        { path: "/admin/analytics", label: "System Analytics", icon: "📉" },
        { path: "/admin/settings", label: "System Settings", icon: "⚙️" },
      ];
    }
    return [];
  };

  const navLinks = getNavLinks();

  return (
    <div className="dashboard-container">
      {/* SIDEBAR */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-brand">
          <img
            src="/KVGCE_logo.png"
            alt="KVGCE Logo"
            className="sidebar-logo"
            onError={(e) => (e.target.style.display = "none")}
          />
          <div className="brand-text">
            <h2>KVGCE TAP</h2>
            <span>{role?.toUpperCase()} PORTAL</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navLinks.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item ${isActive ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span>🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* OVERLAY FOR MOBILE */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
      )}

      {/* MAIN CONTENT AREA */}
      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="header-left">
            <button
              className="toggle-sidebar-btn"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              ☰
            </button>
            <h1 className="page-title">{title || "Dashboard"}</h1>
          </div>

          <div className="header-right">
            <Link to="/" className="home-link-btn" title="Back to Landing Page">
              🌐 College Website
            </Link>

            <div className="user-badge">
              <div className="avatar-circle">
                {user?.full_name ? user.full_name.charAt(0).toUpperCase() : "U"}
              </div>
              <div className="user-info-text">
                <span className="user-name">{user?.full_name || "User"}</span>
                <span className="user-role-tag">{role?.toUpperCase()}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="dashboard-body">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;
