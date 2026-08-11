import "./HowItWorks.css";

const steps = [
  {
    number: "01",
    title: "Login & Register",
    description:
      "Secure access for students, faculty and administrators based on their roles.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 20h14M12 4a4 4 0 1 0 0 8M8 14h6a3 3 0 0 1 3 3v3H5v-3a3 3 0 0 1 3-3Z" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Take Tests & Tasks",
    description:
      "Complete aptitude, coding, MCQ, communication and skill-based activities.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7 5h10M7 9h10M7 13h6M5 3h14v18H5z" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Evaluation & Scoring",
    description:
      "Evaluate submissions and calculate marks, accuracy, time and efficiency.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 19h14M7 17V9m4 8V5m4 12v-6" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Track Performance",
    description:
      "Monitor progress through performance graphs, activity history and skill analysis.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 19V5M4 19h16M7 15l3-4 3 2 5-7" />
      </svg>
    ),
  },
  {
    number: "05",
    title: "Rankings & Analysis",
    description:
      "Generate class, department, college and skill-wise rankings.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l2.2 4.8 5.3.7-3.8 3.6.9 5.3L12 15.8 7.4 17.4l.9-5.3L4.5 8.5l5.3-.7L12 3z" />
      </svg>
    ),
  },
  {
    number: "06",
    title: "Improve & Prepare",
    description:
      "Use feedback and performance insights to improve skills and career readiness.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 19h14M12 4v12m0 0l-4-4m4 4 4-4" />
      </svg>
    ),
  },
];

const roles = [
  {
    id: "student",
    title: "Student",
    tone: "student",
    description:
      "Take assessments, submit work, view results and stay informed about progress.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 13a4 4 0 1 0-4-4 4 4 0 0 0 4 4Zm-7 9v-2a7 7 0 0 1 14 0v2" />
      </svg>
    ),
    items: [
      "Take Tests & Tasks",
      "Submit Assignments",
      "View Results",
      "Track Progress",
      "View Rankings",
      "Receive Feedback",
    ],
  },
  {
    id: "faculty",
    title: "Faculty",
    tone: "faculty",
    description:
      "Create assessments, evaluate submissions and guide students with feedback.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 6h16v12H4zM8 6V4h8v2M7 10h10M7 14h6" />
      </svg>
    ),
    items: [
      "Create Tests",
      "Assign Tasks",
      "Evaluate Submissions",
      "Track Students",
      "View Analytics",
      "Provide Feedback",
    ],
  },
  {
    id: "admin",
    title: "Admin",
    tone: "admin",
    description:
      "Manage users, categories, analytics, settings and platform security.",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3l7 4v5c0 5-3.5 8-7 9-3.5-1-7-4-7-9V7zM9 12l2 2 4-5" />
      </svg>
    ),
    items: [
      "Manage Users",
      "Manage Categories",
      "Monitor System",
      "View Analytics",
      "Manage Settings",
      "Security & Backup",
    ],
  },
];

function HowItWorks() {
  return (
    <section className="how-section section-shell" id="how-it-works">
      <div className="page-container">

        {/* Header */}
        <header className="how-header reveal-up">
          <p className="section-eyebrow">How It Works</p>

          <h2 className="section-title">
            From Learning to Career Readiness
          </h2>

          <p className="section-lead how-lead">
            TAP connects students, faculty and administrators through one
            centralized platform for skill assessment, activity tracking,
            performance analysis and career preparation.
          </p>
        </header>

        {/* Six Steps */}
        <div className="how-process">
          {[
            steps.slice(0, 3),
            steps.slice(3, 6),
          ].map((row) => (
            <div className="process-row" key={row[0].number}>
              {row.map((step, index) => (
                <div className="process-group" key={step.number}>

                  <article className="process-card">
                    <div className="process-top">

                      <span className="process-number">
                        {step.number}
                      </span>

                      <span
                        className="process-icon"
                        aria-hidden="true"
                      >
                        {step.icon}
                      </span>

                    </div>

                    <h3>{step.title}</h3>

                    <p>{step.description}</p>
                  </article>

                  {index < row.length - 1 && (
                    <div
                      className="process-connector"
                      aria-hidden="true"
                    >
                      <span></span>
                    </div>
                  )}

                </div>
              ))}
            </div>
          ))}
        </div>

        {/* Roles */}
        <section className="roles-panel reveal-up">

          <div className="roles-header">
            <p className="section-eyebrow">
              Role Section
            </p>

            <h2 className="section-title">
              Three Roles, One Connected Platform
            </h2>
          </div>

          <div className="roles-grid">

            {roles.map((role) => (
              <article
                className={`role-card ${role.tone}`}
                id={role.id}
                key={role.title}
              >

                <div
                  className="role-icon"
                  aria-hidden="true"
                >
                  {role.icon}
                </div>

                <h3>{role.title}</h3>

                <p>{role.description}</p>

                <ul>
                  {role.items.map((item) => (
                    <li key={item}>
                      {item}
                    </li>
                  ))}
                </ul>

              </article>
            ))}

          </div>
        </section>

      </div>
    </section>
  );
}

export default HowItWorks;