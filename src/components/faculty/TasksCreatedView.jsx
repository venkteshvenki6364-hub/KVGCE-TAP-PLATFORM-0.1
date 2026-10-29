import React, { useState, useEffect, useRef } from "react";
import api from "../../services/api";
import "./TasksCreatedView.css";

const INITIAL_TASKS = [
  {
    id: "task-1",
    title: "DBMS Quiz - Set 3",
    type: "Quiz",
    subject: "Database Management Systems",
    createdOn: "12 May 2026",
    dueDate: "19 May 2026",
    status: "Active",
    description: "Assessment on relational normalization (1NF, 2NF, 3NF, BCNF) and complex SQL joins.",
    targetBatch: "CSE 6th Sem - Section A & B",
  },
  {
    id: "task-2",
    title: "SQL Assignment",
    type: "Assignment",
    subject: "Database Management Systems",
    createdOn: "10 May 2026",
    dueDate: "20 May 2026",
    status: "Active",
    description: "Hands-on SQL lab exercise involving aggregation, nested subqueries, and window functions.",
    targetBatch: "CSE 6th Sem",
  },
  {
    id: "task-3",
    title: "UNIT 3 Test",
    type: "Test",
    subject: "Data Structures",
    createdOn: "08 May 2026",
    dueDate: "15 May 2026",
    status: "Completed",
    description: "Theory and algorithmic implementation test on Binary Search Trees and Graph Traversals.",
    targetBatch: "ISE & CSE 4th Sem",
  },
  {
    id: "task-4",
    title: "C Programming Quiz",
    type: "Quiz",
    subject: "C Programming",
    createdOn: "05 May 2026",
    dueDate: "12 May 2026",
    status: "Scheduled",
    description: "Fundamental evaluation on pointers, memory management, and file operations in C.",
    targetBatch: "1st Year Engineering",
  },
  {
    id: "task-5",
    title: "DSA Assignment - 2",
    type: "Assignment",
    subject: "Data Structures & Algorithms",
    createdOn: "02 May 2026",
    dueDate: "16 May 2026",
    status: "Draft",
    description: "Greedy algorithms, Dijkstra shortest path implementation, and Knapsack dynamic programming.",
    targetBatch: "CSE 4th Sem",
  },
];

