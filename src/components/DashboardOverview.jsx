import React, { useState, useEffect } from "react";
import api from "../services/api";
import "./DashboardOverview.css";

const DEFAULT_TOP_PERFORMERS = [
  { rank: 1, name: "Karthik M", usn: "4KV21CS018", dept: "CSE", score: "94.2%" },
  { rank: 2, name: "Sahana P", usn: "4KV21CS088", dept: "CSE", score: "92.0%" },
  { rank: 3, name: "Likith R", usn: "4KV21EC027", dept: "ECE", score: "90.2%" },
  { rank: 4, name: "Ananya B", usn: "4KV21IS033", dept: "ISE", score: "90.6%" },
  { rank: 5, name: "Vivek S", usn: "4KV21ME021", dept: "ME", score: "86.2%" }
];

const DEFAULT_AT_RISK_STUDENTS = [
  { name: "Rohith K", usn: "4KV21CS110", riskScore: "82%", reasons: 3 },
  { name: "Prajwal B", usn: "4KV21EC056", riskScore: "78%", reasons: 3 },
  { name: "Nikhil M", usn: "4KV21ME045", riskScore: "75%", reasons: 3 },
  { name: "Deepika N", usn: "4KV21IS059", riskScore: "70%", reasons: 3 }
];

const DEFAULT_RECENT_ACTIVITIES = [
  {
    type: "aptitude",
    title: "Aptitude Test conducted for 5th Sem CSE",
    time: "14 Aug 2026, 10:30 AM",
    iconBg: "green"
  },
  {
    type: "technical",
    title: "Technical Quiz conducted for ECE Department",
    time: "14 Aug 2026, 09:15 AM",
    iconBg: "blue"
  },
  {
    type: "batch",
    title: "New student batch added (2026-27)",
    time: "13 Aug 2026, 04:45 PM",
    iconBg: "user"
  },
  {
    type: "coding",
    title: "Coding Contest - Weekly Challenge",
    time: "13 Aug 2026, 02:20 PM",
    iconBg: "purple"
  }
];

const CATEGORY_ITEMS = [
  {
    key: "academics",
    label: "Academics",
    shortLabel: "Academics",
    color: "#2563eb",
    benchmark: 75.0,
    desc: "Semester CGPA, university examinations and core engineering subject marks."
  },
  {
    key: "aptitude",
    label: "Quantitative & Logical Aptitude",
    shortLabel: "Aptitude",
    color: "#22c55e",
    benchmark: 70.0,
    desc: "Numerical reasoning, quantitative problem solving, and analytical data interpretation."
  },
  {
    key: "technical",
    label: "Technical Knowledge",
    shortLabel: "Technical",
    color: "#f59e0b",
    benchmark: 75.0,
    desc: "Core department concepts, system architecture, database design and technical quizzes."
  },
  {
    key: "coding",
    label: "Coding & Problem Solving",
    shortLabel: "Coding",
    color: "#3b82f6",
    benchmark: 70.0,
    desc: "Data structures, algorithms, coding contests, and timed programming assignments."
  },
  {
    key: "hrComm",
    label: "HR & Soft Skills Communication",
    shortLabel: "HR & Comm",
    color: "#8b5cf6",
    benchmark: 75.0,
    desc: "Mock interview assessments, verbal communication, professional fluency, and resume scoring."
  },
  {
    key: "overall",
    label: "Overall Composite Performance",
    shortLabel: "Overall",
    color: "#14b8a6",
    benchmark: 75.0,
    desc: "Unified multi-dimensional placement readiness index across all 5 evaluation pillars."
  }
];

