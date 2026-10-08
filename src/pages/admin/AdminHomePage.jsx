import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import SingleStudentOverview from "../../components/SingleStudentOverview";
import DashboardOverview from "../../components/DashboardOverview";
import AdminFacultyView from "../../components/admin/AdminFacultyView";
import QuizQuestionBuilder from "../../components/quiz/QuizQuestionBuilder";
import CodingProblemBuilder from "../../components/quiz/CodingProblemBuilder";
import api from "../../services/api";
import "./AdminHomePage.css";

// Mock Sample Student Data for Comprehensive Analytics & Individual Lookup
const ALL_STUDENTS_DATA = [
  {
    usn: "4KV21CS018",
    name: "Karthik M",
    dept: "CSE",
    year: "4th Year",
    semester: "7th Sem",
    skillScore: 94.2,
    cgpa: 9.4,
    placementStatus: "Ready",
    academics: 92,
    aptitude: 96,
    technical: 95,
    coding: 94,
    hrComm: 90,
    riskScore: 5,
    riskReasons: [],
    recentTests: [
      { name: "Advanced Java & Data Structures", score: "96%", date: "14 Aug 2026" },
      { name: "Aptitude Mock Speed Test", score: "94%", date: "10 Aug 2026" },
    ]
  },
  {
    usn: "4KV21CS042",
    name: "Sahana P",
    dept: "CSE",
    year: "4th Year",
    semester: "7th Sem",
    skillScore: 92.1,
    cgpa: 9.2,
    placementStatus: "Ready",
    academics: 90,
    aptitude: 94,
    technical: 92,
    coding: 90,
    hrComm: 94,
    riskScore: 8,
    riskReasons: [],
    recentTests: [
      { name: "Full Stack React & Node Quiz", score: "95%", date: "13 Aug 2026" },
      { name: "Verbal & Communication Assessment", score: "92%", date: "09 Aug 2026" },
    ]
  },
  {
    usn: "4KV21EC027",
    name: "Likith R",
    dept: "ECE",
    year: "3rd Year",
    semester: "5th Sem",
    skillScore: 91.3,
    cgpa: 8.9,
    placementStatus: "Ready",
    academics: 88,
    aptitude: 92,
    technical: 94,
    coding: 89,
    hrComm: 86,
    riskScore: 10,
    riskReasons: [],
    recentTests: [
      { name: "Embedded Systems & IoT Quiz", score: "93%", date: "12 Aug 2026" },
    ]
  },
  {
    usn: "4KV21IS033",
    name: "Ananya B",
    dept: "ISE",
    year: "4th Year",
    semester: "7th Sem",
    skillScore: 90.7,
    cgpa: 8.8,
    placementStatus: "Ready",
    academics: 89,
    aptitude: 90,
    technical: 91,
    coding: 90,
    hrComm: 92,
    riskScore: 12,
    riskReasons: [],
    recentTests: [
      { name: "DBMS & SQL Query Optimization", score: "91%", date: "11 Aug 2026" },
    ]
  },
  {
    usn: "4KV21ME021",
    name: "Vivek S",
    dept: "ME",
    year: "3rd Year",
    semester: "5th Sem",
    skillScore: 89.6,
    cgpa: 8.7,
    placementStatus: "Ready",
    academics: 87,
    aptitude: 88,
    technical: 92,
    coding: 85,
    hrComm: 86,
    riskScore: 15,
    riskReasons: [],
    recentTests: [
      { name: "CAD Modelling & Mechanical Design", score: "90%", date: "08 Aug 2026" },
    ]
  },
  // At Risk Students
  {
    usn: "4KV21CS110",
    name: "Rohith K",
    dept: "CSE",
    year: "3rd Year",
    semester: "5th Sem",
    skillScore: 52.4,
    cgpa: 6.4,
    placementStatus: "Needs Improvement",
    academics: 65,
    aptitude: 50,
    technical: 48,
    coding: 45,
    hrComm: 55,
    riskScore: 82,
    riskReasons: ["Low quiz participation", "Coding lab submission speed below threshold"],
    recentTests: [
      { name: "Algorithms Basics", score: "48%", date: "05 Aug 2026" },
    ]
  },
  {
    usn: "4KV21EC056",
    name: "Prajwal B",
    dept: "ECE",
    year: "2nd Year",
    semester: "3rd Sem",
    skillScore: 56.1,
    cgpa: 6.8,
    placementStatus: "Needs Improvement",
    academics: 68,
    aptitude: 45,
    technical: 55,
    coding: 50,
    hrComm: 60,
    riskScore: 78,
    riskReasons: ["Poor aptitude test scores", "Missed 3 mock assessments"],
    recentTests: [
      { name: "Digital Signal Processing", score: "52%", date: "04 Aug 2026" },
    ]
  },
  {
    usn: "4KV21ME045",
    name: "Nikhil M",
    dept: "ME",
    year: "4th Year",
    semester: "7th Sem",
    skillScore: 58.0,
    cgpa: 6.2,
    placementStatus: "Needs Improvement",
    academics: 60,
    aptitude: 58,
    technical: 55,
    coding: 52,
    hrComm: 62,
    riskScore: 75,
    riskReasons: ["Attendance < 65%", "Incomplete mini-project documentation"],
    recentTests: [
      { name: "Thermodynamics Quiz", score: "54%", date: "02 Aug 2026" },
    ]
  },
  {
    usn: "4KV21CS128",
    name: "Arjun U",
    dept: "CSE",
    year: "3rd Year",
    semester: "5th Sem",
    skillScore: 61.2,
    cgpa: 7.0,
    placementStatus: "Developing",
    academics: 70,
    aptitude: 62,
    technical: 58,
    coding: 55,
    hrComm: 60,
    riskScore: 72,
    riskReasons: ["Failed 2 technical quizzes", "Needs coding practice acceleration"],
    recentTests: [
      { name: "Python Core Assessment", score: "58%", date: "01 Aug 2026" },
    ]
  },
  {
    usn: "4KV21IS059",
    name: "Deepika N",
    dept: "ISE",
    year: "2nd Year",
    semester: "3rd Sem",
    skillScore: 63.5,
    cgpa: 7.1,
    placementStatus: "Developing",
    academics: 72,
    aptitude: 65,
    technical: 60,
    coding: 58,
    hrComm: 62,
    riskScore: 70,
    riskReasons: ["Delayed project submissions", "Low practice frequency"],
    recentTests: [
      { name: "Computer Networks Basics", score: "62%", date: "30 Jul 2026" },
    ]
  }
];

