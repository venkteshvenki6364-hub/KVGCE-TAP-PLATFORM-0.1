import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import SingleStudentOverview from "../../components/SingleStudentOverview";
import AdminFacultyView from "../../components/admin/AdminFacultyView";
import QuizQuestionBuilder from "../../components/quiz/QuizQuestionBuilder";
import api from "../../services/api";
import "./AdminHomePage.css";

// Mock Sample Student Data for Comprehensive Analytics & Individual Lookup
const ALL_STUDENTS_DATA = [
  {
    usn: "4KV21CS018",
    name: "Karthik M",
    dept: "CSE",
    year: "4th Year",
    semester: "7th Sem",
    skillScore: 94.2,
    cgpa: 9.4,
    placementStatus: "Ready",
    academics: 92,
    aptitude: 96,
    technical: 95,
    coding: 94,
    hrComm: 90,
    riskScore: 5,
    riskReasons: [],
    recentTests: [
      { name: "Advanced Java & Data Structures", score: "96%", date: "14 Aug 2026" },
      { name: "Aptitude Mock Speed Test", score: "94%", date: "10 Aug 2026" },
    ]
  },
  {
    usn: "4KV21CS042",
    name: "Sahana P",
    dept: "CSE",
    year: "4th Year",
    semester: "7th Sem",
    skillScore: 92.1,
    cgpa: 9.2,
    placementStatus: "Ready",
    academics: 90,
    aptitude: 94,
    technical: 92,
    coding: 90,
    hrComm: 94,
    riskScore: 8,
    riskReasons: [],
    recentTests: [
      { name: "Full Stack React & Node Quiz", score: "95%", date: "13 Aug 2026" },
      { name: "Verbal & Communication Assessment", score: "92%", date: "09 Aug 2026" },
    ]
  },
  {
    usn: "4KV21EC027",
    name: "Likith R",
    dept: "ECE",
    year: "3rd Year",
    semester: "5th Sem",
    skillScore: 91.3,
    cgpa: 8.9,
    placementStatus: "Ready",
    academics: 88,
    aptitude: 92,
    technical: 94,
    coding: 89,
    hrComm: 86,
    riskScore: 10,
    riskReasons: [],
    recentTests: [
      { name: "Embedded Systems & IoT Quiz", score: "93%", date: "12 Aug 2026" },
    ]
  },
  {
    usn: "4KV21IS033",
    name: "Ananya B",
    dept: "ISE",
    year: "4th Year",
    semester: "7th Sem",
    skillScore: 90.7,
    cgpa: 8.8,
    placementStatus: "Ready",
    academics: 89,
    aptitude: 90,
    technical: 91,
    coding: 90,
    hrComm: 92,
    riskScore: 12,
    riskReasons: [],
    recentTests: [
      { name: "DBMS & SQL Query Optimization", score: "91%", date: "11 Aug 2026" },
    ]
  },
  {
    usn: "4KV21ME021",
    name: "Vivek S",
    dept: "ME",
    year: "3rd Year",
    semester: "5th Sem",
    skillScore: 89.6,
    cgpa: 8.7,
    placementStatus: "Ready",
    academics: 87,
    aptitude: 88,
    technical: 92,
    coding: 85,
    hrComm: 86,
    riskScore: 15,
    riskReasons: [],
    recentTests: [
      { name: "CAD Modelling & Mechanical Design", score: "90%", date: "08 Aug 2026" },
    ]
  },
  // At Risk Students
  {
    usn: "4KV21CS110",
    name: "Rohith K",
    dept: "CSE",
    year: "3rd Year",
    semester: "5th Sem",
    skillScore: 52.4,
    cgpa: 6.4,
    placementStatus: "Needs Improvement",
    academics: 65,
    aptitude: 50,
    technical: 48,
    coding: 45,
    hrComm: 55,
    riskScore: 82,
    riskReasons: ["Low quiz participation", "Coding lab submission speed below threshold"],
    recentTests: [
      { name: "Algorithms Basics", score: "48%", date: "05 Aug 2026" },
    ]
  },
  {
    usn: "4KV21EC056",
    name: "Prajwal B",
    dept: "ECE",
    year: "2nd Year",
    semester: "3rd Sem",
    skillScore: 56.1,
    cgpa: 6.8,
    placementStatus: "Needs Improvement",
    academics: 68,
    aptitude: 45,
    technical: 55,
    coding: 50,
    hrComm: 60,
    riskScore: 78,
    riskReasons: ["Poor aptitude test scores", "Missed 3 mock assessments"],
    recentTests: [
      { name: "Digital Signal Processing", score: "52%", date: "04 Aug 2026" },
    ]
  },
  {
    usn: "4KV21ME045",
    name: "Nikhil M",
    dept: "ME",
    year: "4th Year",
    semester: "7th Sem",
    skillScore: 58.0,
    cgpa: 6.2,
    placementStatus: "Needs Improvement",
    academics: 60,
    aptitude: 58,
    technical: 55,
    coding: 52,
    hrComm: 62,
    riskScore: 75,
    riskReasons: ["Attendance < 65%", "Incomplete mini-project documentation"],
    recentTests: [
      { name: "Thermodynamics Quiz", score: "54%", date: "02 Aug 2026" },
    ]
  },
  {
    usn: "4KV21CS128",
    name: "Arjun U",
    dept: "CSE",
    year: "3rd Year",
    semester: "5th Sem",
    skillScore: 61.2,
    cgpa: 7.0,
    placementStatus: "Developing",
    academics: 70,
    aptitude: 62,
    technical: 58,
    coding: 55,
    hrComm: 60,
    riskScore: 72,
    riskReasons: ["Failed 2 technical quizzes", "Needs coding practice acceleration"],
    recentTests: [
      { name: "Python Core Assessment", score: "58%", date: "01 Aug 2026" },
    ]
  },
  {
    usn: "4KV21IS059",
    name: "Deepika N",
    dept: "ISE",
    year: "2nd Year",
    semester: "3rd Sem",
    skillScore: 63.5,
    cgpa: 7.1,
    placementStatus: "Developing",
    academics: 72,
    aptitude: 65,
    technical: 60,
    coding: 58,
    hrComm: 62,
    riskScore: 70,
    riskReasons: ["Delayed project submissions", "Low practice frequency"],
    recentTests: [
      { name: "Computer Networks Basics", score: "62%", date: "30 Jul 2026" },
    ]
  }
];

