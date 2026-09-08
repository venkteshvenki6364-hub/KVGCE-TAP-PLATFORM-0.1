import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SingleStudentOverview.css";

// Comprehensive mock database of students for lookup across Admin, Faculty, and Peers
export const ALL_STUDENTS_MOCK_DATA = [
  {
    usn: "4KV21CS042",
    name: "Venkatesh R",
    status: "Active",
    dept: "CSE - Computer Science Engineering",
    deptShort: "CSE",
    semester: "Semester 6 (Year 3)",
    section: "Section A",
    email: "venkatesh.r@example.com",
    phone: "+91 98765 43210",
    joined: "Aug 2021",
    cgpa: "7.33",
    skillScore: 82.5,
    skillRating: "Good",
    placementReadiness: 78,
    placementRating: "High",
    testsCompleted: 24,
    categories: {
      academics: 78,
      aptitude: 85,
      technical: 80,
      coding: 75,
      hrComm: 70,
      overall: 82.5,
    },
    strengths: [
      "Aptitude Skills",
      "Technical Knowledge",
      "Problem Solving",
      "Consistent Test Performance",
    ],
    areasToImprove: [
      "HR / Communication",
      "Coding Speed & Accuracy",
    ],
    recentActivities: [
      {
        id: 1,
        type: "aptitude",
        title: "Completed Aptitude Test",
        detail: "Score: 85%",
        date: "12 Aug 2026",
      },
      {
        id: 2,
        type: "coding",
        title: "Solved Coding Problem",
        detail: "Problem: Two Sum",
        date: "10 Aug 2026",
      },
      {
        id: 3,
        type: "quiz",
        title: "Attempted Technical Quiz",
        detail: "Score: 80%",
        date: "09 Aug 2026",
      },
    ],
  },
  {
    usn: "4KV21CS018",
    name: "Karthik M",
    status: "Active",
    dept: "CSE - Computer Science Engineering",
    deptShort: "CSE",
    semester: "Semester 7 (Year 4)",
    section: "Section A",
    email: "karthik.m@example.com",
    phone: "+91 98765 12345",
    joined: "Aug 2021",
    cgpa: "9.42",
    skillScore: 94.2,
    skillRating: "Excellent",
    placementReadiness: 95,
    placementRating: "Ready",
    testsCompleted: 36,
    categories: {
      academics: 92,
      aptitude: 96,
      technical: 95,
      coding: 94,
      hrComm: 90,
      overall: 94.2,
    },
    strengths: [
      "Advanced Data Structures",
      "Full Stack Development",
      "Aptitude & Reasoning",
      "Mock HR Performance",
    ],
    areasToImprove: [
      "System Design Architecture",
    ],
    recentActivities: [
      {
        id: 1,
        type: "quiz",
        title: "Completed Java & DS Quiz",
        detail: "Score: 96%",
        date: "14 Aug 2026",
      },
      {
        id: 2,
        type: "aptitude",
        title: "Aptitude Mock Speed Test",
        detail: "Score: 94%",
        date: "10 Aug 2026",
      },
    ],
  },
  {
    usn: "4KV21CS040",
    name: "Sahana P",
    status: "Active",
    dept: "CSE - Computer Science Engineering",
    deptShort: "CSE",
    semester: "Semester 7 (Year 4)",
    section: "Section B",
    email: "sahana.p@example.com",
    phone: "+91 98765 67890",
    joined: "Aug 2021",
    cgpa: "9.21",
    skillScore: 92.1,
    skillRating: "Excellent",
    placementReadiness: 92,
    placementRating: "Ready",
    testsCompleted: 31,
    categories: {
      academics: 90,
      aptitude: 94,
      technical: 92,
      coding: 90,
      hrComm: 94,
      overall: 92.1,
    },
    strengths: [
      "Verbal & HR Communication",
      "React & Frontend Skills",
      "Database Optimization",
    ],
    areasToImprove: [
      "Competitive Coding Speed",
    ],
    recentActivities: [
      {
        id: 1,
        type: "coding",
        title: "React & Node Project Submission",
        detail: "Score: 95%",
        date: "13 Aug 2026",
      },
    ],
  },
  {
    usn: "4KV21EC027",
    name: "Likith R",
    status: "Active",
    dept: "ECE - Electronics & Communication",
    deptShort: "ECE",
    semester: "Semester 5 (Year 3)",
    section: "Section A",
    email: "likith.r@example.com",
    phone: "+91 98765 54321",
    joined: "Aug 2022",
    cgpa: "8.90",
    skillScore: 88.5,
    skillRating: "Good",
    placementReadiness: 84,
    placementRating: "High",
    testsCompleted: 22,
    categories: {
      academics: 88,
      aptitude: 92,
      technical: 90,
      coding: 82,
      hrComm: 85,
      overall: 88.5,
    },
    strengths: [
      "Embedded Systems & IoT",
      "Analytical Aptitude",
      "Signal Processing",
    ],
    areasToImprove: [
      "Python Data Structures",
    ],
    recentActivities: [
      {
        id: 1,
        type: "quiz",
        title: "Embedded Systems Quiz",
        detail: "Score: 93%",
        date: "12 Aug 2026",
      },
    ],
  },
];

