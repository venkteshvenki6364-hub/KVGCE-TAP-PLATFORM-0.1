import React, { useState } from "react";
import api from "../../services/api";
import "./AdminFacultyView.css";

// Comprehensive mock data matching the screenshot
const FACULTIES_DATA = [
  {
    id: "FCE001",
    name: "Dr. Ramesh H",
    dept: "CSE",
    section: "A",
    semester: 6,
    classesCount: 2,
    overallPerformance: 86,
    classesHandled: [
      {
        course: "Data Structures",
        dept: "CSE",
        section: "A",
        semester: 6,
        students: 68,
        performance: 88,
      },
      {
        course: "Database Management Systems",
        dept: "CSE",
        section: "A",
        semester: 6,
        students: 65,
        performance: 84,
      },
    ],
  },
  {
    id: "FCE002",
    name: "Prof. Kavitha S",
    dept: "ECE",
    section: "B",
    semester: 6,
    classesCount: 2,
    overallPerformance: 82,
    classesHandled: [
      {
        course: "Digital Signal Processing",
        dept: "ECE",
        section: "B",
        semester: 6,
        students: 60,
        performance: 85,
      },
      {
        course: "Embedded Systems",
        dept: "ECE",
        section: "B",
        semester: 6,
        students: 58,
        performance: 79,
      },
    ],
  },
  {
    id: "FCE003",
    name: "Prof. Mahesh P",
    dept: "ISE",
    section: "A",
    semester: 4,
    classesCount: 3,
    overallPerformance: 78,
    classesHandled: [
      {
        course: "Object Oriented Programming",
        dept: "ISE",
        section: "A",
        semester: 4,
        students: 62,
        performance: 80,
      },
      {
        course: "Operating Systems",
        dept: "ISE",
        section: "A",
        semester: 4,
        students: 64,
        performance: 76,
      },
      {
        course: "Computer Networks Lab",
        dept: "ISE",
        section: "A",
        semester: 4,
        students: 30,
        performance: 78,
      },
    ],
  },
  {
    id: "FCE004",
    name: "Prof. Anitha M",
    dept: "ME",
    section: "A",
    semester: 6,
    classesCount: 2,
    overallPerformance: 75,
    classesHandled: [
      {
        course: "Thermodynamics",
        dept: "ME",
        section: "A",
        semester: 6,
        students: 55,
        performance: 76,
      },
      {
        course: "Fluid Mechanics",
        dept: "ME",
        section: "A",
        semester: 6,
        students: 52,
        performance: 74,
      },
    ],
  },
  {
    id: "FCE005",
    name: "Prof. Sandeep K",
    dept: "CSE",
    section: "B",
    semester: 4,
    classesCount: 1,
    overallPerformance: 72,
    classesHandled: [
      {
        course: "Design and Analysis of Algorithms",
        dept: "CSE",
        section: "B",
        semester: 4,
        students: 66,
        performance: 72,
      },
    ],
  },
];

