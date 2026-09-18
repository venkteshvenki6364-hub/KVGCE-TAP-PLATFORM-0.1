import { useState } from "react";
import "./About.css";

const heroPillars = [
  {
    id: "growth",
    title: "Continuous Student Skill & Activity Engine",
    description:
      "Automated activity tracking, VTU-aligned credit point calculation, skill radar visualization, and real-time performance analytics for continuous academic and placement progression.",
    accent: "growth-accent",
    badge: "Analytics & Credit Engine",
    features: [
      "Real-time Performance Graphs & Skill Radar",
      "Automated Credit & Certificate Verification",
      "Comprehensive Activity Log & Skill Matrix",
    ],
    stat: "98% Growth Tracked",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19V5M4 19h16M7 15l3-4 3 2 4-6" />
      </svg>
    ),
  },
  {
    id: "readiness",
    title: "Integrated Assessment & Coding Lab",
    description:
      "Multi-language online code compilers (C, C++, Java, Python), aptitude challenge suites, departmental technical quizzes, and AI career guidance for top placements.",
    accent: "readiness-accent",
    badge: "Placement Preparation",
    features: [
      "Online Multi-language Code Practice Compiler",
      "500+ Quantitative, Verbal & Technical Tests",
      "24/7 AI Resume & HR Interview Assistant",
    ],
    stat: "500+ Practice Labs",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    id: "platform",
    title: "Triple-Role Institutional Governance",
    description:
      "Connecting students, faculty evaluators, and placement administrators in a transparent ecosystem with mandatory registration approval and role governance.",
    accent: "platform-accent",
    badge: "Governance & Verification",
    features: [
      "Role-Tailored Dashboards (Student, Faculty, Admin)",
      "Mandatory Admin Verification & Approval Flow",
      "Department & College Leaderboards",
    ],
    stat: "3 Connected Portals",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

const statsData = [
  { value: "35+", label: "Years of Academic Excellence" },
  { value: "2,500+", label: "Active Engineering Students" },
  { value: "150+", label: "Expert Faculty Mentors" },
  { value: "98%", label: "Placement & Skill Readiness" },
];

function About() {
  const [hoveredPillar, setHoveredPillar] = useState(null);

  return (
    <section className="about-section section-shell" id="about">
      <div className="page-container">

        {/* SECTION HEADER */}
        <div className="about-main-header">
          <span className="about-eyebrow-badge">
            ABOUT KVGCE TAP PLATFORM &amp; SPECIFICATIONS
          </span>

          <h2 className="about-section-heading">
            Next-Generation Student Activity Tracking &amp; Placement Readiness
          </h2>

          <p className="about-section-subtext">
            KVGCE TAP (Activity Tracking &amp; Management System) bridges academic learning with career placement. It provides real-time skill analytics, faculty verification workflows, and AI-powered career development tools for KVG College of Engineering.
          </p>
        </div>

        {/* ABOUT KVG COLLEGE OF ENGINEERING INSTITUTION HIGHLIGHT */}
        <div className="institution-highlight-card">
          <div className="inst-header-row">
            <img src="/KVGCE_logo.png" alt="KVGCE Logo" className="inst-badge-logo" />
            <div>
              <span className="inst-sub-eyebrow">ESTABLISHED 1989 • SULLIA, D.K.</span>
              <h3 className="inst-title">KVG College of Engineering</h3>
              <p className="inst-affiliation">
                Sponsored by Academy of Liberal Education (R) • Affiliated to VTU, Belagavi • Approved by AICTE, New Delhi
              </p>
            </div>
          </div>
          <p className="inst-description">
            KVG College of Engineering is one of Karnataka's premier engineering institutions, founded by visionary leader <strong>Dr. K. V. Gowda</strong>. Over 35+ years, the college has nurtured thousands of successful engineers across Computer Science, Electronics, Mechanical, Civil, and AI/ML disciplines. TAP is the flagship digital platform designed to elevate student skill profiles to global placement standards.
          </p>
        </div>

        {/* THREE SIGNATURE ELEVATED PILLAR CARDS */}
        <div className="about-pillars-grid">
          {heroPillars.map((pillar) => (
            <div
              key={pillar.id}
              className={`pillar-card ${pillar.accent} ${
                hoveredPillar === pillar.id ? "hovered" : ""
              }`}
              onMouseEnter={() => setHoveredPillar(pillar.id)}
              onMouseLeave={() => setHoveredPillar(null)}
            >
              <div className="pillar-header">
                <div className="pillar-icon-box">{pillar.icon}</div>
                <span className="pillar-badge">{pillar.badge}</span>
              </div>

              <h3 className="pillar-title">{pillar.title}</h3>
              <p className="pillar-description">{pillar.description}</p>

              <ul className="pillar-features-list">
                {pillar.features.map((feat, idx) => (
                  <li key={idx}>
                    <span className="check-mark">✓</span>
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>

              <div className="pillar-footer">
                <span className="pillar-stat-pill">{pillar.stat}</span>
                <a href="#how-it-works" className="pillar-action-link">
                  Explore Specs →
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* LIVE STATS COUNTER BAR */}
        <div className="about-stats-bar">
          {statsData.map((stat, i) => (
            <div className="stat-box" key={i}>
              <span className="stat-number">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

export default About;