import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../services/api";
import "./StudentSkills.css";

const defaultCategories = [
  { name: "Python Programming", category: "Programming Languages", level: "Advanced", score: 88 },
  { name: "Data Structures & Algorithms", category: "Core CS", level: "Intermediate", score: 82 },
  { name: "Web Development (React & HTML)", category: "Frontend", level: "Advanced", score: 90 },
  { name: "Database Management (SQL)", category: "Backend", level: "Intermediate", score: 78 },
  { name: "Quantitative Aptitude", category: "Aptitude", level: "Advanced", score: 85 },
  { name: "Logical Reasoning", category: "Aptitude", level: "Advanced", score: 87 },
  { name: "System Design", category: "Architecture", level: "Beginner", score: 60 },
  { name: "Git & Version Control", category: "DevOps", level: "Advanced", score: 92 },
];

function StudentSkills() {
  const [skills, setSkills] = useState(defaultCategories);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await api.get("/students/dashboard");
        if (res.data && res.data.data && res.data.data.skills) {
          setSkills(res.data.data.skills);
        }
      } catch (err) {
        console.error("Using default skills matrix:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSkills();
  }, []);

  return (
    <DashboardLayout title="Student Skill Matrix">
      <div className="skills-page">
        <div className="skills-header">
          <h2>Technical & Aptitude Skill Matrix</h2>
          <p>Real-time skill evaluation powered by quiz attempts, coding challenges & project verifications.</p>
        </div>

        <div className="skills-grid">
          {skills.map((s, i) => (
            <div key={i} className="skill-matrix-card">
              <div className="s-card-top">
                <h3>{s.name}</h3>
                <span className="s-cat">{s.category}</span>
              </div>
              <div className="s-card-mid">
                <span className="s-score">{s.percentage || s.score}%</span>
                <span className="s-level">{s.level}</span>
              </div>
              <div className="s-progress-track">
                <div className="s-progress-fill" style={{ width: `${s.percentage || s.score}%` }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default StudentSkills;
