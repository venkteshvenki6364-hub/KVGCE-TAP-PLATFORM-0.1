import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./AcademicStudentRankingsTable.css";

// Sample mock generator to provide 60+ realistic students for 50-per-page testing
const BASE_NAMES = [
  "Karthik M", "Venkatesh V", "Sahana P", "Aanand S", "Likith R", "Chetan V", "Abhay N", "Bhavana K",
  "Ananya B", "Anish K", "Vivek S", "Rohan K", "Prajwal B", "Nikhil M", "Arjun U", "Deepika N",
  "Manish G", "Pooja R", "Siddharth K", "Tanvi H", "Yashwanth B", "Swathi N", "Gautham P", "Divya M",
  "Kiran T", "Nayana S", "Varun D", "Tejaswini C", "Rakesh B", "Aditi P", "Darshan K", "Harshitha V",
  "Sujay R", "Preethi N", "Vineeth M", "Shreya B", "Sharath K", "Monika P", "Kavya L", "Bhaskar S",
  "Pavan R", "Spoorthi G", "Manoj K", "Nandini V", "Sanjay P", "Deepak B", "Meghana S", "Charan K",
  "Rashmi V", "Chaitra R", "Pranav M", "Bindu P", "Sagar K", "Bhoomika N", "Vinay R", "Sneha B",
  "Ganesh M", "Archana P", "Suraj K", "Aishwarya N"
];

const DEPTS = ["CSE", "ECE", "ISE", "ME", "CV", "AI&DS"];
const BATCHES = [2023, 2024, 2025, 2026, 2027];
const SECTIONS = ["A", "B", "C"];

const MOCK_ACADEMIC_STUDENTS = BASE_NAMES.map((name, idx) => {
  const dept = DEPTS[idx % DEPTS.length];
  const batch = BATCHES[idx % BATCHES.length];
  const sec = SECTIONS[idx % SECTIONS.length];
  const usnNum = String(idx + 1).padStart(3, "0");
  const usn = `4KV21${dept.replace("&", "").slice(0, 2)}${usnNum}`;

  let cgpa, acadPct, apt, tech, hr;
  if (idx < 15) {
    cgpa = 9.5 - idx * 0.04;
    acadPct = cgpa * 10;
    apt = 94 - idx * 0.5;
    tech = 96 - idx * 0.6;
    hr = 92 - idx * 0.5;
  } else if (idx < 38) {
    cgpa = 8.8 - (idx - 15) * 0.08;
    acadPct = cgpa * 10;
    apt = 84 - (idx - 15) * 0.7;
    tech = 85 - (idx - 15) * 0.7;
    hr = 82 - (idx - 15) * 0.6;
  } else if (idx < 52) {
    cgpa = 5.8 - (idx - 38) * 0.12;
    acadPct = cgpa * 10;
    apt = 58 - (idx - 38) * 1.1;
    tech = 56 - (idx - 38) * 1.0;
    hr = 54 - (idx - 38) * 0.9;
  } else {
    cgpa = 3.8 - (idx - 52) * 0.15;
    acadPct = cgpa * 10;
    apt = 38 - (idx - 52) * 1.2;
    tech = 36 - (idx - 52) * 1.1;
    hr = 34 - (idx - 52) * 1.0;
  }

  const roundedCgpa = Math.round(cgpa * 100) / 100;
  const roundedAcadPct = Math.round(acadPct * 10) / 10;
  const roundedApt = Math.round(apt * 100) / 100;
  const roundedTech = Math.round(tech * 100) / 100;
  const roundedHr = Math.round(hr * 100) / 100;
  const overall = Math.round(((roundedAcadPct + roundedApt + roundedTech + roundedHr) / 4) * 100) / 100;

  return {
    name,
    usn,
    batch,
    department: dept,
    semester: 6,
    section: sec,
    cgpa: roundedCgpa,
    total_credits: 160,
    percentage: roundedAcadPct,
    academics: roundedCgpa,
    aptitude: roundedApt,
    technical: roundedTech,
    hr_interview: roundedHr,
    overall_performance: overall
  };
});

