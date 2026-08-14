import { useState } from "react";
import "./About.css";

const heroPillars = [
  {
    id: "growth",
    title: "A Smarter Way to Track Student Growth",
    description:
      "Automated activity tracking, credit points calculation, skill matrix visualization, and real-time performance analytics for continuous academic and professional progression.",
    accent: "growth-accent",
    badge: "Analytics & Tracking",
    features: [
      "Real-time Performance Graphs & Skill Radar",
      "Automated Credit & Certificate Verification",
      "Comprehensive Activity Log & History",
    ],
    stat: "98% Growth Tracked",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19V5M4 19h16M7 15l3-4 3 2 4-6" />
      </svg>
    ),
  },
  {
    id: "readiness",
    title: "From Learning to Career Readiness",
    description:
      "Interactive code compilers, aptitude challenge suites, departmental technical quizzes, and AI-driven career guidance to bridge academic preparation with top industry placements.",
    accent: "readiness-accent",
    badge: "Placement Preparation",
    features: [
      "Online Multi-language Code Practice Engine",
      "500+ Quantitative & Technical Assessments",
      "24/7 AI-Powered Resume & Career Insights",
    ],
    stat: "500+ Practice Labs",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    id: "platform",
    title: "Three Roles, One Connected Ecosystem",
    description:
      "Synchronizing students, faculty evaluators, and institutional administrators in a transparent ecosystem designed to streamline skill verification and performance monitoring.",
    accent: "platform-accent",
    badge: "Unified Ecosystem",
    features: [
      "Role-Tailored Dashboards (Student, Faculty, Admin)",
      "Multi-level Activity Verification Workflow",
      "Department & College Leaderboards",
    ],
    stat: "3 Connected Portals",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm14 10v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

const platformModules = [
  {
    title: "Aptitude Assessment",
    desc: "Quantitative, Logical Reasoning, and Verbal Ability tests with timed practice sessions.",
    icon: "🧮",
    color: "#2563eb",
  },
  {
    title: "Coding Practice Lab",
    desc: "Interactive code editor supporting C, C++, Java, and Python with automated test case evaluation.",
    icon: "💻",
    color: "#059669",
  },
  {
    title: "Technical Quiz Suite",
    desc: "Domain-specific MCQs spanning Computer Science, Electronics, Mechanical, and Civil Engineering.",
    icon: "📝",
    color: "#7c3aed",
  },
  {
    title: "Activity & Certificate Tracker",
    desc: "Log workshops, seminars, internships, and certifications with direct faculty approval.",
    icon: "🏆",
    color: "#d97706",
  },
  {
    title: "AI Career Assistant",
    desc: "Intelligent chatbot providing personalized study recommendations, resume reviews, and interview prep.",
    icon: "🤖",
    color: "#0284c7",
  },
  {
    title: "Institutional Analytics",
    desc: "Real-time rank leaderboards, department performance heatmaps, and placement eligibility reports.",
    icon: "📊",
    color: "#dc2626",
  },
];

const statsData = [
  { value: "2,500+", label: "Active Engineering Students" },
  { value: "150+", label: "Verified Faculty Mentors" },
  { value: "500+", label: "Practice Tests & Code Labs" },
  { value: "98%", label: "Placement Career Readiness" },
];

function About() {
  const [hoveredPillar, setHoveredPillar] = useState(null);

  return (
    <section className="about-section section-shell" id="about">
      <div className="page-container">

        {/* SECTION HEADER */}
        <div className="about-main-header">
          <span className="about-eyebrow-badge">
            ABOUT KVGCE TAP PLATFORM
          </span>

          <h2 className="about-section-heading">
            A Smarter Way to Track Student Growth &amp; Placement Readiness
          </h2>

          <p className="about-section-subtext">
            KVGCE TAP connects students, faculty mentors, and placement officers in a unified digital ecosystem designed for continuous skill development, real-time assessment analytics, and automated activity verification.
          </p>
        </div>

        {/* THREE SIGNATURE ELEVATED PILLAR CARDS (NO LIGHT BLUE) */}
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
                  Explore Details →
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

        {/* PLATFORM MODULES GRID */}
        <div className="modules-showcase-section">
          <div className="modules-header">
            <h3>Comprehensive Training &amp; Assessment Modules</h3>
            <p>Everything students need to excel in academic assessments and campus recruitment drives.</p>
          </div>

          <div className="modules-grid">
            {platformModules.map((mod, index) => (
              <div className="module-card" key={index}>
                <div className="module-icon" style={{ backgroundColor: `${mod.color}15`, color: mod.color }}>
                  {mod.icon}
                </div>
                <h4>{mod.title}</h4>
                <p>{mod.desc}</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}

export default About;