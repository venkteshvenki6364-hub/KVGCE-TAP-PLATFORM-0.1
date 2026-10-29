import React, { useState, useEffect } from "react";
import api from "../../services/api";
import "./TasksCreatedView.css";

// Comprehensive initial fallback items (quizzes, aptitude tests, student projects, coding challenges)
const INITIAL_ITEMS = [
  {
    id: "quiz-1",
    title: "DBMS Relational Normalization Quiz",
    type: "Quiz",
    subject: "Database Management Systems",
    createdOn: "12 May 2026",
    dueDate: "25 Mins Limit",
    status: "Active",
    description: "Assessment on relational database normalization (1NF, 2NF, 3NF, BCNF) and complex SQL joins.",
    targetBatch: "CSE 6th Sem - Section A & B",
    questionsCount: 15,
    totalMarks: 30,
    meta: { category: "Quiz", faculty: "Prof. Suresh Kumar" }
  },
  {
    id: "proj-1",
    title: "KVGCE-TAP Platform & Assessment Engine",
    type: "Project",
    subject: "Full-Stack Web Engineering",
    createdOn: "10 May 2026",
    dueDate: "Final Sem Submission",
    status: "Approved",
    description: "End-to-end placement readiness tracking and coding lab platform with real-time analytics and rankings.",
    targetBatch: "CSE 8th Sem - Batch 2026",
    questionsCount: null,
    totalMarks: 100,
    meta: {
      studentName: "Aditya Hegde",
      studentId: "4KV21CS042",
      techStack: ["React.js", "FastAPI", "MongoDB", "Python"],
      githubUrl: "https://github.com/venkatesh-r/kvgce-tap-platform",
      hostedUrl: "https://kvgce-tap.vercel.app"
    }
  },
  {
    id: "apt-1",
    title: "Quantitative Aptitude & Speed Math Test",
    type: "Aptitude",
    subject: "Quantitative Aptitude",
    createdOn: "08 May 2026",
    dueDate: "20 Mins Limit",
    status: "Active",
    description: "Speed calculations, percentages, ratios, profit & loss, and time-speed-distance problem solving.",
    targetBatch: "All Engineering Branches (3rd & 4th Year)",
    questionsCount: 20,
    totalMarks: 40,
    meta: { category: "Aptitude", department: "Training & Placement Cell" }
  },
  {
    id: "test-1",
    title: "Data Structures & Tree Traversals Unit Test",
    type: "Test",
    subject: "Data Structures & Algorithms",
    createdOn: "05 May 2026",
    dueDate: "45 Mins Limit",
    status: "Completed",
    description: "Rigorous test covering Binary Search Trees, AVL balance factors, and Graph BFS/DFS implementations.",
    targetBatch: "CSE & ISE 4th Sem",
    questionsCount: 12,
    totalMarks: 25,
    meta: { category: "Test", faculty: "Prof. Ramesh K" }
  },
  {
    id: "proj-2",
    title: "AI-Powered Career & Resume Assistant",
    type: "Project",
    subject: "Machine Learning & NLP",
    createdOn: "03 May 2026",
    dueDate: "Capstone Evaluation",
    status: "Pending",
    description: "Automated resume parsing with Gemini AI to generate customized mock interview scenarios and skill gaps.",
    targetBatch: "CSE 8th Sem",
    questionsCount: null,
    totalMarks: 100,
    meta: {
      studentName: "Sahana P",
      studentId: "4KV21CS018",
      techStack: ["Python", "PyTorch", "React", "Node.js"],
      githubUrl: "https://github.com/venkatesh-r/ai-career-assistant"
    }
  },
  {
    id: "code-1",
    title: "Array Manipulation & Two Pointer Challenge",
    type: "Coding Challenge",
    subject: "Competitive Programming",
    createdOn: "01 May 2026",
    dueDate: "30 Mins Limit",
    status: "Active",
    description: "Interactive coding problem evaluated via live Judge0 sandbox with custom hidden test suites.",
    targetBatch: "Open Campus Coding Lab",
    questionsCount: 3,
    totalMarks: 30,
    meta: { category: "Coding", difficulty: "Medium" }
  }
];

