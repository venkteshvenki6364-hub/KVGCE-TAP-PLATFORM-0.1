import React, { useState, useEffect, useCallback } from "react";
import api from "../services/api";
import "./DashboardOverview.css";

const BRANCHES = ["CSE", "ECE", "ME", "CV", "ISE"];
const YEARS    = ["1", "2", "3", "4"];
const SEMESTERS = ["1", "2", "3", "4", "5", "6", "7", "8"];
const SECTIONS = ["A", "B", "C", "D"];

const CAT_BARS = [
  { key: "academics", label: "Acad.",  color: "academics" },
  { key: "aptitude",  label: "Aptit.", color: "aptitude"  },
  { key: "technical", label: "Tech.",  color: "technical" },
  { key: "coding",    label: "Code",   color: "coding"    },
  { key: "hrComm",    label: "HR",     color: "hrcomm"    },
  { key: "overall",   label: "Avg",    color: "overall",  bold: true },
];

export default function DashboardOverview({ role = "admin", dashboardData = null }) {
  const [dateRange, setDateRange] = useState("01 Feb 2026 - 14 Aug 2026");

  /* ── Filter state ─────────────────────────────────────────────────────── */
  const [filters, setFilters] = useState({ branch: "all", year: "all", semester: "all", section: "all" });
  const [isFiltering, setIsFiltering] = useState(false);
  const [filterLabel, setFilterLabel] = useState("");

  const [liveStats, setLiveStats] = useState({
    totalStudents: 0, activeStudents: 0,
    avgSkillScore: null, placementReadiness: null,
    atRiskStudents: null, testsCompleted: 0
  });
  const [categoryScores, setCategoryScores] = useState({
    academics: null, aptitude: null, technical: null,
    coding: null, hrComm: null, overall: null
  });
  const [departmentScores, setDepartmentScores] = useState([]);
  const [topPerformers, setTopPerformers] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [scoreDistribution, setScoreDistribution] = useState({});
  const [atRiskStudents, setAtRiskStudents] = useState([]);
  const displayMetric = (value, suffix = "") =>
    value === null || value === undefined ? "—" : `${value}${suffix}`;

  /* ── Shared data applier ──────────────────────────────────────────────── */
  const applyAnalysis = useCallback((overall, students) => {
    setLiveStats(prev => ({
      ...prev,
      totalStudents:      overall.totalStudents      !== undefined ? overall.totalStudents      : prev.totalStudents,
      activeStudents:     overall.activeStudents     !== undefined ? overall.activeStudents     : prev.activeStudents,
      avgSkillScore:      overall.avgSkillScore      !== undefined ? overall.avgSkillScore : prev.avgSkillScore,
      placementReadiness: overall.placementReadiness !== undefined ? overall.placementReadiness : prev.placementReadiness,
      atRiskStudents:     overall.atRiskStudents     !== undefined ? overall.atRiskStudents     : prev.atRiskStudents,
      testsCompleted:     overall.testsCompleted     !== undefined ? overall.testsCompleted : prev.testsCompleted,
    }));
    if (overall.categoryScores) setCategoryScores(overall.categoryScores);
    if (Array.isArray(overall.departmentScores)) setDepartmentScores(overall.departmentScores);
    if (overall.scoreDistribution) setScoreDistribution(overall.scoreDistribution);
    if (Array.isArray(overall.atRiskStudentList)) setAtRiskStudents(overall.atRiskStudentList);
    if (Array.isArray(overall.recentActivity)) {
      setRecentActivities(overall.recentActivity.map((activity) => ({
        type: String(activity.category || "").toLowerCase(),
        title: `${activity.title} — ${activity.student}`,
        time: activity.time ? new Date(activity.time).toLocaleString() : "Recently",
        iconBg: "blue",
      })));
    }

    const performers = overall.topPerformers || [];
    if (performers.length > 0) {
      setTopPerformers(performers.slice(0, 5).map((s, idx) => ({
        rank: idx + 1,
        name: s.name || "Student",
        usn:  s.usn  || "—",
        dept: s.dept || "—",
        score: typeof s.score === "number" ? `${s.score.toFixed(1)}%` : String(s.score)
      })));
    } else if (students && students.length > 0) {
      setTopPerformers(students.slice(0, 5).map((s, idx) => ({
        rank: idx + 1,
        name: s.full_name || s.name || "Student",
        usn:  s.student_id || s.usn || `4KV21CS0${idx + 10}`,
        dept: s.department ? (s.department.includes("Computer") ? "CSE" : s.department.slice(0, 3).toUpperCase()) : "CSE",
        score: s.skill_score || s.skillScore ? `${Number(s.skill_score || s.skillScore).toFixed(1)}%` : "—"
      })));
    }
  }, []);

  useEffect(() => {
    if (dashboardData) {
      applyAnalysis(
        dashboardData.overallAnalysis || {},
        dashboardData.recentStudents || dashboardData.recentUsers || []
      );
    }
  }, [dashboardData, applyAnalysis]);

  /* ── Initial load ─────────────────────────────────────────────────────── */
  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const endpoint = role === "faculty" ? "/faculty/dashboard" : "/admin/dashboard";
        const res = await api.get(endpoint);
        if (res.data?.data) {
          const { overallAnalysis = {}, recentStudents, recentUsers } = res.data.data;
          applyAnalysis(overallAnalysis, recentStudents || recentUsers || []);
        }
      } catch (err) { console.error("Dashboard overview request failed:", err); }
    };
    fetchDashboard();
  }, [role, applyAnalysis]);

  /* ── Filtered fetch ────────────────────────────────────────────────────── */
  useEffect(() => {
    const { branch, year, semester, section } = filters;
    const isDefault = branch === "all" && year === "all" && semester === "all" && section === "all";
    if (isDefault) { setFilterLabel(""); return; }

    const fetchFiltered = async () => {
      setIsFiltering(true);
      try {
        const params = new URLSearchParams();
        if (branch  !== "all") params.append("branch",  branch);
        if (year    !== "all") params.append("year",    year);
        if (semester !== "all") params.append("semester", semester);
        if (section !== "all") params.append("section", section);
        const base = role === "faculty" ? "/faculty/dashboard/filtered" : "/admin/dashboard/filtered";
        const res = await api.get(`${base}?${params.toString()}`);
        if (res.data?.data) {
          const { overallAnalysis = {}, recentStudents } = res.data.data;
          applyAnalysis(overallAnalysis, recentStudents || []);
          const parts = [];
          if (branch  !== "all") parts.push(branch);
          if (year    !== "all") parts.push(`Year ${year}`);
          if (semester !== "all") parts.push(`Sem ${semester}`);
          if (section !== "all") parts.push(`Sec-${section}`);
          setFilterLabel(parts.join(" · "));
        }
      } catch (err) { console.warn("Filtered dashboard fetch error:", err); }
      finally { setIsFiltering(false); }
    };
    fetchFiltered();
  }, [filters, role, applyAnalysis]);

  const handleFilterChange = (key, val) => setFilters(prev => ({ ...prev, [key]: val }));
  const resetFilters = () => setFilters({ branch: "all", year: "all", semester: "all", section: "all" });

  /* ── Filter pill helper ─────────────────────────────────────────────── */
  const FilterPill = () => filterLabel ? (
    <span className="ov-chart-filter-pill">
      <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
      {filterLabel}
    </span>
  ) : null;

  /* ── Arc calculation ────────────────────────────────────────────────── */
  const pct    = liveStats.placementReadiness || 0;
  const CIRC   = 125.6;
  const filled = (pct / 100) * CIRC;
  const distributionTotal = Object.values(scoreDistribution).reduce((sum, value) => sum + value, 0);
  const distributionSegments = [
    { key: "90_plus", cls: "green", txt: "90%+", color: "#22c55e" },
    { key: "75_90", cls: "blue", txt: "75–90%", color: "#2563eb" },
    { key: "60_75", cls: "orange", txt: "60–75%", color: "#f97316" },
    { key: "40_60", cls: "purple", txt: "40–60%", color: "#a855f7" },
    { key: "below_40", cls: "red", txt: "Below 40%", color: "#ef4444" },
  ];
  let distributionOffset = 0;

  return (
    <div className="dashboard-overview-container">

      {/* ── HEADER ────────────────────────────────────────────────────── */}
      <div className="overview-top-header">
        <div className="overview-header-titles">
          <h2>Dashboard Overview</h2>
          <p>Real-time performance analytics — filter by branch, year &amp; section below</p>
        </div>
        <div className="overview-date-picker-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="overview-date-select">
            <option value="01 Feb 2026 - 14 Aug 2026">01 Feb 2026 – 14 Aug 2026</option>
            <option value="01 Jan 2026 - 31 Jul 2026">01 Jan 2026 – 31 Jul 2026</option>
            <option value="Last 30 Days">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* ── FILTER ROW ─────────────────────────────────────────────────── */}
      <div className="ov-filter-row">
        <div className="ov-filter-row-left">
          <svg className="ov-filter-icon" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
          </svg>
          <span className="ov-filter-label">Filter Students:</span>

          <div className="ov-filter-group">
            <label className="ov-filter-tag">Branch</label>
            <select id="ov-filter-branch" className="ov-filter-select" value={filters.branch}
              onChange={e => handleFilterChange("branch", e.target.value)}>
              <option value="all">All Branches</option>
              {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="ov-filter-group">
            <label className="ov-filter-tag">Year</label>
            <select id="ov-filter-year" className="ov-filter-select" value={filters.year}
              onChange={e => handleFilterChange("year", e.target.value)}>
              <option value="all">All Years</option>
              {YEARS.map(y => <option key={y} value={y}>Year {y}</option>)}
            </select>
          </div>

          <div className="ov-filter-group">
            <label className="ov-filter-tag">Semester</label>
            <select id="ov-filter-semester" className="ov-filter-select" value={filters.semester}
              onChange={e => handleFilterChange("semester", e.target.value)}>
              <option value="all">All Semesters</option>
              {SEMESTERS.map(s => <option key={s} value={s}>Semester {s}</option>)}
            </select>
          </div>

          <div className="ov-filter-group">
            <label className="ov-filter-tag">Section</label>
            <select id="ov-filter-section" className="ov-filter-select" value={filters.section}
              onChange={e => handleFilterChange("section", e.target.value)}>
              <option value="all">All Sections</option>
              {SECTIONS.map(s => <option key={s} value={s}>Sec {s}</option>)}
            </select>
          </div>
        </div>

        <div className="ov-filter-row-right">
          {isFiltering && (
            <span className="ov-filter-loading"><span className="ov-spin"/> Updating…</span>
          )}
          {filterLabel && !isFiltering && (
            <span className="ov-active-badge">
              <svg width="9" height="9" viewBox="0 0 24 24" fill="#22c55e"><circle cx="12" cy="12" r="10"/></svg>
              {filterLabel}
            </span>
          )}
          {(filters.branch !== "all" || filters.year !== "all" || filters.semester !== "all" || filters.section !== "all") && (
            <button className="ov-reset-filter-btn" onClick={resetFilters}>✕ Reset</button>
          )}
        </div>
      </div>

      {/* ── KPI CARDS ───────────────────────────────────────────────────── */}
      <div className="overview-stats-grid">
        {[
          { label: "Total Students",    val: liveStats.totalStudents.toLocaleString(),  icon: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z", color: "blue",   foot: "↑ 5.2% from last month", footCls: "ov-trend-green"  },
          { label: "Active Students",   val: liveStats.activeStudents.toLocaleString(), icon: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z", color: "green",  foot: `${liveStats.totalStudents > 0 ? Math.round((liveStats.activeStudents/liveStats.totalStudents)*100) : 94}% of total`, footCls: "ov-sub-gray" },
          { label: "Avg Skill Score",   val: displayMetric(liveStats.avgSkillScore, "%"), icon: "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z", color: "orange", foot: "Submitted-attempt average", footCls: "ov-sub-gray" },
          { label: "Placement Ready",   val: displayMetric(liveStats.placementReadiness, "%"), icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z", color: "purple", foot: "Not calculated", footCls: "ov-sub-gray" },
          { label: "At-Risk Students",  val: displayMetric(liveStats.atRiskStudents), icon: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z", color: "red", foot: "Not calculated", footCls: "ov-sub-gray" },
          { label: "Tests Completed",   val: liveStats.testsCompleted.toLocaleString(), icon: "M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z", color: "blue",  foot: "↑ 7.8% from last month", footCls: "ov-trend-green"  },
        ].map(({ label, val, icon, color, foot, footCls }) => (
          <div className="ov-stat-card" key={label}>
            <div className="ov-stat-card-top">
              <div className={`ov-icon-wrapper ${color}`}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d={icon}/></svg>
              </div>
              <div className="ov-stat-label-box">
                <span className="ov-stat-lbl">{label}</span>
                <strong className="ov-stat-val">{val}</strong>
              </div>
            </div>
            <div className={`ov-stat-footer ${footCls}`}>{foot}</div>
          </div>
        ))}
      </div>

      {/* ── CHARTS ROW ───────────────────────────────────────────────────── */}
      <div className="overview-middle-charts-grid">

        {/* CHART 1 — Performance by Category (vertical bars) */}
        <div className="ov-chart-card">
          <div className="ov-chart-card-header">
            <div className="ov-chart-title-group">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ov-chart-title-icon blue">
                <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
              </svg>
              <h3>Performance by Category</h3>
            </div>
            <FilterPill/>
          </div>
          <div className="ov-vbars-wrapper">
            <div className="ov-yaxis-scale">
              <span>100</span><span>75</span><span>50</span><span>25</span><span>0</span>
            </div>
            <div className="ov-vbars-content">
              {CAT_BARS.map(({ key, label, color, bold }) => (
                <div className="ov-vbar-col" key={key}>
                  <span className="ov-vbar-val" style={bold ? { fontWeight: 800 } : {}}>
                    {displayMetric(categoryScores[key], "%")}
                  </span>
                  <div className="ov-vbar-track">
                    <div className={`ov-vbar-fill ${color}`} style={{ height: `${Math.min(categoryScores[key] || 0, 100)}%` }}/>
                  </div>
                  <span className="ov-vbar-label" style={bold ? { fontWeight: 800, color: "#0f172a" } : {}}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CHART 2 — Dept Avg Skill Score (horizontal bars) */}
        <div className="ov-chart-card">
          <div className="ov-chart-card-header">
            <div className="ov-chart-title-group">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ov-chart-title-icon purple">
                <rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/>
              </svg>
              <h3>Dept. Avg Skill Score</h3>
            </div>
            <FilterPill/>
          </div>
          <div className="ov-hbars-wrapper">
            {departmentScores.map((d, i) => (
              <div key={i} className="ov-hbar-row">
                <span className="ov-hbar-name">{d.dept}</span>
                <div className="ov-hbar-track">
                  <div className="ov-hbar-fill" style={{ width: `${Math.min(d.score, 100)}%` }}/>
                </div>
                <span className="ov-hbar-val">{d.score}%</span>
              </div>
            ))}
            <div className="ov-xaxis-scale">
              <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
            </div>
          </div>
        </div>

        {/* CHART 3 — Score Distribution (donut) */}
        <div className="ov-chart-card">
          <div className="ov-chart-card-header">
            <div className="ov-chart-title-group">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ov-chart-title-icon orange">
                <circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10"/>
              </svg>
              <h3>Score Distribution</h3>
            </div>
            <FilterPill/>
          </div>
          <div className="ov-donut-flex">
            <div className="ov-donut-wrapper">
              <svg className="ov-donut-svg" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" stroke="#e2e8f0" strokeWidth="12" fill="none"/>
                {distributionSegments.map(({ key, color }) => {
                  const segment = distributionTotal ? (scoreDistribution[key] / distributionTotal) * 239 : 0;
                  const offset = distributionOffset;
                  distributionOffset += segment;
                  return <circle key={key} cx="50" cy="50" r="38" stroke={color} strokeWidth="12" fill="none" strokeDasharray={`${segment} ${239 - segment}`} strokeDashoffset={-offset}/>;
                })}
              </svg>
              <div className="ov-donut-center">
                <strong className="ov-donut-num">{liveStats.totalStudents.toLocaleString()}</strong>
                <span className="ov-donut-sub">Students</span>
              </div>
            </div>
            <div className="ov-legend-list">
              {distributionSegments.map(({ key, cls, txt }) => (
                <div className="ov-legend-item" key={cls}>
                  <span className={`ov-legend-dot ${cls}`}/>
                  <span className="ov-legend-txt">{txt}</span>
                  <strong className="ov-legend-val">{distributionTotal ? `${Math.round(scoreDistribution[key] / distributionTotal * 100)}%` : "—"}</strong>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── LOWER SECTION ────────────────────────────────────────────────── */}
      <div className="overview-lower-grid">

        {/* LEFT — Top Performers + Recent Activity */}
        <div>
          <div className="ov-card-box">
            <div className="ov-card-box-header">
              <div className="ov-chart-title-group">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ov-chart-title-icon gold">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                <h3>Top Performers</h3>
              </div>
              <FilterPill/>
            </div>
            <table className="ov-data-table">
              <thead>
                <tr><th>#</th><th>Student</th><th>USN</th><th>Dept</th><th>Score</th></tr>
              </thead>
              <tbody>
                {topPerformers.length === 0 && (
                  <tr><td colSpan="5" className="ov-empty-state">No submitted student performance yet.</td></tr>
                )}
                {topPerformers.map(s => (
                  <tr key={s.usn}>
                    <td><div className={`ov-rank-medal r${s.rank <= 3 ? s.rank : "n"}`}>{s.rank}</div></td>
                    <td className="ov-td-name">{s.name}</td>
                    <td className="ov-usn-cell">{s.usn}</td>
                    <td><span className="ov-dept-badge">{s.dept}</span></td>
                    <td className="ov-score-highlight">{s.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ov-card-box">
            <div className="ov-card-box-header">
              <div className="ov-chart-title-group">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ov-chart-title-icon blue">
                  <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                </svg>
                <h3>Recent Activity</h3>
              </div>
            </div>
            <div className="ov-activity-feed">
              {recentActivities.length === 0 && (
                <div className="ov-empty-state">No recent activity recorded.</div>
              )}
              {recentActivities.map((act, idx) => (
                <div key={idx} className="ov-activity-item">
                  <div className="ov-act-left">
                    <div className={`ov-act-icon ${act.iconBg}`}>
                      {act.type === "aptitude"  && <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>}
                      {act.type === "technical" && <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12z"/></svg>}
                      {act.type === "batch"     && <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M15 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm-9 0c2.21 0 4-1.79 4-4S8.21 4 6 4 2 5.79 2 8s1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>}
                      {act.type === "coding"    && <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>}
                    </div>
                    <span className="ov-act-title">{act.title}</span>
                  </div>
                  <span className="ov-act-time">{act.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT — Summary Stats + Placement Arc */}
        <div>
          <div className="ov-card-box">
            <div className="ov-card-box-header">
              <div className="ov-chart-title-group">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ov-chart-title-icon red">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <h3>At-Risk Students</h3>
              </div>
              <FilterPill/>
            </div>
            <div className="ov-risk-list">
              {atRiskStudents.length === 0 && <div className="ov-empty-state">No students below the risk threshold.</div>}
              {atRiskStudents.slice(0, 5).map((student) => (
                <div className="ov-risk-row" key={student.usn}>
                  <div>
                    <strong>{student.name}</strong>
                    <span>{student.usn}</span>
                  </div>
                  <strong className="ov-risk-score-text">{student.score}%</strong>
                </div>
              ))}
            </div>
            {/* Summary metrics remain available in the KPI row above. */}
            <div className="ov-summary-grid" style={{ display: "none" }}>
              {[
                { cls: "blue",   icon: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5z", val: liveStats.totalStudents.toLocaleString(),  label: "Total Students"    },
                { cls: "green",  icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z",                                                                                                     val: liveStats.activeStudents.toLocaleString(), label: "Active Students"    },
                { cls: "orange", icon: "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z",                                                                                                                                                   val: `${liveStats.avgSkillScore}%`,             label: "Avg Skill Score"   },
                { cls: "red",    icon: "M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z",                                                                                                                                                                         val: String(liveStats.atRiskStudents),          label: "At-Risk Students"  },
                { cls: "purple", icon: "M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z",                                                   val: liveStats.testsCompleted.toLocaleString(), label: "Tests Completed"   },
                { cls: "teal",   icon: "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm0-14c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm0 10c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z", val: `${liveStats.placementReadiness}%`,       label: "Placement Ready"   },
              ].map(({ cls, icon, val, label }) => (
                <div className={`ov-summary-item ${cls}`} key={label}>
                  <span className="ov-summary-icon"><svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d={icon}/></svg></span>
                  <div><strong>{val}</strong><span>{label}</span></div>
                </div>
              ))}
            </div>
          </div>

          <div className="ov-card-box">
            <div className="ov-card-box-header">
              <div className="ov-chart-title-group">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ov-chart-title-icon teal">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
                </svg>
                <h3>Placement Readiness</h3>
              </div>
              <FilterPill/>
            </div>
            <div className="ov-placement-gauge-box">
              <div className="ov-arc-wrapper">
                <svg className="ov-arc-svg" viewBox="0 0 100 60">
                  <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="#e2e8f0" strokeWidth="12" strokeLinecap="round"/>
                  <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="url(#arcGrad)" strokeWidth="12"
                    strokeDasharray={`${filled} ${CIRC - filled}`} strokeDashoffset="0" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#2563eb"/><stop offset="100%" stopColor="#22c55e"/>
                    </linearGradient>
                  </defs>
                </svg>
                <div className="ov-arc-center-meta">
                  <strong className="ov-arc-score-num">{pct}%</strong>
                  <span className="ov-arc-score-lbl">Ready</span>
                </div>
              </div>
              <div className="ov-legend-list">
                <div className="ov-legend-item"><span className="ov-legend-dot green"/><span className="ov-legend-txt">Ready (≥80%)</span><strong className="ov-legend-val">{pct}%</strong></div>
                <div className="ov-legend-item"><span className="ov-legend-dot blue"/><span className="ov-legend-txt">Developing (60–80%)</span><strong className="ov-legend-val">{Math.max(0, 100 - pct - 10)}%</strong></div>
                <div className="ov-legend-item"><span className="ov-legend-dot red"/><span className="ov-legend-txt">Needs Work (&lt;60%)</span><strong className="ov-legend-val">{Math.min(30, 100 - pct)}%</strong></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
