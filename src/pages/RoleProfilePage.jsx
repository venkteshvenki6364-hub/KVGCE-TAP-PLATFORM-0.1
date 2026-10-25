import { useCallback, useEffect, useRef, useState } from "react";
import DashboardLayout from "../components/DashboardLayout";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./RoleProfilePage.css";

const emptyPassword = { current_password: "", new_password: "", confirm_password: "" };

function RoleProfilePage() {
  const { user, updateUser } = useAuth();
  const isFaculty = user?.role === "faculty";
  const endpoint = isFaculty ? "/faculty/profile" : "/admin/profile";
  const [profile, setProfile] = useState(user || {});
  const [editing, setEditing] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [form, setForm] = useState({});
  const [passwordForm, setPasswordForm] = useState(emptyPassword);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const applyProfile = (nextProfile) => {
    setProfile(nextProfile);
    setForm({
      full_name: nextProfile.full_name || "",
      phone: nextProfile.phone || "",
      department: nextProfile.department || "",
      summary: nextProfile.summary || "",
    });
  };

  const loadProfile = useCallback(async () => {
    try {
      const response = await api.get(endpoint);
      applyProfile(response.data?.data || user || {});
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Could not load profile.");
    } finally {
      setLoading(false);
    }
  }, [endpoint, user]);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      await loadProfile();
    };
    load();
  }, [loadProfile, user]);

  const setField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const saveProfile = async (event) => {
    event.preventDefault();
    if (!form.full_name.trim()) {
      setError("Full name is required.");
      return;
    }
    if (form.phone && !/^(?:\+?91[\s-]?)?\d{10}$/.test(form.phone.trim().replace(/\s+/g, " "))) {
      setError("Phone number must contain exactly 10 digits.");
      return;
    }
    if (form.summary.length > 1000) {
      setError("Summary must be 1000 characters or fewer.");
      return;
    }

    setSaving(true);
    setError("");
    setMessage("");
    try {
      const payload = {
        full_name: form.full_name.trim(),
        phone: form.phone.trim(),
        summary: form.summary.trim(),
      };
      if (!isFaculty) payload.department = form.department.trim();
      const response = await api.put(endpoint, payload);
      const updated = response.data?.data || profile;
      applyProfile(updated);
      updateUser({ full_name: updated.full_name, phone: updated.phone, department: updated.department, summary: updated.summary });
      setEditing(false);
      setMessage("Profile updated successfully.");
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Could not save profile.");
    } finally {
      setSaving(false);
    }
  };

  const uploadAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Profile image must be 5 MB or smaller.");
      return;
    }
    const formData = new FormData();
    formData.append("file", file);
    setSaving(true);
    setError("");
    try {
      const response = await api.post(`${endpoint}/avatar`, formData, { headers: { "Content-Type": "multipart/form-data" } });
      applyProfile(response.data?.data || profile);
      updateUser({ avatarUrl: response.data?.data?.avatarUrl });
      setMessage("Profile image updated successfully.");
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Could not upload profile image.");
    } finally {
      setSaving(false);
      event.target.value = "";
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (passwordForm.new_password.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setError("New password and confirmation do not match.");
      return;
    }
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const response = await api.put(`${endpoint}/password`, passwordForm);
      setPasswordForm(emptyPassword);
      setPasswordOpen(false);
      setMessage(response.data?.message || "Password updated successfully.");
    } catch (requestError) {
      setError(requestError.response?.data?.detail || "Could not update password.");
    } finally {
      setSaving(false);
    }
  };

  const initials = (profile.full_name || (isFaculty ? "Faculty" : "Admin"))
    .split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  if (loading) {
    return <DashboardLayout title="Profile"><p className="role-profile-loading">Loading profile...</p></DashboardLayout>;
  }

  return (
    <DashboardLayout title={`${isFaculty ? "Faculty" : "Admin"} Profile`}>
      <main className="role-profile-page">
        {message && <div className="role-profile-message success">{message}</div>}
        {error && <div className="role-profile-message error">{error}</div>}

        <section className="role-profile-header">
          <div className="role-profile-avatar-wrap">
            {profile.avatarUrl
              ? <img className="role-profile-avatar" src={profile.avatarUrl} alt={`${profile.full_name || "Profile"} profile`} />
              : <div className="role-profile-avatar role-profile-avatar-fallback">{initials}</div>}
            {editing && (
              <>
                <button type="button" className="role-profile-image-button" onClick={() => fileInputRef.current?.click()} disabled={saving}>Change image</button>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={uploadAvatar} hidden />
              </>
            )}
          </div>
          <div className="role-profile-heading">
            <h2>{profile.full_name || "Profile"}</h2>
            <p>{profile.department || "Department not specified"}</p>
          </div>
          {!editing && <button className="role-profile-primary" type="button" onClick={() => setEditing(true)}>Edit Profile</button>}
        </section>

        <section className="role-profile-card">
          <h3>Profile Information</h3>
          {editing ? (
            <form className="role-profile-edit-form" onSubmit={saveProfile}>
              <label>Full name<input name="full_name" value={form.full_name} onChange={setField} required /></label>
              <label>Phone number<input name="phone" value={form.phone} onChange={setField} placeholder="10 digit phone number" /></label>
              {!isFaculty && <label>Department<input name="department" value={form.department} onChange={setField} /></label>}
              <label>Email address<input value={profile.email || ""} readOnly /></label>
              <label>Summary / About<textarea name="summary" value={form.summary} onChange={setField} maxLength={1000} rows={4} /></label>
              <div className="role-profile-actions">
                <button className="role-profile-primary" type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
                <button type="button" onClick={() => { applyProfile(profile); setEditing(false); }}>Cancel</button>
              </div>
            </form>
          ) : (
            <div className="role-profile-details">
              <div><span>Phone number</span><strong>{profile.phone || "Not provided"}</strong></div>
              <div><span>Email address</span><strong>{profile.email || "Not available"}</strong></div>
              <div><span>Department</span><strong>{profile.department || "Not specified"}</strong></div>
            </div>
          )}
        </section>

        {isFaculty && (
          <section className="role-profile-card">
            <h3>Subjects They Teach</h3>
            <div className="role-profile-subjects">
              {profile.subjects?.length
                ? profile.subjects.map((subject, index) => <span key={subject._id || subject.subject_id || index}>{subject.name || subject.subject_name || subject.title || "Subject"}</span>)
                : <p>No subjects assigned.</p>}
            </div>
          </section>
        )}

        <section className="role-profile-card">
          <h3>About</h3>
          <p className="role-profile-summary">
            {profile.summary || (isFaculty
              ? `Faculty member supporting ${profile.department || "the department"} through teaching, subject delivery, and academic guidance.`
              : "Administrator responsible for managing the TAP-KVGCE platform, users, assessments, and student performance monitoring.")}
          </p>
        </section>

        <section className="role-profile-card role-profile-actions-card">
          {!passwordOpen ? (
            <button type="button" className="role-profile-secondary" onClick={() => setPasswordOpen(true)}>Change Password</button>
          ) : (
            <form className="role-profile-password-form" onSubmit={changePassword}>
              <h3>Change Password</h3>
              <input type="password" placeholder="Current password" value={passwordForm.current_password} onChange={(event) => setPasswordForm({ ...passwordForm, current_password: event.target.value })} required />
              <input type="password" placeholder="New password (minimum 8 characters)" minLength={8} value={passwordForm.new_password} onChange={(event) => setPasswordForm({ ...passwordForm, new_password: event.target.value })} required />
              <input type="password" placeholder="Confirm new password" minLength={8} value={passwordForm.confirm_password} onChange={(event) => setPasswordForm({ ...passwordForm, confirm_password: event.target.value })} required />
              <div className="role-profile-actions">
                <button className="role-profile-primary" type="submit" disabled={saving}>{saving ? "Updating..." : "Update Password"}</button>
                <button type="button" onClick={() => { setPasswordForm(emptyPassword); setPasswordOpen(false); }}>Cancel</button>
              </div>
            </form>
          )}
        </section>
      </main>
    </DashboardLayout>
  );
}

export default RoleProfilePage;