export default function SingleStudentOverview({ defaultUsn = "4KV21CS042", userRole = "admin" }) {
  const navigate = useNavigate();

  // Search & Filter state matching top toolbar in image
  const [searchUsn, setSearchUsn] = useState(defaultUsn);
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedSem, setSelectedSem] = useState("all");
  const [selectedSec, setSelectedSec] = useState("all");

  // Find active student object
  const currentStudent =
    ALL_STUDENTS_MOCK_DATA.find(
      (s) => s.usn.toLowerCase() === searchUsn.toLowerCase() || s.name.toLowerCase().includes(searchUsn.toLowerCase())
    ) || ALL_STUDENTS_MOCK_DATA[0];

  const cats = currentStudent.categories;

  const handleSearchSubmit = (e) => {
    e.preventDefault();
  };

  return (
    <div className="single-student-overview-container">
      {/* 1. TOP SEARCH & FILTER BAR */}
      <div className="top-filter-bar-card">
        <form onSubmit={handleSearchSubmit} className="top-filter-form">
          {/* USN Input / Dropdown */}
          <div className="filter-input-wrapper">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <select
              value={currentStudent.usn}
              onChange={(e) => setSearchUsn(e.target.value)}
              className="student-usn-select"
            >
              {ALL_STUDENTS_MOCK_DATA.map((s) => (
                <option key={s.usn} value={s.usn}>
                  {s.usn} - {s.name} ({s.deptShort})
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div className="filter-dropdown-box">
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="top-select-field"
            >
              <option value="all">Department</option>
              <option value="CSE">CSE - Computer Science</option>
              <option value="ECE">ECE - Electronics</option>
              <option value="ISE">ISE - Information Science</option>
              <option value="ME">ME - Mechanical</option>
            </select>
          </div>

          {/* Semester Filter */}
          <div className="filter-dropdown-box">
            <select
              value={selectedSem}
              onChange={(e) => setSelectedSem(e.target.value)}
              className="top-select-field"
            >
              <option value="all">semester</option>
              <option value="6">Semester 6 (Year 3)</option>
              <option value="7">Semester 7 (Year 4)</option>
              <option value="5">Semester 5 (Year 3)</option>
            </select>
          </div>

          {/* Section Filter */}
          <div className="filter-dropdown-box">
            <select
              value={selectedSec}
              onChange={(e) => setSelectedSec(e.target.value)}
              className="top-select-field"
            >
              <option value="all">section</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
            </select>
          </div>

          {/* Add New Student Action */}
          <button type="button" className="add-new-student-btn" onClick={() => alert("Add New Student Modal")}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            ADD NEW S
          </button>
        </form>
      </div>

      {/* 2. STUDENT HERO PROFILE CARD */}
      <div className="student-profile-hero-card">
        <div className="hero-left-col">
          <div className="student-avatar-circle">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="#3b82f6">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z" />
            </svg>
          </div>
          <div className="student-meta-info">
            <div className="name-status-row">
              <h2 className="student-name-text">{currentStudent.name}</h2>
              <span className="status-badge-active">{currentStudent.status}</span>
            </div>
            <p className="student-usn-sub">USN: {currentStudent.usn}</p>
            <div className="dept-sem-details">
              <span>🎓 {currentStudent.dept}</span>
              <span className="divider-pipe">|</span>
              <span>📅 {currentStudent.semester} - {currentStudent.section}</span>
            </div>
          </div>
        </div>

        <div className="hero-right-col">
          <div className="contact-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span>{currentStudent.email}</span>
          </div>
          <div className="contact-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>{currentStudent.phone}</span>
          </div>
          <div className="contact-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Joined: {currentStudent.joined}</span>
          </div>
        </div>
      </div>

      {/* 3. 4 KEY METRIC CARDS ROW WITH SPARKLINES */}
      <div className="four-metrics-grid">
        {/* Metric 1: CGPA */}
        <div className="metric-card">
          <div className="metric-top-label font-cgpa">CGPA</div>
          <div className="metric-val-row">
            <span className="metric-main-val">{currentStudent.cgpa}</span>
            <span className="metric-denom">/10</span>
          </div>
          {/* Blue Sparkline */}
          <div className="sparkline-container">
            <svg viewBox="0 0 120 30" className="sparkline-svg">
              <path
                d="M0,22 Q20,25 40,15 T80,18 T120,5"
                fill="none"
                stroke="#2563eb"
                strokeWidth="2.5"
              />
            </svg>
          </div>
        </div>

        {/* Metric 2: Overall Skill Score */}
        <div className="metric-card">
          <div className="metric-top-label font-skill">Overall Skill Score</div>
          <div className="metric-val-row">
            <span className="metric-main-val">{currentStudent.skillScore}%</span>
            <span className="metric-badge-good">{currentStudent.skillRating}</span>
          </div>
          {/* Orange/Green Sparkline */}
          <div className="sparkline-container">
            <svg viewBox="0 0 120 30" className="sparkline-svg">
              <path
                d="M0,25 Q30,18 60,24 T120,10"
                fill="none"
                stroke="#f97316"
                strokeWidth="2.5"
              />
            </svg>
          </div>
        </div>

        {/* Metric 3: Placement Readiness */}
        <div className="metric-card">
          <div className="metric-top-label font-readiness">Placement Readiness</div>
          <div className="metric-val-row">
            <span className="metric-main-val">{currentStudent.placementReadiness}%</span>
            <span className="metric-badge-high">{currentStudent.placementRating}</span>
          </div>
          {/* Green Sparkline */}
          <div className="sparkline-container">
            <svg viewBox="0 0 120 30" className="sparkline-svg">
              <path
                d="M0,26 Q40,24 70,14 T120,8"
                fill="none"
                stroke="#16a34a"
                strokeWidth="2.5"
              />
            </svg>
          </div>
        </div>

        {/* Metric 4: Tests Completed */}
        <div className="metric-card">
          <div className="metric-top-label font-tests">Tests Completed</div>
          <div className="metric-val-row">
            <span className="metric-main-val">{currentStudent.testsCompleted}</span>
            <span className="metric-sub-lbl">Total</span>
          </div>
          {/* Purple Sparkline */}
          <div className="sparkline-container">
            <svg viewBox="0 0 120 30" className="sparkline-svg">
              <path
                d="M0,28 Q30,22 60,25 T90,20 T120,6"
                fill="none"
                stroke="#9333ea"
                strokeWidth="2.5"
              />
            </svg>
          </div>
        </div>
      </div>

      {/* 4. PERFORMANCE OVERVIEW BAR CHART & SKILL RADAR GRID */}
      <div className="charts-twin-grid">
        {/* Performance Overview Card */}
        <div className="overview-chart-card">
          <h3 className="chart-card-title">Performance Overview</h3>
          
          <div className="custom-bar-chart-container">
            <div className="y-axis-labels">
              <span>100</span>
              <span>75</span>
              <span>50</span>
              <span>25</span>
              <span>0</span>
            </div>

            <div className="bars-flex-wrapper">
              {/* Academics */}
              <div className="chart-column-item">
                <span className="bar-val-badge">{cats.academics}%</span>
                <div className="bar-track-bg">
                  <div className="bar-fill blue-bar" style={{ height: `${cats.academics}%` }}></div>
                </div>
                <span className="bar-column-label">Academics</span>
              </div>

              {/* Aptitude */}
              <div className="chart-column-item">
                <span className="bar-val-badge">{cats.aptitude}%</span>
                <div className="bar-track-bg">
                  <div className="bar-fill green-bar" style={{ height: `${cats.aptitude}%` }}></div>
                </div>
                <span className="bar-column-label">Aptitude</span>
              </div>

              {/* Technical */}
              <div className="chart-column-item">
                <span className="bar-val-badge">{cats.technical}%</span>
                <div className="bar-track-bg">
                  <div className="bar-fill orange-bar" style={{ height: `${cats.technical}%` }}></div>
                </div>
                <span className="bar-column-label">Technical</span>
              </div>

              {/* Coding */}
              <div className="chart-column-item">
                <span className="bar-val-badge">{cats.coding}%</span>
                <div className="bar-track-bg">
                  <div className="bar-fill blue-bar" style={{ height: `${cats.coding}%` }}></div>
                </div>
                <span className="bar-column-label">Coding</span>
              </div>

              {/* HR / Comm. */}
              <div className="chart-column-item">
                <span className="bar-val-badge">{cats.hrComm}%</span>
                <div className="bar-track-bg">
                  <div className="bar-fill purple-bar" style={{ height: `${cats.hrComm}%` }}></div>
                </div>
                <span className="bar-column-label">HR / Comm.</span>
              </div>

              {/* Overall */}
              <div className="chart-column-item">
                <span className="bar-val-badge">{cats.overall}%</span>
                <div className="bar-track-bg">
                  <div className="bar-fill teal-bar" style={{ height: `${cats.overall}%` }}></div>
                </div>
                <span className="bar-column-label font-bold">Overall</span>
              </div>
            </div>
          </div>
        </div>

        {/* Skill Radar Card */}
        <div className="overview-chart-card">
          <h3 className="chart-card-title">Skill Radar</h3>

          <div className="radar-canvas-container">
            <svg viewBox="0 0 320 230" className="radar-svg-canvas">
              {/* Pentagon Grid Circles */}
              <polygon points="160,25 255,94 219,206 101,206 65,94" fill="none" stroke="#e2e8f0" strokeWidth="1" />
              <polygon points="160,55 230,106 203,189 117,189 90,106" fill="none" stroke="#e2e8f0" strokeWidth="1" />
              <polygon points="160,85 205,118 188,172 132,172 115,118" fill="none" stroke="#e2e8f0" strokeWidth="1" />

              {/* Axis Dashed Lines */}
              <line x1="160" y1="125" x2="160" y2="25" stroke="#cbd5e1" strokeDasharray="3 3" />
              <line x1="160" y1="125" x2="255" y2="94" stroke="#cbd5e1" strokeDasharray="3 3" />
              <line x1="160" y1="125" x2="219" y2="206" stroke="#cbd5e1" strokeDasharray="3 3" />
              <line x1="160" y1="125" x2="101" y2="206" stroke="#cbd5e1" strokeDasharray="3 3" />
              <line x1="160" y1="125" x2="65" y2="94" stroke="#cbd5e1" strokeDasharray="3 3" />

              {/* Average Line (Dashed) */}
              <polygon points="160,50 235,98 205,185 115,185 85,98" fill="rgba(148,163,184,0.05)" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="4 4" />

              {/* Student Score Pentagon (Blue Polygon) */}
              <polygon points="160,35 245,95 200,195 120,195 75,95" fill="rgba(37,99,235,0.12)" stroke="#2563eb" strokeWidth="2.5" />
              <circle cx="160" cy="35" r="3.5" fill="#2563eb" />
              <circle cx="245" cy="95" r="3.5" fill="#2563eb" />
              <circle cx="200" cy="195" r="3.5" fill="#2563eb" />
              <circle cx="120" cy="195" r="3.5" fill="#2563eb" />
              <circle cx="75" cy="95" r="3.5" fill="#2563eb" />

              {/* Pentagon Vertex Labels */}
              <text x="160" y="15" textAnchor="middle" className="r-label">Technical</text>
              <text x="262" y="94" textAnchor="start" className="r-label">Aptitude</text>
              <text x="224" y="222" textAnchor="middle" className="r-label">Coding</text>
              <text x="96" y="222" textAnchor="middle" className="r-label">HR / Communication</text>
              <text x="58" y="94" textAnchor="end" className="r-label">Academics</text>
            </svg>

            {/* Radar Legend */}
            <div className="radar-legend-bar">
              <div className="radar-legend-item">
                <span className="legend-solid-blue"></span>
                <span>Student Score</span>
              </div>
              <div className="radar-legend-item">
                <span className="legend-dashed-gray"></span>
                <span>Average</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. THREE COLUMN LOWER GRID */}
      <div className="three-columns-grid">
        {/* Column 1: Recent Activity */}
        <div className="lower-card">
          <h3 className="lower-card-title">Recent Activity</h3>
          <div className="activities-list-container">
            {currentStudent.recentActivities.map((act) => (
              <div key={act.id} className="activity-item-row">
                <div className={`activity-icon-badge icon-${act.type}`}>
                  {act.type === "aptitude" && "✓"}
                  {act.type === "coding" && "</>"}
                  {act.type === "quiz" && "📋"}
                </div>
                <div className="activity-details-col">
                  <h4 className="act-title">{act.title}</h4>
                  <p className="act-detail">{act.detail}</p>
                </div>
                <span className="act-date">{act.date}</span>
              </div>
            ))}
          </div>

          <div className="view-all-activity-link">
            <button type="button" onClick={() => navigate("/student/activities")} className="view-all-btn">
              View All Activity →
            </button>
          </div>
        </div>

        {/* Column 2: Strengths & Areas to Improve */}
        <div className="lower-card">
          <div className="strengths-section">
            <h3 className="lower-card-title">Strengths</h3>
            <ul className="strengths-list">
              {currentStudent.strengths.map((str, idx) => (
                <li key={idx} className="strength-item">
                  <span className="check-icon-badge">✓</span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="improve-section">
            <h3 className="lower-card-title">Areas to Improve</h3>
            <ul className="improve-list">
              {currentStudent.areasToImprove.map((item, idx) => (
                <li key={idx} className="improve-item">
                  <span className="warning-icon-badge">⚠️</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Column 3: Quick Actions */}
        <div className="lower-card">
          <h3 className="lower-card-title">Quick Actions</h3>
          <div className="quick-actions-flex">
            <button className="quick-action-btn" onClick={() => navigate("/student/profile")}>
              <div className="qa-left">
                <span className="qa-icon">👤</span>
                <span>View Full Profile</span>
              </div>
              <span className="qa-arrow">›</span>
            </button>

            <button className="quick-action-btn" onClick={() => navigate("/student/aptitude")}>
              <div className="qa-left">
                <span className="qa-icon">📋</span>
                <span>View All Tests</span>
              </div>
              <span className="qa-arrow">›</span>
            </button>

            <button className="quick-action-btn" onClick={() => navigate("/student/activities")}>
              <div className="qa-left">
                <span className="qa-icon">💼</span>
                <span>View Projects</span>
              </div>
              <span className="qa-arrow">›</span>
            </button>

            <button className="quick-action-btn" onClick={() => alert(`Generating PDF report for ${currentStudent.name}...`)}>
              <div className="qa-left">
                <span className="qa-icon">📄</span>
                <span>Generate Report</span>
              </div>
              <span className="qa-arrow">›</span>
            </button>
          </div>
        </div>
      </div>

      {/* 6. BOTTOM HISTORY SECTION */}
      <div className="bottom-history-card">
        <h3 className="history-tab-title">History</h3>
      </div>
    </div>
  );
}
