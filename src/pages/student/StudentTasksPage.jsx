import { useEffect, useMemo, useState } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../services/api";
import "./StudentTasksPage.css";

const filters = ["all", "pending", "in_progress", "completed"];

function StudentTasksPage() {
  const [tasks, setTasks] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState("");

  useEffect(() => {
    let active = true;
    const fetchTasks = async () => {
      try {
        const response = await api.get("/students/tasks");
        if (active) {
          setError("");
          setTasks(response.data?.data || []);
        }
      } catch (requestError) {
        if (active) {
          setError(requestError.response?.data?.detail || "Unable to load tasks right now.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchTasks();
    return () => {
      active = false;
    };
  }, []);

  const loadTasks = async () => {
    setLoading(true);
    try {
      setError("");
      const response = await api.get("/students/tasks");
      setTasks(response.data?.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to load tasks right now.");
    } finally {
      setLoading(false);
    }
  };

  const visibleTasks = useMemo(
    () => filter === "all" ? tasks : tasks.filter((task) => task.status === filter),
    [filter, tasks]
  );

  const updateStatus = async (task, status) => {
    setUpdating(task.id);
    try {
      const response = await api.patch(`/students/tasks/${encodeURIComponent(task.id)}/status`, { status });
      const updated = response.data?.data;
      if (updated) {
        setTasks((current) => current.map((item) => item.id === task.id ? updated : item));
      }
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Unable to update task progress.");
    } finally {
      setUpdating("");
    }
  };

  return (
    <DashboardLayout title="My Tasks">
      <section className="student-tasks-page">
        <div className="student-tasks-heading">
          <div>
            <p className="student-tasks-kicker">Assigned work</p>
            <h1>Tasks from Faculty & Admin</h1>
            <p>Every published assessment, coding problem, and faculty task appears here.</p>
          </div>
          <button className="student-tasks-refresh" onClick={loadTasks} disabled={loading}>Refresh</button>
        </div>

        <div className="student-task-filters">
          {filters.map((item) => (
            <button
              key={item}
              className={filter === item ? "selected" : ""}
              onClick={() => setFilter(item)}
            >
              {item.replace("_", " ")}
            </button>
          ))}
        </div>

        {error && <p className="student-task-error">{error}</p>}
        {loading && <p className="student-task-empty">Loading assigned tasks...</p>}
        {!loading && !visibleTasks.length && <p className="student-task-empty">No tasks match this filter.</p>}

        <div className="student-task-grid">
          {visibleTasks.map((task) => (
            <article className="student-task-card" key={task.id}>
              <div className="student-task-card-top">
                <span className="student-task-type">{task.type}</span>
                <span className={`student-task-status status-${task.status}`}>{task.status.replace("_", " ")}</span>
              </div>
              <h2>{task.title}</h2>
              <p className="student-task-subject">{task.subject}</p>
              <p className="student-task-description">{task.description || "No description provided."}</p>
              <div className="student-task-meta">
                <span>Created by {task.creatorName}</span>
                {task.dueDate && <span>Due {task.dueDate}</span>}
                {task.durationMinutes && <span>{task.durationMinutes} min</span>}
              </div>
              <div className="student-task-actions">
                {task.status !== "in_progress" && task.status !== "completed" && (
                  <button disabled={updating === task.id} onClick={() => updateStatus(task, "in_progress")}>
                    Start task
                  </button>
                )}
                {task.status !== "completed" && (
                  <button className="complete" disabled={updating === task.id} onClick={() => updateStatus(task, "completed")}>
                    Mark completed
                  </button>
                )}
                {task.status === "completed" && <span className="student-task-done">Completed</span>}
              </div>
            </article>
          ))}
        </div>
      </section>
    </DashboardLayout>
  );
}

export default StudentTasksPage;