export default function TasksCreatedView() {
  const [tasks, setTasks] = useState(INITIAL_ITEMS);
  const [viewingTask, setViewingTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isExpanded, setIsExpanded] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load recently created tests, quizzes, aptitude assessments, and student projects
  useEffect(() => {
    const fetchCreatedRecords = async () => {
      setLoading(true);
      try {
        const aggregated = [];
        const seenIds = new Set();
        const seenTitles = new Set();

        const addRecord = (item) => {
          if (!item || !item.title) return;
          const id = String(item.id || item._id || "");
          const titleKey = String(item.title).toLowerCase().trim();
          if ((!id || !seenIds.has(id)) && (!titleKey || !seenTitles.has(titleKey))) {
            if (id) seenIds.add(id);
            if (titleKey) seenTitles.add(titleKey);
            aggregated.push(item);
          }
        };

        // 1. Fetch published Quizzes and Aptitude Tests from Assessments API
        try {
          const assessRes = await api.get("/assessments");
          const assessData = assessRes.data?.data || assessRes.data || [];
          if (Array.isArray(assessData)) {
            assessData.forEach((a) => {
              const catLow = String(a.category || "").toLowerCase();
              const titLow = String(a.title || "").toLowerCase();
              let tType = "Test";
              if (catLow.includes("aptitude") || catLow.includes("quant") || catLow.includes("reasoning")) {
                tType = "Aptitude";
              } else if (catLow.includes("quiz") || titLow.includes("quiz")) {
                tType = "Quiz";
              } else if (catLow.includes("coding") || titLow.includes("coding")) {
                tType = "Coding Challenge";
              }

              const qCount = Array.isArray(a.questions) ? a.questions.length : 10;
              const dur = a.duration_minutes || a.timeLimit || 25;
              const marks = a.total_marks || (qCount * 2);

              addRecord({
                id: a._id || a.id || `assess-${Date.now()}-${Math.random()}`,
                title: a.title,
                type: tType,
                subject: a.category || a.department || "General Engineering",
                createdOn: a.created_at ? new Date(a.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Active",
                dueDate: `${dur} Mins Limit`,
                status: a.is_published !== false ? "Active" : "Draft",
                description: a.description || `Assessment covering ${a.category || "core concepts"} with ${qCount} questions.`,
                targetBatch: a.department || "All Batches",
                questionsCount: qCount,
                totalMarks: marks,
                meta: {
                  category: a.category,
                  department: a.department,
                  questionsCount: qCount,
                  totalMarks: marks,
                  duration: dur
                }
              });
            });
          }
        } catch (e) {
          console.warn("Could not fetch assessments:", e);
        }

        // 2. Fetch Student Projects from backend
        try {
          const projRes = await api.get("/students/projects");
          const projData = projRes.data?.data || projRes.data || [];
          if (Array.isArray(projData)) {
            projData.forEach((p) => {
              addRecord({
                id: p.project_id || p.id || p._id || `proj-${Date.now()}-${Math.random()}`,
                title: p.title || "Capstone Project",
                type: "Project",
                subject: Array.isArray(p.techStack) ? p.techStack.slice(0, 3).join(", ") : (p.student_department || "Software Engineering"),
                createdOn: p.created_at ? new Date(p.created_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "14 May 2026",
                dueDate: "Project Evaluation",
                status: p.status === "Approved" ? "Approved" : p.status === "Completed" ? "Completed" : "Pending",
                description: p.description || "Student capstone project submission.",
                targetBatch: p.student_department || "Final Year Students",
                questionsCount: null,
                totalMarks: p.marks || 100,
                meta: {
                  studentName: p.student_name,
                  studentId: p.student_id,
                  techStack: p.techStack || [],
                  githubUrl: p.githubUrl,
                  hostedUrl: p.hostedUrl,
                  marks: p.marks
                }
              });
            });
          }
        } catch (e) {
          console.warn("Could not fetch student projects:", e);
        }

        // 3. Fetch from faculty tasks backend
        try {
          const tasksRes = await api.get("/faculty/tasks");
          const taskItems = tasksRes.data?.data || [];
          if (Array.isArray(taskItems)) {
            taskItems.forEach((t) => addRecord(t));
          }
        } catch (e) {
          console.warn("Could not fetch faculty tasks:", e);
        }

        // 4. Fetch locally published Quizzes from QuizBuilder
        try {
          const localQuizzes = JSON.parse(localStorage.getItem("kvgce_published_quizzes") || "[]");
          if (Array.isArray(localQuizzes)) {
            localQuizzes.forEach((lq) => {
              const qCount = Array.isArray(lq.questions) ? lq.questions.length : 5;
              addRecord({
                id: lq.id || `quiz-local-${Date.now()}-${Math.random()}`,
                title: lq.title,
                type: "Quiz",
                subject: lq.category || lq.department || "Technical Quiz",
                createdOn: "Today",
                dueDate: `${lq.duration_minutes || 30} Mins Limit`,
                status: "Active",
                description: lq.description || `Interactive quiz created via Quiz Builder with ${qCount} questions.`,
                targetBatch: lq.department || "All Students",
                questionsCount: qCount,
                totalMarks: lq.total_marks || (qCount * 2),
                meta: {
                  category: lq.category,
                  department: lq.department,
                  questionsCount: qCount,
                  totalMarks: lq.total_marks
                }
              });
            });
          }
        } catch (e) {}

        // 5. Fallback initial items if still empty
        if (aggregated.length === 0) {
          INITIAL_ITEMS.forEach((it) => addRecord(it));
        }

        setTasks(aggregated);
      } catch (err) {
        console.warn("Error consolidating created tests & projects:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCreatedRecords();
  }, []);

  const handleDeleteTask = (taskId) => {
    if (window.confirm("Are you sure you want to remove this record from the view?")) {
      setTasks((prev) => prev.filter((t) => (t.id || t._id) !== taskId));
      if (viewingTask && (viewingTask.id || viewingTask._id) === taskId) {
        setViewingTask(null);
      }
    }
  };

  // Filter tasks & projects by search query and type tab
  const filteredTasks = tasks.filter((t) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !q ||
      (t.title && t.title.toLowerCase().includes(q)) ||
      (t.subject && t.subject.toLowerCase().includes(q)) ||
      (t.type && t.type.toLowerCase().includes(q)) ||
      (t.meta?.studentName && t.meta.studentName.toLowerCase().includes(q));

    let matchesFilter = true;
    if (statusFilter === "All") {
      matchesFilter = true;
    } else if (statusFilter === "Quiz") {
      matchesFilter = String(t.type || "").toLowerCase().includes("quiz");
    } else if (statusFilter === "Aptitude") {
      matchesFilter =
        String(t.type || "").toLowerCase().includes("aptitude") ||
        String(t.subject || "").toLowerCase().includes("aptitude");
    } else if (statusFilter === "Test") {
      matchesFilter = String(t.type || "").toLowerCase().includes("test");
    } else if (statusFilter === "Project") {
      matchesFilter = String(t.type || "").toLowerCase().includes("project");
    } else if (statusFilter === "Coding") {
      matchesFilter =
        String(t.type || "").toLowerCase().includes("coding") ||
        String(t.type || "").toLowerCase().includes("challenge");
    }

    return matchesQuery && matchesFilter;
  });

  // Display top 5 unless expanded or active filter
  const displayedTasks =
    isExpanded || searchQuery || statusFilter !== "All"
      ? filteredTasks
      : filteredTasks.slice(0, 5);

  const getTypeClass = (type) => {
    const t = String(type || "").toLowerCase();
    if (t.includes("quiz")) return "type-quiz";
    if (t.includes("aptitude")) return "type-aptitude";
    if (t.includes("project")) return "type-project";
    if (t.includes("coding") || t.includes("challenge")) return "type-challenge";
    return "type-test";
  };

  const getStatusClass = (status) => {
    const s = String(status || "").toLowerCase();
    if (s.includes("active") || s.includes("approved")) return "status-active";
    if (s.includes("completed")) return "status-completed";
    if (s.includes("scheduled")) return "status-scheduled";
    return "status-draft";
  };

  return (
    <div className="tasks-created-card">
      {/* CARD HEADER (VIEW-ONLY, CREATE BUTTON REMOVED) */}
      <div className="tasks-header">
        <div className="tasks-header-left">
          <div className="tasks-icon-box" title="Tasks & Projects Created">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
              <rect x="8" y="2" width="8" height="4" rx="1" />
              <path d="m9 14 2 2 4-4" />
            </svg>
          </div>
          <div>
            <h2 className="tasks-title">Tasks & Projects Created</h2>
            <p className="tasks-subtitle">
              Live repository of recently created tests, quizzes, aptitude assessments, and student projects
            </p>
          </div>
        </div>

        <div className="tasks-header-right">
          <div className="tasks-summary-pill">
            <span className="live-dot-pulse"></span>
            <strong>{filteredTasks.length}</strong>
            <span>Records Available</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH BAR */}
      <div className="tasks-filter-bar">
        <input
          type="text"
          className="tasks-search-input"
          placeholder="Search by Title, Subject, Student, or Category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <div className="tasks-status-tabs">
          {["All", "Quiz", "Aptitude", "Test", "Project", "Coding"].map((tab) => (
            <button
              key={tab}
              type="button"
              className={`tasks-tab-pill ${statusFilter === tab ? "active" : ""}`}
              onClick={() => setStatusFilter(tab)}
            >
              {tab === "All" ? "All Records" : tab === "Coding" ? "Coding Labs" : `${tab}s`}
            </button>
          ))}
        </div>
      </div>

      {/* TABLE (READ-ONLY INSPECTION VIEW) */}
      <div className="tasks-table-container">
        <table className="tasks-table">
          <thead>
            <tr>
              <th className="th-num">#</th>
              <th>Title & Details</th>
              <th>Type</th>
              <th>Subject / Domain</th>
              <th>Created On</th>
              <th>Timeline / Duration</th>
              <th>Status</th>
              <th className="th-actions">Action</th>
            </tr>
          </thead>
          <tbody>
            {displayedTasks.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
                  {loading ? "Loading recently created records..." : "No tests, quizzes, or projects found matching your search."}
                </td>
              </tr>
            ) : (
              displayedTasks.map((task, idx) => (
                <tr
                  key={task.id || task._id || idx}
                  className="task-table-row-clickable"
                  onClick={() => setViewingTask(task)}
                >
                  <td className="td-num">{idx + 1}</td>
                  <td className="tasks-title-cell">
                    <strong className="item-primary-title">{task.title}</strong>
                    {task.meta?.studentName && (
                      <span className="item-sub-meta">Student: {task.meta.studentName} ({task.meta.studentId || "Student"})</span>
                    )}
                    {task.questionsCount && (
                      <span className="item-sub-meta">{task.questionsCount} Questions • {task.totalMarks || (task.questionsCount * 2)} Total Marks</span>
                    )}
                  </td>
                  <td>
                    <span className={`task-type-pill ${getTypeClass(task.type)}`}>
                      {task.type}
                    </span>
                  </td>
                  <td>{task.subject}</td>
                  <td>{task.createdOn}</td>
                  <td>{task.dueDate}</td>
                  <td>
                    <span className={`task-status-pill ${getStatusClass(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="tasks-view-btn-pill"
                      title="View Details"
                      onClick={(e) => {
                        e.stopPropagation();
                        setViewingTask(task);
                      }}
                    >
                      <svg
                        width="15"
                        height="15"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* FOOTER */}
      <div className="tasks-footer">
        <button
          type="button"
          className="tasks-view-all-btn"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <span>{isExpanded ? "Show Top 5 Records" : `View All (${filteredTasks.length}) Records`}</span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{
              transform: isExpanded ? "rotate(-90deg)" : "none",
              transition: "transform 0.2s ease",
            }}
          >
            <path d="M5 12h14" />
            <path d="m12 5 7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* MODAL: VIEW ITEM DETAILS (READ-ONLY) */}
      {viewingTask && (
        <div className="task-modal-backdrop" onClick={() => setViewingTask(null)}>
          <div className="task-modal" onClick={(e) => e.stopPropagation()}>
            <div className="task-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span className={`task-type-pill ${getTypeClass(viewingTask.type)}`}>
                  {viewingTask.type}
                </span>
                <span className={`task-status-pill ${getStatusClass(viewingTask.status)}`}>
                  {viewingTask.status}
                </span>
              </div>
              <button
                type="button"
                className="task-modal-close"
                onClick={() => setViewingTask(null)}
              >
                ✕
              </button>
            </div>
            <div className="task-modal-body">
              <h2 style={{ fontSize: "1.35rem", fontWeight: 800, margin: "0 0 1rem 0", color: "#0f172a" }}>
                {viewingTask.title}
              </h2>

              <div className="task-detail-grid">
                <div className="task-detail-item">
                  <div className="task-detail-label">SUBJECT / DOMAIN</div>
                  <div className="task-detail-val">{viewingTask.subject}</div>
                </div>
                <div className="task-detail-item">
                  <div className="task-detail-label">TARGET BATCH / AUDIENCE</div>
                  <div className="task-detail-val">{viewingTask.targetBatch || "All Batches"}</div>
                </div>
                <div className="task-detail-item">
                  <div className="task-detail-label">CREATED ON</div>
                  <div className="task-detail-val">{viewingTask.createdOn}</div>
                </div>
                <div className="task-detail-item">
                  <div className="task-detail-label">TIMELINE / DURATION</div>
                  <div className="task-detail-val">{viewingTask.dueDate}</div>
                </div>

                {viewingTask.questionsCount && (
                  <div className="task-detail-item">
                    <div className="task-detail-label">QUESTIONS COUNT</div>
                    <div className="task-detail-val">{viewingTask.questionsCount} Questions</div>
                  </div>
                )}

                {viewingTask.totalMarks && (
                  <div className="task-detail-item">
                    <div className="task-detail-label">TOTAL MARKS</div>
                    <div className="task-detail-val">{viewingTask.totalMarks} Marks</div>
                  </div>
                )}

                {viewingTask.meta?.studentName && (
                  <div className="task-detail-item">
                    <div className="task-detail-label">SUBMITTED BY</div>
                    <div className="task-detail-val">
                      {viewingTask.meta.studentName} ({viewingTask.meta.studentId || "Student"})
                    </div>
                  </div>
                )}
              </div>

              {viewingTask.meta?.techStack && viewingTask.meta.techStack.length > 0 && (
                <div style={{ marginTop: "1rem" }}>
                  <div className="task-detail-label">TECH STACK</div>
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                    {viewingTask.meta.techStack.map((tech, i) => (
                      <span
                        key={i}
                        style={{
                          background: "#eff6ff",
                          color: "#1d4ed8",
                          border: "1px solid #bfdbfe",
                          padding: "3px 10px",
                          borderRadius: "6px",
                          fontSize: "0.78rem",
                          fontWeight: 700
                        }}
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {viewingTask.meta?.githubUrl && (
                <div style={{ marginTop: "1rem" }}>
                  <div className="task-detail-label">PROJECT REPOSITORY</div>
                  <a
                    href={viewingTask.meta.githubUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#2563eb", fontWeight: 600, fontSize: "0.88rem", textDecoration: "underline" }}
                  >
                    {viewingTask.meta.githubUrl}
                  </a>
                </div>
              )}

              <div className="task-desc-box" style={{ marginTop: "1.25rem" }}>
                <div className="task-detail-label">DESCRIPTION / INSTRUCTIONS</div>
                <p style={{ margin: "4px 0 0 0", color: "#334155", lineHeight: 1.55 }}>
                  {viewingTask.description || "No specific instructions provided."}
                </p>
              </div>
            </div>

            <div className="task-modal-footer">
              <button
                type="button"
                className="task-btn-secondary"
                onClick={() => setViewingTask(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="task-btn-danger"
                style={{
                  background: "#fee2e2",
                  color: "#b91c1c",
                  border: "1px solid #fca5a5",
                  padding: "0.55rem 1rem",
                  borderRadius: "8px",
                  fontWeight: 700,
                  fontSize: "0.85rem",
                  cursor: "pointer"
                }}
                onClick={() => handleDeleteTask(viewingTask.id || viewingTask._id)}
              >
                Remove from List
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