function AdminHomePage() {
  const location = useLocation();
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window !== "undefined" && window.location.pathname.includes("/faculty")) {
      return "faculty";
    }
    return "pending";
  }); // pending | analysis | faculty | users | departments | quizBuilder | analytics

  // Filter Modes: "all" | "class" | "single"
  const [filterMode, setFilterMode] = useState("all");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedStudentUSN, setSelectedStudentUSN] = useState("4KV21CS018");
  const [dateRange, setDateRange] = useState("01 Feb 2026 - 14 Aug 2026");

  // User Management modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const [newUser, setNewUser] = useState({
    email: "",
    full_name: "",
    password: "Password123!",
    role: "student",
    department: "Computer Science & Engineering",
    student_id: "",
    faculty_id: "",
    phone: "",
    dob: "",
  });

  const fetchAdminData = async () => {
    try {
      const [dashRes, usersRes, pendingRes] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/users"),
        api.get("/admin/pending-users").catch(() => ({ data: { data: [] } })),
      ]);
      if (dashRes.data && dashRes.data.data) {
        setData(dashRes.data.data);
      }
      if (usersRes.data && usersRes.data.data) {
        setUsers(usersRes.data.data);
      }
      if (pendingRes.data && pendingRes.data.data) {
        setPendingUsers(pendingRes.data.data);
      }
    } catch (err) {
      console.error("Error loading admin dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApproveUser = async (email, name, role) => {
    try {
      const res = await api.post(`/admin/users/${encodeURIComponent(email)}/approve`);
      if (res.data && res.data.success) {
        setMsg(`✅ Approved ${name} (${role?.toUpperCase()})! User is now active and added to database.`);
        fetchAdminData();
      }
    } catch (err) {
      console.error("Approval failed:", err);
      alert(err.response?.data?.detail || "Could not approve user.");
    }
  };

  const handleRejectUser = async (email, name) => {
    if (!window.confirm(`Are you sure you want to reject the registration request for ${name} (${email})?`)) return;
    try {
      const res = await api.post(`/admin/users/${encodeURIComponent(email)}/reject`);
      if (res.data && res.data.success) {
        setMsg(`❌ Registration for ${name} rejected.`);
        fetchAdminData();
      }
    } catch (err) {
      console.error("Rejection failed:", err);
      alert(err.response?.data?.detail || "Could not reject user.");
    }
  };

  const handleToggleStatus = async (email) => {
    try {
      const res = await api.put(`/admin/users/${email}/toggle-status`);
      if (res.data && res.data.success) {
        setMsg(`User status updated!`);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (email) => {
    if (!window.confirm(`Are you sure you want to delete user ${email}?`)) return;
    try {
      const res = await api.delete(`/admin/users/${email}`);
      if (res.data && res.data.success) {
        setMsg(`User ${email} deleted.`);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Could not delete user.");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg("");
    try {
      const res = await api.post("/admin/users", newUser);
      if (res.data && res.data.success) {
        setMsg(`User ${newUser.email} (${newUser.role}) created!`);
        setShowUserModal(false);
        setNewUser({
          email: "",
          full_name: "",
          password: "Password123!",
          role: "student",
          department: "Computer Science & Engineering",
          student_id: "",
          faculty_id: "",
          phone: "",
        });
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  // Dynamic Metrics Filter Engine
  const getFilteredData = () => {
    let filtered = [...ALL_STUDENTS_DATA];

    if (filterMode === "class") {
      if (selectedDept !== "all") {
        filtered = filtered.filter((s) => s.dept === selectedDept);
      }
      if (selectedYear !== "all") {
        filtered = filtered.filter((s) => s.year === selectedYear);
      }
    } else if (filterMode === "single") {
      const singleStudent = ALL_STUDENTS_DATA.find((s) => s.usn === selectedStudentUSN);
      if (singleStudent) {
        return {
          isSingle: true,
          student: singleStudent,
          overallScore: singleStudent.skillScore,
          categoryScores: {
            academics: singleStudent.academics,
            aptitude: singleStudent.aptitude,
            technical: singleStudent.technical,
            coding: singleStudent.coding,
            hrComm: singleStudent.hrComm,
            overall: singleStudent.skillScore,
          },
          totalCount: 1,
          activeCount: 1,
          avgSkillScore: singleStudent.skillScore,
          placementReadyPercent: singleStudent.placementStatus === "Ready" ? 100 : singleStudent.placementStatus === "Developing" ? 65 : 40,
          atRiskCount: singleStudent.riskScore > 60 ? 1 : 0,
          testsCompleted: singleStudent.recentTests.length * 15 + 8,
          deptScores: [
            { dept: singleStudent.dept, score: singleStudent.skillScore },
          ],
        };
      }
    }

    const count = filtered.length || 1;
    const avgSkill = (filtered.reduce((acc, curr) => acc + curr.skillScore, 0) / count).toFixed(1);
    const avgAcademics = Math.round(filtered.reduce((acc, curr) => acc + curr.academics, 0) / count);
    const avgAptitude = Math.round(filtered.reduce((acc, curr) => acc + curr.aptitude, 0) / count);
    const avgTechnical = Math.round(filtered.reduce((acc, curr) => acc + curr.technical, 0) / count);
    const avgCoding = Math.round(filtered.reduce((acc, curr) => acc + curr.coding, 0) / count);
    const avgHrComm = Math.round(filtered.reduce((acc, curr) => acc + curr.hrComm, 0) / count);

    return {
      isSingle: false,
      overallScore: avgSkill,
      categoryScores: {
        academics: avgAcademics || 78,
        aptitude: avgAptitude || 85,
        technical: avgTechnical || 80,
        coding: avgCoding || 75,
        hrComm: avgHrComm || 70,
        overall: parseFloat(avgSkill) || 82.5,
      },
      totalCount: filterMode === "all" ? 1248 : count * 150,
      activeCount: filterMode === "all" ? 1182 : Math.round(count * 140),
      avgSkillScore: avgSkill,
      placementReadyPercent: 78,
      atRiskCount: filterMode === "all" ? 128 : Math.round(count * 12),
      testsCompleted: filterMode === "all" ? 2856 : count * 320,
      deptScores: [
        { dept: "CSE", score: 84.6 },
        { dept: "ECE", score: 79.3 },
        { dept: "ME", score: 72.5 },
        { dept: "CV", score: 75.8 },
        { dept: "ISE", score: 81.2 },
        { dept: "Other", score: 68.4 },
      ],
    };
  };

  const analyticsData = getFilteredData();
  const currentSingleStudent = ALL_STUDENTS_DATA.find((s) => s.usn === selectedStudentUSN) || ALL_STUDENTS_DATA[0];

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="admin-page-container">
        {msg && <div className="admin-alert">✅ {msg}</div>}

        {/* 1. TOP WELCOME BACK HERO BANNER */}
        <div className="admin-welcome-hero">
          <div className="hero-left-profile">
            <div className="hero-avatar-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="hero-text-meta">
              <h2 className="hero-title">Welcome back, Admin! 🎓</h2>
              <p className="hero-subtitle">
                Comprehensive skill tracking, branch data analytics, and performance monitor
              </p>
            </div>
          </div>

          <div className="hero-right-score-badge">
            <span className="hero-score-num">{analyticsData.overallScore}%</span>
            <span className="hero-score-label">Overall Skill Score</span>
          </div>
        </div>

        {/* 2. TOP COUNTER METRIC CARDS ROW */}
        <div className="top-banner-stats-row">
          <div className="navy-stat-card">
            <span className="navy-stat-val">2,500+</span>
            <span className="navy-stat-lbl">ACTIVE ENGINEERING STUDENTS</span>
          </div>
          <div className="navy-stat-card">
            <span className="navy-stat-val">150+</span>
            <span className="navy-stat-lbl">VERIFIED FACULTY MENTORS</span>
          </div>
          <div className="navy-stat-card">
            <span className="navy-stat-val">500+</span>
            <span className="navy-stat-lbl">PRACTICE TESTS & CODE LABS</span>
          </div>
          <div className="navy-stat-card">
            <span className="navy-stat-val">98%</span>
            <span className="navy-stat-lbl">PLACEMENT CAREER READINESS</span>
          </div>
        </div>

        {/* 3. MAIN TAB NAVIGATION BAR */}
        <div className="admin-main-tabs-bar">
          <button
            className={`admin-nav-tab ${activeTab === "pending" ? "active" : ""}`}
            onClick={() => setActiveTab("pending")}
          >
            ⏳ Pending Verification ({pendingUsers.length})
          </button>
          <button
            className={`admin-nav-tab ${activeTab === "analysis" ? "active" : ""}`}
            onClick={() => setActiveTab("analysis")}
          >
            📊 Overall Analysis
          </button>
          <button
            className={`admin-nav-tab ${activeTab === "faculty" ? "active" : ""}`}
            onClick={() => setActiveTab("faculty")}
          >
            👨‍🏫 Faculties
          </button>
          <button
            className={`admin-nav-tab ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            👤 User Management
          </button>
          <button
            className={`admin-nav-tab ${activeTab === "departments" ? "active" : ""}`}
            onClick={() => setActiveTab("departments")}
          >
            🏢 Departments
          </button>
          <button
            className={`admin-nav-tab ${activeTab === "quizBuilder" ? "active" : ""}`}
            onClick={() => setActiveTab("quizBuilder")}
          >
            📝 Quiz & Question Builder
          </button>
          <button
            className={`admin-nav-tab ${activeTab === "analytics" ? "active" : ""}`}
            onClick={() => setActiveTab("analytics")}
          >
            📈 System Health
          </button>
        </div>

        {/* TAB: QUIZ BUILDER */}
        {activeTab === "quizBuilder" && (
          <div style={{ marginTop: "1rem" }}>
            <QuizQuestionBuilder quizTitle="Aptitude & Technical Quiz Editor" onBack={() => setActiveTab("analysis")} />
          </div>
        )}

        {/* TAB 0: FACULTIES VIEW */}
        {activeTab === "faculty" && <AdminFacultyView />}

        {/* TAB 1: OVERALL DATA ANALYSIS & SKILL TRACKING */}
        {activeTab === "analysis" && (
          <div className="analysis-dashboard-section">
            {/* FILTER TOOLBAR CARD */}
            <div className="dashboard-filter-card">
              <div className="filter-card-header">
                <div>
                  <h3 className="filter-section-title">Dashboard Overview</h3>
                  <p className="filter-section-sub">
                    Real-time overview of all students' performance, skill tracking, and activities
                  </p>
                </div>

                <div className="date-picker-box">
                  <span className="calendar-icon">📅</span>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="date-select-dropdown"
                  >
                    <option value="01 Feb 2026 - 14 Aug 2026">01 Feb 2026 - 14 Aug 2026</option>
                    <option value="01 Jan 2026 - 31 Jul 2026">01 Jan 2026 - 31 Jul 2026</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                  </select>
                </div>
              </div>

              {/* INTERACTIVE SKILL ANALYSIS FILTER CONTROLS */}
              <div className="filter-controls-row">
                <div className="filter-group">
                  <label className="filter-label">Analytics Scope Mode:</label>
                  <div className="filter-tabs-pills">
                    <button
                      className={`pill-btn ${filterMode === "all" ? "active" : ""}`}
                      onClick={() => setFilterMode("all")}
                    >
                      All Students
                    </button>
                    <button
                      className={`pill-btn ${filterMode === "class" ? "active" : ""}`}
                      onClick={() => setFilterMode("class")}
                    >
                      Filter by Class / Branch / Year
                    </button>
                    <button
                      className={`pill-btn ${filterMode === "single" ? "active" : ""}`}
                      onClick={() => setFilterMode("single")}
                    >
                      Single Student Lookup
                    </button>
                  </div>
                </div>

                {/* CONDITIONAL CONTROLS: CLASS / BRANCH / YEAR */}
                {filterMode === "class" && (
                  <div className="sub-filter-row">
                    <div className="filter-select-item">
                      <label className="sub-lbl">Department / Branch:</label>
                      <select
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="filter-dropdown-select"
                      >
                        <option value="all">All Departments</option>
                        <option value="CSE">Computer Science (CSE)</option>
                        <option value="ECE">Electronics (ECE)</option>
                        <option value="ME">Mechanical (ME)</option>
                        <option value="ISE">Information Science (ISE)</option>
                        <option value="CV">Civil Engineering (CV)</option>
                      </select>
                    </div>

                    <div className="filter-select-item">
                      <label className="sub-lbl">Academic Year:</label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="filter-dropdown-select"
                      >
                        <option value="all">All Years</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* CONDITIONAL CONTROLS: SINGLE STUDENT LOOKUP */}
                {filterMode === "single" && (
                  <div className="single-student-search-box">
                    <label className="sub-lbl">Select Student USN or Name:</label>
                    <select
                      value={selectedStudentUSN}
                      onChange={(e) => setSelectedStudentUSN(e.target.value)}
                      className="student-picker-select"
                    >
                      {ALL_STUDENTS_DATA.map((s) => (
                        <option key={s.usn} value={s.usn}>
                          {s.usn} - {s.name} ({s.dept}, {s.year})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {filterMode === "single" ? (
              <div style={{ marginTop: "1rem" }}>
                <SingleStudentOverview defaultUsn={selectedStudentUSN} userRole="admin" />
              </div>
            ) : (
              <>

            {/* 4. 6 KPI MINI METRICS CARDS */}
            <div className="kpi-mini-grid">
              {/* Card 1 */}
              <div className="kpi-mini-card">
                <div className="kpi-icon-box bg-blue-light">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <span className="kpi-lbl">Total Students</span>
                  <strong className="kpi-val">{analyticsData.totalCount.toLocaleString()}</strong>
                  <span className="kpi-trend trend-green">↑ 5.2% from last month</span>
                </div>
              </div>

              {/* Card 2 */}
              <div className="kpi-mini-card">
                <div className="kpi-icon-box bg-green-light">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <span className="kpi-lbl">Active Students</span>
                  <strong className="kpi-val">{analyticsData.activeCount.toLocaleString()}</strong>
                  <span className="kpi-sub-note">94.7% of total students</span>
                </div>
              </div>

              {/* Card 3 */}
              <div className="kpi-mini-card">
                <div className="kpi-icon-box bg-orange-light">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ea580c" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <span className="kpi-lbl">Average Skill Score</span>
                  <strong className="kpi-val">{analyticsData.avgSkillScore}%</strong>
                  <span className="kpi-trend trend-green">↑ 4.6% from last month</span>
                </div>
              </div>

              {/* Card 4 */}
              <div className="kpi-mini-card">
                <div className="kpi-icon-box bg-purple-light">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9333ea" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <circle cx="12" cy="12" r="6" />
                    <circle cx="12" cy="12" r="2" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <span className="kpi-lbl">Placement Readiness</span>
                  <strong className="kpi-val">{analyticsData.placementReadyPercent}%</strong>
                  <span className="kpi-trend trend-green">↑ 6.1% from last month</span>
                </div>
              </div>

              {/* Card 5 */}
              <div className="kpi-mini-card">
                <div className="kpi-icon-box bg-red-light">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <span className="kpi-lbl">At-Risk Students</span>
                  <strong className="kpi-val">{analyticsData.atRiskCount}</strong>
                  <span className="kpi-trend trend-red">↓ 3.3% from last month</span>
                </div>
              </div>

              {/* Card 6 */}
              <div className="kpi-mini-card">
                <div className="kpi-icon-box bg-cyan-light">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0891b2" strokeWidth="2">
                    <polyline points="9 11 12 14 22 4" />
                    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                  </svg>
                </div>
                <div className="kpi-content">
                  <span className="kpi-lbl">Tests Completed</span>
                  <strong className="kpi-val">{analyticsData.testsCompleted.toLocaleString()}</strong>
                  <span className="kpi-trend trend-green">↑ 7.8% from last month</span>
                </div>
              </div>
            </div>

            {/* SINGLE STUDENT DETAILED ANALYSIS HERO (IF SINGLE STUDENT MODE ACTIVE) */}
            {filterMode === "single" && currentSingleStudent && (
              <div className="single-student-deepdive-card">
                <div className="student-profile-header-meta">
                  <div className="student-avatar-frame">
                    <span className="avatar-initials">{currentSingleStudent.name.charAt(0)}</span>
                  </div>
                  <div className="student-meta-details">
                    <h3 className="student-full-name">{currentSingleStudent.name}</h3>
                    <div className="student-tags">
                      <span className="usn-tag">{currentSingleStudent.usn}</span>
                      <span className="dept-tag">{currentSingleStudent.dept}</span>
                      <span className="sem-tag">{currentSingleStudent.year} • {currentSingleStudent.semester}</span>
                      <span className="cgpa-tag">CGPA: {currentSingleStudent.cgpa}</span>
                    </div>
                  </div>
                  <div className="student-overall-score-badge">
                    <span className="score-val">{currentSingleStudent.skillScore}%</span>
                    <span className="score-lbl">Skill Mastery Score</span>
                  </div>
                </div>

                <div className="student-skills-breakdown-row">
                  <div className="sub-skill-box">
                    <span className="lbl">Academics</span>
                    <strong className="val">{currentSingleStudent.academics}%</strong>
                    <div className="mini-track"><div className="mini-fill blue" style={{ width: `${currentSingleStudent.academics}%` }}></div></div>
                  </div>
                  <div className="sub-skill-box">
                    <span className="lbl">Aptitude</span>
                    <strong className="val">{currentSingleStudent.aptitude}%</strong>
                    <div className="mini-track"><div className="mini-fill green" style={{ width: `${currentSingleStudent.aptitude}%` }}></div></div>
                  </div>
                  <div className="sub-skill-box">
                    <span className="lbl">Technical</span>
                    <strong className="val">{currentSingleStudent.technical}%</strong>
                    <div className="mini-track"><div className="mini-fill yellow" style={{ width: `${currentSingleStudent.technical}%` }}></div></div>
                  </div>
                  <div className="sub-skill-box">
                    <span className="lbl">Coding Lab</span>
                    <strong className="val">{currentSingleStudent.coding}%</strong>
                    <div className="mini-track"><div className="mini-fill purple" style={{ width: `${currentSingleStudent.coding}%` }}></div></div>
                  </div>
                  <div className="sub-skill-box">
                    <span className="lbl">HR & Comm</span>
                    <strong className="val">{currentSingleStudent.hrComm}%</strong>
                    <div className="mini-track"><div className="mini-fill teal" style={{ width: `${currentSingleStudent.hrComm}%` }}></div></div>
                  </div>
                </div>
              </div>
            )}

            {/* 5. ANALYTICS CHARTS SECTION (3-CARD GRID) */}
            <div className="analytics-charts-grid">
              {/* CHART CARD 1: OVERALL PERFORMANCE BY CATEGORY */}
              <div className="chart-card">
                <div className="chart-header">
                  <h4 className="chart-title">Overall Performance by Category</h4>
                  <select className="mini-select">
                    <option>All Students</option>
                    <option>Top 10%</option>
                  </select>
                </div>

                <div className="vertical-bars-container">
                  <div className="bar-column">
                    <span className="bar-val-top">{analyticsData.categoryScores.academics}%</span>
                    <div className="bar-track">
                      <div className="bar-fill blue-fill" style={{ height: `${analyticsData.categoryScores.academics}%` }}></div>
                    </div>
                    <span className="bar-label">Academics</span>
                  </div>

                  <div className="bar-column">
                    <span className="bar-val-top">{analyticsData.categoryScores.aptitude}%</span>
                    <div className="bar-track">
                      <div className="bar-fill green-fill" style={{ height: `${analyticsData.categoryScores.aptitude}%` }}></div>
                    </div>
                    <span className="bar-label">Aptitude</span>
                  </div>

                  <div className="bar-column">
                    <span className="bar-val-top">{analyticsData.categoryScores.technical}%</span>
                    <div className="bar-track">
                      <div className="bar-fill yellow-fill" style={{ height: `${analyticsData.categoryScores.technical}%` }}></div>
                    </div>
                    <span className="bar-label">Technical</span>
                  </div>

                  <div className="bar-column">
                    <span className="bar-val-top">{analyticsData.categoryScores.coding}%</span>
                    <div className="bar-track">
                      <div className="bar-fill cyan-fill" style={{ height: `${analyticsData.categoryScores.coding}%` }}></div>
                    </div>
                    <span className="bar-label">Coding</span>
                  </div>

                  <div className="bar-column">
                    <span className="bar-val-top">{analyticsData.categoryScores.hrComm}%</span>
                    <div className="bar-track">
                      <div className="bar-fill purple-fill" style={{ height: `${analyticsData.categoryScores.hrComm}%` }}></div>
                    </div>
                    <span className="bar-label">HR / Comm.</span>
                  </div>

                  <div className="bar-column">
                    <span className="bar-val-top">{analyticsData.categoryScores.overall}%</span>
                    <div className="bar-track">
                      <div className="bar-fill teal-fill" style={{ height: `${analyticsData.categoryScores.overall}%` }}></div>
                    </div>
                    <span className="bar-label font-bold">Overall</span>
                  </div>
                </div>
              </div>

              {/* CHART CARD 2: DEPARTMENT WISE AVERAGE SKILL SCORE */}
              <div className="chart-card">
                <div className="chart-header">
                  <h4 className="chart-title">Department Wise Average Skill Score</h4>
                  <select className="mini-select">
                    <option>All Students</option>
                  </select>
                </div>

                <div className="horizontal-bars-container">
                  {analyticsData.deptScores.map((deptItem) => (
                    <div key={deptItem.dept} className="hbar-row">
                      <span className="hbar-name">{deptItem.dept}</span>
                      <div className="hbar-track">
                        <div className="hbar-fill blue-fill" style={{ width: `${deptItem.score}%` }}></div>
                      </div>
                      <span className="hbar-val">{deptItem.score}%</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CHART CARD 3: SKILL SCORE DISTRIBUTION (DONUT CHART) */}
              <div className="chart-card">
                <div className="chart-header">
                  <h4 className="chart-title">Skill Score Distribution</h4>
                </div>

                <div className="donut-chart-flex">
                  <div className="donut-svg-wrapper">
                    <svg className="distribution-donut" viewBox="0 0 100 100">
                      {/* Donut segments */}
                      <circle cx="50" cy="50" r="38" stroke="#e2e8f0" strokeWidth="12" fill="none" />
                      <circle cx="50" cy="50" r="38" stroke="#22c55e" strokeWidth="12" fill="none" strokeDasharray="43 195" strokeDashoffset="0" />
                      <circle cx="50" cy="50" r="38" stroke="#2563eb" strokeWidth="12" fill="none" strokeDasharray="74 164" strokeDashoffset="-43" />
                      <circle cx="50" cy="50" r="38" stroke="#eab308" strokeWidth="12" fill="none" strokeDasharray="45 193" strokeDashoffset="-117" />
                      <circle cx="50" cy="50" r="38" stroke="#a855f7" strokeWidth="12" fill="none" strokeDasharray="50 188" strokeDashoffset="-162" />
                      <circle cx="50" cy="50" r="38" stroke="#ef4444" strokeWidth="12" fill="none" strokeDasharray="19 219" strokeDashoffset="-212" />
                    </svg>
                    <div className="donut-center-meta">
                      <strong className="center-num">{analyticsData.totalCount}</strong>
                      <span className="center-lbl">Students</span>
                    </div>
                  </div>

                  <div className="distribution-legend">
                    <div className="legend-item">
                      <span className="legend-dot bg-green"></span>
                      <span className="legend-text">90% and above</span>
                      <strong className="legend-val">221 (18%)</strong>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot bg-blue"></span>
                      <span className="legend-text">75% - 90%</span>
                      <strong className="legend-val">381 (31%)</strong>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot bg-yellow"></span>
                      <span className="legend-text">60% - 75%</span>
                      <strong className="legend-val">242 (19%)</strong>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot bg-purple"></span>
                      <span className="legend-text">40% - 60%</span>
                      <strong className="legend-val">261 (21%)</strong>
                    </div>
                    <div className="legend-item">
                      <span className="legend-dot bg-red"></span>
                      <span className="legend-text">Below 40%</span>
                      <strong className="legend-val">95 (8%)</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 6. TABLES ROW (TOP PERFORMERS & AT-RISK STUDENTS) */}
            <div className="tables-two-column-grid">
              {/* TABLE 1: TOP PERFORMERS */}
              <div className="table-card">
                <div className="table-card-header">
                  <h4 className="table-card-title">Top Performers</h4>
                  <button className="view-all-btn">View All</button>
                </div>

                <table className="analysis-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Student</th>
                      <th>USN</th>
                      <th>Department</th>
                      <th>Skill Score</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ALL_STUDENTS_DATA.slice(0, 5).map((s, idx) => (
                      <tr key={s.usn}>
                        <td>
                          <span className={`rank-badge rank-${idx + 1}`}>{idx + 1}</span>
                        </td>
                        <td className="font-semibold">{s.name}</td>
                        <td className="font-mono text-muted">{s.usn}</td>
                        <td>{s.dept}</td>
                        <td>
                          <strong className="score-blue">{s.skillScore}%</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TABLE 2: AT-RISK STUDENTS */}
              <div className="table-card">
                <div className="table-card-header">
                  <h4 className="table-card-title">At-Risk Students</h4>
                  <button className="view-all-btn">View All</button>
                </div>

                <table className="analysis-table">
                  <thead>
                    <tr>
                      <th>Student</th>
                      <th>USN</th>
                      <th>Risk Score</th>
                      <th>Reasons</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ALL_STUDENTS_DATA.filter((s) => s.riskScore > 60).map((s) => (
                      <tr key={s.usn}>
                        <td className="font-semibold">{s.name}</td>
                        <td className="font-mono text-muted">{s.usn}</td>
                        <td>
                          <span className="risk-score-badge">{s.riskScore}%</span>
                        </td>
                        <td>
                          <div className="risk-dots-row" title={s.riskReasons.join(", ") || "Low Participation"}>
                            <span className="orange-dot"></span>
                            <span className="orange-dot"></span>
                            <span className="orange-dot"></span>
                            <span className="gray-dot"></span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 7. BOTTOM ROW (RECENT ACTIVITY & PLACEMENT READINESS OVERVIEW) */}
            <div className="bottom-two-column-grid">
              {/* CARD 1: RECENT ACTIVITY */}
              <div className="table-card">
                <div className="table-card-header">
                  <h4 className="table-card-title">Recent Activity</h4>
                  <button className="view-all-btn">View All</button>
                </div>

                <div className="activity-list-feed">
                  <div className="activity-feed-item">
                    <div className="act-icon-bg icon-green">📝</div>
                    <div className="act-content">
                      <strong className="act-title">Aptitude Test conducted for 5th Sem CSE</strong>
                    </div>
                    <span className="act-time">14 Aug 2026, 10:30 AM</span>
                  </div>

                  <div className="activity-feed-item">
                    <div className="act-icon-bg icon-blue">💻</div>
                    <div className="act-content">
                      <strong className="act-title">Technical Quiz conducted for ECE Department</strong>
                    </div>
                    <span className="act-time">14 Aug 2026, 09:15 AM</span>
                  </div>

                  <div className="activity-feed-item">
                    <div className="act-icon-bg icon-purple">🎓</div>
                    <div className="act-content">
                      <strong className="act-title">New student batch added (2026-27)</strong>
                    </div>
                    <span className="act-time">13 Aug 2026, 04:45 PM</span>
                  </div>

                  <div className="activity-feed-item">
                    <div className="act-icon-bg icon-orange">⚡</div>
                    <div className="act-content">
                      <strong className="act-title">Coding Contest - Weekly Challenge</strong>
                    </div>
                    <span className="act-time">13 Aug 2026, 02:20 PM</span>
                  </div>
                </div>
              </div>

              {/* CARD 2: PLACEMENT READINESS OVERVIEW */}
              <div className="table-card">
                <div className="table-card-header">
                  <h4 className="table-card-title">Placement Readiness Overview</h4>
                  <select className="mini-select">
                    <option>All Students</option>
                  </select>
                </div>

                <div className="placement-gauge-flex">
                  <div className="arc-gauge-wrapper">
                    <svg className="arc-gauge-svg" viewBox="0 0 100 60">
                      <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round" />
                      <path
                        d="M 10 50 A 40 40 0 0 1 90 50"
                        fill="none"
                        stroke="#22c55e"
                        strokeWidth="12"
                        strokeDasharray="125.6"
                        strokeDashoffset={125.6 - (125.6 * analyticsData.placementReadyPercent) / 100}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="arc-center-text">
                      <strong className="arc-score">{analyticsData.placementReadyPercent}%</strong>
                      <span className="arc-lbl">Placement Readiness</span>
                    </div>
                  </div>

                  <div className="placement-legend-list">
                    <div className="p-legend-item">
                      <span className="p-dot bg-green"></span>
                      <span className="p-lbl">Ready (80% and above)</span>
                      <strong className="p-val">324 (26%)</strong>
                    </div>
                    <div className="p-legend-item">
                      <span className="p-dot bg-blue"></span>
                      <span className="p-lbl">Developing (60% - 80%)</span>
                      <strong className="p-val">586 (47%)</strong>
                    </div>
                    <div className="p-legend-item">
                      <span className="p-dot bg-red"></span>
                      <span className="p-lbl">Needs Improvement (Below 60%)</span>
                      <strong className="p-val">338 (27%)</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </>
            )}
          </div>
        )}

        {/* TAB: PENDING APPROVALS */}
        {activeTab === "pending" && (
          <div className="admin-sec-card">
            <div className="sec-header">
              <div>
                <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#1e293b" }}>
                  ⏳ Registration Verification Requests ({pendingUsers.length})
                </h3>
                <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "0.875rem" }}>
                  Review new Student and Faculty sign-up requests. Approving a user activates their account and adds them to the active database.
                </p>
              </div>
              <button
                className="add-user-btn"
                style={{ background: "#2563eb" }}
                onClick={() => setShowUserModal(true)}
              >
                + Add Direct User (Student/Faculty)
              </button>
            </div>

            {pendingUsers.length === 0 ? (
              <div style={{ padding: "3rem 1.5rem", textAlign: "center", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1", marginTop: "1rem" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🎉</div>
                <h4 style={{ margin: "0 0 6px 0", color: "#1e293b", fontSize: "1.1rem" }}>No Pending Verification Requests</h4>
                <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                  All user sign-ups have been verified and added to the database. New registrations will appear here for Admin approval.
                </p>
              </div>
            ) : (
              <table className="admin-table" style={{ marginTop: "1rem" }}>
                <thead>
                  <tr>
                    <th>Registration Details</th>
                    <th>Requested Role</th>
                    <th>USN / Faculty ID</th>
                    <th>Department & Course</th>
                    <th>Contact & DOB</th>
                    <th>Verification Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingUsers.map((u) => (
                    <tr key={u._id || u.email}>
                      <td>
                        <strong style={{ color: "#0f172a", fontSize: "0.95rem" }}>{u.full_name}</strong>
                        <br />
                        <small style={{ color: "#64748b" }}>{u.email}</small>
                      </td>
                      <td>
                        <span className={`role-pill ${u.role}`} style={{ fontWeight: 600, padding: "4px 10px", borderRadius: "6px" }}>
                          {u.role?.toUpperCase() === "STUDENT" ? "🎓 STUDENT" : "👨‍🏫 FACULTY"}
                        </span>
                      </td>
                      <td>
                        <strong style={{ fontFamily: "monospace", fontSize: "0.9rem", color: "#1e293b" }}>
                          {u.student_id || u.faculty_id || "Pending ID"}
                        </strong>
                      </td>
                      <td>
                        <span>{u.department || "Engineering"}</span>
                        <br />
                        <small style={{ color: "#64748b" }}>{u.course || (u.role === "student" ? "B.E. CSE" : "Faculty Staff")}</small>
                      </td>
                      <td>
                        <small style={{ color: "#334155" }}>📞 {u.phone || "N/A"}</small>
                        <br />
                        <small style={{ color: "#64748b" }}>🎂 DOB: {u.dob || "N/A"}</small>
                      </td>
                      <td>
                        <div className="action-row" style={{ display: "flex", gap: "8px" }}>
                          <button
                            type="button"
                            onClick={() => handleApproveUser(u.email, u.full_name, u.role)}
                            style={{
                              background: "#16a34a",
                              color: "#fff",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontWeight: "600",
                              cursor: "pointer",
                              fontSize: "0.85rem",
                              boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                            }}
                          >
                            ✓ Approve & Add
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectUser(u.email, u.full_name)}
                            style={{
                              background: "#ef4444",
                              color: "#fff",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              fontWeight: "600",
                              cursor: "pointer",
                              fontSize: "0.85rem"
                            }}
                          >
                            ✕ Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {activeTab === "users" && (
          <div className="admin-sec-card">
            <div className="sec-header">
              <h3>All Database Accounts ({users.length})</h3>
              <button className="add-user-btn" onClick={() => setShowUserModal(true)}>
                + Add Direct User (Student/Faculty)
              </button>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Role</th>
                  <th>Department / ID</th>
                  <th>Account Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id || u.email}>
                    <td>
                      <strong>{u.full_name}</strong>
                      <br />
                      <small>{u.email}</small>
                    </td>
                    <td>
                      <span className={`role-pill ${u.role}`}>{u.role?.toUpperCase()}</span>
                    </td>
                    <td>
                      {u.department || "Computer Science"}
                      <br />
                      <small>{u.student_id || u.faculty_id || "N/A"}</small>
                    </td>
                    <td>
                      <span className={`status-pill ${u.status === "pending" || u.is_verified === false ? "inactive" : u.is_active !== false ? "active" : "inactive"}`}>
                        {u.status === "pending" || u.is_verified === false ? "⏳ Pending Admin Verification" : u.is_active !== false ? "🟢 Active & Verified" : "🔴 Deactivated"}
                      </span>
                    </td>
                    <td>
                      <div className="action-row">
                        {u.status === "pending" || u.is_verified === false ? (
                          <button
                            className="toggle-btn"
                            style={{ background: "#16a34a", color: "#fff" }}
                            onClick={() => handleApproveUser(u.email, u.full_name, u.role)}
                          >
                            Approve
                          </button>
                        ) : (
                          <button className="toggle-btn" onClick={() => handleToggleStatus(u.email)}>
                            {u.is_active !== false ? "Deactivate" : "Activate"}
                          </button>
                        )}
                        <button className="del-btn" onClick={() => handleDeleteUser(u.email)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* TAB 3: DEPARTMENTS */}
        {activeTab === "departments" && (
          <div className="admin-sec-card">
            <h3>KVGCE Engineering Departments</h3>
            <div className="dept-grid">
              {["Computer Science & Engineering", "Information Science & Engineering", "Electronics & Communication", "Mechanical Engineering", "Civil Engineering"].map((dept, i) => (
                <div key={i} className="dept-card">
                  <h4>{dept}</h4>
                  <p>HOD: Dr. K. V. Gururaja</p>
                  <span className="dept-code">CODE: {dept.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: SYSTEM HEALTH */}
        {activeTab === "analytics" && (
          <div className="admin-sec-card">
            <h3>System Performance & Infrastructure Status</h3>
            <div className="analytics-box">
              <p>🟢 <strong>FastAPI Backend Status:</strong> Healthy (Uptime: 99.9%)</p>
              <p>🗄️ <strong>Database Store:</strong> Motor / MongoDB Live Sync</p>
              <p>🔐 <strong>JWT Token Security:</strong> HS256 Encrypted</p>
            </div>
          </div>
        )}

        {/* ADD USER MODAL */}
        {showUserModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Create New User Account</h3>
                <button className="close-btn" onClick={() => setShowUserModal(false)}>×</button>
              </div>

              <form onSubmit={handleCreateUser} className="modal-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Department</label>
                    <select
                      value={newUser.department}
                      onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    >
                      <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                      <option value="Information Science & Engineering">Information Science & Engineering</option>
                      <option value="Electronics & Communication">Electronics & Communication</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Student USN / Faculty ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 4KV21CS099"
                    value={newUser.student_id}
                    onChange={(e) => setNewUser({ ...newUser, student_id: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Default Password</label>
                  <input
                    type="text"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowUserModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn" disabled={submitting}>
                    {submitting ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default AdminHomePage;
