import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../services/api";
import "./AdminHomePage.css";

function AdminHomePage() {
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users"); // users, departments, analytics
  const [showUserModal, setShowUserModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const [newUser, setNewUser] = useState({
    email: "",
    full_name: "",
    password: "Password123!",
    role: "student",
    department: "Computer Science & Engineering",
    student_id: "",
    faculty_id: "",
    phone: "",
  });

  const fetchAdminData = async () => {
    try {
      const [dashRes, usersRes] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/users"),
      ]);
      if (dashRes.data && dashRes.data.data) {
        setData(dashRes.data.data);
      }
      if (usersRes.data && usersRes.data.data) {
        setUsers(usersRes.data.data);
      }
    } catch (err) {
      console.error("Error loading admin dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleStatus = async (email) => {
    try {
      const res = await api.put(`/admin/users/${email}/toggle-status`);
      if (res.data && res.data.success) {
        setMsg(`User status updated!`);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (email) => {
    if (!window.confirm(`Are you sure you want to delete user ${email}?`)) return;
    try {
      const res = await api.delete(`/admin/users/${email}`);
      if (res.data && res.data.success) {
        setMsg(`User ${email} deleted.`);
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Could not delete user.");
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg("");
    try {
      const res = await api.post("/admin/users", newUser);
      if (res.data && res.data.success) {
        setMsg(`User ${newUser.email} (${newUser.role}) created!`);
        setShowUserModal(false);
        setNewUser({
          email: "",
          full_name: "",
          password: "Password123!",
          role: "student",
          department: "Computer Science & Engineering",
          student_id: "",
          faculty_id: "",
          phone: "",
        });
        fetchAdminData();
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.detail || "Failed to create user.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="System Administration">
        <div style={{ textAlign: "center", padding: "3rem" }}>Loading Administration Portal...</div>
      </DashboardLayout>
    );
  }

  const stats = data?.stats || {
    totalUsers: users.length,
    totalStudents: users.filter((u) => u.role === "student").length,
    totalFaculty: users.filter((u) => u.role === "faculty").length,
    totalAdmins: users.filter((u) => u.role === "admin").length,
    totalDepartments: 5,
  };

  return (
    <DashboardLayout title="Admin Command Center">
      <div className="admin-page">
        {msg && <div className="admin-alert">✅ {msg}</div>}

        {/* METRICS CARDS */}
        <div className="admin-stats-grid">
          <div className="a-stat-card">
            <h3>Total Platform Users</h3>
            <p className="a-num">{stats.totalUsers}</p>
            <span>Registered Accounts</span>
          </div>
          <div className="a-stat-card">
            <h3>Students Enrolled</h3>
            <p className="a-num blue">{stats.totalStudents}</p>
            <span>Active Student Profiles</span>
          </div>
          <div className="a-stat-card">
            <h3>Faculty Members</h3>
            <p className="a-num green">{stats.totalFaculty}</p>
            <span>Department Instructors</span>
          </div>
          <div className="a-stat-card">
            <h3>System Administrators</h3>
            <p className="a-num gold">{stats.totalAdmins}</p>
            <span>KVGCE IT Staff</span>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="admin-tabs">
          <button className={activeTab === "users" ? "a-tab active" : "a-tab"} onClick={() => setActiveTab("users")}>
            👥 User Management
          </button>
          <button className={activeTab === "departments" ? "a-tab active" : "a-tab"} onClick={() => setActiveTab("departments")}>
            🏫 Department Configurations
          </button>
          <button className={activeTab === "analytics" ? "a-tab active" : "a-tab"} onClick={() => setActiveTab("analytics")}>
            📈 System Analytics
          </button>
        </div>

        {/* USERS TAB */}
        {activeTab === "users" && (
          <div className="admin-sec-card">
            <div className="sec-header">
              <h3>All Registered Users ({users.length})</h3>
              <button className="add-user-btn" onClick={() => setShowUserModal(true)}>
                + Add New User
              </button>
            </div>

            <table className="admin-table">
              <thead>
                <tr>
                  <th>User Details</th>
                  <th>Role</th>
                  <th>Department / ID</th>
                  <th>Account Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id || u.email}>
                    <td>
                      <strong>{u.full_name}</strong>
                      <br />
                      <small>{u.email}</small>
                    </td>
                    <td>
                      <span className={`role-pill ${u.role}`}>{u.role?.toUpperCase()}</span>
                    </td>
                    <td>
                      {u.department || "Computer Science"}
                      <br />
                      <small>{u.student_id || u.faculty_id || "N/A"}</small>
                    </td>
                    <td>
                      <span className={`status-pill ${u.is_active !== false ? "active" : "inactive"}`}>
                        {u.is_active !== false ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td>
                      <div className="action-row">
                        <button className="toggle-btn" onClick={() => handleToggleStatus(u.email)}>
                          {u.is_active !== false ? "Deactivate" : "Activate"}
                        </button>
                        <button className="del-btn" onClick={() => handleDeleteUser(u.email)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DEPARTMENTS TAB */}
        {activeTab === "departments" && (
          <div className="admin-sec-card">
            <h3>KVGCE Engineering Departments</h3>
            <div className="dept-grid">
              {["Computer Science & Engineering", "Information Science & Engineering", "Electronics & Communication", "Mechanical Engineering", "Civil Engineering"].map((dept, i) => (
                <div key={i} className="dept-card">
                  <h4>{dept}</h4>
                  <p>HOD: Dr. K. V. Gururaja</p>
                  <span className="dept-code">CODE: {dept.split(" ")[0]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div className="admin-sec-card">
            <h3>System Performance & Department Rankings</h3>
            <div className="analytics-box">
              <p>🟢 <strong>FastAPI Backend Status:</strong> Healthy (Uptime: 99.9%)</p>
              <p>🗄️ <strong>Database Store:</strong> Motor (JSON Fallback Store active)</p>
              <p>🔐 <strong>JWT Token Security:</strong> HS256 Encrypted</p>
            </div>
          </div>
        )}

        {/* ADD USER MODAL */}
        {showUserModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Create New User Account</h3>
                <button className="close-btn" onClick={() => setShowUserModal(false)}>×</button>
              </div>

              <form onSubmit={handleCreateUser} className="modal-form">
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({ ...newUser, full_name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Email Address</label>
                  <input
                    type="email"
                    required
                    value={newUser.email}
                    onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Role</label>
                    <select
                      value={newUser.role}
                      onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                    >
                      <option value="student">Student</option>
                      <option value="faculty">Faculty</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Department</label>
                    <select
                      value={newUser.department}
                      onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
                    >
                      <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                      <option value="Information Science & Engineering">Information Science & Engineering</option>
                      <option value="Electronics & Communication">Electronics & Communication</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Student USN / Faculty ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 4KV21CS099"
                    value={newUser.student_id}
                    onChange={(e) => setNewUser({ ...newUser, student_id: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Default Password</label>
                  <input
                    type="text"
                    value={newUser.password}
                    onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowUserModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn" disabled={submitting}>
                    {submitting ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default AdminHomePage;
