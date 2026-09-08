import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../services/api";
import "./StudentRankingsPage.css";

const ALL_STUDENTS_MOCK = [
  { rank: 1, name: "Karthik M", usn: "4KV21CS018", department: "CSE", semester: "6", section: "A", cgpa: 9.42, overall_score: "94.2%" },
  { rank: 2, name: "Sahana P", usn: "4KV21CS042", department: "CSE", semester: "6", section: "A", cgpa: 9.21, overall_score: "92.1%" },
  { rank: 3, name: "Likith R", usn: "4KV21EC027", department: "ECE", semester: "6", section: "A", cgpa: 9.13, overall_score: "91.3%" },
  { rank: 4, name: "Ananya B", usn: "4KV21IS033", department: "ISE", semester: "6", section: "B", cgpa: 9.07, overall_score: "90.7%" },
  { rank: 5, name: "Vivek S", usn: "4KV21ME021", department: "ME", semester: "6", section: "A", cgpa: 8.96, overall_score: "89.6%" },
  { rank: 6, name: "Rohan K", usn: "4KV21CS110", department: "CSE", semester: "6", section: "B", cgpa: 8.82, overall_score: "88.2%" },
  { rank: 7, name: "Prajwal B", usn: "4KV21EC056", department: "ECE", semester: "6", section: "A", cgpa: 8.75, overall_score: "87.5%" },
  { rank: 8, name: "Nikhil M", usn: "4KV21ME045", department: "ME", semester: "6", section: "B", cgpa: 8.68, overall_score: "86.8%" },
  { rank: 9, name: "Arjun U", usn: "4KV21CS128", department: "CSE", semester: "6", section: "A", cgpa: 8.52, overall_score: "85.2%" },
  { rank: 10, name: "Deepika N", usn: "4KV21IS059", department: "ISE", semester: "6", section: "B", cgpa: 8.47, overall_score: "84.7%" },
  { rank: 11, name: "Siddharth V", usn: "4KV21CS140", department: "CSE", semester: "6", section: "A", cgpa: 8.41, overall_score: "84.1%" },
  { rank: 12, name: "Pooja Hegde", usn: "4KV21EC080", department: "ECE", semester: "6", section: "B", cgpa: 8.35, overall_score: "83.5%" },
  { rank: 13, name: "Manjunath K", usn: "4KV21CV012", department: "CV", semester: "6", section: "A", cgpa: 8.28, overall_score: "82.8%" },
  { rank: 14, name: "Aishwarya Rai", usn: "4KV21AI005", department: "AI&DS", semester: "6", section: "A", cgpa: 8.22, overall_score: "82.2%" },
  { rank: 15, name: "Girish K", usn: "4KV21IS020", department: "ISE", semester: "6", section: "A", cgpa: 8.15, overall_score: "81.5%" },
];

function StudentRankingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [students, setStudents] = useState(ALL_STUDENTS_MOCK);
  const [usnFilter, setUsnFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [semFilter, setSemFilter] = useState("all");
  const [secFilter, setSecFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        const res = await api.get("/students/rankings");
        if (res.data && res.data.data && res.data.data.length > 0) {
          setStudents(res.data.data);
        }
      } catch (err) {
        console.warn("Using fallback client ranking data:", err);
      }
    };
    fetchRankings();
  }, []);

  // Filter students based on dropdown controls & USN search
  const filteredStudents = students.filter((s) => {
    const matchesUsn =
      !usnFilter ||
      s.usn.toLowerCase().includes(usnFilter.toLowerCase()) ||
      s.name.toLowerCase().includes(usnFilter.toLowerCase());
    const matchesDept = deptFilter === "all" || s.department === deptFilter;
    const matchesSem = semFilter === "all" || String(s.semester) === semFilter;
    const matchesSec = secFilter === "all" || s.section === secFilter;
    return matchesUsn && matchesDept && matchesSem && matchesSec;
  });

  const exportToExcel = () => {
    const headers = ["Rank,Name,USN,Department,Semester,Section,CGPA,Overall Score"];
    const rows = filteredStudents.map(
      (s) => `${s.rank},"${s.name}",${s.usn},${s.department},${s.semester},${s.section},${s.cgpa},${s.overall_score}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KVGCE_Student_Rankings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderRankBadge = (rank) => {
    if (rank === 1) {
      return (
        <span className="rank-badge rank-1" title="Rank 1 - Gold Medal">
          1
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="rank-badge rank-2" title="Rank 2 - Silver Medal">
          2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="rank-badge rank-3" title="Rank 3 - Bronze Medal">
          3
        </span>
      );
    }
    return <span className="rank-badge rank-default">{rank}</span>;
  };

  return (
    <DashboardLayout title="Student Rankings">
      <div className="student-rankings-container">
        {/* TOP FILTER BAR */}
        <div className="rankings-filter-row">
          {/* USN / Name Search Dropdown Box */}
          <div className="filter-item">
            <input
              type="text"
              className="filter-select-input"
              placeholder="Select All USN / Search..."
              value={usnFilter}
              onChange={(e) => setUsnFilter(e.target.value)}
            />
          </div>

          {/* Department Dropdown */}
          <div className="filter-item">
            <select
              className="filter-select"
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="all">Department</option>
              <option value="CSE">CSE</option>
              <option value="ECE">ECE</option>
              <option value="ISE">ISE</option>
              <option value="ME">ME</option>
              <option value="CV">CV</option>
              <option value="AI&DS">AI &amp; DS</option>
            </select>
          </div>

          {/* Semester Dropdown */}
          <div className="filter-item">
            <select
              className="filter-select"
              value={semFilter}
              onChange={(e) => setSemFilter(e.target.value)}
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

          {/* Section Dropdown */}
          <div className="filter-item">
            <select
              className="filter-select"
              value={secFilter}
              onChange={(e) => setSecFilter(e.target.value)}
            >
              <option value="all">Section</option>
              <option value="A">Section A</option>
              <option value="B">Section B</option>
              <option value="C">Section C</option>
            </select>
          </div>
        </div>

        {/* MAIN RANKINGS TABLE CARD */}
        <div className="rankings-table-card">
          <div className="table-card-header">
            <div className="card-header-left">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <h3 className="card-header-title">Students List</h3>
            </div>

            <button className="export-excel-btn" onClick={exportToExcel} title="Export to CSV Excel">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <line x1="9" y1="3" x2="9" y2="21" />
                <line x1="3" y1="9" x2="21" y2="9" />
                <line x1="3" y1="15" x2="21" y2="15" />
              </svg>
              <span>Export Excel</span>
            </button>
          </div>

          {/* TABLE CONTAINER */}
          <div className="table-responsive-wrapper">
            <table className="rankings-table">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Name</th>
                  <th>USN</th>
                  <th>Department</th>
                  <th>Semester</th>
                  <th>Section</th>
                  <th>CGPA</th>
                  <th>Overall Score</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.slice(0, 10).map((student) => (
                  <tr key={student.rank} className={student.usn === "4KV21CS042" ? "highlight-user-row" : ""}>
                    <td>{renderRankBadge(student.rank)}</td>
                    <td className="font-semibold text-slate-800">
                      <button
                        style={{ background: "none", border: "none", color: "#2563eb", fontWeight: 600, cursor: "pointer", padding: 0 }}
                        onClick={() => navigate(`/student/overview`)}
                        title="Click to view full single student overview"
                      >
                        {student.name} 👁️
                      </button>
                    </td>
                    <td className="usn-cell">{student.usn}</td>
                    <td>{student.department}</td>
                    <td>{student.semester}</td>
                    <td>{student.section}</td>
                    <td className="font-bold text-slate-700">{student.cgpa}</td>
                    <td className="font-bold text-blue-600">{student.overall_score}</td>
                  </tr>
                ))}

                {/* ELIPSIS ROW */}
                <tr className="dots-row">
                  <td>...</td>
                  <td>...</td>
                  <td>...</td>
                  <td>...</td>
                  <td>...</td>
                  <td>...</td>
                  <td>...</td>
                  <td>...</td>
                </tr>

                {/* LOGGED IN STUDENT RANK ROW (MY RANKING) */}
                <tr className="my-rank-row">
                  <td>
                    <span className="rank-badge rank-my">{user?.student_id === "4KV21CS042" ? "1400" : "1200"}</span>
                  </td>
                  <td className="font-bold text-blue-900">
                    {user?.full_name || "Rahul J"} <span className="you-pill-tag">YOU</span>
                  </td>
                  <td className="usn-cell">{user?.student_id || "4KV21CS999"}</td>
                  <td>{user?.department || "CSE"}</td>
                  <td>{user?.semester || 6}</td>
                  <td>B</td>
                  <td className="font-bold text-slate-800">6.85</td>
                  <td className="font-bold text-blue-600">65.8%</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* PAGINATION FOOTER */}
          <div className="table-pagination-footer">
            <span className="pagination-text">Showing 1 to 10 of 1200 students</span>
            <div className="pagination-controls">
              <button
                className={`page-num-btn ${currentPage === 1 ? "active" : ""}`}
                onClick={() => setCurrentPage(1)}
              >
                1
              </button>
              <button
                className={`page-num-btn ${currentPage === 2 ? "active" : ""}`}
                onClick={() => setCurrentPage(2)}
              >
                2
              </button>
              <button
                className={`page-num-btn ${currentPage === 3 ? "active" : ""}`}
                onClick={() => setCurrentPage(3)}
              >
                3
              </button>
              <span className="pagination-dots">...</span>
              <button className="page-num-btn" onClick={() => setCurrentPage(120)}>
                120
              </button>
              <button className="page-next-btn" aria-label="Next Page">
                &gt;
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default StudentRankingsPage;