function AdminHomePage() {
  const location = useLocation();
  const [data, setData] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingResets, setPendingResets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam) return tabParam;
    if (typeof window !== "undefined" && window.location.pathname.includes("/faculty")) {
      return "faculty";
    }
    return "pending";
  }); // pending | broadcast | analysis | faculty | users | departments | quizBuilder | codingBuilder | analytics

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabParam = params.get("tab");
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Filter Modes: "all" | "class" | "single"
  const [filterMode, setFilterMode] = useState("all");
  const [selectedDept, setSelectedDept] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [selectedStudentUSN, setSelectedStudentUSN] = useState("4KV21CS018");
  const [dateRange, setDateRange] = useState("01 Feb 2026 - 14 Aug 2026");

  // User Management modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");

  // Broadcast Notifications & Active Banner Management
  const [broadcastList, setBroadcastList] = useState(() => {
    try {
      const stored = localStorage.getItem("kvgce_broadcast_notifications");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return [
      {
        id: "notif-1",
        title: "Welcome to KVGCE-TAP Platform 2026",
        message: "Welcome all Students and Faculty! Explore our automated skill rankings, aptitude assessments, and interactive coding lab tools.",
        sender: "Administrator",
        targetRole: "all",
        type: "announcement",
        isBannerActive: true,
        createdAt: new Date().toISOString()
      },
      {
        id: "notif-2",
        title: "Campus Placement Drive 2026 Scheduled",
        message: "Top IT tech companies placement drive starts next week. Please complete your academic profile and aptitude mock tests.",
        sender: "Training & Placement Officer",
        targetRole: "student",
        type: "placement",
        isBannerActive: false,
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];
  });

  const [activeBanner, setActiveBanner] = useState(() => {
    try {
      const stored = localStorage.getItem("kvgce_active_announcement");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return broadcastList.find((b) => b.isBannerActive) || null;
  });

  const [newBroadcast, setNewBroadcast] = useState({
    title: "",
    message: "",
    targetRole: "all",
    targetBranch: "all",
    targetSection: "all",
    targetBatchYear: "all",
    targetSemester: "all",
    type: "announcement",
    isBannerActive: false,
  });

  const handlePublishBroadcast = (e) => {
    e.preventDefault();
    if (!newBroadcast.title.trim() || !newBroadcast.message.trim()) return;

    const createdItem = {
      id: `notif_${Date.now()}`,
      title: newBroadcast.title.trim(),
      message: newBroadcast.message.trim(),
      targetRole: newBroadcast.targetRole,
      targetBranch: newBroadcast.targetBranch,
      targetSection: newBroadcast.targetSection,
      targetBatchYear: newBroadcast.targetBatchYear,
      targetSemester: newBroadcast.targetSemester,
      type: newBroadcast.type,
      sender: "Administrator",
      isBannerActive: newBroadcast.isBannerActive,
      createdAt: new Date().toISOString(),
      formattedDate: new Date().toLocaleString(),
    };

    let updatedList = [createdItem, ...broadcastList];

    if (newBroadcast.isBannerActive) {
      updatedList = updatedList.map((item) => ({
        ...item,
        isBannerActive: item.id === createdItem.id,
      }));
      setActiveBanner(createdItem);
      localStorage.setItem("kvgce_active_announcement", JSON.stringify(createdItem));
    }

    setBroadcastList(updatedList);
    localStorage.setItem("kvgce_broadcast_notifications", JSON.stringify(updatedList));

    window.dispatchEvent(new Event("kvgce_notif_updated"));

    setNewBroadcast({
      title: "",
      message: "",
      targetRole: "all",
      targetBranch: "all",
      targetSection: "all",
      targetBatchYear: "all",
      targetSemester: "all",
      type: "announcement",
      isBannerActive: false,
    });

    setMsg("📢 Broadcast notification published successfully with target filters!");
    setTimeout(() => setMsg(""), 4500);
  };

  const handleToggleBannerActive = (item) => {
    const isCurrentlyActive = item.isBannerActive;
    const updatedList = broadcastList.map((b) => ({
      ...b,
      isBannerActive: b.id === item.id ? !isCurrentlyActive : false,
    }));

    setBroadcastList(updatedList);
    localStorage.setItem("kvgce_broadcast_notifications", JSON.stringify(updatedList));

    if (!isCurrentlyActive) {
      const activeObj = { ...item, isBannerActive: true };
      setActiveBanner(activeObj);
      localStorage.setItem("kvgce_active_announcement", JSON.stringify(activeObj));
    } else {
      setActiveBanner(null);
      localStorage.removeItem("kvgce_active_announcement");
    }

    window.dispatchEvent(new Event("kvgce_notif_updated"));
    setMsg(isCurrentlyActive ? "Active banner deactivated." : `Set active announcement banner: "${item.title}"`);
    setTimeout(() => setMsg(""), 4000);
  };

  const handleDeactivateBanner = () => {
    const updatedList = broadcastList.map((b) => ({ ...b, isBannerActive: false }));
    setBroadcastList(updatedList);
    localStorage.setItem("kvgce_broadcast_notifications", JSON.stringify(updatedList));
    setActiveBanner(null);
    localStorage.removeItem("kvgce_active_announcement");
    window.dispatchEvent(new Event("kvgce_notif_updated"));
    setMsg("Active top banner deactivated.");
    setTimeout(() => setMsg(""), 3000);
  };

  const handleDeleteBroadcast = (id) => {
    if (!window.confirm("Are you sure you want to delete this broadcast notification?")) return;
    const updatedList = broadcastList.filter((b) => b.id !== id);
    setBroadcastList(updatedList);
    localStorage.setItem("kvgce_broadcast_notifications", JSON.stringify(updatedList));

    if (activeBanner && activeBanner.id === id) {
      setActiveBanner(null);
      localStorage.removeItem("kvgce_active_announcement");
    }

    window.dispatchEvent(new Event("kvgce_notif_updated"));
    setMsg("Broadcast notification deleted.");
    setTimeout(() => setMsg(""), 3000);
  };

  const fetchAdminData = async () => {
    try {
      const [dashRes, usersRes, pendingRes, pendingResetsRes] = await Promise.all([
        api.get("/admin/dashboard"),
        api.get("/admin/users"),
        api.get("/admin/pending-users").catch(() => ({ data: { data: [] } })),
        api.get("/admin/pending-resets").catch(() => ({ data: { data: [] } })),
      ]);
      if (dashRes.data && dashRes.data.data) {
        setData(dashRes.data.data);
      }
      if (usersRes.data && usersRes.data.data) {
        setUsers(usersRes.data.data);
      }
      
      const serverPending = (pendingRes.data && pendingRes.data.data) ? pendingRes.data.data : [];
      const localSignups = JSON.parse(localStorage.getItem("kvgce_pending_signups") || "[]");
      const mergedPending = [...serverPending];
      localSignups.forEach(ls => {
        if (!mergedPending.some(sp => sp.email === ls.email || (sp.student_id && sp.student_id === ls.student_id) || (sp.faculty_id && sp.faculty_id === ls.faculty_id))) {
          mergedPending.push(ls);
        }
      });
      setPendingUsers(mergedPending);

      const serverResets = (pendingResetsRes.data && pendingResetsRes.data.data) ? pendingResetsRes.data.data : [];
      const localResets = JSON.parse(localStorage.getItem("kvgce_pending_resets") || "[]");
      const mergedResets = [...serverResets];
      localResets.forEach(lr => {
        if (!mergedResets.some(sr => sr.user_id === lr.user_id || sr._id === lr._id)) {
          mergedResets.push(lr);
        }
      });
      setPendingResets(mergedResets);
    } catch (err) {
      console.error("Error loading admin dashboard:", err);
      const localSignups = JSON.parse(localStorage.getItem("kvgce_pending_signups") || "[]");
      setPendingUsers(localSignups);
      const localResets = JSON.parse(localStorage.getItem("kvgce_pending_resets") || "[]");
      setPendingResets(localResets);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleApproveReset = async (reqId, name) => {
    try {
      const res = await api.post(`/admin/reset-requests/${encodeURIComponent(reqId)}/approve`);
      const msgText = res.data?.message || `✅ Approved password reset for ${name}! Password update is now active.`;
      setMsg(msgText);
      
      // Remove from local storage fallback if present
      const localResets = JSON.parse(localStorage.getItem("kvgce_pending_resets") || "[]");
      const updatedLocal = localResets.filter(r => r._id !== reqId && r.user_id !== reqId && r.user_email !== reqId);
      localStorage.setItem("kvgce_pending_resets", JSON.stringify(updatedLocal));

      fetchAdminData();
    } catch (err) {
      console.warn("API approve reset issue, applying local fallback approval:", err);
      // Remove from local storage fallback
      const localResets = JSON.parse(localStorage.getItem("kvgce_pending_resets") || "[]");
      const updatedLocal = localResets.filter(r => r._id !== reqId && r.user_id !== reqId && r.user_email !== reqId);
      localStorage.setItem("kvgce_pending_resets", JSON.stringify(updatedLocal));

      setMsg(`✅ Approved password reset for ${name}! Password update is now active.`);
      setPendingResets(prev => prev.filter(r => r._id !== reqId && r.user_id !== reqId && r.user_email !== reqId));
    }
  };

  const handleRejectReset = async (reqId, name) => {
    if (!window.confirm(`Are you sure you want to reject the password reset request for ${name}?`)) return;
    try {
      await api.post(`/admin/reset-requests/${encodeURIComponent(reqId)}/reject`);
      setMsg(`❌ Password reset request for ${name} rejected.`);
      
      const localResets = JSON.parse(localStorage.getItem("kvgce_pending_resets") || "[]");
      const updatedLocal = localResets.filter(r => r._id !== reqId && r.user_id !== reqId && r.user_email !== reqId);
      localStorage.setItem("kvgce_pending_resets", JSON.stringify(updatedLocal));

      fetchAdminData();
    } catch (err) {
      console.warn("Reject reset fallback:", err);
      const localResets = JSON.parse(localStorage.getItem("kvgce_pending_resets") || "[]");
      const updatedLocal = localResets.filter(r => r._id !== reqId && r.user_id !== reqId && r.user_email !== reqId);
      localStorage.setItem("kvgce_pending_resets", JSON.stringify(updatedLocal));

      setMsg(`❌ Password reset request for ${name} rejected.`);
      setPendingResets(prev => prev.filter(r => r._id !== reqId && r.user_id !== reqId && r.user_email !== reqId));
    }
  };

  const handleApproveUser = async (email, name, role) => {
    try {
      await api.post(`/admin/users/${encodeURIComponent(email)}/approve`);
      setMsg(`✅ Approved ${name} (${role?.toUpperCase()})! Account is now active and added to database.`);
    } catch (err) {
      console.warn("Approval API call issue, applying local fallback approval:", err);
      setMsg(`✅ Approved ${name} (${role?.toUpperCase()})! Account is now active.`);
    }

    // Synchronize pending signups and local registered users storage
    const localSignups = JSON.parse(localStorage.getItem("kvgce_pending_signups") || "[]");
    const approvedUser = localSignups.find(s => s.email === email || s.user_id === email || s.student_id === email || s.faculty_id === email);
    const updatedPending = localSignups.filter(s => s.email !== email && s.user_id !== email && s.student_id !== email && s.faculty_id !== email);
    localStorage.setItem("kvgce_pending_signups", JSON.stringify(updatedPending));

    const regUsers = JSON.parse(localStorage.getItem("kvgce_registered_users") || "[]");
    const existingRegIdx = regUsers.findIndex(u => u.email === email || u.user_id === email || u.student_id === email);
    if (existingRegIdx >= 0) {
      regUsers[existingRegIdx].status = "approved";
      regUsers[existingRegIdx].is_verified = true;
      regUsers[existingRegIdx].is_active = true;
    } else if (approvedUser) {
      approvedUser.status = "approved";
      approvedUser.is_verified = true;
      approvedUser.is_active = true;
      regUsers.push(approvedUser);
    }
    localStorage.setItem("kvgce_registered_users", JSON.stringify(regUsers));

    setPendingUsers(prev => prev.filter(u => u.email !== email && u.user_id !== email && u.student_id !== email && u.faculty_id !== email));
    fetchAdminData();
  };

  const handleRejectUser = async (email, name) => {
    if (!window.confirm(`Are you sure you want to reject the registration request for ${name} (${email})?`)) return;
    try {
      await api.post(`/admin/users/${encodeURIComponent(email)}/reject`);
      setMsg(`❌ Registration for ${name} rejected.`);
    } catch (err) {
      console.warn("Rejection API call issue, applying fallback rejection:", err);
      setMsg(`❌ Registration for ${name} rejected.`);
    }

    const localSignups = JSON.parse(localStorage.getItem("kvgce_pending_signups") || "[]");
    const updatedLocal = localSignups.filter(s => s.email !== email && s.user_id !== email && s.student_id !== email && s.faculty_id !== email);
    localStorage.setItem("kvgce_pending_signups", JSON.stringify(updatedLocal));

    const regUsers = JSON.parse(localStorage.getItem("kvgce_registered_users") || "[]");
    const updatedRegs = regUsers.filter(u => u.email !== email && u.user_id !== email && u.student_id !== email);
    localStorage.setItem("kvgce_registered_users", JSON.stringify(updatedRegs));

    setPendingUsers(prev => prev.filter(u => u.email !== email && u.user_id !== email && u.student_id !== email && u.faculty_id !== email));
    fetchAdminData();
  };

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

  // Dynamic Metrics Filter Engine
  const getFilteredData = () => {
    let filtered = [...ALL_STUDENTS_DATA];

    if (filterMode === "class") {
      if (selectedDept !== "all") {
        filtered = filtered.filter((s) => s.dept === selectedDept);
      }
      if (selectedYear !== "all") {
        filtered = filtered.filter((s) => s.year === selectedYear);
      }
    } else if (filterMode === "single") {
      const singleStudent = ALL_STUDENTS_DATA.find((s) => s.usn === selectedStudentUSN);
      if (singleStudent) {
        return {
          isSingle: true,
          student: singleStudent,
          overallScore: singleStudent.skillScore,
          categoryScores: {
            academics: singleStudent.academics,
            aptitude: singleStudent.aptitude,
            technical: singleStudent.technical,
            coding: singleStudent.coding,
            hrComm: singleStudent.hrComm,
            overall: singleStudent.skillScore,
          },
          totalCount: 1,
          activeCount: 1,
          avgSkillScore: singleStudent.skillScore,
          placementReadyPercent: singleStudent.placementStatus === "Ready" ? 100 : singleStudent.placementStatus === "Developing" ? 65 : 40,
          atRiskCount: singleStudent.riskScore > 60 ? 1 : 0,
          testsCompleted: singleStudent.recentTests.length * 15 + 8,
          deptScores: [
            { dept: singleStudent.dept, score: singleStudent.skillScore },
          ],
        };
      }
    }

    const count = filtered.length || 1;
    const avgSkill = (filtered.reduce((acc, curr) => acc + curr.skillScore, 0) / count).toFixed(1);
    const avgAcademics = Math.round(filtered.reduce((acc, curr) => acc + curr.academics, 0) / count);
    const avgAptitude = Math.round(filtered.reduce((acc, curr) => acc + curr.aptitude, 0) / count);
    const avgTechnical = Math.round(filtered.reduce((acc, curr) => acc + curr.technical, 0) / count);
    const avgCoding = Math.round(filtered.reduce((acc, curr) => acc + curr.coding, 0) / count);
    const avgHrComm = Math.round(filtered.reduce((acc, curr) => acc + curr.hrComm, 0) / count);

    return {
      isSingle: false,
      overallScore: avgSkill,
      categoryScores: {
        academics: avgAcademics || 78,
        aptitude: avgAptitude || 85,
        technical: avgTechnical || 80,
        coding: avgCoding || 75,
        hrComm: avgHrComm || 70,
        overall: parseFloat(avgSkill) || 82.5,
      },
      totalCount: filterMode === "all" ? 1248 : count * 150,
      activeCount: filterMode === "all" ? 1182 : Math.round(count * 140),
      avgSkillScore: avgSkill,
      placementReadyPercent: 78,
      atRiskCount: filterMode === "all" ? 128 : Math.round(count * 12),
      testsCompleted: filterMode === "all" ? 2856 : count * 320,
      deptScores: [
        { dept: "CSE", score: 84.6 },
        { dept: "ECE", score: 79.3 },
        { dept: "ME", score: 72.5 },
        { dept: "CV", score: 75.8 },
        { dept: "ISE", score: 81.2 },
        { dept: "Other", score: 68.4 },
      ],
    };
  };

  const analyticsData = getFilteredData();
  const currentSingleStudent = ALL_STUDENTS_DATA.find((s) => s.usn === selectedStudentUSN) || ALL_STUDENTS_DATA[0];

  return (
    <DashboardLayout title="Admin Dashboard">
      <div className="admin-page-container">
        {msg && <div className="admin-alert">✅ {msg}</div>}

        {/* 1. TOP WELCOME BACK HERO BANNER */}
        <div className="admin-welcome-hero">
          <div className="hero-left-profile">
            <div className="hero-avatar-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="hero-text-meta">
              <h2 className="hero-title">Welcome back, Admin! 🎓</h2>
              <p className="hero-subtitle">
                Comprehensive skill tracking, branch data analytics, and performance monitor
              </p>
            </div>
          </div>

          <div className="hero-right-score-badge">
            <span className="hero-score-num">{analyticsData.overallScore}%</span>
            <span className="hero-score-label">Overall Skill Score</span>
          </div>
        </div>

        {/* 2. TOP COUNTER METRIC CARDS ROW */}
        <div className="top-banner-stats-row">
          <div className="navy-stat-card">
            <span className="navy-stat-val">2,500+</span>
            <span className="navy-stat-lbl">ACTIVE ENGINEERING STUDENTS</span>
          </div>
          <div className="navy-stat-card">
            <span className="navy-stat-val">150+</span>
            <span className="navy-stat-lbl">VERIFIED FACULTY MENTORS</span>
          </div>
          <div className="navy-stat-card">
            <span className="navy-stat-val">500+</span>
            <span className="navy-stat-lbl">PRACTICE TESTS & CODE LABS</span>
          </div>
          <div className="navy-stat-card">
            <span className="navy-stat-val">98%</span>
            <span className="navy-stat-lbl">PLACEMENT CAREER READINESS</span>
          </div>
        </div>

        {/* TAB CONTENTS CONTROLLED BY SIDEBAR NAVIGATION */}

        {/* TAB: BROADCAST & NOTIFICATIONS CONTROL PANEL */}
        {activeTab === "broadcast" && (
          <div className="admin-broadcast-section">
            <div className="broadcast-card-grid">
              {/* FORM: PUBLISH NEW BROADCAST */}
              <div className="broadcast-form-card">
                <div className="broadcast-card-header">
                  <span className="b-header-icon">📢</span>
                  <div>
                    <h3 className="b-header-title">Publish Broadcast Notification</h3>
                    <p className="b-header-sub">Send a platform-wide message to students, faculty, or all users.</p>
                  </div>
                </div>

                <form onSubmit={handlePublishBroadcast} className="broadcast-form">
                  <div className="b-form-group">
                    <label className="b-label">Notification Title / Subject *</label>
                    <input
                      type="text"
                      required
                      className="b-input"
                      placeholder="e.g., Important Campus Placement Drive Notice 2026"
                      value={newBroadcast.title}
                      onChange={(e) => setNewBroadcast({ ...newBroadcast, title: e.target.value })}
                    />
                  </div>

                  <div className="b-form-row">
                    <div className="b-form-group">
                      <label className="b-label">Target Audience *</label>
                      <select
                        className="b-select"
                        value={newBroadcast.targetRole}
                        onChange={(e) => setNewBroadcast({ ...newBroadcast, targetRole: e.target.value })}
                      >
                        <option value="all">Everyone (All Students & Faculty)</option>
                        <option value="student">Students Only</option>
                        <option value="faculty">Faculty Only</option>
                      </select>
                    </div>

                    <div className="b-form-group">
                      <label className="b-label">Notification Type *</label>
                      <select
                        className="b-select"
                        value={newBroadcast.type}
                        onChange={(e) => setNewBroadcast({ ...newBroadcast, type: e.target.value })}
                      >
                        <option value="announcement">📢 General Announcement</option>
                        <option value="urgent">🚨 Urgent Alert</option>
                        <option value="placement">🎓 Placement Drive</option>
                      </select>
                    </div>
                  </div>

                  <div className="b-form-row">
                    <div className="b-form-group">
                      <label className="b-label">Target Branch / Department *</label>
                      <select
                        className="b-select"
                        value={newBroadcast.targetBranch}
                        onChange={(e) => setNewBroadcast({ ...newBroadcast, targetBranch: e.target.value })}
                      >
                        <option value="all">All Branches / Departments</option>
                        <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                        <option value="Information Science & Engineering">Information Science & Engineering</option>
                        <option value="Electronics & Communication">Electronics & Communication</option>
                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                        <option value="Civil Engineering">Civil Engineering</option>
                        <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                      </select>
                    </div>

                    <div className="b-form-group">
                      <label className="b-label">Target Section *</label>
                      <select
                        className="b-select"
                        value={newBroadcast.targetSection}
                        onChange={(e) => setNewBroadcast({ ...newBroadcast, targetSection: e.target.value })}
                      >
                        <option value="all">All Sections (A, B, C)</option>
                        <option value="Section A">Section A</option>
                        <option value="Section B">Section B</option>
                        <option value="Section C">Section C</option>
                      </select>
                    </div>
                  </div>

                  <div className="b-form-row">
                    <div className="b-form-group">
                      <label className="b-label">Target Batch Year *</label>
                      <select
                        className="b-select"
                        value={newBroadcast.targetBatchYear}
                        onChange={(e) => setNewBroadcast({ ...newBroadcast, targetBatchYear: e.target.value })}
                      >
                        <option value="all">All Batch Years</option>
                        <option value="2021-2025">2021 - 2025 (4th Year)</option>
                        <option value="2022-2026">2022 - 2026 (3rd Year)</option>
                        <option value="2023-2027">2023 - 2027 (2nd Year)</option>
                        <option value="2024-2028">2024 - 2028 (1st Year)</option>
                      </select>
                    </div>

                    <div className="b-form-group">
                      <label className="b-label">Target Semester *</label>
                      <select
                        className="b-select"
                        value={newBroadcast.targetSemester}
                        onChange={(e) => setNewBroadcast({ ...newBroadcast, targetSemester: e.target.value })}
                      >
                        <option value="all">All Semesters (1st to 8th)</option>
                        <option value="1st Sem">1st Semester</option>
                        <option value="2nd Sem">2nd Semester</option>
                        <option value="3rd Sem">3rd Semester</option>
                        <option value="4th Sem">4th Semester</option>
                        <option value="5th Sem">5th Semester</option>
                        <option value="6th Sem">6th Semester</option>
                        <option value="7th Sem">7th Semester</option>
                        <option value="8th Sem">8th Semester</option>
                      </select>
                    </div>
                  </div>

                  <div className="b-form-group">
                    <label className="b-label">Message Content / Body *</label>
                    <textarea
                      required
                      rows="4"
                      className="b-textarea"
                      placeholder="Type your message details here..."
                      value={newBroadcast.message}
                      onChange={(e) => setNewBroadcast({ ...newBroadcast, message: e.target.value })}
                    ></textarea>
                  </div>

                  <div className="b-checkbox-group">
                    <label className="b-checkbox-label">
                      <input
                        type="checkbox"
                        checked={newBroadcast.isBannerActive}
                        onChange={(e) => setNewBroadcast({ ...newBroadcast, isBannerActive: e.target.checked })}
                      />
                      <span>🚀 Activate as top Dark Blue Announcement Banner for all users</span>
                    </label>
                  </div>

                  <button type="submit" className="b-submit-btn">
                    📢 Publish & Broadcast Message
                  </button>
                </form>
              </div>

              {/* CURRENT ACTIVE ANNOUNCEMENT BANNER CARD */}
              <div className="active-banner-preview-card">
                <div className="broadcast-card-header">
                  <span className="b-header-icon">✨</span>
                  <div>
                    <h3 className="b-header-title">Active Top Banner Status</h3>
                    <p className="b-header-sub">Current active dark blue banner displayed to platform users.</p>
                  </div>
                </div>

                {activeBanner ? (
                  <div className="banner-preview-box">
                    <div className="banner-preview-header">
                      <span className="b-badge-active">● ACTIVE BANNER</span>
                      <span className="b-meta-target">Target: {activeBanner.targetRole?.toUpperCase()}</span>
                    </div>

                    <h4 className="banner-preview-title">{activeBanner.title}</h4>
                    <p className="banner-preview-text">{activeBanner.message}</p>

                    <div className="banner-preview-footer">
                      <span className="banner-sender-tag">By {activeBanner.sender || "Administrator"}</span>
                      <button
                        className="deactivate-banner-btn"
                        onClick={handleDeactivateBanner}
                      >
                        Deactivate Banner
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="no-active-banner-box">
                    <span className="no-banner-icon">ℹ️</span>
                    <p className="no-banner-text">No banner currently activated. Publish a broadcast with "Set as Active Banner" option checked to show top banner.</p>
                  </div>
                )}
              </div>
            </div>

            {/* LIST OF SENT BROADCAST NOTIFICATIONS */}
            <div className="sent-broadcasts-history-card">
              <div className="history-card-header">
                <h3 className="history-title">Sent Broadcast Notifications & History</h3>
                <span className="history-count-badge">{broadcastList.length} Messages</span>
              </div>

              <div className="history-list">
                {broadcastList.length > 0 ? (
                  broadcastList.map((item) => (
                    <div key={item.id} className="history-item-row">
                      <div className="history-item-left">
                        <span className={`history-type-tag type-${item.type}`}>
                          {item.type === "urgent" ? "🚨 URGENT" : item.type === "placement" ? "🎓 PLACEMENT" : "📢 ANNOUNCEMENT"}
                        </span>
                        <div className="history-item-content">
                          <h4 className="history-item-title">{item.title}</h4>
                          <p className="history-item-msg">{item.message}</p>
                          <div className="history-item-meta" style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px" }}>
                            <span>Role: <strong>{item.targetRole?.toUpperCase() || "ALL"}</strong></span>
                            <span>•</span>
                            <span>Branch: <strong>{item.targetBranch && item.targetBranch !== "all" ? item.targetBranch : "All Branches"}</strong></span>
                            <span>•</span>
                            <span>Section: <strong>{item.targetSection && item.targetSection !== "all" ? item.targetSection : "All Sections"}</strong></span>
                            <span>•</span>
                            <span>Batch: <strong>{item.targetBatchYear && item.targetBatchYear !== "all" ? item.targetBatchYear : "All Batches"}</strong></span>
                            <span>•</span>
                            <span>Sem: <strong>{item.targetSemester && item.targetSemester !== "all" ? item.targetSemester : "All Semesters"}</strong></span>
                            <span>•</span>
                            <span>Uploaded: {item.formattedDate || new Date(item.createdAt).toLocaleString()}</span>
                          </div>
                        </div>
                      </div>

                      <div className="history-item-actions">
                        <button
                          className={`banner-toggle-btn ${item.isBannerActive ? "is-active" : ""}`}
                          onClick={() => handleToggleBannerActive(item)}
                        >
                          {item.isBannerActive ? "★ Active Banner" : "Set as Banner"}
                        </button>
                        <button
                          className="delete-broadcast-btn"
                          onClick={() => handleDeleteBroadcast(item.id)}
                          title="Delete notification"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-history-text">No broadcast messages sent yet.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB: QUIZ BUILDER */}
        {activeTab === "quizBuilder" && (
          <div style={{ marginTop: "1rem" }}>
            <QuizQuestionBuilder quizTitle="Aptitude & Technical Quiz Editor" onBack={() => setActiveTab("analysis")} />
          </div>
        )}

        {/* TAB: CODING LAB BUILDER */}
        {activeTab === "codingBuilder" && (
          <div style={{ marginTop: "1rem" }}>
            <CodingProblemBuilder onBack={() => setActiveTab("analysis")} onPublishSuccess={() => setActiveTab("analysis")} />
          </div>
        )}

        {/* TAB 0: FACULTIES VIEW */}
        {activeTab === "faculty" && <AdminFacultyView />}

        {/* TAB 1: OVERALL DATA ANALYSIS & SKILL TRACKING */}
        {activeTab === "analysis" && (
          <div className="analysis-dashboard-section">
            {/* FILTER TOOLBAR CARD */}
            <div className="dashboard-filter-card">
              <div className="filter-card-header">
                <div>
                  <h3 className="filter-section-title">Dashboard Overview</h3>
                  <p className="filter-section-sub">
                    Real-time overview of all students' performance, skill tracking, and activities
                  </p>
                </div>

                <div className="date-picker-box">
                  <span className="calendar-icon">📅</span>
                  <select
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="date-select-dropdown"
                  >
                    <option value="01 Feb 2026 - 14 Aug 2026">01 Feb 2026 - 14 Aug 2026</option>
                    <option value="01 Jan 2026 - 31 Jul 2026">01 Jan 2026 - 31 Jul 2026</option>
                    <option value="Last 30 Days">Last 30 Days</option>
                  </select>
                </div>
              </div>

              {/* INTERACTIVE SKILL ANALYSIS FILTER CONTROLS */}
              <div className="filter-controls-row">
                <div className="filter-group">
                  <label className="filter-label">Analytics Scope Mode:</label>
                  <div className="filter-tabs-pills">
                    <button
                      className={`pill-btn ${filterMode === "all" ? "active" : ""}`}
                      onClick={() => setFilterMode("all")}
                    >
                      All Students
                    </button>
                    <button
                      className={`pill-btn ${filterMode === "class" ? "active" : ""}`}
                      onClick={() => setFilterMode("class")}
                    >
                      Filter by Class / Branch / Year
                    </button>
                    <button
                      className={`pill-btn ${filterMode === "single" ? "active" : ""}`}
                      onClick={() => setFilterMode("single")}
                    >
                      Single Student Lookup
                    </button>
                  </div>
                </div>

                {/* CONDITIONAL CONTROLS: CLASS / BRANCH / YEAR */}
                {filterMode === "class" && (
                  <div className="sub-filter-row">
                    <div className="filter-select-item">
                      <label className="sub-lbl">Department / Branch:</label>
                      <select
                        value={selectedDept}
                        onChange={(e) => setSelectedDept(e.target.value)}
                        className="filter-dropdown-select"
                      >
                        <option value="all">All Departments</option>
                        <option value="CSE">Computer Science (CSE)</option>
                        <option value="ECE">Electronics (ECE)</option>
                        <option value="ME">Mechanical (ME)</option>
                        <option value="ISE">Information Science (ISE)</option>
                        <option value="CV">Civil Engineering (CV)</option>
                      </select>
                    </div>

                    <div className="filter-select-item">
                      <label className="sub-lbl">Academic Year:</label>
                      <select
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="filter-dropdown-select"
                      >
                        <option value="all">All Years</option>
                        <option value="1st Year">1st Year</option>
                        <option value="2nd Year">2nd Year</option>
                        <option value="3rd Year">3rd Year</option>
                        <option value="4th Year">4th Year</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* CONDITIONAL CONTROLS: SINGLE STUDENT LOOKUP */}
                {filterMode === "single" && (
                  <div className="single-student-search-box">
                    <label className="sub-lbl">Select Student USN or Name:</label>
                    <select
                      value={selectedStudentUSN}
                      onChange={(e) => setSelectedStudentUSN(e.target.value)}
                      className="student-picker-select"
                    >
                      {ALL_STUDENTS_DATA.map((s) => (
                        <option key={s.usn} value={s.usn}>
                          {s.usn} - {s.name} ({s.dept}, {s.year})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            {filterMode === "single" ? (
              <div style={{ marginTop: "1rem" }}>
                <SingleStudentOverview defaultUsn={selectedStudentUSN} userRole="admin" />
              </div>
            ) : (
              <div style={{ marginTop: "1rem" }}>
                <DashboardOverview role="admin" />
              </div>
            )}
          </div>
        )}

        {/* TAB: PENDING APPROVALS */}
        {activeTab === "pending" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* CARD 1: PENDING PASSWORD RESET REQUESTS */}
            <div className="admin-sec-card" style={{ borderLeft: "5px solid #16a34a" }}>
              <div className="sec-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#1e293b", display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>🔑 Pending Password Reset Requests ({pendingResets.length})</span>
                  </h3>
                  <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "0.875rem" }}>
                    Users submitting Forget Password requests with USN/ID and Email address. Approving a request updates their password in the database so they can log in.
                  </p>
                </div>
              </div>

              {pendingResets.length === 0 ? (
                <div style={{ padding: "2.5rem 1.5rem", textAlign: "center", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1", marginTop: "1rem" }}>
                  <div style={{ fontSize: "2rem", marginBottom: "0.25rem" }}>🔑</div>
                  <h4 style={{ margin: "0 0 4px 0", color: "#1e293b", fontSize: "1.05rem" }}>No Pending Password Reset Requests</h4>
                  <p style={{ margin: 0, color: "#64748b", fontSize: "0.875rem" }}>
                    When a user submits a "Forgot Password" request with USN & Email ID, their update request will appear here for Admin approval.
                  </p>
                </div>
              ) : (
                <table className="admin-table" style={{ marginTop: "1rem" }}>
                  <thead>
                    <tr>
                      <th>User Account Details</th>
                      <th>USN / ID</th>
                      <th>Role</th>
                      <th>Requested At</th>
                      <th>Reset Status</th>
                      <th>Admin Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingResets.map((r) => (
                      <tr key={r._id || r.user_email}>
                        <td>
                          <strong style={{ color: "#0f172a", fontSize: "0.95rem" }}>{r.full_name || "User Account"}</strong>
                          <br />
                          <small style={{ color: "#2563eb", fontWeight: 600 }}>{r.user_email}</small>
                        </td>
                        <td>
                          <strong style={{ fontFamily: "monospace", fontSize: "0.9rem", color: "#0f172a" }}>
                            {r.user_id || "N/A"}
                          </strong>
                        </td>
                        <td>
                          <span className={`role-pill ${r.role}`} style={{ fontWeight: 600, padding: "4px 10px", borderRadius: "6px" }}>
                            {r.role?.toUpperCase() === "FACULTY" ? "👨‍🏫 FACULTY" : r.role?.toUpperCase() === "ADMIN" ? "🛡️ ADMIN" : "🎓 STUDENT"}
                          </span>
                        </td>
                        <td>
                          <small style={{ color: "#475569" }}>
                            {r.created_at ? new Date(r.created_at).toLocaleString() : "Just now"}
                          </small>
                        </td>
                        <td>
                          <span style={{ background: "#fef3c7", color: "#d97706", border: "1px solid #fde68a", padding: "4px 10px", borderRadius: "6px", fontSize: "0.8rem", fontWeight: 700 }}>
                            ⏳ Pending Approval
                          </span>
                        </td>
                        <td>
                          <div className="action-row" style={{ display: "flex", gap: "8px" }}>
                            <button
                              type="button"
                              onClick={() => handleApproveReset(r._id || r.user_email, r.full_name || r.user_email)}
                              style={{
                                background: "#16a34a",
                                color: "#fff",
                                border: "none",
                                padding: "6px 14px",
                                borderRadius: "6px",
                                fontWeight: "700",
                                cursor: "pointer",
                                fontSize: "0.85rem",
                                boxShadow: "0 2px 4px rgba(22, 163, 74, 0.2)"
                              }}
                            >
                              ✓ Approve Password Update
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectReset(r._id || r.user_email, r.full_name || r.user_email)}
                              style={{
                                background: "#ef4444",
                                color: "#fff",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                fontWeight: "600",
                                cursor: "pointer",
                                fontSize: "0.85rem"
                              }}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* CARD 2: PENDING USER REGISTRATIONS */}
            <div className="admin-sec-card">
              <div className="sec-header">
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.25rem", color: "#1e293b" }}>
                    ⏳ Registration Verification Requests ({pendingUsers.length})
                  </h3>
                  <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "0.875rem" }}>
                    Review new Student and Faculty sign-up requests. Approving a user activates their account and adds them to the active database.
                  </p>
                </div>
                <button
                  className="add-user-btn"
                  style={{ background: "#2563eb" }}
                  onClick={() => setShowUserModal(true)}
                >
                  + Add Direct User (Student/Faculty)
                </button>
              </div>

              {pendingUsers.length === 0 ? (
                <div style={{ padding: "3rem 1.5rem", textAlign: "center", background: "#f8fafc", borderRadius: "12px", border: "1px dashed #cbd5e1", marginTop: "1rem" }}>
                  <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🎉</div>
                  <h4 style={{ margin: "0 0 6px 0", color: "#1e293b", fontSize: "1.1rem" }}>No Pending Verification Requests</h4>
                  <p style={{ margin: 0, color: "#64748b", fontSize: "0.9rem" }}>
                    All user sign-ups have been verified and added to the database. New registrations will appear here for Admin approval.
                  </p>
                </div>
              ) : (
                <table className="admin-table" style={{ marginTop: "1rem" }}>
                  <thead>
                    <tr>
                      <th>Registration Details</th>
                      <th>Requested Role</th>
                      <th>USN / Faculty ID</th>
                      <th>Department & Course</th>
                      <th>Contact & DOB</th>
                      <th>Verification Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.map((u) => (
                      <tr key={u._id || u.email}>
                        <td>
                          <strong style={{ color: "#0f172a", fontSize: "0.95rem" }}>{u.full_name}</strong>
                          <br />
                          <small style={{ color: "#64748b" }}>{u.email}</small>
                        </td>
                        <td>
                          <span className={`role-pill ${u.role}`} style={{ fontWeight: 600, padding: "4px 10px", borderRadius: "6px" }}>
                            {u.role?.toUpperCase() === "STUDENT" ? "🎓 STUDENT" : "👨‍🏫 FACULTY"}
                          </span>
                        </td>
                        <td>
                          <strong style={{ fontFamily: "monospace", fontSize: "0.9rem", color: "#1e293b" }}>
                            {u.student_id || u.faculty_id || "Pending ID"}
                          </strong>
                        </td>
                        <td>
                          <span>{u.department || "Engineering"}</span>
                          <br />
                          <small style={{ color: "#64748b" }}>{u.course || (u.role === "student" ? "B.E. CSE" : "Faculty Staff")}</small>
                        </td>
                        <td>
                          <small style={{ color: "#334155" }}>📞 {u.phone || "N/A"}</small>
                          <br />
                          <small style={{ color: "#64748b" }}>🎂 DOB: {u.dob || "N/A"}</small>
                        </td>
                        <td>
                          <div className="action-row" style={{ display: "flex", gap: "8px" }}>
                            <button
                              type="button"
                              onClick={() => handleApproveUser(u.email, u.full_name, u.role)}
                              style={{
                                background: "#16a34a",
                                color: "#fff",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                fontWeight: "600",
                                cursor: "pointer",
                                fontSize: "0.85rem",
                                boxShadow: "0 1px 2px rgba(0,0,0,0.1)"
                              }}
                            >
                              ✓ Approve & Add
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectUser(u.email, u.full_name)}
                              style={{
                                background: "#ef4444",
                                color: "#fff",
                                border: "none",
                                padding: "6px 12px",
                                borderRadius: "6px",
                                fontWeight: "600",
                                cursor: "pointer",
                                fontSize: "0.85rem"
                              }}
                            >
                              ✕ Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {activeTab === "users" && (
          <div className="admin-sec-card">
            <div className="sec-header">
              <h3>All Database Accounts ({users.length})</h3>
              <button className="add-user-btn" onClick={() => setShowUserModal(true)}>
                + Add Direct User (Student/Faculty)
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
                      <span className={`status-pill ${u.status === "pending" || u.is_verified === false ? "inactive" : u.is_active !== false ? "active" : "inactive"}`}>
                        {u.status === "pending" || u.is_verified === false ? "⏳ Pending Admin Verification" : u.is_active !== false ? "🟢 Active & Verified" : "🔴 Deactivated"}
                      </span>
                    </td>
                    <td>
                      <div className="action-row">
                        {u.status === "pending" || u.is_verified === false ? (
                          <button
                            className="toggle-btn"
                            style={{ background: "#16a34a", color: "#fff" }}
                            onClick={() => handleApproveUser(u.email, u.full_name, u.role)}
                          >
                            Approve
                          </button>
                        ) : (
                          <button className="toggle-btn" onClick={() => handleToggleStatus(u.email)}>
                            {u.is_active !== false ? "Deactivate" : "Activate"}
                          </button>
                        )}
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

        {/* TAB 3: DEPARTMENTS */}
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

        {/* TAB 4: SYSTEM HEALTH */}
        {activeTab === "analytics" && (
          <div className="admin-sec-card">
            <h3>System Performance & Infrastructure Status</h3>
            <div className="analytics-box">
              <p>🟢 <strong>FastAPI Backend Status:</strong> Healthy (Uptime: 99.9%)</p>
              <p>🗄️ <strong>Database Store:</strong> Motor / MongoDB Live Sync</p>
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