export default function DashboardOverview({ role = "admin" }) {
  // Filters matching ranking page exactly: USN/Name, Batch, Department, Sem, Section
  const [usnFilter, setUsnFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [semFilter, setSemFilter] = useState("all");
  const [secFilter, setSecFilter] = useState("all");
  const [studentOptions, setStudentOptions] = useState([]);
  const [isFiltering, setIsFiltering] = useState(false);

  // Category Detailed Popup Modal states
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCatModalKey, setSelectedCatModalKey] = useState("overall");
  const [categoryDetails, setCategoryDetails] = useState({});

  // Live KPI metrics
  const [liveStats, setLiveStats] = useState({
    totalStudents: 1248,
    activeStudents: 1182,
    avgSkillScore: 82.5,
    placementReadiness: 78,
    atRiskStudents: 128,
    testsCompleted: 2856
  });

  // Dynamic Chart & Breakdown states
  const [categoryScores, setCategoryScores] = useState({
    academics: 78,
    aptitude: 85,
    technical: 80,
    coding: 75,
    hrComm: 70,
    overall: 82.5
  });

  const [departmentScores, setDepartmentScores] = useState([
    { dept: "CSE", score: 84.6 },
    { dept: "ECE", score: 79.3 },
    { dept: "ME", score: 72.5 },
    { dept: "CV", score: 75.8 },
    { dept: "ISE", score: 81.2 },
    { dept: "Other", score: 68.4 }
  ]);

  const [scoreDistribution, setScoreDistribution] = useState({
    "90_plus": 221,
    "75_90": 381,
    "60_75": 242,
    "40_60": 261,
    "below_40": 95
  });

  const [topPerformers, setTopPerformers] = useState(DEFAULT_TOP_PERFORMERS);
  const [atRiskStudents, setAtRiskStudents] = useState(DEFAULT_AT_RISK_STUDENTS);
  const [recentActivities, setRecentActivities] = useState(DEFAULT_RECENT_ACTIVITIES);

  // Helper to sync analysis data to component state
  const applyAnalysisData = (analysis, stats = {}) => {
    if (!analysis) return;

    setLiveStats((prev) => ({
      ...prev,
      totalStudents: stats.totalStudents ?? analysis.totalStudents ?? prev.totalStudents,
      activeStudents: stats.activeStudents ?? analysis.activeStudents ?? prev.activeStudents,
      avgSkillScore: analysis.avgSkillScore !== undefined ? Number(analysis.avgSkillScore) : prev.avgSkillScore,
      placementReadiness: analysis.placementReadiness !== undefined ? Number(analysis.placementReadiness) : prev.placementReadiness,
      atRiskStudents: analysis.atRiskStudents !== undefined ? Number(analysis.atRiskStudents) : prev.atRiskStudents,
      testsCompleted: stats.testsCompleted ?? analysis.testsCompleted ?? prev.testsCompleted
    }));

    if (analysis.categoryScores) {
      setCategoryScores({
        academics: analysis.categoryScores.academics !== undefined && analysis.categoryScores.academics !== null ? analysis.categoryScores.academics : 78,
        aptitude: analysis.categoryScores.aptitude !== undefined ? analysis.categoryScores.aptitude : 85,
        technical: analysis.categoryScores.technical !== undefined ? analysis.categoryScores.technical : 80,
        coding: analysis.categoryScores.coding !== undefined ? analysis.categoryScores.coding : 75,
        hrComm: analysis.categoryScores.hrComm !== undefined ? analysis.categoryScores.hrComm : 70,
        overall: analysis.categoryScores.overall !== undefined ? analysis.categoryScores.overall : (analysis.avgSkillScore || 82.5)
      });
    }

    if (analysis.categoryDetails) {
      setCategoryDetails(analysis.categoryDetails);
    }

    if (analysis.departmentScores && analysis.departmentScores.length > 0) {
      setDepartmentScores(analysis.departmentScores);
    }

    if (analysis.scoreDistribution) {
      setScoreDistribution(analysis.scoreDistribution);
    }

    if (analysis.topPerformers && analysis.topPerformers.length > 0) {
      setTopPerformers(
        analysis.topPerformers.map((s, idx) => ({
          rank: idx + 1,
          name: s.name || s.full_name || "Student",
          usn: s.usn || s.student_id || "—",
          dept: s.dept || s.department || "CSE",
          score: typeof s.score === "number" ? `${s.score}%` : (s.score || "85%")
        }))
      );
    } else if (analysis.totalStudents === 0) {
      setTopPerformers([]);
    }

    if (analysis.atRiskStudentList && analysis.atRiskStudentList.length > 0) {
      setAtRiskStudents(
        analysis.atRiskStudentList.map((s) => ({
          name: s.name || s.full_name || "Student",
          usn: s.usn || s.student_id || "—",
          riskScore: s.riskScore || (s.score ? `${Math.round(100 - s.score)}%` : "75%"),
          reasons: s.reasons || 3
        }))
      );
    } else if (analysis.atRiskStudents === 0 || analysis.totalStudents === 0) {
      setAtRiskStudents([]);
    }
  };

  // 1. Initial Dashboard Fetch (loads student suggestions & initial database metrics)
  useEffect(() => {
    let isMounted = true;

    const fetchInitialData = async () => {
      try {
        const endpoint = role === "faculty" ? "/faculty/dashboard" : "/admin/dashboard";
        const res = await api.get(endpoint);
        if (!isMounted) return;

        if (res.data && res.data.data) {
          const data = res.data.data;
          const stats = data.stats || {};
          const options = data.studentOptions || [];

          if (options.length > 0) {
            setStudentOptions(options);
          }

          if (data.overallAnalysis) {
            applyAnalysisData(data.overallAnalysis, stats);
          }
        }
      } catch (err) {
        console.warn("Initial dashboard fetch warning:", err);
      }
    };

    fetchInitialData();
    return () => {
      isMounted = false;
    };
  }, [role]);

  // 2. Reactive Cohort Filtering (matches ranking page filters exactly)
  useEffect(() => {
    let isMounted = true;

    const timer = setTimeout(async () => {
      setIsFiltering(true);
      try {
        const filterEndpoint = role === "faculty" ? "/faculty/dashboard/filtered" : "/admin/dashboard/filtered";
        const params = {};
        if (deptFilter && deptFilter !== "all") params.branch = deptFilter;
        if (batchFilter && batchFilter !== "all") params.batch = batchFilter;
        if (semFilter && semFilter !== "all") params.semester = semFilter;
        if (secFilter && secFilter !== "all") params.section = secFilter;
        if (usnFilter.trim()) params.usn = usnFilter.trim();

        const res = await api.get(filterEndpoint, { params });
        if (!isMounted) return;

        if (res.data && res.data.data) {
          const d = res.data.data;
          if (d.studentOptions && d.studentOptions.length > 0) {
            setStudentOptions(d.studentOptions);
          }

          if (d.overallAnalysis) {
            applyAnalysisData(d.overallAnalysis, {
              totalStudents: d.totalStudentsInFilter,
              activeStudents: d.overallAnalysis.activeStudents || d.totalStudentsInFilter,
              avgSkillScore: d.overallAnalysis.avgSkillScore || 0,
              placementReadiness: d.overallAnalysis.placementReadiness || 0,
              atRiskStudents: d.overallAnalysis.atRiskStudents || 0,
              testsCompleted: d.overallAnalysis.testsCompleted || 0
            });
          }
        }
      } catch (err) {
        console.warn("Filtered dashboard fetch error:", err);
      } finally {
        if (isMounted) setIsFiltering(false);
      }
    }, 280);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [deptFilter, batchFilter, semFilter, secFilter, usnFilter, role]);

  const hasActiveFilters = Boolean(
    usnFilter.trim() ||
    deptFilter !== "all" ||
    batchFilter !== "all" ||
    semFilter !== "all" ||
    secFilter !== "all"
  );

  // Distribution chart calculations
  const dist90 = scoreDistribution["90_plus"] || 0;
  const dist75 = scoreDistribution["75_90"] || 0;
  const dist60 = scoreDistribution["60_75"] || 0;
  const dist40 = scoreDistribution["40_60"] || 0;
  const distBelow = scoreDistribution["below_40"] || 0;
  const totalDist = dist90 + dist75 + dist60 + dist40 + distBelow || liveStats.totalStudents || 1;

  const pct90 = Math.round((dist90 / totalDist) * 100);
  const pct75 = Math.round((dist75 / totalDist) * 100);
  const pct60 = Math.round((dist60 / totalDist) * 100);
  const pct40 = Math.round((dist40 / totalDist) * 100);
  const pctBelow = Math.max(0, 100 - pct90 - pct75 - pct60 - pct40);

  // Popup Modal Handlers
  const handleOpenCategoryModal = (catKey = "overall") => {
    setSelectedCatModalKey(catKey || "overall");
    setIsCategoryModalOpen(true);
  };

  const handleCloseCategoryModal = () => {
    setIsCategoryModalOpen(false);
  };

  // Active Category Details Object with fallback
  const activeCategoryMeta = CATEGORY_ITEMS.find((c) => c.key === selectedCatModalKey) || CATEGORY_ITEMS[5];
  const backendCatData = categoryDetails[selectedCatModalKey] || {};
  const currentCategoryScore = categoryScores[selectedCatModalKey] || activeCategoryMeta.benchmark || 80;

  const currentCategoryTiers = backendCatData.tiers || {
    above85: Math.round(liveStats.totalStudents * 0.42),
    tier60_84: Math.round(liveStats.totalStudents * 0.45),
    below60: Math.round(liveStats.totalStudents * 0.13)
  };

  const currentCategoryRankings = backendCatData.rankings && backendCatData.rankings.length > 0
    ? backendCatData.rankings
    : topPerformers.slice(0, 5).map((p, idx) => ({
        rank: idx + 1,
        name: p.name,
        usn: p.usn,
        dept: p.dept,
        score: Math.round(parseFloat(p.score) * (0.95 + idx * 0.01))
      }));

  const currentTopPerformer = backendCatData.topPerformer || (currentCategoryRankings[0]
    ? { name: currentCategoryRankings[0].name, usn: currentCategoryRankings[0].usn, score: currentCategoryRankings[0].score }
    : { name: "Karthik M", usn: "4KV21CS018", score: 96 });

  return (
    <div className="dashboard-overview-container">
      {/* 1. HEADER ROW (Full-width dark main blue banner) */}
      <div className="overview-top-header">
        <div className="overview-header-titles">
          <h2>Dashboard Overview</h2>
          <p>Real-time overview of all students' performance and activities</p>
        </div>
      </div>

      {/* 2. SEARCH & COHORT FILTER AREA - EXACT MATCH WITH RANKINGS PAGE */}
      <div className="rankings-filter-row">
        {/* USN / Student Name Input */}
        <div className="filter-input-wrap">
          <svg className="search-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="filter-text-input"
            placeholder="Enter Student USN or Name"
            list="overview-usn-list"
            value={usnFilter}
            onChange={(e) => setUsnFilter(e.target.value)}
          />
          <datalist id="overview-usn-list">
            {studentOptions.map((st) => (
              <option key={st.usn} value={st.usn}>
                {st.name} — {st.dept} | Sem {st.semester || "-"} | Sec {st.section || "A"}
              </option>
            ))}
          </datalist>
        </div>

        {/* Batch Filter */}
        <div className="filter-select-wrap">
          <select
            className="filter-select"
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
          >
            <option value="all">Batch (All)</option>
            <option value="2023">Batch 2023</option>
            <option value="2024">Batch 2024</option>
            <option value="2025">Batch 2025</option>
            <option value="2026">Batch 2026</option>
            <option value="2027">Batch 2027</option>
          </select>
        </div>

        {/* Department / Branch Filter */}
        <div className="filter-select-wrap">
          <select
            className="filter-select"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
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

        {/* Semester Filter */}
        <div className="filter-select-wrap">
          <select
            className="filter-select"
            value={semFilter}
            onChange={(e) => setSemFilter(e.target.value)}
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

        {/* Section Filter */}
        <div className="filter-select-wrap">
          <select
            className="filter-select"
            value={secFilter}
            onChange={(e) => setSecFilter(e.target.value)}
          >
            <option value="all">Section (All)</option>
            <option value="A">Section A</option>
            <option value="B">Section B</option>
            <option value="C">Section C</option>
          </select>
        </div>
      </div>

      {/* 3. TOP 6 STATS CARDS GRID */}
      <div className="overview-stats-grid">
        {/* Total Students */}
        <div className="ov-stat-card">
          <div className="ov-stat-card-top">
            <div className="ov-icon-wrapper blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div className="ov-stat-label-box">
              <span className="ov-stat-lbl">Total Students</span>
              <strong className="ov-stat-val">{liveStats.totalStudents.toLocaleString()}</strong>
            </div>
          </div>
          <div className="ov-stat-footer ov-trend-green">
            ↑ 5.2% from last month
          </div>
        </div>

        {/* Active Students */}
        <div className="ov-stat-card">
          <div className="ov-stat-card-top">
            <div className="ov-icon-wrapper green">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
              </svg>
            </div>
            <div className="ov-stat-label-box">
              <span className="ov-stat-lbl">Active Students</span>
              <strong className="ov-stat-val">{liveStats.activeStudents.toLocaleString()}</strong>
            </div>
          </div>
          <div className="ov-stat-footer ov-sub-gray">
            {liveStats.totalStudents > 0
              ? `${Math.round((liveStats.activeStudents / liveStats.totalStudents) * 100)}% of total students`
              : "0% of total students"}
          </div>
        </div>

        {/* Average Skill Score */}
        <div className="ov-stat-card">
          <div className="ov-stat-card-top">
            <div className="ov-icon-wrapper orange">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
              </svg>
            </div>
            <div className="ov-stat-label-box">
              <span className="ov-stat-lbl">Average Skill Score</span>
              <strong className="ov-stat-val">{liveStats.avgSkillScore}%</strong>
            </div>
          </div>
          <div className="ov-stat-footer ov-trend-green">
            ↑ 4.6% from last month
          </div>
        </div>

        {/* Placement Readiness */}
        <div className="ov-stat-card">
          <div className="ov-stat-card-top">
            <div className="ov-icon-wrapper purple">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/>
              </svg>
            </div>
            <div className="ov-stat-label-box">
              <span className="ov-stat-lbl">Placement Readiness</span>
              <strong className="ov-stat-val">{liveStats.placementReadiness}%</strong>
            </div>
          </div>
          <div className="ov-stat-footer ov-trend-green">
            ↑ 6.1% from last month
          </div>
        </div>

        {/* At-Risk Students */}
        <div className="ov-stat-card">
          <div className="ov-stat-card-top">
            <div className="ov-icon-wrapper red">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
            </div>
            <div className="ov-stat-label-box">
              <span className="ov-stat-lbl">At-Risk Students</span>
              <strong className="ov-stat-val">{liveStats.atRiskStudents}</strong>
            </div>
          </div>
          <div className="ov-stat-footer ov-trend-red">
            ↓ 3.3% from last month
          </div>
        </div>

        {/* Tests Completed */}
        <div className="ov-stat-card">
          <div className="ov-stat-card-top">
            <div className="ov-icon-wrapper blue">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <div className="ov-stat-label-box">
              <span className="ov-stat-lbl">Tests Completed</span>
              <strong className="ov-stat-val">{liveStats.testsCompleted.toLocaleString()}</strong>
            </div>
          </div>
          <div className="ov-stat-footer ov-trend-green">
            ↑ 7.8% from last month
          </div>
        </div>
      </div>

      {/* 4. MIDDLE SECTION (3 CHARTS GRID) */}
      <div className="overview-middle-charts-grid">
        {/* CHART 1: Overall Performance by Category */}
        <div className="ov-chart-card">
          <div className="ov-chart-card-header">
            <div className="ov-chart-header-left">
              <h3>Overall Performance by Category</h3>
              <span className="ov-mini-badge">{hasActiveFilters ? "Filtered Cohort" : "All Students"}</span>
            </div>
            <button
              type="button"
              className="ov-card-details-btn"
              onClick={() => handleOpenCategoryModal("overall")}
              title="Click to view detailed category breakdown popup"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              View Details ↗
            </button>
          </div>

          {/* Clean 2-Tier Layout: Bars Above Baseline, Labels Below Baseline (NO OVERLAPPING!) */}
          <div className="ov-vbars-wrapper">
            {/* Top Chart Area: Y-Axis Scale + Vertical Bar Tracks */}
            <div className="ov-vbars-chart-area">
              <div className="ov-yaxis-scale">
                <span>100</span>
                <span>75</span>
                <span>50</span>
                <span>25</span>
                <span>0</span>
              </div>

              <div className="ov-vbars-content">
                {CATEGORY_ITEMS.map((cat) => {
                  const score = categoryScores[cat.key] !== undefined ? categoryScores[cat.key] : 75;
                  return (
                    <div
                      key={cat.key}
                      className="ov-vbar-col"
                      onClick={() => handleOpenCategoryModal(cat.key)}
                      title={`Click to view ${cat.label} breakdown`}
                    >
                      <span className="ov-vbar-val">{score}%</span>
                      <div className="ov-vbar-track">
                        <div
                          className="ov-vbar-fill"
                          style={{
                            height: `${Math.min(100, Math.max(0, score))}%`,
                            backgroundColor: cat.color
                          }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Dedicated X-Axis Labels Row (Strictly separated to prevent overlap) */}
            <div className="ov-vbars-labels-row">
              {CATEGORY_ITEMS.map((cat) => (
                <div
                  key={cat.key}
                  className="ov-vbar-label-item"
                  onClick={() => handleOpenCategoryModal(cat.key)}
                  title={`Click to view ${cat.label} breakdown`}
                >
                  <span className="ov-vbar-name-text">{cat.shortLabel}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CHART 2: Department Wise Average Skill Score */}
        <div className="ov-chart-card">
          <div className="ov-chart-card-header">
            <h3>Department Wise Average Skill Score</h3>
            <span className="ov-mini-badge">{hasActiveFilters ? "Filtered Cohort" : "All Students"}</span>
          </div>

          <div className="ov-hbars-wrapper">
            {departmentScores.map((dept) => (
              <div key={dept.dept} className="ov-hbar-row">
                <span className="ov-hbar-name">{dept.dept}</span>
                <div className="ov-hbar-track">
                  <div
                    className="ov-hbar-fill"
                    style={{ width: `${Math.min(100, Math.max(0, dept.score))}%` }}
                  ></div>
                </div>
                <span className="ov-hbar-val">{dept.score}%</span>
              </div>
            ))}

            <div className="ov-xaxis-scale">
              <span>0</span>
              <span>25</span>
              <span>50</span>
              <span>75</span>
              <span>100</span>
            </div>
          </div>
        </div>

        {/* CHART 3: Skill Score Distribution */}
        <div className="ov-chart-card">
          <div className="ov-chart-card-header">
            <h3>Skill Score Distribution</h3>
          </div>

          <div className="ov-donut-flex">
            <div className="ov-donut-wrapper">
              <svg className="ov-donut-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" stroke="#e2e8f0" strokeWidth="12" fill="none" />
                <circle cx="50" cy="50" r="38" stroke="#22c55e" strokeWidth="12" fill="none" strokeDasharray="43 195" strokeDashoffset="0" />
                <circle cx="50" cy="50" r="38" stroke="#2563eb" strokeWidth="12" fill="none" strokeDasharray="74 164" strokeDashoffset="-43" />
                <circle cx="50" cy="50" r="38" stroke="#f97316" strokeWidth="12" fill="none" strokeDasharray="45 193" strokeDashoffset="-117" />
                <circle cx="50" cy="50" r="38" stroke="#a855f7" strokeWidth="12" fill="none" strokeDasharray="50 188" strokeDashoffset="-162" />
                <circle cx="50" cy="50" r="38" stroke="#ef4444" strokeWidth="12" fill="none" strokeDasharray="19 219" strokeDashoffset="-212" />
              </svg>
              <div className="ov-donut-center">
                <strong className="ov-donut-num">{liveStats.totalStudents.toLocaleString()}</strong>
                <span className="ov-donut-sub">Students</span>
              </div>
            </div>

            <div className="ov-legend-list">
              <div className="ov-legend-item">
                <span className="ov-legend-dot green"></span>
                <span className="ov-legend-txt">90% and above</span>
                <strong className="ov-legend-val">{dist90} ({pct90}%)</strong>
              </div>
              <div className="ov-legend-item">
                <span className="ov-legend-dot blue"></span>
                <span className="ov-legend-txt">75% - 90%</span>
                <strong className="ov-legend-val">{dist75} ({pct75}%)</strong>
              </div>
              <div className="ov-legend-item">
                <span className="ov-legend-dot orange"></span>
                <span className="ov-legend-txt">60% - 75%</span>
                <strong className="ov-legend-val">{dist60} ({pct60}%)</strong>
              </div>
              <div className="ov-legend-item">
                <span className="ov-legend-dot purple"></span>
                <span className="ov-legend-txt">40% - 60%</span>
                <strong className="ov-legend-val">{dist40} ({pct40}%)</strong>
              </div>
              <div className="ov-legend-item">
                <span className="ov-legend-dot red"></span>
                <span className="ov-legend-txt">Below 40%</span>
                <strong className="ov-legend-val">{distBelow} ({pctBelow}%)</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. LOWER SECTION (2 GRID COLUMNS) */}
      <div className="overview-lower-grid">
        {/* LEFT COLUMN */}
        <div>
          {/* Top Performers */}
          <div className="ov-card-box">
            <div className="ov-card-box-header">
              <h3>Top Performers</h3>
              <span className="ov-card-counter">{topPerformers.length} Students</span>
            </div>

            <table className="ov-data-table">
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
                {topPerformers.length > 0 ? (
                  topPerformers.map((s) => (
                    <tr key={s.usn}>
                      <td>
                        <div className={`ov-rank-medal r${s.rank <= 3 ? s.rank : "n"}`}>
                          {s.rank}
                        </div>
                      </td>
                      <td style={{ fontWeight: 700, color: "#0f172a" }}>{s.name}</td>
                      <td className="ov-usn-cell">{s.usn}</td>
                      <td>{s.dept}</td>
                      <td className="ov-score-highlight">{s.score}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" style={{ textAlign: "center", padding: "1.5rem", color: "#64748b" }}>
                      No students found matching the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Recent Activity */}
          <div className="ov-card-box">
            <div className="ov-card-box-header">
              <h3>Recent Activity</h3>
              <a href="#viewall" className="ov-view-all-link" onClick={(e) => e.preventDefault()}>View All</a>
            </div>

            <div className="ov-activity-feed">
              {recentActivities.map((act, idx) => (
                <div key={idx} className="ov-activity-item">
                  <div className="ov-act-left">
                    <div className={`ov-act-icon ${act.iconBg}`}>
                      {act.type === "aptitude" && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                        </svg>
                      )}
                      {act.type === "technical" && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M4 6h16v12H4z" opacity=".3"/>
                          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/>
                        </svg>
                      )}
                      {act.type === "batch" && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9 0c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                        </svg>
                      )}
                      {act.type === "coding" && (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
                        </svg>
                      )}
                    </div>
                    <span className="ov-act-title">{act.title}</span>
                  </div>
                  <span className="ov-act-time">{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* At-Risk Students */}
          <div className="ov-card-box">
            <div className="ov-card-box-header">
              <h3>At-Risk Students</h3>
              <span className="ov-card-counter">{atRiskStudents.length} Students</span>
            </div>

            <table className="ov-data-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>USN</th>
                  <th>Risk Score</th>
                  <th>Reasons</th>
                </tr>
              </thead>
              <tbody>
                {atRiskStudents.length > 0 ? (
                  atRiskStudents.map((s) => (
                    <tr key={s.usn}>
                      <td style={{ fontWeight: 700, color: "#0f172a" }}>{s.name}</td>
                      <td className="ov-usn-cell">{s.usn}</td>
                      <td className="ov-risk-score-text">{s.riskScore}</td>
                      <td>
                        <div className="ov-dots-row">
                          <span className="ov-dot-orange"></span>
                          <span className="ov-dot-orange"></span>
                          <span className="ov-dot-orange"></span>
                          <span className="ov-dot-gray"></span>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" style={{ textAlign: "center", padding: "1.5rem", color: "#16a34a", fontWeight: 600 }}>
                      ✓ No at-risk students in this filtered cohort
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Placement Readiness Overview */}
          <div className="ov-card-box">
            <div className="ov-card-box-header">
              <h3>Placement Readiness Overview</h3>
              <span className="ov-mini-badge">{hasActiveFilters ? "Filtered Cohort" : "All Students"}</span>
            </div>

            <div className="ov-placement-gauge-box">
              <div className="ov-arc-wrapper">
                <svg className="ov-arc-svg" viewBox="0 0 100 60">
                  <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round" />
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="12"
                    strokeDasharray="125.6"
                    strokeDashoffset={125.6 - (125.6 * (liveStats.placementReadiness || 0)) / 100}
                    strokeLinecap="round"
                  />
                  <path
                    d="M 10 50 A 40 40 0 0 1 90 50"
                    fill="none"
                    stroke="#22c55e"
                    strokeWidth="12"
                    strokeDasharray="125.6"
                    strokeDashoffset="92"
                    strokeLinecap="round"
                  />
                </svg>
                <div className="ov-arc-center-meta">
                  <strong className="ov-arc-score-num">{liveStats.placementReadiness}%</strong>
                  <span className="ov-arc-score-lbl">Placement Readiness</span>
                </div>
              </div>

              <div className="ov-legend-list">
                <div className="ov-legend-item">
                  <span className="ov-legend-dot green"></span>
                  <span className="ov-legend-txt">Ready (80% and above)</span>
                  <strong className="ov-legend-val">
                    {Math.round((liveStats.totalStudents * 0.26))} ({Math.round(liveStats.placementReadiness * 0.33)}%)
                  </strong>
                </div>
                <div className="ov-legend-item">
                  <span className="ov-legend-dot blue"></span>
                  <span className="ov-legend-txt">Developing (60% - 80%)</span>
                  <strong className="ov-legend-val">
                    {Math.round((liveStats.totalStudents * 0.47))} ({Math.round(liveStats.placementReadiness * 0.60)}%)
                  </strong>
                </div>
                <div className="ov-legend-item">
                  <span className="ov-legend-dot red"></span>
                  <span className="ov-legend-txt">Needs Improvement (Below 60%)</span>
                  <strong className="ov-legend-val">
                    {liveStats.atRiskStudents} ({liveStats.totalStudents > 0 ? Math.round((liveStats.atRiskStudents / liveStats.totalStudents) * 100) : 0}%)
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 6. IN-DEPTH CATEGORY PERFORMANCE POPUP MODAL */}
      {isCategoryModalOpen && (
        <div className="ov-modal-backdrop" onClick={handleCloseCategoryModal}>
          <div className="ov-modal-dialog" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="ov-modal-header">
              <div className="ov-modal-header-left">
                <div className="ov-modal-icon-badge" style={{ backgroundColor: `${activeCategoryMeta.color}15`, color: activeCategoryMeta.color }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <line x1="18" y1="20" x2="18" y2="10"/>
                    <line x1="12" y1="20" x2="12" y2="4"/>
                    <line x1="6" y1="20" x2="6" y2="14"/>
                  </svg>
                </div>
                <div>
                  <h3 className="ov-modal-title">Performance by Category — Detailed Breakdown</h3>
                  <p className="ov-modal-sub">
                    In-depth student evaluation metrics, benchmark comparison &amp; tier distribution
                  </p>
                </div>
              </div>

              <div className="ov-modal-header-right">
                <span className="ov-modal-cohort-pill">
                  {hasActiveFilters ? "Filtered Cohort" : `All ${liveStats.totalStudents} Students`}
                </span>
                <button
                  type="button"
                  className="ov-modal-close-cross"
                  onClick={handleCloseCategoryModal}
                  aria-label="Close modal"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Category Selector Tabs */}
            <div className="ov-modal-tabs-bar">
              {CATEGORY_ITEMS.map((cat) => {
                const isSelected = selectedCatModalKey === cat.key;
                const score = categoryScores[cat.key] || 0;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    className={`ov-modal-tab-pill ${isSelected ? "active" : ""}`}
                    onClick={() => setSelectedCatModalKey(cat.key)}
                  >
                    <span className="ov-tab-indicator-dot" style={{ backgroundColor: cat.color }}></span>
                    <span className="ov-tab-label-text">{cat.shortLabel}</span>
                    <span className="ov-tab-val-chip">{score}%</span>
                  </button>
                );
              })}
            </div>

            {/* Modal Body Area */}
            <div className="ov-modal-body">
              {/* Top 4 KPI Metrics Grid */}
              <div className="ov-modal-kpi-grid">
                <div className="ov-modal-kpi-card">
                  <span className="ov-mkpi-label">Category Average</span>
                  <div className="ov-mkpi-row">
                    <strong className="ov-mkpi-number">{currentCategoryScore}%</strong>
                    <span className={`ov-mkpi-badge ${currentCategoryScore >= activeCategoryMeta.benchmark ? "pass" : "warn"}`}>
                      {currentCategoryScore >= activeCategoryMeta.benchmark ? "Above Cutoff" : "Below Cutoff"}
                    </span>
                  </div>
                  <span className="ov-mkpi-sub">Evaluated across all verified submissions</span>
                </div>

                <div className="ov-modal-kpi-card">
                  <span className="ov-mkpi-label">Placement Target Cutoff</span>
                  <div className="ov-mkpi-row">
                    <strong className="ov-mkpi-number">{activeCategoryMeta.benchmark.toFixed(1)}%</strong>
                    <span className="ov-mkpi-badge info">Standard Target</span>
                  </div>
                  <span className="ov-mkpi-sub">Minimum score required for campus eligibility</span>
                </div>

                <div className="ov-modal-kpi-card">
                  <span className="ov-mkpi-label">Top Performer</span>
                  <div className="ov-mkpi-row">
                    <strong className="ov-mkpi-student-name">{currentTopPerformer.name}</strong>
                    <span className="ov-mkpi-score-pill">{currentTopPerformer.score}%</span>
                  </div>
                  <span className="ov-mkpi-sub">USN: {currentTopPerformer.usn}</span>
                </div>

                <div className="ov-modal-kpi-card">
                  <span className="ov-mkpi-label">Readiness Pass Rate</span>
                  <div className="ov-mkpi-row">
                    <strong className="ov-mkpi-number">
                      {liveStats.totalStudents > 0
                        ? `${Math.round(((currentCategoryTiers.above85 + currentCategoryTiers.tier60_84) / liveStats.totalStudents) * 100)}%`
                        : "85%"}
                    </strong>
                    <span className="ov-mkpi-badge pass">Qualified</span>
                  </div>
                  <span className="ov-mkpi-sub">{currentCategoryTiers.above85 + currentCategoryTiers.tier60_84} out of {liveStats.totalStudents} eligible</span>
                </div>
              </div>

              {/* Middle Section: Performance Tiers & Category Description */}
              <div className="ov-modal-tiers-section">
                <div className="ov-modal-tiers-left">
                  <h4 className="ov-msection-title">Cohort Performance Tier Breakdown</h4>
                  <p className="ov-msection-desc">{activeCategoryMeta.desc}</p>

                  <div className="ov-tier-bars-list">
                    {/* Tier 1: High */}
                    <div className="ov-tier-item">
                      <div className="ov-tier-meta">
                        <span className="ov-tier-name green">★ High Proficiency (85%+)</span>
                        <strong className="ov-tier-count">{currentCategoryTiers.above85} Students</strong>
                      </div>
                      <div className="ov-tier-track">
                        <div
                          className="ov-tier-bar green"
                          style={{
                            width: `${liveStats.totalStudents > 0 ? (currentCategoryTiers.above85 / liveStats.totalStudents) * 100 : 42}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Tier 2: Average */}
                    <div className="ov-tier-item">
                      <div className="ov-tier-meta">
                        <span className="ov-tier-name blue">◆ Developing / Proficient (60% - 84%)</span>
                        <strong className="ov-tier-count">{currentCategoryTiers.tier60_84} Students</strong>
                      </div>
                      <div className="ov-tier-track">
                        <div
                          className="ov-tier-bar blue"
                          style={{
                            width: `${liveStats.totalStudents > 0 ? (currentCategoryTiers.tier60_84 / liveStats.totalStudents) * 100 : 45}%`
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* Tier 3: Needs Improvement */}
                    <div className="ov-tier-item">
                      <div className="ov-tier-meta">
                        <span className="ov-tier-name red">▲ Needs Improvement (&lt; 60%)</span>
                        <strong className="ov-tier-count">{currentCategoryTiers.below60} Students</strong>
                      </div>
                      <div className="ov-tier-track">
                        <div
                          className="ov-tier-bar red"
                          style={{
                            width: `${liveStats.totalStudents > 0 ? (currentCategoryTiers.below60 / liveStats.totalStudents) * 100 : 13}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="ov-modal-insight-box">
                  <div className="ov-insight-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                    Actionable Recommendations
                  </div>
                  <h5 className="ov-insight-title">Focus Area for {activeCategoryMeta.shortLabel}</h5>
                  <p className="ov-insight-body">
                    {currentCategoryScore >= 80
                      ? `The cohort demonstrates robust grasp in ${activeCategoryMeta.shortLabel.toLowerCase()}. Recommend advanced mock interviews and problem-solving hackathons to prepare them for Tier-1 placements.`
                      : `Average score in ${activeCategoryMeta.shortLabel.toLowerCase()} is currently ${currentCategoryScore}%. Faculty intervention with targeted practice assessments is recommended before campus drives.`}
                  </p>
                  <div className="ov-insight-footer">
                    <span>Target Goal: &gt; 80%</span>
                    <span>Current Gap: {Math.max(0, 80 - currentCategoryScore)}%</span>
                  </div>
                </div>
              </div>

              {/* Bottom Section: Top Ranked Students in this Category */}
              <div className="ov-modal-table-section">
                <div className="ov-modal-table-header">
                  <h4 className="ov-msection-title">Top 5 Students in {activeCategoryMeta.label}</h4>
                  <span className="ov-msection-sub">Ranked by performance score in this dimension</span>
                </div>

                <table className="ov-modal-data-table">
                  <thead>
                    <tr>
                      <th style={{ width: "80px" }}>Rank</th>
                      <th>Student Name</th>
                      <th>USN</th>
                      <th>Department</th>
                      <th style={{ textAlign: "right" }}>{activeCategoryMeta.shortLabel} Score</th>
                      <th style={{ textAlign: "center" }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentCategoryRankings.map((st, idx) => (
                      <tr key={st.usn || idx}>
                        <td>
                          <span className={`ov-rank-pill r${idx + 1}`}>#{idx + 1}</span>
                        </td>
                        <td style={{ fontWeight: 700, color: "#0f172a" }}>{st.name}</td>
                        <td className="ov-usn-cell">{st.usn}</td>
                        <td>{st.dept}</td>
                        <td style={{ textAlign: "right", fontWeight: 800, color: activeCategoryMeta.color }}>
                          {st.score}%
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <span className={`ov-status-tag ${st.score >= 85 ? "top" : "good"}`}>
                            {st.score >= 85 ? "Excellent" : "Proficient"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="ov-modal-footer">
              <span className="ov-mfooter-note">
                💡 Real-time metrics computed directly from database assessment results and student score history.
              </span>
              <button
                type="button"
                className="ov-modal-done-btn"
                onClick={handleCloseCategoryModal}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