export default function TasksCreatedView() {
  const [tasks, setTasks] = useState(() => {
    try {
      const saved = localStorage.getItem("kvgce_faculty_tasks_created");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn("Error loading stored tasks, using default:", e);
    }
    return INITIAL_TASKS;
  });

  const [activeMenuId, setActiveMenuId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingTask, setViewingTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isExpanded, setIsExpanded] = useState(false);

  // Form state for creating new task
  const [newTaskForm, setNewTaskForm] = useState({
    title: "",
    type: "Quiz",
    subject: "Database Management Systems",
    dueDate: "20 May 2026",
    status: "Active",
    description: "",
    targetBatch: "CSE 6th Sem",
  });

  // Load tasks from backend on mount
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const res = await api.get("/faculty/tasks");
        if (res.data?.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          setTasks(res.data.data);
        }
      } catch (err) {
        console.warn("Backend tasks fetch issue, fallback to cached tasks:", err);
      }
    };
    fetchTasks();
  }, []);

    // Save to localStorage whenever tasks change
  useEffect(() => {
    try {
      localStorage.setItem("kvgce_faculty_tasks_created", JSON.stringify(tasks));
    } catch (e) {
      console.warn("Failed to persist tasks:", e);
    }
  }, [tasks]);

  // Close dropdown menu when clicking outside
  const menuRef = useRef(null);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!newTaskForm.title.trim()) return;

    const todayStr = new Date().toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const newTask = {
      id: `task-${Date.now()}`,
      title: newTaskForm.title.trim(),
      type: newTaskForm.type,
      subject: newTaskForm.subject.trim() || "General Engineering",
      createdOn: todayStr,
      dueDate: newTaskForm.dueDate.trim() || "30 May 2026",
      status: newTaskForm.status,
      description: newTaskForm.description.trim() || "Detailed task instructions for students.",
      targetBatch: newTaskForm.targetBatch.trim() || "All Enrolled Students",
    };

    try {
      const res = await api.post("/faculty/tasks", newTask);
      if (res.data?.data) {
        const savedDoc = res.data.data;
        setTasks([savedDoc, ...tasks.filter(t => (t.id || t._id) !== (savedDoc.id || savedDoc._id))]);
        setShowCreateModal(false);
        setNewTaskForm({
          title: "",
          type: "Quiz",
          subject: "Database Management Systems",
          dueDate: "25 May 2026",
          status: "Active",
          description: "",
          targetBatch: "CSE 6th Sem",
        });
        return;
      }
    } catch (err) {
      console.warn("Backend task create issue, using local storage fallback:", err);
    }
    setTasks([newTask, ...tasks]);
    setShowCreateModal(false);
    setNewTaskForm({
      title: "",
      type: "Quiz",
      subject: "Database Management Systems",
      dueDate: "25 May 2026",
      status: "Active",
      description: "",
      targetBatch: "CSE 6th Sem",
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingTask || !editingTask.title.trim()) return;

    try {
      await api.put(`/faculty/tasks/${editingTask.id || editingTask._id}`, editingTask);
    } catch (err) {
      console.warn("Backend task update issue, using local storage fallback:", err);
    }
    setTasks((prev) =>
      prev.map((t) => (t.id === editingTask.id ? { ...editingTask } : t))
    );
    setEditingTask(null);
  };

  const handleDeleteTask = (taskId) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        api.delete(`/faculty/tasks/${taskId}`).catch(() => {});
      } catch (err) {}
      setTasks((prev) => prev.filter((t) => (t.id || t._id) !== taskId));
      setActiveMenuId(null);
    }
  };

  const handleToggleComplete = (task) => {
    const nextStatus = task.status === "Completed" ? "Active" : "Completed";
    try {
      api.put(`/faculty/tasks/${task.id || task._id}`, { status: nextStatus }).catch(() => {});
    } catch (err) {}
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
    );
    setActiveMenuId(null);
  };

  const handleDuplicate = (task) => {
    const duplicated = {
      ...task,
      id: `task-${Date.now()}`,
      title: `${task.title} (Copy)`,
      createdOn: new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
      status: "Draft",
    };
    setTasks([duplicated, ...tasks]);
    setActiveMenuId(null);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesQuery =
      t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "All" || t.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesQuery && matchesStatus;
  });

  // Display top 5 unless expanded or searching/filtering
  const displayedTasks =
    isExpanded || searchQuery || statusFilter !== "All"
      ? filteredTasks
      : filteredTasks.slice(0, 5);

  return (
    <div className="tasks-created-card">
      {/* CARD HEADER */}
      <div className="tasks-header">
        <div className="tasks-header-left">
          <div className="tasks-icon-box" title="Tasks Created">
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
          <h2 className="tasks-title">Tasks Created</h2>
        </div>

        <button
          type="button"
          className="tasks-create-btn"
          onClick={() => setShowCreateModal(true)}
        >
          <svg
            width="17"
            height="17"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span>Create New Task</span>
        </button>
      </div>

      {/* FILTER & SEARCH BAR (WHEN EXPANDED OR ACTIVE SEARCH) */}
      {(isExpanded || tasks.length > 5) && (
        <div className="tasks-filter-bar">
          <input
            type="text"
            className="tasks-search-input"
            placeholder="Search by Task Title or Subject..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="tasks-status-tabs">
            {["All", "Active", "Completed", "Scheduled", "Draft"].map((tab) => (
              <button
                key={tab}
                type="button"
                className={`tasks-tab-pill ${statusFilter === tab ? "active" : ""}`}
                onClick={() => setStatusFilter(tab)}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* TABLE */}
      <div className="tasks-table-container">
        <table className="tasks-table">
          <thead>
            <tr>
              <th className="th-num">#</th>
              <th>Task Title</th>
              <th>Type</th>
              <th>Subject / Course</th>
              <th>Created On</th>
              <th>Due Date</th>
              <th>Status</th>
              <th className="th-actions">Actions</th>
            </tr>
          </thead>
          <tbody>
            {displayedTasks.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", padding: "2.5rem", color: "#64748b" }}>
                  No tasks found matching your filter.
                </td>
              </tr>
            ) : (
              displayedTasks.map((task, idx) => {
                const typeClass =
                  task.type === "Quiz"
                    ? "type-quiz"
                    : task.type === "Assignment"
                    ? "type-assignment"
                    : task.type === "Test"
                    ? "type-test"
                    : "type-challenge";

                const statusClass =
                  task.status === "Active"
                    ? "status-active"
                    : task.status === "Completed"
                    ? "status-completed"
                    : task.status === "Scheduled"
                    ? "status-scheduled"
                    : "status-draft";

                return (
                  <tr key={task.id}>
                    <td className="td-num">{idx + 1}</td>
                    <td className="tasks-title-cell">{task.title}</td>
                    <td>
                      <span className={`task-type-pill ${typeClass}`}>
                        {task.type}
                      </span>
                    </td>
                    <td>{task.subject}</td>
                    <td>{task.createdOn}</td>
                    <td>{task.dueDate}</td>
                    <td>
                      <span className={`task-status-pill ${statusClass}`}>
                        {task.status}
                      </span>
                    </td>
                    <td>
                      <div className="tasks-actions-group">
                        {/* VIEW ACTION */}
                        <button
                          type="button"
                          className="task-action-btn view-btn"
                          title="View Task Details"
                          onClick={() => setViewingTask(task)}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                            <circle cx="12" cy="12" r="3" />
                          </svg>
                        </button>

                        {/* EDIT ACTION */}
                        <button
                          type="button"
                          className="task-action-btn edit-btn"
                          title="Edit Task"
                          onClick={() => setEditingTask({ ...task })}
                        >
                          <svg
                            width="15"
                            height="15"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          </svg>
                        </button>

                        {/* MORE OPTIONS ACTION */}
                        <button
                          type="button"
                          className="task-action-btn more-btn"
                          title="More Options"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenuId(activeMenuId === task.id ? null : task.id);
                          }}
                        >
                          <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <circle cx="12" cy="12" r="1" />
                            <circle cx="12" cy="5" r="1" />
                            <circle cx="12" cy="19" r="1" />
                          </svg>
                        </button>

                        {/* DROPDOWN MENU */}
                        {activeMenuId === task.id && (
                          <div className="task-dropdown-menu" ref={menuRef}>
                            <button
                              type="button"
                              className="task-dropdown-item"
                              onClick={() => handleToggleComplete(task)}
                            >
                              <span>{task.status === "Completed" ? "↩️ Mark as Active" : "✓ Mark Completed"}</span>
                            </button>
                            <button
                              type="button"
                              className="task-dropdown-item"
                              onClick={() => handleDuplicate(task)}
                            >
                              <span>📋 Duplicate Task</span>
                            </button>
                            <button
                              type="button"
                              className="task-dropdown-item danger"
                              onClick={() => handleDeleteTask(task.id)}
                            >
                              <span>🗑️ Delete Task</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
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
          <span>{isExpanded ? "Show Top 5 Tasks" : "View All Tasks"}</span>
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

      {/* MODAL: CREATE NEW TASK */}
      {showCreateModal && (
        <div className="task-modal-backdrop" onClick={() => setShowCreateModal(false)}>
          <div className="task-modal" onClick={(e) => e.stopPropagation()}>
            <div className="task-modal-header">
              <h3>Create New Student Task</h3>
              <button
                type="button"
                className="task-modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateTask}>
              <div className="task-modal-body">
                <div className="task-form-group">
                  <label>Task Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Computer Networks Lab Quiz - Unit 2"
                    value={newTaskForm.title}
                    onChange={(e) =>
                      setNewTaskForm({ ...newTaskForm, title: e.target.value })
                    }
                  />
                </div>

                <div className="task-form-row">
                  <div className="task-form-group">
                    <label>Task Type</label>
                    <select
                      value={newTaskForm.type}
                      onChange={(e) =>
                        setNewTaskForm({ ...newTaskForm, type: e.target.value })
                      }
                    >
                      <option value="Quiz">Quiz</option>
                      <option value="Assignment">Assignment</option>
                      <option value="Test">Test</option>
                      <option value="Challenge">Coding Challenge</option>
                    </select>
                  </div>

                  <div className="task-form-group">
                    <label>Initial Status</label>
                    <select
                      value={newTaskForm.status}
                      onChange={(e) =>
                        setNewTaskForm({ ...newTaskForm, status: e.target.value })
                      }
                    >
                      <option value="Active">Active</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                </div>

                <div className="task-form-row">
                  <div className="task-form-group">
                    <label>Subject / Course</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Database Management Systems"
                      value={newTaskForm.subject}
                      onChange={(e) =>
                        setNewTaskForm({ ...newTaskForm, subject: e.target.value })
                      }
                    />
                  </div>

                  <div className="task-form-group">
                    <label>Due Date</label>
                    <input
                      type="text"
                      placeholder="e.g. 24 May 2026"
                      value={newTaskForm.dueDate}
                      onChange={(e) =>
                        setNewTaskForm({ ...newTaskForm, dueDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="task-form-group">
                  <label>Target Department / Batch</label>
                  <input
                    type="text"
                    placeholder="e.g. CSE 6th Sem - Section A"
                    value={newTaskForm.targetBatch}
                    onChange={(e) =>
                      setNewTaskForm({ ...newTaskForm, targetBatch: e.target.value })
                    }
                  />
                </div>

                <div className="task-form-group">
                  <label>Task Instructions & Description</label>
                  <textarea
                    rows={3}
                    placeholder="Enter instructions, syllabus covered, or submission format guidelines..."
                    value={newTaskForm.description}
                    onChange={(e) =>
                      setNewTaskForm({ ...newTaskForm, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="task-modal-footer">
                <button
                  type="button"
                  className="task-btn-secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="task-btn-primary">
                  Create Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: VIEW TASK DETAILS */}
      {viewingTask && (
        <div className="task-modal-backdrop" onClick={() => setViewingTask(null)}>
          <div className="task-modal" onClick={(e) => e.stopPropagation()}>
            <div className="task-modal-header">
              <h3>Task Details</h3>
              <button
                type="button"
                className="task-modal-close"
                onClick={() => setViewingTask(null)}
              >
                ✕
              </button>
            </div>
            <div className="task-modal-body">
              <div style={{ marginBottom: "1rem" }}>
                <span
                  className={`task-type-pill ${
                    viewingTask.type === "Quiz"
                      ? "type-quiz"
                      : viewingTask.type === "Assignment"
                      ? "type-assignment"
                      : viewingTask.type === "Test"
                      ? "type-test"
                      : "type-challenge"
                  }`}
                  style={{ marginRight: "0.5rem" }}
                >
                  {viewingTask.type}
                </span>
                <span
                  className={`task-status-pill ${
                    viewingTask.status === "Active"
                      ? "status-active"
                      : viewingTask.status === "Completed"
                      ? "status-completed"
                      : viewingTask.status === "Scheduled"
                      ? "status-scheduled"
                      : "status-draft"
                  }`}
                >
                  {viewingTask.status}
                </span>
              </div>

              <h2 style={{ fontSize: "1.35rem", fontWeight: 700, margin: "0 0 1rem 0", color: "#0f172a" }}>
                {viewingTask.title}
              </h2>

              <div className="task-detail-grid">
                <div className="task-detail-item">
                  <div className="task-detail-label">SUBJECT / COURSE</div>
                  <div className="task-detail-val">{viewingTask.subject}</div>
                </div>
                <div className="task-detail-item">
                  <div className="task-detail-label">TARGET BATCH</div>
                  <div className="task-detail-val">{viewingTask.targetBatch || "All Batches"}</div>
                </div>
                <div className="task-detail-item">
                  <div className="task-detail-label">CREATED ON</div>
                  <div className="task-detail-val">{viewingTask.createdOn}</div>
                </div>
                <div className="task-detail-item">
                  <div className="task-detail-label">DUE DATE</div>
                  <div className="task-detail-val">{viewingTask.dueDate}</div>
                </div>
              </div>

              <div className="task-desc-box">
                <div className="task-detail-label">INSTRUCTIONS / DESCRIPTION</div>
                <p>{viewingTask.description || "No specific instructions provided."}</p>
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
                className="task-btn-primary"
                onClick={() => {
                  setEditingTask({ ...viewingTask });
                  setViewingTask(null);
                }}
              >
                Edit Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: EDIT TASK */}
      {editingTask && (
        <div className="task-modal-backdrop" onClick={() => setEditingTask(null)}>
          <div className="task-modal" onClick={(e) => e.stopPropagation()}>
            <div className="task-modal-header">
              <h3>Edit Task</h3>
              <button
                type="button"
                className="task-modal-close"
                onClick={() => setEditingTask(null)}
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSaveEdit}>
              <div className="task-modal-body">
                <div className="task-form-group">
                  <label>Task Title *</label>
                  <input
                    type="text"
                    required
                    value={editingTask.title}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, title: e.target.value })
                    }
                  />
                </div>

                <div className="task-form-row">
                  <div className="task-form-group">
                    <label>Task Type</label>
                    <select
                      value={editingTask.type}
                      onChange={(e) =>
                        setEditingTask({ ...editingTask, type: e.target.value })
                      }
                    >
                      <option value="Quiz">Quiz</option>
                      <option value="Assignment">Assignment</option>
                      <option value="Test">Test</option>
                      <option value="Challenge">Coding Challenge</option>
                    </select>
                  </div>

                  <div className="task-form-group">
                    <label>Status</label>
                    <select
                      value={editingTask.status}
                      onChange={(e) =>
                        setEditingTask({ ...editingTask, status: e.target.value })
                      }
                    >
                      <option value="Active">Active</option>
                      <option value="Completed">Completed</option>
                      <option value="Scheduled">Scheduled</option>
                      <option value="Draft">Draft</option>
                    </select>
                  </div>
                </div>

                <div className="task-form-row">
                  <div className="task-form-group">
                    <label>Subject / Course</label>
                    <input
                      type="text"
                      required
                      value={editingTask.subject}
                      onChange={(e) =>
                        setEditingTask({ ...editingTask, subject: e.target.value })
                      }
                    />
                  </div>

                  <div className="task-form-group">
                    <label>Due Date</label>
                    <input
                      type="text"
                      value={editingTask.dueDate}
                      onChange={(e) =>
                        setEditingTask({ ...editingTask, dueDate: e.target.value })
                      }
                    />
                  </div>
                </div>

                <div className="task-form-group">
                  <label>Target Department / Batch</label>
                  <input
                    type="text"
                    value={editingTask.targetBatch || ""}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, targetBatch: e.target.value })
                    }
                  />
                </div>

                <div className="task-form-group">
                  <label>Task Instructions & Description</label>
                  <textarea
                    rows={3}
                    value={editingTask.description || ""}
                    onChange={(e) =>
                      setEditingTask({ ...editingTask, description: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="task-modal-footer">
                <button
                  type="button"
                  className="task-btn-secondary"
                  onClick={() => setEditingTask(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="task-btn-primary">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

