import "./About.css";

const features = [
  {
    title: "Assess",
    description:
      "Evaluate student skills through tests, coding tasks, aptitude and assessments.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 7h16M4 12h10M4 17h7" />
      </svg>
    ),
  },
  {
    title: "Track",
    description:
      "Monitor activities, submissions, progress and learning performance.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19V5M4 19h16M7 15l3-4 3 2 4-6" />
      </svg>
    ),
  },
  {
    title: "Analyze",
    description:
      "Use performance data, graphs and skill analysis to identify strengths and improvement areas.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19V5M8 19v-8M12 19v-5M16 19v-11M20 19V9" />
      </svg>
    ),
  },
  {
    title: "Improve",
    description:
      "Provide feedback and personalized insights to help students become career ready.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 16l6-6 4 4 6-8M14 6h6v6" />
      </svg>
    ),
  },
];

function About() {
  return (
    <section className="about-section section-shell" id="about">
      <div className="page-container about-layout">
        <div className="about-copy reveal-up">
          <p className="section-eyebrow">About TAP</p>

          <h2 className="section-title about-title">
            A Smarter Way to Track Student Growth
          </h2>

          <p className="section-lead about-description">
            TAP – Activity Tracking &amp; Management System is a centralized
            platform designed to assess, monitor, and analyze student skills
            and academic activities. It connects students, faculty, and
            administrators through a single system for continuous performance
            tracking and career preparation.
          </p>

          <a className="about-link" href="#how-it-works">
            Explore the Workflow
          </a>
        </div>

        <div className="about-grid reveal-up">
          {features.map((feature) => (
            <article className="about-card" key={feature.title}>
              <div className="about-card-icon" aria-hidden="true">
                {feature.icon}
              </div>

              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

export default About;