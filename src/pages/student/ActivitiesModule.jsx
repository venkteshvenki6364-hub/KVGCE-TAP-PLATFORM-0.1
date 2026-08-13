import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../services/api";
import "./ActivitiesModule.css";

function ActivitiesModule() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  const [formData, setFormData] = useState({
    title: "",
    category: "Workshop",
    description: "",
    date: new Date().toISOString().split("T")[0],
    organizer: "",
    certificate_url: "",
  });

  const fetchActivities = async () => {
    try {
      const res = await api.get("/activities");
      if (res.data && res.data.data) {
        setActivities(res.data.data);
      }
    } catch (err) {
      console.error("Error loading activities:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg("");

    try {
      const res = await api.post("/activities", formData);
      if (res.data && res.data.success) {
        setMsg("Activity submitted successfully for Faculty Verification!");
        setShowModal(false);
        setFormData({
          title: "",
          category: "Workshop",
          description: "",
          date: new Date().toISOString().split("T")[0],
          organizer: "",
          certificate_url: "",
        });
        fetchActivities();
      }
    } catch (err) {
      console.error(err);
      setMsg("Failed to submit activity. Please check input.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardLayout title="Student Activities & Achievements">
      <div className="activities-page">
        <div className="act-topbar">
          <div>
            <h2>My Activity Log</h2>
            <p>Track your extra-curricular events, workshops, hackathons & certifications.</p>
          </div>
          <button className="add-act-btn" onClick={() => setShowModal(true)}>
            + Submit New Activity
          </button>
        </div>

        {msg && <div className="alert-banner">✅ {msg}</div>}

        {/* ACTIVITIES TABLE */}
        <div className="activities-card">
          {loading ? (
            <p style={{ textAlign: "center", padding: "2rem" }}>Loading activities...</p>
          ) : activities.length === 0 ? (
            <div className="empty-act-state">
              <span className="empty-icon">🎯</span>
              <h3>No activities submitted yet</h3>
              <p>Click "Submit New Activity" above to record your achievements for credit verification.</p>
            </div>
          ) : (
            <table className="act-table">
              <thead>
                <tr>
                  <th>Title & Description</th>
                  <th>Category</th>
                  <th>Date & Organizer</th>
                  <th>Points</th>
                  <th>Verification Status</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr key={a._id}>
                    <td>
                      <strong>{a.title}</strong>
                      <p className="act-desc-sub">{a.description}</p>
                    </td>
                    <td><span className="category-tag">{a.category}</span></td>
                    <td>{a.date}<br /><small>{a.organizer}</small></td>
                    <td><strong className="points-val">+{a.points || 30} pts</strong></td>
                    <td>
                      <span className={`status-badge ${a.status?.toLowerCase()}`}>
                        {a.status === "Verified" ? "✅ Verified" : a.status === "Rejected" ? "❌ Rejected" : "⏳ Pending Review"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* SUBMISSION MODAL */}
        {showModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h3>Submit Activity for Credit Verification</h3>
                <button className="close-btn" onClick={() => setShowModal(false)}>×</button>
              </div>

              <form onSubmit={handleSubmit} className="modal-form">
                <div className="form-group">
                  <label>Activity Title</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="e.g. State Level Hackathon 2026 Winner"
                    value={formData.title}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Category</label>
                    <select name="category" value={formData.category} onChange={handleChange}>
                      <option value="Hackathon">Hackathon</option>
                      <option value="Workshop">Workshop</option>
                      <option value="Seminar">Seminar</option>
                      <option value="Internship">Internship</option>
                      <option value="Certification">Certification</option>
                      <option value="Project">Project</option>
                      <option value="Competition">Competition</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Date Conducted</label>
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Organizer / Host Entity</label>
                  <input
                    type="text"
                    name="organizer"
                    placeholder="e.g. VTU Belagavi or AWS"
                    value={formData.organizer}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    placeholder="Provide brief details about what was accomplished..."
                    value={formData.description}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Credential / Certificate URL (Optional)</label>
                  <input
                    type="url"
                    name="certificate_url"
                    placeholder="https://drive.google.com/... or https://coursera.org/verify/..."
                    value={formData.certificate_url}
                    onChange={handleChange}
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-btn" disabled={submitting}>
                    {submitting ? "Submitting..." : "Submit for Approval"}
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

export default ActivitiesModule;