const DEPT_FULL_NAMES = {
  CSE: "Computer Science & Engineering",
  ECE: "Electronics & Communication Engineering",
  ISE: "Information Science & Engineering",
  ME: "Mechanical Engineering",
  CV: "Civil Engineering",
  "AI & DS": "Artificial Intelligence & Data Science",
  "AI&DS": "Artificial Intelligence & Data Science"
};

// Color brackets: Green (>=85%), Blue (60%-84.99%), Orange (40%-59.99%), Red (<40%)
const getScoreColorClass = (score) => {
  const val = parseFloat(score) || 0;
  if (val >= 85) return "score-green";
  if (val >= 60) return "score-blue";
  if (val >= 40) return "score-orange";
  return "score-red";
};

function AcademicStudentRankingsTable({ title = "Student Rankings" }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [rawStudents, setRawStudents] = useState([]);
  const [usnFilter, setUsnFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [semFilter, setSemFilter] = useState("all");
  const [secFilter, setSecFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // Default page size: 50 students per page (as requested by user)
  const [pageSize, setPageSize] = useState(50);

  // Single-select criteria state
  const [selectedCriteria, setSelectedCriteria] = useState("overall");

  // Rank sorting order state: "desc" (High to Low / Rank 1 -> Low) or "asc" (Low to High / Rank Low -> 1)
  const [sortOrder, setSortOrder] = useState("desc");

  const roundVal = (num) => Math.round((parseFloat(num) || 0) * 100) / 100;

  // Fetch rankings from API with fallback
  useEffect(() => {
    let isMounted = true;
    const fetchRankings = async () => {
      setLoading(true);
      let loadedList = [];
      try {
        const res = await api.get("/students/academic-rankings");
        if (res.data && res.data.data && Array.isArray(res.data.data) && res.data.data.length > 0) {
          loadedList = res.data.data;
        } else {
          loadedList = MOCK_ACADEMIC_STUDENTS;
        }
      } catch (err) {
        console.warn("Using fallback ranking data:", err);
        loadedList = MOCK_ACADEMIC_STUDENTS;
      }

      if (user && (user.full_name || user.name || user.student_id || user.usn)) {
        const uName = user.full_name || user.name || "Logged Student";
        const uUsn = user.student_id || user.usn || "4KV23CE033";
        const isPresent = loadedList.some(
          (s) => (s.usn && s.usn.toLowerCase() === uUsn.toLowerCase()) || (s.name && s.name.toLowerCase() === uName.toLowerCase())
        );

        if (!isPresent) {
          const userCgpa = parseFloat(user.cgpa || 8.80);
          const userAcadPct = parseFloat(user.percentage || userCgpa * 10);
          const userApt = parseFloat(user.aptitude || 85.0);
          const userTech = parseFloat(user.technical || 86.0);
          const userHr = parseFloat(user.hr_interview || 84.0);
          const userOverall = roundVal((userAcadPct + userApt + userTech + userHr) / 4);

          loadedList = [
            ...loadedList,
            {
              name: uName,
              usn: uUsn,
              batch: user.batch || 2025,
              department: user.department || "CSE",
              semester: user.semester || 6,
              section: user.section || "A",
              cgpa: userCgpa,
              academics: userCgpa,
              aptitude: userApt,
              technical: userTech,
              hr_interview: userHr,
              overall_performance: userOverall,
              total_credits: 160
            }
          ];
        }
      }

      if (isMounted) {
        setRawStudents(loadedList);
        setLoading(false);
      }
    };

    fetchRankings();
    return () => { isMounted = false; };
  }, [user]);

  // Compute calculated student scores and determine ranking value based on single selected criteria
  const processedStudents = useMemo(() => {
    return rawStudents.map((s) => {
      const rawCgpa = roundVal(s.cgpa ?? s.academics ?? (s.percentage ? s.percentage / 10 : 8.5));
      const acadPct = roundVal(s.percentage ?? rawCgpa * 10);
      const apt = roundVal(s.aptitude ?? 82);
      const tech = roundVal(s.technical ?? 85);
      const hr = roundVal(s.hr_interview ?? 80);
      const batchYear = s.batch ? parseInt(s.batch) : 2025;
      const overall = roundVal((acadPct + apt + tech + hr) / 4);

      let rankScore = overall;
      if (selectedCriteria === "academics") rankScore = acadPct;
      else if (selectedCriteria === "aptitude") rankScore = apt;
      else if (selectedCriteria === "technical") rankScore = tech;
      else if (selectedCriteria === "hr_interview") rankScore = hr;

      return {
        ...s,
        batch: batchYear,
        academics: rawCgpa,
        academics_pct: acadPct,
        aptitude: apt,
        technical: tech,
        hr_interview: hr,
        overall_performance: overall,
        rankScore: rankScore
      };
    });
  }, [rawStudents, selectedCriteria]);

  // 1. Filter raw processed students based on active selection (Search, Batch, Dept, Semester, Section)
  const filteredRawStudents = useMemo(() => {
    return processedStudents.filter((s) => {
      const query = usnFilter.trim().toLowerCase();
      const matchesUsn =
        !query ||
        s.usn.toLowerCase().includes(query) ||
        s.name.toLowerCase().includes(query);

      const matchesBatch = batchFilter === "all" || String(s.batch) === String(batchFilter);
      const matchesDept = deptFilter === "all" || s.department.toUpperCase() === deptFilter.toUpperCase();
      const matchesSem = semFilter === "all" || String(s.semester) === String(semFilter);
      const matchesSec = secFilter === "all" || s.section.toUpperCase() === secFilter.toUpperCase();

      return matchesUsn && matchesBatch && matchesDept && matchesSem && matchesSec;
    });
  }, [processedStudents, usnFilter, batchFilter, deptFilter, semFilter, secFilter]);

  // 2. Assign relative ranks (1, 2, 3...) within the active selected subset
  const filteredWithRanks = useMemo(() => {
    const sortedDescending = [...filteredRawStudents].sort((a, b) => {
      if (b.rankScore !== a.rankScore) {
        return b.rankScore - a.rankScore;
      }
      if (b.academics !== a.academics) {
        return b.academics - a.academics;
      }
      return (a.name || "").localeCompare(b.name || "");
    });

    return sortedDescending.map((student, idx) => ({
      ...student,
      displayRank: idx + 1
    }));
  }, [filteredRawStudents]);

  // 3. Global absolute ranks for all college students
  const globalListWithRanks = useMemo(() => {
    const sortedDescending = [...processedStudents].sort((a, b) => {
      if (b.rankScore !== a.rankScore) return b.rankScore - a.rankScore;
      if (b.academics !== a.academics) return b.academics - a.academics;
      return (a.name || "").localeCompare(b.name || "");
    });
    return sortedDescending.map((student, idx) => ({
      ...student,
      globalRank: idx + 1
    }));
  }, [processedStudents]);

  // 4. Final list sorted according to sortOrder preference (High to Low / Low to High)
  const sortedFilteredStudents = useMemo(() => {
    return [...filteredWithRanks].sort((a, b) => {
      if (sortOrder === "asc") {
        return a.rankScore !== b.rankScore ? a.rankScore - b.rankScore : b.displayRank - a.displayRank;
      } else {
        return b.rankScore !== a.rankScore ? b.rankScore - a.rankScore : a.displayRank - b.displayRank;
      }
    });
  }, [filteredWithRanks, sortOrder]);

  // Logged in student details for integrated ranking header
  const myRankingData = useMemo(() => {
    const loggedUsn = (user?.student_id || user?.usn || "").toLowerCase();
    const loggedName = (user?.full_name || user?.name || "").toLowerCase();

    let foundInFiltered = filteredWithRanks.find(
      (s) => (loggedUsn && s.usn.toLowerCase() === loggedUsn) || (loggedName && s.name.toLowerCase() === loggedName)
    );

    if (foundInFiltered) {
      return { ...foundInFiltered, currentRank: foundInFiltered.displayRank };
    }

    let foundInGlobal = globalListWithRanks.find(
      (s) => (loggedUsn && s.usn.toLowerCase() === loggedUsn) || (loggedName && s.name.toLowerCase() === loggedName)
    );

    if (foundInGlobal) {
      return { ...foundInGlobal, currentRank: foundInGlobal.globalRank };
    }

    return globalListWithRanks[0] ? { ...globalListWithRanks[0], currentRank: globalListWithRanks[0].globalRank } : null;
  }, [filteredWithRanks, globalListWithRanks, user]);

  const filteredStudents = sortedFilteredStudents;

  const totalPages = Math.ceil(filteredStudents.length / pageSize) || 1;
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  const exportToExcel = () => {
    const headers = ["Rank,Student Name,USN,Batch,Department,Semester,Section,Academics (CGPA / %),Aptitude (%),Technical (%),HR Interview (%),Overall Performance (%)"];
    const rows = filteredStudents.map((s) => {
      return `${s.displayRank},"${s.name}",${s.usn},${s.batch},${s.department},${s.semester},${s.section},${s.academics.toFixed(2)} (${s.academics_pct.toFixed(1)}%),${s.aptitude.toFixed(2)},${s.technical.toFixed(2)},${s.hr_interview.toFixed(2)},${s.overall_performance.toFixed(2)}`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `KVG_TAP_Student_Rankings_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="student-rankings-wrapper-component">
      {/* 1. SEARCH & FILTER AREA */}
      <div className="rankings-filter-row">
        <div className="filter-input-wrap">
          <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="filter-text-input"
            placeholder="Enter Student USN or Name"
            value={usnFilter}
            onChange={(e) => {
              setUsnFilter(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="filter-select-wrap">
          <select
            className="filter-select"
            value={batchFilter}
            onChange={(e) => {
              setBatchFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">Batch (All)</option>
            <option value="2023">Batch 2023</option>
            <option value="2024">Batch 2024</option>
            <option value="2025">Batch 2025</option>
            <option value="2026">Batch 2026</option>
            <option value="2027">Batch 2027</option>
          </select>
        </div>

        <div className="filter-select-wrap">
          <select
            className="filter-select"
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">Department (All)</option>
            <option value="CSE">CSE - Computer Science</option>
            <option value="ECE">ECE - Electronics &amp; Comm.</option>
            <option value="ISE">ISE - Info Science</option>
            <option value="ME">ME - Mechanical Eng.</option>
            <option value="CV">CV - Civil Eng.</option>
            <option value="AI&DS">AI &amp; DS - AI &amp; Data Science</option>
          </select>
        </div>

        <div className="filter-select-wrap">
          <select
            className="filter-select"
            value={semFilter}
            onChange={(e) => {
              setSemFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">Sem (All)</option>
            <option value="1">Sem 1</option>
            <option value="2">Sem 2</option>
            <option value="3">Sem 3</option>
            <option value="4">Sem 4</option>
            <option value="5">Sem 5</option>
            <option value="6">Sem 6</option>
            <option value="7">Sem 7</option>
            <option value="8">Sem 8</option>
          </select>
        </div>

        <div className="filter-select-wrap">
          <select
            className="filter-select"
            value={secFilter}
            onChange={(e) => {
              setSecFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">Section (All)</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>
        </div>
      </div>

      {/* 2. SINGLE-SELECT RANKING CRITERIA SELECTION ROW */}
      <div className="criteria-selection-bar">
        <div className="criteria-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
          <span>Ranking Criteria:</span>
        </div>
        <div className="criteria-radio-group">
          <label className={`criteria-radio-label ${selectedCriteria === "overall" ? "active" : ""}`}>
            <input
              type="radio"
              name="rankingCriteria"
              checked={selectedCriteria === "overall"}
              onChange={() => {
                setSelectedCriteria("overall");
                setCurrentPage(1);
              }}
            />
            <span>Overall Performance</span>
          </label>

          <label className={`criteria-radio-label ${selectedCriteria === "academics" ? "active" : ""}`}>
            <input
              type="radio"
              name="rankingCriteria"
              checked={selectedCriteria === "academics"}
              onChange={() => {
                setSelectedCriteria("academics");
                setCurrentPage(1);
              }}
            />
            <span>Academics (CGPA / %)</span>
          </label>

          <label className={`criteria-radio-label ${selectedCriteria === "aptitude" ? "active" : ""}`}>
            <input
              type="radio"
              name="rankingCriteria"
              checked={selectedCriteria === "aptitude"}
              onChange={() => {
                setSelectedCriteria("aptitude");
                setCurrentPage(1);
              }}
            />
            <span>Aptitude</span>
          </label>

          <label className={`criteria-radio-label ${selectedCriteria === "technical" ? "active" : ""}`}>
            <input
              type="radio"
              name="rankingCriteria"
              checked={selectedCriteria === "technical"}
              onChange={() => {
                setSelectedCriteria("technical");
                setCurrentPage(1);
              }}
            />
            <span>Technical</span>
          </label>

          <label className={`criteria-radio-label ${selectedCriteria === "hr_interview" ? "active" : ""}`}>
            <input
              type="radio"
              name="rankingCriteria"
              checked={selectedCriteria === "hr_interview"}
              onChange={() => {
                setSelectedCriteria("hr_interview");
                setCurrentPage(1);
              }}
            />
            <span>HR Interview</span>
          </label>
        </div>
      </div>

      {/* 3. MAIN RANKING TABLE CARD WITH INTEGRATED MY RANKING BANNER & SORT ORDER */}
      <div className="rankings-table-card">
        <div className="table-card-header">
          <div className="card-header-left">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            <h3 className="card-header-title">{title}</h3>

            {/* Integrated My Rank Banner in Header */}
            {myRankingData && (
              <div className="integrated-my-rank-pill">
                <span className="my-rank-label">My Rank:</span>
                <span className="my-rank-num">#{myRankingData.currentRank}</span>
                <span className="my-rank-divider">|</span>
                <span className="my-rank-info">{myRankingData.name} ({myRankingData.usn})</span>
                <span className="my-rank-divider">|</span>
                <span className={`my-rank-score ${getScoreColorClass(myRankingData.overall_performance)}`}>
                  {myRankingData.overall_performance.toFixed(2)}%
                </span>
              </div>
            )}
          </div>

          <div className="card-header-actions-right">
            {/* RANK SORT ORDER DROPDOWN */}
            <div className="rank-sort-dropdown-wrap">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m3 16 4 4 4-4"/>
                <path d="M7 20V4"/>
                <path d="M11 4h10"/>
                <path d="M11 8h7"/>
                <path d="M11 12h4"/>
              </svg>
              <select
                className="rank-sort-select"
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  setCurrentPage(1);
                }}
                title="Sort Rank Order"
              >
                <option value="desc">High to Low (Rank 1 → Low)</option>
                <option value="asc">Low to High (Rank Low → 1)</option>
              </select>
            </div>

            {/* EXPORT CSV BUTTON */}
            <button className="export-excel-btn" onClick={exportToExcel} title="Export Student Rankings to CSV">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
                <line x1="3" y1="9" x2="21" y2="9"/>
                <line x1="3" y1="15" x2="21" y2="15"/>
              </svg>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* TABLE WRAPPER */}
        <div className="table-responsive-wrapper">
          {loading ? (
            <div className="table-loading-state">Loading rankings data...</div>
          ) : filteredStudents.length === 0 ? (
            <div className="table-empty-state">No students found matching your filter criteria.</div>
          ) : (
            <table className="rankings-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "center", width: "60px" }}>Rank</th>
                  <th>Student Name</th>
                  <th>USN</th>
                  <th style={{ textAlign: "center" }}>Batch</th>
                  <th>Department</th>
                  <th style={{ textAlign: "center" }}>Semester</th>
                  <th style={{ textAlign: "center" }}>Section</th>
                  <th style={{ textAlign: "right" }} className={selectedCriteria === "academics" ? "col-highlight" : ""}>Academics (CGPA / %)</th>
                  <th style={{ textAlign: "right" }} className={selectedCriteria === "aptitude" ? "col-highlight" : ""}>Aptitude</th>
                  <th style={{ textAlign: "right" }} className={selectedCriteria === "technical" ? "col-highlight" : ""}>Technical</th>
                  <th style={{ textAlign: "right" }} className={selectedCriteria === "hr_interview" ? "col-highlight" : ""}>HR Interview</th>
                  <th style={{ textAlign: "right" }} className={selectedCriteria === "overall" ? "col-highlight" : ""}>Overall Performance</th>
                </tr>
              </thead>
              <tbody>
                {paginatedStudents.map((student) => {
                  const isLoggedUser =
                    user &&
                    ((user.student_id && user.student_id.toLowerCase() === student.usn.toLowerCase()) ||
                      (user.usn && user.usn.toLowerCase() === student.usn.toLowerCase()) ||
                      (user.full_name && user.full_name.toLowerCase() === student.name.toLowerCase()));

                  return (
                    <tr key={student.usn} className={isLoggedUser ? "my-rank-row" : ""}>
                      <td style={{ textAlign: "center" }} className="rank-number-cell">
                        {student.displayRank}
                      </td>

                      <td className="font-semibold text-slate-800">
                        <button
                          className="student-name-link"
                          onClick={() => navigate(`/student/overview/${student.usn}`)}
                          title={`View profile for ${student.name}`}
                        >
                          {student.name}
                        </button>
                        {isLoggedUser && <span className="you-pill-tag">You</span>}
                      </td>

                      <td className="usn-cell">{student.usn}</td>

                      <td style={{ textAlign: "center" }} className="font-semibold">{student.batch}</td>

                      <td>
                        <span className="dept-label" title={student.department}>
                          {DEPT_FULL_NAMES[student.department] || student.department}
                        </span>
                      </td>

                      <td style={{ textAlign: "center" }} className="sem-cell">Sem {student.semester}</td>

                      <td style={{ textAlign: "center" }}>{student.section}</td>

                      {/* Academics (CGPA / %) */}
                      <td style={{ textAlign: "right" }} className={`score-cell ${selectedCriteria === "academics" ? "active-score" : ""}`}>
                        {student.academics.toFixed(2)}{" "}
                        <span className={`pct-subtext ${getScoreColorClass(student.academics_pct)}`}>
                          ({student.academics_pct.toFixed(1)}%)
                        </span>
                      </td>

                      {/* Aptitude */}
                      <td style={{ textAlign: "right" }} className={`score-cell ${selectedCriteria === "aptitude" ? "active-score" : ""} ${getScoreColorClass(student.aptitude)}`}>
                        {student.aptitude.toFixed(2)}%
                      </td>

                      {/* Technical */}
                      <td style={{ textAlign: "right" }} className={`score-cell ${selectedCriteria === "technical" ? "active-score" : ""} ${getScoreColorClass(student.technical)}`}>
                        {student.technical.toFixed(2)}%
                      </td>

                      {/* HR Interview */}
                      <td style={{ textAlign: "right" }} className={`score-cell ${selectedCriteria === "hr_interview" ? "active-score" : ""} ${getScoreColorClass(student.hr_interview)}`}>
                        {student.hr_interview.toFixed(2)}%
                      </td>

                      {/* Overall Performance */}
                      <td style={{ textAlign: "right" }} className={`score-cell font-bold ${getScoreColorClass(student.overall_performance)} ${selectedCriteria === "overall" ? "active-score" : ""}`}>
                        {student.overall_performance.toFixed(2)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* PAGINATION FOOTER */}
        {!loading && filteredStudents.length > 0 && (
          <div className="table-pagination-footer">
            <div className="pagination-left-info">
              <span className="pagination-text">
                Showing {(currentPage - 1) * pageSize + 1} to{" "}
                {Math.min(currentPage * pageSize, filteredStudents.length)} of {filteredStudents.length} students
              </span>

              {/* Rows Per Page Selector */}
              <div className="page-size-selector-wrap">
                <span className="page-size-label">Show:</span>
                <select
                  className="page-size-select"
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                >
                  <option value={25}>25 per page</option>
                  <option value={50}>50 per page</option>
                  <option value={100}>100 per page</option>
                </select>
              </div>
            </div>

            <div className="pagination-controls">
              <button
                className="page-next-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                style={{ opacity: currentPage === 1 ? 0.5 : 1 }}
              >
                &lt;
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                <button
                  key={pNum}
                  className={`page-num-btn ${currentPage === pNum ? "active" : ""}`}
                  onClick={() => setCurrentPage(pNum)}
                >
                  {pNum}
                </button>
              ))}

              <button
                className="page-next-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                style={{ opacity: currentPage === totalPages ? 0.5 : 1 }}
              >
                &gt;
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AcademicStudentRankingsTable;