export default function AdminFacultyView() {
  const [facultiesList, setFacultiesList] = useState(FACULTIES_DATA);
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedSem, setSelectedSem] = useState("all");
  const [selectedSec, setSelectedSec] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  // Track expanded rows (default FCE001 expanded)
  const [expandedFacultyIds, setExpandedFacultyIds] = useState(["FCE001"]);
  const [currentPage, setCurrentPage] = useState(1);

  React.useEffect(() => {
    const loadFacultyUsers = async () => {
      try {
        const res = await api.get("/admin/users");
        if (res.data && res.data.data) {
          const facultyUsers = res.data.data.filter(u => u.role === "faculty");
          const formatted = facultyUsers.map(u => {
            const deptCode = u.department?.includes("Computer") ? "CSE" :
                             u.department?.includes("Electronics") ? "ECE" :
                             u.department?.includes("Information") ? "ISE" :
                             u.department?.includes("Mechanical") ? "ME" : "CSE";
            return {
              id: u.faculty_id || `KVG-FAC-${u.email.slice(0, 4).toUpperCase()}`,
              name: u.full_name,
              dept: deptCode,
              section: "A",
              semester: 6,
              classesCount: 2,
              overallPerformance: 85,
              classesHandled: [
                {
                  course: "Core Engineering & Lab",
                  dept: deptCode,
                  section: "A",
                  semester: 6,
                  students: 60,
                  performance: 85,
                }
              ]
            };
          });

          // Merge without duplicates
          const existingIds = new Set(FACULTIES_DATA.map(f => f.id));
          const newEntries = formatted.filter(f => !existingIds.has(f.id));
          setFacultiesList([...FACULTIES_DATA, ...newEntries]);
        }
      } catch (err) {
        console.warn("Could not fetch live faculty users:", err);
      }
    };
    loadFacultyUsers();
  }, []);

  const toggleExpandRow = (id) => {
    setExpandedFacultyIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filter faculties
  const filteredFaculties = facultiesList.filter((f) => {
    const matchesDept = selectedDept === "all" || f.dept === selectedDept;
    const matchesSem = selectedSem === "all" || String(f.semester) === selectedSem;
    const matchesSec = selectedSec === "all" || f.section === selectedSec;
    return matchesDept && matchesSem && matchesSec;
  });

  const exportExcel = () => {
    const headers = ["Faculty ID,Faculty Name,Department,Section,Semester,Classes Handling,Overall Performance"];
    const rows = filteredFaculties.map(
      (f) => `${f.id},"${f.name}",${f.dept},${f.section},${f.semester},${f.classesCount},${f.overallPerformance}%`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KVGCE_Faculties_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to render Circular Ring Gauge
  const renderCircularGauge = (percentage) => {
    const radius = 18;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    let strokeColor = "#10b981"; // green
    if (percentage < 80 && percentage >= 74) {
      strokeColor = "#f59e0b"; // orange
    } else if (percentage < 74) {
      strokeColor = "#ef4444"; // red
    }

    return (
      <div className="circular-gauge-container" title={`Overall Performance: ${percentage}%`}>
        <svg width="48" height="48" viewBox="0 0 48 48" className="gauge-svg">
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth="3.5"
          />
          <circle
            cx="24"
            cy="24"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="3.5"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 24 24)"
          />
        </svg>
        <span className="gauge-text">{percentage}%</span>
      </div>
    );
  };

  return (
    <div className="admin-faculty-view-wrapper">
      {/* 1. TOP FILTER CONTROLS ROW */}
      <div className="admin-faculty-filter-bar">
        {/* Department Select */}
        <div className="fac-filter-item">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="fac-select-input"
          >
            <option value="all">Select All Department</option>
            <option value="CSE">CSE</option>
            <option value="ECE">ECE</option>
            <option value="ISE">ISE</option>
            <option value="ME">ME</option>
            <option value="CV">CV</option>
          </select>
        </div>

        {/* Semester Select */}
        <div className="fac-filter-item">
          <select
            value={selectedSem}
            onChange={(e) => setSelectedSem(e.target.value)}
            className="fac-select-input"
          >
            <option value="all">Semester</option>
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Semester 3</option>
            <option value="4">Semester 4</option>
            <option value="5">Semester 5</option>
            <option value="6">Semester 6</option>
            <option value="7">Semester 7</option>
            <option value="8">Semester 8</option>
          </select>
        </div>

        {/* Section Select */}
        <div className="fac-filter-item">
          <select
            value={selectedSec}
            onChange={(e) => setSelectedSec(e.target.value)}
            className="fac-select-input"
          >
            <option value="all">Section</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>
        </div>

        {/* Handling Status Select */}
        <div className="fac-filter-item">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="fac-select-input"
          >
            <option value="all">Handling Status</option>
            <option value="active">Active Handling</option>
            <option value="multiple">Multiple Classes</option>
          </select>
        </div>
      </div>

      {/* 2. MAIN FACULTIES TABLE CARD */}
      <div className="faculties-table-card">
        <div className="faculties-card-header">
          <div className="header-title-box">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1e293b" strokeWidth="2.2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <h3 className="fac-card-title">Faculties List</h3>
          </div>

          <button className="export-excel-btn" onClick={exportExcel}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
            </svg>
            <span>Export Excel</span>
          </button>
        </div>

        {/* TABLE WRAPPER */}
        <div className="table-responsive-container">
          <table className="faculties-main-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}></th>
                <th>Faculty Name</th>
                <th>Faculty ID</th>
                <th>Department</th>
                <th>Section</th>
                <th>Semester</th>
                <th>Classes Handling</th>
                <th style={{ textAlign: "center" }}>Overall Performance</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaculties.map((faculty) => {
                const isExpanded = expandedFacultyIds.includes(faculty.id);

                return (
                  <React.Fragment key={faculty.id}>
                    {/* FACULTY MAIN ROW */}
                    <tr className={`faculty-row ${isExpanded ? "row-expanded" : ""}`}>
                      <td className="toggle-cell">
                        <button
                          className="accordion-toggle-btn"
                          onClick={() => toggleExpandRow(faculty.id)}
                          aria-label="Toggle Details"
                        >
                          {isExpanded ? "−" : "›"}
                        </button>
                      </td>
                      <td className="faculty-name-cell">
                        <div className="faculty-avatar-box">
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="#3b82f6">
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        </div>
                        <span className="fac-name-text">{faculty.name}</span>
                      </td>
                      <td className="fac-id-text">{faculty.id}</td>
                      <td>{faculty.dept}</td>
                      <td>{faculty.section}</td>
                      <td>{faculty.semester}</td>
                      <td>
                        <button
                          className="classes-link-btn"
                          onClick={() => toggleExpandRow(faculty.id)}
                        >
                          {faculty.classesCount} {faculty.classesCount === 1 ? "Class" : "Classes"}
                        </button>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {renderCircularGauge(faculty.overallPerformance)}
                      </td>
                    </tr>

                    {/* EXPANDED CLASSES SUB-TABLE ROW */}
                    {isExpanded && (
                      <tr className="classes-expanded-container-row">
                        <td colSpan="8">
                          <div className="expanded-classes-card">
                            <h4 className="classes-handled-title">
                              Classes Handled by {faculty.name}
                            </h4>
                            <table className="classes-sub-table">
                              <thead>
                                <tr>
                                  <th>Class / Course</th>
                                  <th>Department</th>
                                  <th>Section</th>
                                  <th>Semester</th>
                                  <th>Students</th>
                                  <th>Overall Performance</th>
                                </tr>
                              </thead>
                              <tbody>
                                {faculty.classesHandled.map((cls, idx) => (
                                  <tr key={idx}>
                                    <td className="font-semibold text-slate-800">{cls.course}</td>
                                    <td>{cls.dept}</td>
                                    <td>{cls.section}</td>
                                    <td>{cls.semester}</td>
                                    <td>{cls.students}</td>
                                    <td>
                                      <div className="sub-performance-bar-row">
                                        <div className="horizontal-track-bg">
                                          <div
                                            className="horizontal-fill-bar"
                                            style={{ width: `${cls.performance}%` }}
                                          ></div>
                                        </div>
                                        <span className="perf-percent-lbl">{cls.performance}%</span>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        <div className="faculties-pagination-footer">
          <span className="pagination-info-text">
            Showing 1 to {filteredFaculties.length} of 25 faculties
          </span>
          <div className="pagination-pills">
            <button
              className={`page-pill ${currentPage === 1 ? "active" : ""}`}
              onClick={() => setCurrentPage(1)}
            >
              1
            </button>
            <button
              className={`page-pill ${currentPage === 2 ? "active" : ""}`}
              onClick={() => setCurrentPage(2)}
            >
              2
            </button>
            <button
              className={`page-pill ${currentPage === 3 ? "active" : ""}`}
              onClick={() => setCurrentPage(3)}
            >
              3
            </button>
            <span className="pagination-ellipsis">...</span>
            <button className="page-pill" onClick={() => setCurrentPage(5)}>
              5
            </button>
            <button className="page-pill-next" aria-label="Next Page">
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
