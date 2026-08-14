import { useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import "./TechnicalQuizModule.css";

const technicalQuizzes = [
  {
    id: "t1",
    title: "Python & Data Science Fundamentals",
    questionsCount: 15,
    duration: 20,
    category: "Programming",
    difficulty: "Intermediate",
  },
  {
    id: "t2",
    title: "DBMS & SQL Query Optimization",
    questionsCount: 12,
    duration: 15,
    category: "Database",
    difficulty: "Advanced",
  },
  {
    id: "t3",
    title: "Data Structures & Algorithmic Complexity",
    questionsCount: 10,
    duration: 15,
    category: "Core CS",
    difficulty: "Hard",
  },
  {
    id: "t4",
    title: "React JS & Modern Frontend Architecture",
    questionsCount: 15,
    duration: 20,
    category: "Web Tech",
    difficulty: "Intermediate",
  },
];

function TechnicalQuizModule() {
  return (
    <DashboardLayout title="Technical Subject Quizzes">
      <div className="tech-quiz-page">
        <div className="tech-quiz-header">
          <h2>Technical Domain Quizzes</h2>
          <p>Sharpen your core engineering skills with timed subject-wise quizzes.</p>
        </div>

        <div className="quiz-cards-grid">
          {technicalQuizzes.map((q) => (
            <div key={q.id} className="quiz-card">
              <div className="quiz-card-top">
                <span className="q-cat-tag">{q.category}</span>
                <span className={`q-diff ${q.difficulty.toLowerCase()}`}>{q.difficulty}</span>
              </div>

              <h3>{q.title}</h3>
              <p className="q-meta">{q.questionsCount} Questions • {q.duration} Minutes</p>

              <button className="start-quiz-btn" onClick={() => alert(`Starting ${q.title}...`)}>
                Start Quiz 🚀
              </button>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default TechnicalQuizModule;
