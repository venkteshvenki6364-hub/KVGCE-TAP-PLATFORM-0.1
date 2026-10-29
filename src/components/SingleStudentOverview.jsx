import React, { useState, useEffect } from "react";
import api from "../services/api";
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
    githubUrl: "https://github.com/venkatesh-r",
    linkedinUrl: "https://linkedin.com/in/venkatesh-r",
    portfolioUrl: "https://venkatesh-r.dev",
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
        title: "Technical Quiz - Java",
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
    githubUrl: "https://github.com/karthik-m",
    linkedinUrl: "https://linkedin.com/in/karthik-m",
    portfolioUrl: "https://karthikm.tech",
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
    githubUrl: "https://github.com/sahana-p",
    linkedinUrl: "https://linkedin.com/in/sahana-p",
    portfolioUrl: "https://sahanap.design",
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
    githubUrl: "https://github.com/likith-r",
    linkedinUrl: "https://linkedin.com/in/likith-r",
    portfolioUrl: "https://likithr.io",
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

  // Search & Filter state
  const [searchUsn, setSearchUsn] = useState(defaultUsn);
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedSem, setSelectedSem] = useState("all");
  const [selectedSec, setSelectedSec] = useState("all");

  const [dbStudent, setDbStudent] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const fetchOverview = async () => {
      try {
        const res = await api.get(`/faculty/students/${encodeURIComponent(searchUsn)}/overview`);
        if (isMounted && res.data?.success && res.data?.data) {
          setDbStudent(res.data.data);
        }
      } catch (err) {
        if (isMounted) setDbStudent(null);
      }
    };
    if (searchUsn) fetchOverview();
    return () => { isMounted = false; };
  }, [searchUsn]);

  // Dynamic filter for student selector dropdown
  const filteredStudents = ALL_STUDENTS_MOCK_DATA.filter((s) => {
    if (selectedDept !== "all" && s.deptShort !== selectedDept) return false;
    if (selectedSem !== "all" && !s.semester.includes(`Semester ${selectedSem}`)) return false;
    if (selectedSec !== "all" && !s.section.includes(`Section ${selectedSec}`)) return false;
    return true;
  });

  // Find active student object (database-backed with mock fallback)
  const currentStudent = dbStudent ||
    ALL_STUDENTS_MOCK_DATA.find(
      (s) => s.usn.toLowerCase() === searchUsn.toLowerCase() || s.name.toLowerCase().includes(searchUsn.toLowerCase())
    ) || (filteredStudents.length > 0 ? filteredStudents[0] : ALL_STUDENTS_MOCK_DATA[0]);

  const cats = currentStudent.categories || {
    academics: 78,
    aptitude: 85,
    technical: 80,
    coding: 75,
    hrComm: 70,
    overall: 82.5,
  };

  const handleResetFilters = () => {
    setSelectedDept("all");
    setSelectedSem("all");
    setSelectedSec("all");
  };

  const getInitials = (name) => {
    if (!name) return "ST";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="single-student-overview-container">
      {/* 1. TOP SEARCH & FILTER BAR */}
      <div className="top-filter-bar-card">
        <div className="top-filter-form">
          {/* USN / Student Selector */}
          <div className="filter-input-wrapper">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <select
              value={currentStudent.usn}
              onChange={(e) => setSearchUsn(e.target.value)}
              className="student-usn-select"
              aria-label="Select student"
            >
              {(filteredStudents.length > 0 ? filteredStudents : ALL_STUDENTS_MOCK_DATA).map((s) => (
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
              aria-label="Filter by Department"
            >
              <option value="all">All Departments</option>
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
              aria-label="Filter by Semester"
            >
              <option value="all">All Semesters</option>
              <option value="5">Semester 5 (Year 3)</option>
              <option value="6">Semester 6 (Year 3)</option>
              <option value="7">Semester 7 (Year 4)</option>
            </select>
          </div>

          {/* Section Filter */}
          <div className="filter-dropdown-box">
            <select
              value={selectedSec}
              onChange={(e) => setSelectedSec(e.target.value)}
              className="top-select-field"
              aria-label="Filter by Section"
            >
              <option value="all">All Sections</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
            </select>
          </div>

          {/* Active Cohort Counter Pill */}
          <div className="filter-cohort-pill">
            <span className="live-pulse-dot" />
            <span className="cohort-count-text">
              {filteredStudents.length} {filteredStudents.length === 1 ? "Student" : "Students"} Available
            </span>
            {(selectedDept !== "all" || selectedSem !== "all" || selectedSec !== "all") && (
              <button
                type="button"
                className="filter-reset-mini-btn"
                onClick={handleResetFilters}
                title="Reset filters to All"
              >
                ✕ Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. STUDENT HERO PROFILE CARD */}
      <div className="student-profile-hero-card">
        <div className="hero-left-col">
          <div className="student-avatar-initials">
            {getInitials(currentStudent.name)}
          </div>
          <div className="student-meta-info">
            <div className="name-status-row">
              <h2 className="student-name-text">{currentStudent.name}</h2>
              <span className="status-badge-active">
                <span className="status-dot"></span>
                {currentStudent.status || "Active"}
              </span>
            </div>
            <p className="student-usn-sub">
              <span className="usn-tag-label">USN:</span> {currentStudent.usn}
            </p>
            <div className="dept-sem-details">
              <span className="dept-pill">🎓 {currentStudent.deptShort || currentStudent.dept}</span>
              <span className="sem-sec-pill">📅 {currentStudent.semester} • {currentStudent.section}</span>
            </div>
          </div>
        </div>

        <div className="hero-right-col">
          <div className="contact-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
            <span>{currentStudent.email}</span>
          </div>
          <div className="contact-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            <span>{currentStudent.phone}</span>
          </div>
          <div className="contact-item">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>Joined: {currentStudent.joined}</span>
          </div>

          {/* Clickable Social Profile Links */}
          <div className="student-overview-social-row">
            {currentStudent.githubUrl && (
              <a
                href={currentStudent.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="overview-social-btn github-btn"
                title={`Check ${currentStudent.name}'s GitHub Profile`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
                </svg>
                <span>GitHub</span>
              </a>
            )}
            {currentStudent.linkedinUrl && (
              <a
                href={currentStudent.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="overview-social-btn linkedin-btn"
                title={`Check ${currentStudent.name}'s LinkedIn Profile`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                </svg>
                <span>LinkedIn</span>
              </a>
            )}
            {currentStudent.portfolioUrl && (
              <a
                href={currentStudent.portfolioUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="overview-social-btn portfolio-btn"
                title={`Check ${currentStudent.name}'s Portfolio Website`}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="2" y1="12" x2="22" y2="12"/>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span>Portfolio</span>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* 3. 4 KEY METRIC CARDS ROW WITH SPARKLINES */}
      <div className="four-metrics-grid">
        {/* Metric 1: CGPA */}
        <div className="metric-card metric-card-cgpa">
          <div className="metric-header-row">
            <span className="metric-top-label font-cgpa">CGPA</span>
            <div className="metric-icon-circle icon-cgpa">🎓</div>
          </div>
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
        <div className="metric-card metric-card-skill">
          <div className="metric-header-row">
            <span className="metric-top-label font-skill">Overall Skill Score</span>
            <div className="metric-icon-circle icon-skill">⚡</div>
          </div>
          <div className="metric-val-row">
            <span className="metric-main-val">{currentStudent.skillScore}%</span>
            <span className="metric-badge-good">{currentStudent.skillRating}</span>
          </div>
          {/* Orange Sparkline */}
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
        <div className="metric-card metric-card-readiness">
          <div className="metric-header-row">
            <span className="metric-top-label font-readiness">Placement Readiness</span>
            <div className="metric-icon-circle icon-readiness">🎯</div>
          </div>
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
        <div className="metric-card metric-card-tests">
          <div className="metric-header-row">
            <span className="metric-top-label font-tests">Tests Completed</span>
            <div className="metric-icon-circle icon-tests">📝</div>
          </div>
          <div className="metric-val-row">
            <span className="metric-main-val">{currentStudent.testsCompleted}</span>
            <span className="metric-sub-lbl">Tests Evaluated</span>
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
          <div className="chart-card-header">
            <h3 className="chart-card-title">Performance Overview</h3>
            <span className="chart-subtitle-badge">Category Scores</span>
          </div>
          
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
                  <div className="bar-fill purple-blue-bar" style={{ height: `${cats.coding}%` }}></div>
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
                <span className="bar-val-badge highlight-overall-badge">{cats.overall}%</span>
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
          <div className="chart-card-header">
            <h3 className="chart-card-title">Skill Radar</h3>
            <span className="chart-subtitle-badge">Competency Matrix</span>
          </div>

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
                <span>Cohort Average</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. THREE COLUMN LOWER GRID */}
      <div className="three-columns-grid">
        {/* Column 1: Recent Activity */}
        <div className="lower-card">
          <div className="lower-card-header">
            <h3 className="lower-card-title">Recent Activity</h3>
            <span className="lower-card-tag">Latest</span>
          </div>
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
            <button
              type="button"
              onClick={() => navigate(userRole === "faculty" ? "/faculty/dashboard?tab=tasks" : userRole === "admin" ? "/admin/dashboard?tab=tasks" : "/student/history")}
              className="view-all-btn"
            >
              View All Activity →
            </button>
          </div>
        </div>

        {/* Column 2: Strengths & Areas to Improve */}
        <div className="lower-card">
          <div className="strengths-section">
            <div className="lower-card-header">
              <h3 className="lower-card-title">Key Strengths</h3>
              <span className="strength-badge-count">{currentStudent.strengths.length}</span>
            </div>
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
            <div className="lower-card-header">
              <h3 className="lower-card-title">Areas to Improve</h3>
              <span className="improve-badge-count">{currentStudent.areasToImprove.length}</span>
            </div>
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
          <div className="lower-card-header">
            <h3 className="lower-card-title">Quick Actions</h3>
            <span className="lower-card-tag">Actions</span>
          </div>
          <div className="quick-actions-flex">
            <button
              className="quick-action-btn"
              onClick={() => navigate(userRole === "admin" ? "/admin/profile" : userRole === "faculty" ? "/faculty/profile" : "/student/profile")}
            >
              <div className="qa-left">
                <span className="qa-icon">👤</span>
                <span>View Full Profile</span>
              </div>
              <span className="qa-arrow">›</span>
            </button>

            <button
              className="quick-action-btn"
              onClick={() => navigate(userRole === "faculty" ? "/faculty/dashboard?tab=tasks" : userRole === "admin" ? "/admin/dashboard?tab=tasks" : "/student/aptitude")}
            >
              <div className="qa-left">
                <span className="qa-icon">📋</span>
                <span>View Assigned Tests</span>
              </div>
              <span className="qa-arrow">›</span>
            </button>

            <button
              className="quick-action-btn"
              onClick={() => navigate(userRole === "faculty" ? "/faculty/dashboard?tab=projects" : "/student/projects")}
            >
              <div className="qa-left">
                <span className="qa-icon">💼</span>
                <span>View Projects</span>
              </div>
              <span className="qa-arrow">›</span>
            </button>

            <button
              className="quick-action-btn"
              onClick={() => alert(`Generating detailed performance report for ${currentStudent.name} (${currentStudent.usn})...`)}
            >
              <div className="qa-left">
                <span className="qa-icon">📄</span>
                <span>Generate PDF Report</span>
              </div>
              <span className="qa-arrow">›</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
