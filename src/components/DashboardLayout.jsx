import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./DashboardLayout.css";

const DashboardLayout = ({ children, title }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth > 992;
    }
    return true;
  });
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getNavLinks = () => {
    if (role === "student" || !role) {
      return [
        {
          path: "/student/dashboard",
          label: "Library",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <line x1="8" y1="6" x2="16" y2="6" />
              <line x1="8" y1="10" x2="16" y2="10" />
            </svg>
          ),
        },
        {
          path: "/student/skills",
          label: "Academics",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          ),
        },
        {
          path: "/student/aptitude",
          label: "Aptitude Test",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19.439 7.85c-.049-.322-.059-.647-.03-.97.054-.6.28-1.2.7-1.63a2.43 2.43 0 0 0 .58-.87c.22-.52.26-1.1.1-1.66a2.4 2.4 0 0 0-1.07-1.42 2.43 2.43 0 0 0-1.74-.29c-.58.11-1.14.36-1.63.73a2.44 2.44 0 0 1-1.6.47c-.32-.02-.65-.01-.97.04a2.43 2.43 0 0 0-1.63.7c-.43.42-1.03.65-1.63.7a2.45 2.45 0 0 1-.97-.03c-.6-.05-1.2-.28-1.63-.7a2.43 2.43 0 0 0-.87-.58 2.44 2.44 0 0 0-1.66-.1 2.4 2.4 0 0 0-1.42 1.07 2.43 2.43 0 0 0-.29 1.74c.11.58.36 1.14.73 1.63.37.49.53 1.08.47 1.6a2.5 2.5 0 0 1-.04.97c-.05.6-.28 1.2-.7 1.63a2.43 2.43 0 0 0-.58.87 2.44 2.44 0 0 0-.1 1.66c.14.56.52 1.06 1.07 1.42.54.36 1.16.46 1.74.29.58-.11 1.14-.36 1.63-.73.49-.37 1.08-.53 1.6-.47.32.02.65.01.97-.04.6.05 1.2.28 1.63.7.43.42 1.03.65 1.63.7.32.03.65.02.97-.03.6-.05 1.2-.28 1.63-.7.42-.43.65-1.03.7-1.63.03-.32.02-.65-.03-.97z" />
            </svg>
          ),
        },
        {
          path: "/student/quiz",
          label: "Technical Quiz",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          ),
        },
        {
          path: "/student/coding",
          label: "Coding lab",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          ),
        },
        {
          path: "/student/activities",
          label: "Projects",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1.55.61 2.95 1.6 3.98.74.75 1.2 1.51 1.4 2.5" />
            </svg>
          ),
        },
        {
          path: "/student/hr-interview",
          label: "HR Interview",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          ),
        },
        {
          path: "/student/ai",
          label: "AI Career Coach",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ),
        },
        {
          path: "/student/overview",
          label: "Student Overview",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <polyline points="17 11 19 13 23 9" />
            </svg>
          ),
        },
        {
          path: "/student/rankings",
          label: "Rankings",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 15l-2 5l-4 -2l-4 2l2 -5l-4 -4l5.5 -0.5l2.5 -5l2.5 5l5.5 0.5z" />
            </svg>
          ),
        },
      ];
    } else if (role === "faculty") {
      return [
        { path: "/faculty/dashboard", label: "Overview", icon: "📊" },
        { path: "/faculty/students", label: "Student List", icon: "👥" },
        { path: "/student/overview", label: "Student Single Overview", icon: "👤" },
        { path: "/student/rankings", label: "Rankings", icon: "🏆" },
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
        { path: "/student/overview", label: "Student Single Overview", icon: "👤" },
        { path: "/student/rankings", label: "Rankings", icon: "🏆" },
        { path: "/admin/faculty", label: "Faculty", icon: "👨‍🏫" },
        { path: "/admin/users", label: "User Management", icon: "👤" },
        { path: "/admin/departments", label: "Departments", icon: "🏢" },
        { path: "/admin/assessments", label: "Assessments", icon: "📝" },
        { path: "/admin/reports", label: "Reports", icon: "📄" },
      ];
    }
    return [];
  };

  const navLinks = getNavLinks();

  return (
    <div className="dashboard-app-wrapper">
      {/* TOP LIGHT HEADER BAR */}
      <header className="app-top-header light-header">
        <div className="header-brand-container">
          {/* HAMBURGER 3-LINE MENU TOGGLE BUTTON */}
          <button
            className="header-sidebar-toggle-btn"
            onClick={() => setSidebarOpen((prev) => !prev)}
            title="Toggle Sidebar Menu"
            aria-label="Toggle Sidebar Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003896" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="brand-logo-box">
            <img
              src="/KVGCE_logo.png"
              alt="KVGCE Logo"
              className="app-header-logo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/40?text=KVG";
              }}
            />
          </div>
          <div className="brand-title-meta">
            <h1 className="brand-main-name">KVGCE-TAP</h1>
            <span className="brand-sub-tag">
              {role === "admin" ? "Admin Portal" : role === "faculty" ? "Faculty Portal" : "Student Dashboard"}
            </span>
          </div>
        </div>

        <div className="header-search-container">
          <div className="search-pill-box">
            <input
              type="text"
              className="search-pill-input"
              placeholder="Search anything..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button className="search-pill-btn" aria-label="Search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </div>
        </div>

        <div className="header-right-actions">
          {/* CLICKABLE RANKING BADGE LINK */}
          <div
            className="ranking-pill-badge clickable-ranking-badge"
            onClick={() => navigate("/student/rankings")}
            title="Click to view All College Student Rankings"
            style={{ cursor: "pointer" }}
          >
            <span className="ranking-num"># 1400</span>
            <span className="ranking-lbl">My Ranking</span>
          </div>

          {/* 1. Notification Bell Icon */}
          <button className="nav-action-icon-btn" title="Notifications" aria-label="Notifications">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span className="bell-active-dot"></span>
          </button>

          {/* 2. User Profile Icon */}
          <button
            className="nav-action-icon-btn"
            title={user?.full_name || "Profile"}
            aria-label="Profile"
            onClick={() => navigate("/student/profile")}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>
      </header>

      {/* MAIN BODY AREA (SIDEBAR + CONTENT) */}
      <div className="dashboard-content-layout">
        {/* LEFT WHITE SIDEBAR */}
        <aside className={`dashboard-left-sidebar ${sidebarOpen ? "open" : "closed"}`}>
          <nav className="sidebar-card-nav">
            {navLinks.map((item) => {
              const isActive =
                location.pathname === item.path ||
                (item.path === "/student/dashboard" && location.pathname === "/student");

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-nav-card-item ${isActive ? "active" : ""}`}
                  onClick={() => {
                    if (window.innerWidth <= 992) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <span className="card-item-icon">{item.icon}</span>
                  <span className="card-item-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* SIDEBAR BOTTOM EXIT BUTTON */}
          <div className="sidebar-footer">
            <button className="sidebar-exit-btn" onClick={handleLogout} title="Exit Platform">
              <span className="exit-btn-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </span>
              <span className="exit-btn-label">Exit</span>
            </button>
          </div>

          {/* SIDEBAR BOTTOM WAVY GRAPHIC */}
          <div className="sidebar-bottom-wave">
            <svg viewBox="0 0 280 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0 40C40 20 80 60 140 30C200 0 240 50 280 30V120H0V40Z"
                fill="url(#waveGrad)"
                fillOpacity="0.4"
              />
              <defs>
                <linearGradient id="waveGrad" x1="0" y1="0" x2="280" y2="120">
                  <stop offset="0%" stopColor="#dbeafe" />
                  <stop offset="100%" stopColor="#eff6ff" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </aside>

        {/* OVERLAY FOR MOBILE */}
        {sidebarOpen && (
          <div className="mobile-sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
        )}

        {/* PAGE CONTENT CONTAINER */}
        <main className="dashboard-main-view">{children}</main>
      </div>
    </div>
  );
};

export default DashboardLayout;

