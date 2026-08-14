import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import "./StudentProfile.css";

function StudentProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    full_name: "",
    student_id: "",
    email: "",
    phone: "",
    department: "",
    course: "",
    semester: 6,
    year: 3,
    github: "",
    linkedin: "",
    portfolio: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/students/profile");
        if (res.data && res.data.data) {
          setProfile(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: "", text: "" });

    try {
      const res = await api.put("/students/profile", profile);
      if (res.data && res.data.success) {
        setMsg({ type: "success", text: "Profile updated successfully!" });
      }
    } catch (err) {
      console.error(err);
      setMsg({ type: "error", text: "Failed to update profile. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="My Profile">
        <div style={{ textAlign: "center", padding: "3rem" }}>Loading profile details...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Profile & Settings">
      <div className="profile-container">
        {msg.text && (
          <div className={`msg-alert ${msg.type}`}>
            {msg.type === "success" ? "✅" : "⚠️"} {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="profile-form-card">
          <div className="profile-header-strip">
            <div className="profile-avatar-large">
              {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "S"}
            </div>
            <div>
              <h2>{profile.full_name || "Student"}</h2>
              <span className="id-badge">{profile.student_id || "Student ID"}</span>
            </div>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="full_name" value={profile.full_name || ""} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Student ID / USN</label>
              <input type="text" name="student_id" value={profile.student_id || ""} onChange={handleChange} required />
            </div>

            <div className="form-group">
              <label>Email Address</label>
              <input type="email" name="email" value={profile.email || ""} disabled />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input type="text" name="phone" value={profile.phone || ""} onChange={handleChange} placeholder="+91 9876543210" />
            </div>

            <div className="form-group">
              <label>Department</label>
              <select name="department" value={profile.department || ""} onChange={handleChange}>
                <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                <option value="Information Science & Engineering">Information Science & Engineering</option>
                <option value="Electronics & Communication">Electronics & Communication</option>
                <option value="Mechanical Engineering">Mechanical Engineering</option>
                <option value="Civil Engineering">Civil Engineering</option>
              </select>
            </div>

            <div className="form-group">
              <label>Course / Program</label>
              <input type="text" name="course" value={profile.course || ""} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Semester</label>
              <input type="number" name="semester" min="1" max="8" value={profile.semester || 6} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>Academic Year</label>
              <input type="number" name="year" min="1" max="4" value={profile.year || 3} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label>GitHub Profile</label>
              <input type="url" name="github" value={profile.github || ""} onChange={handleChange} placeholder="https://github.com/username" />
            </div>

            <div className="form-group">
              <label>LinkedIn Profile</label>
              <input type="url" name="linkedin" value={profile.linkedin || ""} onChange={handleChange} placeholder="https://linkedin.com/in/username" />
            </div>

            <div className="form-group full-width">
              <label>Portfolio / Personal Website</label>
              <input type="url" name="portfolio" value={profile.portfolio || ""} onChange={handleChange} placeholder="https://portfolio.dev" />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-profile-btn" disabled={saving}>
              {saving ? "Saving Changes..." : "Save Profile Details"}
            </button>
          </div>
        </form>
      </div>
    </DashboardLayout>
  );
}

export default StudentProfile;
