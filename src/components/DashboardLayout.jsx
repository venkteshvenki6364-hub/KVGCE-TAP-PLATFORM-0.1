import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./DashboardLayout.css";

const SEARCH_INDEX = [
  // STUDENTS & PEOPLE
  {
    id: "s1",
    category: "students",
    categoryLabel: "🎓 Students & Faculty",
    title: "Karthik M",
    subtitle: "4KV21CS018 • CSE • 6th Sem • Rank 1",
    tag: "Student",
    badgeColor: "#d97706",
    path: "/student/overview",
    keywords: ["karthik", "4kv21cs018", "cse", "rank 1", "computer science"],
  },
  {
    id: "s2",
    category: "students",
    categoryLabel: "🎓 Students & Faculty",
    title: "Venkatesh V",
    subtitle: "4KV21CS042 • CSE • 6th Sem • Rank 2",
    tag: "Student",
    badgeColor: "#d97706",
    path: "/student/overview",
    keywords: ["venkatesh", "venkatesh v", "4kv21cs042", "cse", "rank 2", "student"],
  },
  {
    id: "s2b",
    category: "students",
    categoryLabel: "🎓 Students & Faculty",
    title: "Anish K",
    subtitle: "4KV21CS008 • CSE • 6th Sem • Rank 9",
    tag: "Student",
    badgeColor: "#2563eb",
    path: "/student/overview",
    keywords: ["anish", "anish k", "4kv21cs008", "cse", "rank 9", "student"],
  },
  {
    id: "s2c",
    category: "students",
    categoryLabel: "🎓 Students & Faculty",
    title: "Sahana P",
    subtitle: "4KV21CS043 • CSE • 6th Sem • Rank 3",
    tag: "Student",
    badgeColor: "#d97706",
    path: "/student/overview",
    keywords: ["sahana", "4kv21cs043", "cse", "rank 3"],
  },

  {
    id: "s3",
    category: "students",
    categoryLabel: "🎓 Students & Faculty",
    title: "Rahul J",
    subtitle: "4KV21CS999 • CSE • 6th Sem • Rank 1400 (You)",
    tag: "Logged In Student",
    badgeColor: "#003896",
    path: "/student/profile",
    keywords: ["rahul", "myself", "me", "profile", "4kv21cs999", "student"],
  },
  {
    id: "s4",
    category: "students",
    categoryLabel: "🎓 Students & Faculty",
    title: "Likith R",
    subtitle: "4KV21EC027 • ECE • 6th Sem • Rank 3",
    tag: "Student",
    badgeColor: "#d97706",
    path: "/student/overview",
    keywords: ["likith", "4kv21ec027", "ece"],
  },
  {
    id: "s5",
    category: "students",
    categoryLabel: "🎓 Students & Faculty",
    title: "Ananya B",
    subtitle: "4KV21IS033 • ISE • 6th Sem • Rank 4",
    tag: "Student",
    badgeColor: "#2563eb",
    path: "/student/overview",
    keywords: ["ananya", "4kv21is033", "ise", "information science"],
  },
  {
    id: "s6",
    category: "students",
    categoryLabel: "🎓 Students & Faculty",
    title: "Vivek S",
    subtitle: "4KV21ME021 • Mechanical • 6th Sem • Rank 5",
    tag: "Student",
    badgeColor: "#16a34a",
    path: "/student/overview",
    keywords: ["vivek", "4kv21me021", "mechanical", "me"],
  },
  {
    id: "f1",
    category: "students",
    categoryLabel: "🎓 Students & Faculty",
    title: "Prof. Ramesh Sharma",
    subtitle: "HOD • Computer Science & Engineering",
    tag: "Faculty",
    badgeColor: "#7c3aed",
    path: "/faculty/students",
    keywords: ["ramesh", "sharma", "hod", "faculty", "professor", "cse"],
  },
  {
    id: "f2",
    category: "students",
    categoryLabel: "🎓 Students & Faculty",
    title: "Dr. Savitha K",
    subtitle: "Professor • Electronics & Communication",
    tag: "Faculty",
    badgeColor: "#7c3aed",
    path: "/faculty/students",
    keywords: ["savitha", "doctor", "dr", "professor", "ece", "faculty"],
  },

  // PROJECTS & ACTIVITIES
  {
    id: "p1",
    category: "projects",
    categoryLabel: "💡 Projects & Activities",
    title: "Smart AI Campus Placement Assistant",
    subtitle: "React.js • FastAPI • Scikit-Learn • Web Portal",
    tag: "Project",
    badgeColor: "#9333ea",
    path: "/student/activities",
    keywords: ["smart ai", "placement", "assistant", "react", "fastapi", "project", "python", "ai"],
  },
  {
    id: "p2",
    category: "projects",
    categoryLabel: "💡 Projects & Activities",
    title: "IoT Based Smart Energy Metering",
    subtitle: "Arduino • ESP32 • C++ • Hardware IoT",
    tag: "Project",
    badgeColor: "#9333ea",
    path: "/student/activities",
    keywords: ["iot", "smart energy", "metering", "arduino", "esp32", "hardware"],
  },
  {
    id: "p3",
    category: "projects",
    categoryLabel: "💡 Projects & Activities",
    title: "Automated Student Library Portal",
    subtitle: "Node.js • Express • MongoDB • React",
    tag: "Project",
    badgeColor: "#9333ea",
    path: "/student/activities",
    keywords: ["library", "portal", "automated", "nodejs", "mongodb"],
  },
  {
    id: "p4",
    category: "projects",
    categoryLabel: "💡 Projects & Activities",
    title: "Facial Recognition Attendance System",
    subtitle: "Python • OpenCV • Deep Learning",
    tag: "Project",
    badgeColor: "#9333ea",
    path: "/student/activities",
    keywords: ["facial recognition", "attendance", "opencv", "python", "ai"],
  },

  // TESTS & ASSESSMENTS
  {
    id: "t1",
    category: "tests",
    categoryLabel: "📝 Tests & Quizzes",
    title: "Aptitude Practice & Placement Test",
    subtitle: "Quantitative, Logical & Verbal Reasoning",
    tag: "Aptitude",
    badgeColor: "#ea580c",
    path: "/student/aptitude",
    keywords: ["aptitude", "math", "test", "reasoning", "quant", "placement"],
  },
  {
    id: "t2",
    category: "tests",
    categoryLabel: "📝 Tests & Quizzes",
    title: "Technical Coding Quiz & MCQ",
    subtitle: "Data Structures, Algorithms & Full-Stack Development",
    tag: "Quiz",
    badgeColor: "#0284c7",
    path: "/student/quiz",
    keywords: ["technical quiz", "mcq", "coding test", "dsa", "quiz"],
  },
  {
    id: "t3",
    category: "tests",
    categoryLabel: "📝 Tests & Quizzes",
    title: "Live Interactive Coding Lab",
    subtitle: "Python, C++, Java & JavaScript Challenges",
    tag: "Coding Lab",
    badgeColor: "#16a34a",
    path: "/student/coding",
    keywords: ["coding lab", "editor", "python", "cpp", "java", "code"],
  },
  {
    id: "t4",
    category: "tests",
    categoryLabel: "📝 Tests & Quizzes",
    title: "HR Mock Interview Simulator",
    subtitle: "Voice & Video AI Interview Practice",
    tag: "HR Interview",
    badgeColor: "#dc2626",
    path: "/student/hr-interview",
    keywords: ["hr interview", "mock interview", "video interview", "hr"],
  },
  {
    id: "t5",
    category: "tests",
    categoryLabel: "📝 Tests & Quizzes",
    title: "AI Career Coach & Resume Scanner",
    subtitle: "Skill gap analysis & placement recommendations",
    tag: "AI Coach",
    badgeColor: "#003896",
    path: "/student/ai",
    keywords: ["ai career coach", "resume", "coach", "skills", "placement bot"],
  },

  // ACADEMICS & DOCUMENTS
  {
    id: "a1",
    category: "academics",
    categoryLabel: "📄 Academics & Certificates",
    title: "SSLC / 10th Marks & Certificate",
    subtitle: "School Name, Total Marks (625), Percentage (70.00%) & PDF",
    tag: "Academics",
    badgeColor: "#2563eb",
    path: "/student/skills",
    keywords: ["sslc", "10th", "school", "marks", "certificate", "pdf", "10th marks card"],
  },
  {
    id: "a2",
    category: "academics",
    categoryLabel: "📄 Academics & Certificates",
    title: "PUC / 12th Marks & Certificate",
    subtitle: "College Name, Total Marks (600), Percentage (63.00%) & PDF",
    tag: "Academics",
    badgeColor: "#16a34a",
    path: "/student/skills",
    keywords: ["puc", "12th", "diploma", "college", "marks card", "pdf"],
  },
  {
    id: "a3",
    category: "academics",
    categoryLabel: "📄 Academics & Certificates",
    title: "B.E. Semesters 1 to 8 Performance",
    subtitle: "Total Marks, CGPA (8.24), SGPA & Marksheets (PDF)",
    tag: "Academics",
    badgeColor: "#9333ea",
    path: "/student/skills",
    keywords: ["be", "engineering", "semester", "cgpa", "sgpa", "marksheet", "sem 1", "sem 6"],
  },

  // PAGES & QUICK LINKS
  {
    id: "g1",
    category: "pages",
    categoryLabel: "🚀 Platform Pages & Navigation",
    title: "Student Library & Resource Hub",
    subtitle: "Study Materials, E-Books & Video Tutorials",
    tag: "Page",
    badgeColor: "#475569",
    path: "/student/dashboard",
    keywords: ["library", "dashboard", "home", "books", "notes"],
  },
  {
    id: "g2",
    category: "pages",
    categoryLabel: "🚀 Platform Pages & Navigation",
    title: "All College Student Rankings & Leaderboard",
    subtitle: "Filter by Department, USN, Semester & CGPA",
    tag: "Page",
    badgeColor: "#d97706",
    path: "/student/rankings",
    keywords: ["rankings", "leaderboard", "toppers", "cgpa ranking", "usn search"],
  },
  {
    id: "g3",
    category: "pages",
    categoryLabel: "🚀 Platform Pages & Navigation",
    title: "Single Student Detailed Overview",
    subtitle: "Comprehensive academic, aptitude & activity breakdown",
    tag: "Page",
    badgeColor: "#0284c7",
    path: "/student/overview",
    keywords: ["overview", "student overview", "single student"],
  },
  {
    id: "g4",
    category: "pages",
    categoryLabel: "🚀 Platform Pages & Navigation",
    title: "Student Profile & Public Social Links",
    subtitle: "Personal Details, GitHub, LinkedIn, Portfolio Links",
    tag: "Page",
    badgeColor: "#003896",
    path: "/student/profile",
    keywords: ["profile", "github", "linkedin", "contact", "edit profile"],
  },
];

const DashboardLayout = ({ children, title }) => {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth > 992;
    }
    return true;
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchBoxRef = useRef(null);

  // Derive uploaded profile avatar image if available
  const studentId = user?.student_id || user?.usn || user?.user_id;
  const customProfileKey = studentId ? `kvgce_student_profile_${studentId}` : null;
  const storedAvatar = (() => {
    if (!customProfileKey) return null;
    try {
      const raw = localStorage.getItem(customProfileKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed?.avatarUrl || null;
      }
    } catch (e) {
      return null;
    }
    return null;
  })();

  const avatarUrl =
    user?.avatarUrl !== undefined && user?.avatarUrl !== ""
      ? user.avatarUrl
      : storedAvatar || "";

  // Broadcast Notifications & Active Banner State
  const DEFAULT_NOTIFICATIONS = [
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
    },
    {
      id: "notif-3",
      title: "Aptitude & Technical Coding Test Schedule",
      message: "All Computer Science & Engineering students must take the mandatory online Aptitude Mock Test this Saturday at 10:00 AM.",
      sender: "Academic Coordinator",
      targetRole: "all",
      type: "urgent",
      isBannerActive: false,
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: "notif-4",
      title: "Updated Semester Internal Marks & Academic Leaderboard",
      message: "Academic rankings for the current session have been recalculated based on the latest internal assessment marks. Check your position on the rankings tab.",
      sender: "Dean of Academics",
      targetRole: "all",
      type: "announcement",
      isBannerActive: false,
      createdAt: new Date(Date.now() - 7200000).toISOString()
    }
  ];

  const [notifications, setNotifications] = useState(() => {
    try {
      const stored = localStorage.getItem("kvgce_broadcast_notifications");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    localStorage.setItem("kvgce_broadcast_notifications", JSON.stringify(DEFAULT_NOTIFICATIONS));
    return DEFAULT_NOTIFICATIONS;
  });

  const [activeBanner, setActiveBanner] = useState(() => {
    try {
      const stored = localStorage.getItem("kvgce_active_announcement");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return DEFAULT_NOTIFICATIONS[0];
  });

  const [isBannerVisible, setIsBannerVisible] = useState(true);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isFullPageNotifOpen, setIsFullPageNotifOpen] = useState(false);
  const [isSendNotifOpen, setIsSendNotifOpen] = useState(false);
  const [sendForm, setSendForm] = useState({
    title: "",
    message: "",
    targetRole: "student",
    targetBranch: "all",
    targetSection: "all",
    targetBatchYear: "all",
    selectedRecipients: [],
  });

  const STUDENTS_DATA = [
    { id: "4KV21CS042", usn: "4KV21CS042", name: "Venkatesh V", branch: "Computer Science & Engineering", section: "Section A", year: "2022-2026" },
    { id: "4KV21CS008", usn: "4KV21CS008", name: "Anish K", branch: "Computer Science & Engineering", section: "Section A", year: "2022-2026" },
    { id: "4KV21CS018", usn: "4KV21CS018", name: "Karthik M", branch: "Computer Science & Engineering", section: "Section A", year: "2022-2026" },
    { id: "4KV21CS043", usn: "4KV21CS043", name: "Sahana P", branch: "Computer Science & Engineering", section: "Section A", year: "2022-2026" },
    { id: "4KV21EC027", usn: "4KV21EC027", name: "Likith R", branch: "Electronics & Communication", section: "Section B", year: "2022-2026" },
    { id: "4KV21IS033", usn: "4KV21IS033", name: "Ananya B", branch: "Information Science & Engineering", section: "Section A", year: "2022-2026" },
    { id: "4KV21ME021", usn: "4KV21ME021", name: "Vivek S", branch: "Mechanical Engineering", section: "Section C", year: "2022-2026" },
    { id: "4KV21CS999", usn: "4KV21CS999", name: "Rahul J", branch: "Computer Science & Engineering", section: "Section A", year: "2022-2026" },
  ];

  const FACULTY_DATA = [
    { id: "f1", name: "Prof. Ramesh Sharma", role: "HOD", branch: "Computer Science & Engineering" },
    { id: "f2", name: "Dr. Savitha K", role: "Professor", branch: "Electronics & Communication" },
    { id: "f3", name: "Dr. Anand Kumar", role: "Professor", branch: "Information Science & Engineering" },
    { id: "f4", name: "Prof. Suresh Naik", role: "Professor", branch: "Mechanical Engineering" },
  ];

  const filteredStudentsList = STUDENTS_DATA.filter((st) => {
    if (sendForm.targetBranch !== "all" && !st.branch.toLowerCase().includes(sendForm.targetBranch.toLowerCase())) return false;
    if (sendForm.targetSection !== "all" && st.section !== sendForm.targetSection) return false;
    if (sendForm.targetBatchYear !== "all" && st.year !== sendForm.targetBatchYear) return false;
    return true;
  });

  const filteredFacultyList = FACULTY_DATA.filter((fc) => {
    if (sendForm.targetBranch !== "all" && !fc.branch.toLowerCase().includes(sendForm.targetBranch.toLowerCase())) return false;
    return true;
  });

  const handleToggleRecipient = (nameOrId, isChecked) => {
    setSendForm((prev) => {
      const current = prev.selectedRecipients || [];
      if (isChecked) {
        return { ...prev, selectedRecipients: [...current, nameOrId] };
      } else {
        return { ...prev, selectedRecipients: current.filter((r) => r !== nameOrId) };
      }
    });
  };

  const notifBoxRef = useRef(null);

  const userRole = user?.role || "student";

  const normalizeDept = (dStr) => {
    const d = String(dStr || "").trim().toLowerCase();
    if (!d || d === "all") return "all";
    if (d.includes("computer") || d.includes("cse")) return "cse";
    if (d.includes("information") || d.includes("ise")) return "ise";
    if (d.includes("electronics") || d.includes("ece")) return "ece";
    if (d.includes("mechanical") || d.includes("me") || d.includes("mech")) return "me";
    if (d.includes("civil") || d.includes("civ")) return "civil";
    if (d.includes("ai") || d.includes("data") || d.includes("aids")) return "aids";
    return d;
  };

  const normalizeSec = (sStr) => {
    const s = String(sStr || "").trim().toLowerCase();
    if (!s || s === "all") return "all";
    if (s.includes("a")) return "a";
    if (s.includes("b")) return "b";
    if (s.includes("c")) return "c";
    return s;
  };

  const normalizeYear = (yStr) => {
    const y = String(yStr || "").trim().toLowerCase();
    if (!y || y === "all") return "all";
    if (y.includes("1") || y.includes("2024")) return "1";
    if (y.includes("2") || y.includes("2023")) return "2";
    if (y.includes("3") || y.includes("2022")) return "3";
    if (y.includes("4") || y.includes("2021")) return "4";
    return y;
  };

  const userNotifications = notifications.filter((n) => {
    // If specific individual recipients list is present, check if user matches
    const recipientList = n.recipients || [];
    if (recipientList && recipientList.length > 0) {
      const uEmail = (user?.email || "").toLowerCase();
      const uId = (user?.student_id || user?.faculty_id || user?.user_id || user?.usn || "").toLowerCase();
      const uName = (user?.full_name || user?.name || "").toLowerCase();
      const matchRecipient = recipientList.some((r) => {
        const rLow = String(r).toLowerCase();
        return rLow === uEmail || rLow === uId || rLow === uName || (uId && uId.includes(rLow)) || (uName && uName.includes(rLow));
      });
      if (!matchRecipient && userRole !== "admin") return false;
    }

    const tRole = (n.targetRole || n.recipient_type || "all").toLowerCase();
    const roleMatch = tRole === "all" || tRole === "student" || tRole === userRole || userRole === "admin";
    if (!roleMatch) return false;

    if (userRole === "student" && user) {
      const uDeptNorm = normalizeDept(user.department || user.dept || user.branch);
      const uSecNorm = normalizeSec(user.section);
      const uYearNorm = normalizeYear(user.batch_year || user.year);

      const tDeptNorm = normalizeDept(n.targetBranch || n.branch);
      const tSecNorm = normalizeSec(n.targetSection || n.section);
      const tYearNorm = normalizeYear(n.targetBatchYear || n.year);

      if (tDeptNorm !== "all" && uDeptNorm !== "all" && tDeptNorm !== uDeptNorm) return false;
      if (tSecNorm !== "all" && uSecNorm !== "all" && tSecNorm !== uSecNorm) return false;
      if (tYearNorm !== "all" && uYearNorm !== "all" && tYearNorm !== uYearNorm) return false;
    }

    if (userRole === "faculty" && user) {
      const uDeptNorm = normalizeDept(user.department || user.dept || user.branch);
      const tDeptNorm = normalizeDept(n.targetBranch || n.branch);
      if (tDeptNorm !== "all" && uDeptNorm !== "all" && tDeptNorm !== uDeptNorm) return false;
    }

    return true;
  });

  const unreadCount = userNotifications.filter((n) => n.read !== true && n.is_read !== true).length;
  const activeNotifCount = userNotifications.length;
  const displayBadgeCount = unreadCount > 0 ? unreadCount : activeNotifCount;

  const handleOpenNotifications = async () => {
    setIsFullPageNotifOpen(true);
    if (unreadCount > 0) {
      const unreadNotifIds = userNotifications
        .filter((n) => n.read !== true && n.is_read !== true)
        .map((n) => n.id || n._id || n.notification_id);

      for (const id of unreadNotifIds) {
        if (id) {
          try {
            await api.put(`/notifications/${id}/read`);
          } catch (e) {
            console.warn("Backend mark read error:", e);
          }
        }
      }
    }
  };

  const handleSendNotification = async (e) => {
    if (e) e.preventDefault();
    if (!sendForm.message.trim()) {
      alert("Please enter a notification message before sending.");
      return;
    }

    const titleText = sendForm.title.trim() || (sendForm.targetRole === "faculty" ? "Faculty Notice" : "Campus Notification");
    const createdItem = {
      id: `notif_${Date.now()}`,
      title: titleText,
      message: sendForm.message.trim(),
      targetRole: sendForm.targetRole,
      targetBranch: sendForm.targetBranch,
      targetSection: sendForm.targetSection,
      targetBatchYear: sendForm.targetBatchYear,
      recipients: sendForm.selectedRecipients,
      sender: user?.full_name || "Administrator",
      createdAt: new Date().toISOString(),
    };

    try {
      await api.post("/notifications", createdItem);
    } catch (err) {
      console.warn("Backend notification sync fallback:", err);
    }

    const updatedList = [createdItem, ...notifications];
    setNotifications(updatedList);
    localStorage.setItem("kvgce_broadcast_notifications", JSON.stringify(updatedList));

    window.dispatchEvent(new Event("kvgce_notif_updated"));

    setSendForm({
      title: "",
      message: "",
      targetRole: "student",
      targetBranch: "all",
      targetSection: "all",
      targetBatchYear: "all",
      selectedRecipients: [],
    });
    setIsSendNotifOpen(false);
    setIsFullPageNotifOpen(true);
    alert("📢 Notification sent successfully to target recipients!");
  };

  const handleDeleteIndividualNotif = async (notifId) => {
    try {
      await api.delete(`/notifications/${notifId}`);
    } catch (err) {
      console.warn("Backend notification delete fallback:", err);
    }
    const updated = notifications.filter((n) => n.id !== notifId && n._id !== notifId && n.notification_id !== notifId);
    setNotifications(updated);
    localStorage.setItem("kvgce_broadcast_notifications", JSON.stringify(updated));
    window.dispatchEvent(new Event("kvgce_notif_updated"));
  };

  const handleClearAllUserNotifs = async () => {
    try {
      await api.delete("/notifications/clear-all");
    } catch (err) {
      console.warn("Backend notification clear fallback:", err);
    }
    const updated = notifications.filter(
      (n) => n.targetRole !== "all" && n.targetRole !== userRole
    );
    setNotifications(updated);
    localStorage.setItem("kvgce_broadcast_notifications", JSON.stringify(updated));
    window.dispatchEvent(new Event("kvgce_notif_updated"));
  };

  // Sync notifications live from FastAPI API & localStorage on mount / event
  useEffect(() => {
    let isMounted = true;

    const fetchBackendNotifs = async () => {
      try {
        const res = await api.get("/notifications");
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
          if (isMounted) {
            setNotifications(res.data.data);
            localStorage.setItem("kvgce_broadcast_notifications", JSON.stringify(res.data.data));
          }
          return;
        }
      } catch (err) {
        console.warn("Backend notification fetch fallback:", err);
      }

      try {
        const storedNotifs = localStorage.getItem("kvgce_broadcast_notifications");
        if (storedNotifs && isMounted) setNotifications(JSON.parse(storedNotifs));
      } catch (e) {
        console.error(e);
      }
    };

    fetchBackendNotifs();

    window.addEventListener("storage", fetchBackendNotifs);
    window.addEventListener("kvgce_notif_updated", fetchBackendNotifs);

    return () => {
      isMounted = false;
      window.removeEventListener("storage", fetchBackendNotifs);
      window.removeEventListener("kvgce_notif_updated", fetchBackendNotifs);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Close search and notification popovers on outside click or Escape key press
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
      if (notifBoxRef.current && !notifBoxRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);


  // Filter search results dynamically
  const queryTrimmed = searchQuery.trim().toLowerCase();
  const searchResults = queryTrimmed.length === 0
    ? []
    : SEARCH_INDEX.filter((item) => {
        const matchesTitle = item.title.toLowerCase().includes(queryTrimmed);
        const matchesSub = item.subtitle.toLowerCase().includes(queryTrimmed);
        const matchesTag = item.tag.toLowerCase().includes(queryTrimmed);
        const matchesKw = item.keywords.some((kw) => kw.toLowerCase().includes(queryTrimmed));
        return matchesTitle || matchesSub || matchesTag || matchesKw;
      });

  // Group search results by category
  const groupedResults = searchResults.reduce((acc, item) => {
    if (!acc[item.categoryLabel]) {
      acc[item.categoryLabel] = [];
    }
    acc[item.categoryLabel].push(item);
    return acc;
  }, {});

  const handleResultClick = (path) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    navigate(path);
  };

  const getNavLinks = () => {
    if (role === "student" || !role) {
      return [
        {
          path: "/student/dashboard",
          label: "Library",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              <line x1="8" y1="6" x2="16" y2="6" />
              <line x1="8" y1="10" x2="16" y2="10" />
            </svg>
          ),
        },
        {
          path: "/student/skills",
          label: "Academics",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
            </svg>
          ),
        },
        {
          path: "/student/aptitude",
          label: "Aptitude Test",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19.439 7.85c-.049-.322-.059-.647-.03-.97.054-.6.28-1.2.7-1.63a2.43 2.43 0 0 0 .58-.87c.22-.52.26-1.1.1-1.66a2.4 2.4 0 0 0-1.07-1.42 2.43 2.43 0 0 0-1.74-.29c-.58.11-1.14.36-1.63.73a2.44 2.44 0 0 1-1.6.47c-.32-.02-.65-.01-.97.04a2.43 2.43 0 0 0-1.63.7c-.43.42-1.03.65-1.63.7a2.45 2.45 0 0 1-.97-.03c-.6-.05-1.2-.28-1.63-.7a2.43 2.43 0 0 0-.87-.58 2.44 2.44 0 0 0-1.66-.1 2.4 2.4 0 0 0-1.42 1.07 2.43 2.43 0 0 0-.29 1.74c.11.58.36 1.14.73 1.63.37.49.53 1.08.47 1.6a2.5 2.5 0 0 1-.04.97c-.05.6-.28 1.2-.7 1.63a2.43 2.43 0 0 0-.58.87 2.44 2.44 0 0 0-.1 1.66c.14.56.52 1.06 1.07 1.42.54.36 1.16.46 1.74.29.58-.11 1.14-.36 1.63-.73.49-.37 1.08-.53 1.6-.47.32.02.65.01.97-.04.6.05 1.2.28 1.63.7.43.42 1.03.65 1.63.7.32.03.65.02.97-.03.6-.05 1.2-.28 1.63-.7.42-.43.65-1.03.7-1.63.03-.32.02-.65-.03-.97z" />
            </svg>
          ),
        },
        {
          path: "/student/quiz",
          label: "Technical Quiz",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          ),
        },
        {
          path: "/student/coding",
          label: "Coding lab",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
          ),
        },
        {
          path: "/student/projects",
          label: "Projects",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 18h6" />
              <path d="M10 22h4" />
              <path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1.55.61 2.95 1.6 3.98.74.75 1.2 1.51 1.4 2.5" />
            </svg>
          ),
        },
        {
          path: "/student/hr-interview",
          label: "HR Interview",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M23 7l-7 5 7 5V7z" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          ),
        },
        {
          path: "/student/ai",
          label: "AI Career Coach",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ),
        },
        {
          path: "/student/overview",
          label: "Student Overview",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <polyline points="17 11 19 13 23 9" />
            </svg>
          ),
        },
        {
          path: "/student/rankings",
          label: "Rankings",
          icon: (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 15l-2 5l-4 -2l-4 2l2 -5l-4 -4l5.5 -0.5l2.5 -5l2.5 5l5.5 0.5z" />
            </svg>
          ),
        },
      ];
    } else if (role === "faculty") {
      return [
        { path: "/faculty/dashboard", label: "Overview", icon: "📊" },
        { path: "/faculty/projects", label: "Project Evaluation", icon: "💡" },
        { path: "/faculty/students", label: "Student List", icon: "👥" },
        { path: "/student/overview", label: "Student Single Overview", icon: "👤" },
        { path: "/student/rankings", label: "Rankings", icon: "🏆" },
        { path: "/faculty/assessments", label: "Assessments", icon: "📝" },
        { path: "/faculty/questions", label: "Question Bank", icon: "❓" },
        { path: "/faculty/activities", label: "Activity Verification", icon: "✅" },
        { path: "/faculty/performance", label: "Analytics", icon: "📈" },
        { path: "/faculty/feedback", label: "Student Feedback", icon: "💬" },
      ];
    } else if (role === "admin") {
      return [
        { path: "/admin/dashboard?tab=pending", label: "Pending Approvals", icon: "⏳" },
        { path: "/admin/dashboard?tab=analysis", label: "Overall Analysis", icon: "📊" },
        { path: "/admin/dashboard?tab=faculty", label: "Faculties", icon: "👨‍🏫" },
        { path: "/admin/dashboard?tab=users", label: "User Management", icon: "👤" },
        { path: "/admin/dashboard?tab=departments", label: "Departments", icon: "🏢" },
        { path: "/admin/dashboard?tab=quizBuilder", label: "Quiz & Aptitude Builder", icon: "📝" },
        { path: "/admin/dashboard?tab=codingBuilder", label: "Coding Lab Builder", icon: "💻" },
        { path: "/admin/dashboard?tab=analytics", label: "System Health", icon: "📈" },
        { path: "/admin/students", label: "Students List", icon: "🎓" },
        { path: "/student/rankings", label: "Rankings", icon: "🏆" },
      ];
    }
    return [];
  };

  const navLinks = getNavLinks();

  return (
    <div className="dashboard-app-wrapper">
      {/* TOP LIGHT HEADER BAR */}
      <header className="app-top-header light-header">
        <div className="header-brand-container">
          {/* HAMBURGER 3-LINE MENU TOGGLE BUTTON */}
          <button
            className="header-sidebar-toggle-btn"
            onClick={() => setSidebarOpen((prev) => !prev)}
            title="Toggle Sidebar Menu"
            aria-label="Toggle Sidebar Menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#003896" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          <div className="brand-logo-box">
            <img
              src="/KVGCE_logo.png"
              alt="KVGCE Logo"
              className="app-header-logo"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://via.placeholder.com/40?text=KVG";
              }}
            />
          </div>
          <div className="brand-title-meta">
            <h1 className="brand-main-name">KVGCE-TAP</h1>
            <span className="brand-sub-tag">
              {role === "admin" ? "Admin Portal" : role === "faculty" ? "Faculty Portal" : "Student Dashboard"}
            </span>
          </div>
        </div>

        {/* UNIVERSAL SEARCH CONTAINER */}
        <div className="header-search-container" ref={searchBoxRef}>
          <div className="search-pill-box">
            <input
              type="text"
              className="search-pill-input"
              placeholder="Search anything (Person, Project, Test, Academic)..."
              value={searchQuery}
              onFocus={() => setIsSearchOpen(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
            />
            {searchQuery.trim().length > 0 ? (
              <button
                className="search-pill-clear-btn"
                onClick={() => {
                  setSearchQuery("");
                  setIsSearchOpen(false);
                }}
                title="Clear Search"
              >
                ✕
              </button>
            ) : (
              <button className="search-pill-btn" aria-label="Search">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            )}

            {/* LIVE SEARCH DROPDOWN POPUP */}
            {isSearchOpen && queryTrimmed.length > 0 && (
              <div className="search-results-dropdown-popover">
                {Object.keys(groupedResults).length > 0 ? (
                  Object.entries(groupedResults).map(([categoryLabel, items]) => (
                    <div key={categoryLabel} className="search-results-group">
                      <div className="search-group-header-title">{categoryLabel}</div>
                      {items.map((item) => (
                        <div
                          key={item.id}
                          className="search-result-item-card"
                          onClick={() => handleResultClick(item.path)}
                        >
                          <div className="search-item-info">
                            <span className="search-item-title">{item.title}</span>
                            <span className="search-item-subtitle">{item.subtitle}</span>
                          </div>
                          <span
                            className="search-item-tag-badge"
                            style={{ backgroundColor: item.badgeColor }}
                          >
                            {item.tag}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))
                ) : (
                  <div className="search-empty-state">
                    <div className="empty-icon-wrap">🔍</div>
                    <div className="empty-title-text">No results found for "{searchQuery}"</div>
                    <div className="empty-sub-text">Try searching for a student name, USN, project, test, or page.</div>
                    <div className="search-quick-chips">
                      <button onClick={() => setSearchQuery("Rankings")}>🏆 Rankings</button>
                      <button onClick={() => setSearchQuery("Project")}>💡 Projects</button>
                      <button onClick={() => setSearchQuery("Aptitude")}>📝 Aptitude</button>
                      <button onClick={() => setSearchQuery("SSLC")}>📄 SSLC</button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="header-right-actions">
          {/* CLICKABLE RANKING BADGE LINK - ONLY FOR STUDENTS */}
          {role !== "faculty" && role !== "admin" && !location.pathname.includes("/faculty") && !location.pathname.includes("/admin") && (
            <div
              className="ranking-pill-badge clickable-ranking-badge"
              onClick={() => navigate("/student/rankings")}
              title="Click to view All College Student Rankings"
              style={{ cursor: "pointer" }}
            >
              <span className="ranking-num"># 1400</span>
              <span className="ranking-lbl">My Ranking</span>
            </div>
          )}

          {/* 1. Clean Notification Bell Icon */}
          <div className="header-notif-wrapper">
            <button
              className={`simple-nav-bell-btn ${isFullPageNotifOpen ? "active" : ""}`}
              title="Notifications Center"
              aria-label="Notifications"
              onClick={() => setIsFullPageNotifOpen(true)}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#003896" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
          </div>

          {/* 2. User Profile Icon */}
          <button
            className="nav-action-icon-btn nav-profile-avatar-btn"
            title={user?.full_name || "Profile"}
            aria-label="Profile"
            onClick={() => navigate("/student/profile")}
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={user?.full_name || "Profile"}
                className="nav-profile-avatar-img"
                onError={(e) => {
                  e.target.style.display = "none";
                  const nextSibling = e.target.nextElementSibling;
                  if (nextSibling) {
                    nextSibling.style.display = "block";
                  }
                }}
              />
            ) : null}
            <svg
              className="nav-profile-fallback-svg"
              style={{ display: avatarUrl ? "none" : "block" }}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </button>
        </div>
      </header>

      {/* MAIN BODY AREA (SIDEBAR + CONTENT) */}
      <div className="dashboard-content-layout">
        {/* LEFT WHITE SIDEBAR */}
        <aside className={`dashboard-left-sidebar ${sidebarOpen ? "open" : "closed"}`}>
          <nav className="sidebar-card-nav">
            {navLinks.map((item) => {
              const fullPath = location.pathname + location.search;
              const isActive =
                fullPath === item.path ||
                (location.pathname === item.path && !location.search) ||
                (location.pathname === "/admin/dashboard" && !location.search && item.path === "/admin/dashboard?tab=pending") ||
                (item.path.includes("?") && fullPath.includes(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-nav-card-item ${isActive ? "active" : ""}`}
                  onClick={() => {
                    if (window.innerWidth <= 992) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <span className="card-item-icon">{item.icon}</span>
                  <span className="card-item-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* SIDEBAR BOTTOM EXIT BUTTON */}
          <div className="sidebar-footer">
            <button className="sidebar-exit-btn" onClick={handleLogout} title="Exit Platform">
              <span className="exit-btn-icon">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </span>
              <span className="exit-btn-label">Exit</span>
            </button>
          </div>

          {/* SIDEBAR BOTTOM WAVY GRAPHIC */}
          <div className="sidebar-bottom-wave">
            <svg viewBox="0 0 280 120" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M0 40C40 20 80 60 140 30C200 0 240 50 280 30V120H0V40Z"
                fill="url(#waveGrad)"
                fillOpacity="0.4"
              />
              <defs>
                <linearGradient id="waveGrad" x1="0" y1="0" x2="280" y2="120">
                  <stop offset="0%" stopColor="#dbeafe" />
                  <stop offset="100%" stopColor="#eff6ff" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </aside>

        {/* OVERLAY FOR MOBILE */}
        {sidebarOpen && (
          <div className="mobile-sidebar-overlay" onClick={() => setSidebarOpen(false)}></div>
        )}

        {/* PAGE CONTENT CONTAINER */}
        <main className="dashboard-main-view">{children}</main>
      </div>

      {/* FULL PAGE NOTIFICATIONS MODAL OVERLAY */}
      {isFullPageNotifOpen && (
        <div className="fullpage-notif-overlay" onClick={() => setIsFullPageNotifOpen(false)}>
          <div className="fullpage-notif-container" onClick={(e) => e.stopPropagation()}>
            <div className="fullpage-notif-header">
              <div className="fullpage-header-left">
                <div>
                  <h3 className="fullpage-header-title">Notifications Center</h3>
                  <p className="fullpage-header-sub">System announcements, placement updates, and alerts for {user?.full_name || "User"}</p>
                </div>
              </div>

              <div className="fullpage-header-actions">
                {(userRole === "admin" || userRole === "faculty") && (
                  <button
                    className="fullpage-add-notif-btn"
                    onClick={() => {
                      setIsFullPageNotifOpen(false);
                      setIsSendNotifOpen(true);
                    }}
                    title="Create & Send New Notification"
                  >
                    + Update
                  </button>
                )}
                {userNotifications.length > 0 && (
                  <button
                    className="fullpage-clear-all-btn"
                    onClick={handleClearAllUserNotifs}
                  >
                    Clear All
                  </button>
                )}
                <button
                  className="fullpage-close-btn"
                  onClick={() => setIsFullPageNotifOpen(false)}
                >
                  ✕ Close
                </button>
              </div>
            </div>

            <div className="fullpage-notif-body">
              {userNotifications.length > 0 ? (
                <div className="fullpage-notif-grid">
                  {userNotifications.map((n) => (
                    <div key={n.id} className="fullpage-notif-card">
                      <div className="fullpage-card-top">
                        <h4 className="fullpage-card-title">{n.title}</h4>
                        <button
                          className="fullpage-delete-item-btn"
                          onClick={() => handleDeleteIndividualNotif(n.id)}
                          title="Delete this notification"
                        >
                          Delete
                        </button>
                      </div>

                      <p className="fullpage-card-msg">{n.message}</p>

                      <div className="fullpage-card-footer">
                        <span className="fullpage-author">By <strong>{n.sender || "Administrator"}</strong></span>
                        <span className="fullpage-date">{new Date(n.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="fullpage-empty-box">
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="empty-bell-slash-svg">
                    <path d="M8.66 4.5A6 6 0 0 1 18 8c0 4 2.5 5 2.5 5H8.5" />
                    <path d="M14 19a2 2 0 0 1-3.46 0" />
                    <line x1="2" y1="2" x2="22" y2="22" />
                    <path d="M4.92 4.92A6 6 0 0 0 6 8c0 7-3 9-3 9h10" />
                  </svg>
                  <h4>No notifications</h4>
                  <p>You have cleared all notifications from your dashboard.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FULL-SCREEN SEND NOTIFICATION PAGE OVERLAY */}
      {isSendNotifOpen && (
        <div className="send-notif-fullscreen-overlay">
          <div className="send-notif-fullscreen-container">
            {/* HEADER */}
            <div className="send-notif-header">
              <div className="send-notif-header-left">
                <button
                  className="send-notif-back-btn"
                  onClick={() => {
                    setIsSendNotifOpen(false);
                    setIsFullPageNotifOpen(true);
                  }}
                  title="Back to Notifications"
                >
                  ← Back
                </button>
                <div>
                  <h2 className="send-notif-title">Send Notification</h2>
                  <p className="send-notif-subtitle">Dispatch targeted alerts and notices to students or faculty.</p>
                </div>
              </div>
              <div className="send-notif-header-right">
                <button className="send-notif-cancel-btn" onClick={() => setIsSendNotifOpen(false)}>
                  Cancel
                </button>
                <button className="send-notif-submit-btn" onClick={handleSendNotification}>
                  Send Notification
                </button>
              </div>
            </div>

            {/* BODY FORM */}
            <div className="send-notif-body">
              {/* RECIPIENT TYPE */}
              <div className="send-notif-form-group">
                <label className="send-notif-label">Recipient Type *</label>
                <select
                  className="send-notif-select"
                  value={sendForm.targetRole}
                  onChange={(e) => setSendForm({ ...sendForm, targetRole: e.target.value, selectedRecipients: [] })}
                >
                  <option value="student">Students</option>
                  <option value="faculty">Faculty</option>
                  <option value="all">Everyone (Students & Faculty)</option>
                </select>
              </div>

              {/* IF STUDENTS SELECTED */}
              {sendForm.targetRole === "student" && (
                <>
                  <div className="send-notif-grid-3">
                    <div className="send-notif-form-group">
                      <label className="send-notif-label">Branch / Department</label>
                      <select
                        className="send-notif-select"
                        value={sendForm.targetBranch}
                        onChange={(e) => setSendForm({ ...sendForm, targetBranch: e.target.value })}
                      >
                        <option value="all">All Branches</option>
                        <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                        <option value="Information Science & Engineering">Information Science & Engineering</option>
                        <option value="Electronics & Communication">Electronics & Communication</option>
                        <option value="Mechanical Engineering">Mechanical Engineering</option>
                        <option value="Civil Engineering">Civil Engineering</option>
                        <option value="Artificial Intelligence & Data Science">Artificial Intelligence & Data Science</option>
                      </select>
                    </div>

                    <div className="send-notif-form-group">
                      <label className="send-notif-label">Year</label>
                      <select
                        className="send-notif-select"
                        value={sendForm.targetBatchYear}
                        onChange={(e) => setSendForm({ ...sendForm, targetBatchYear: e.target.value })}
                      >
                        <option value="all">All Years</option>
                        <option value="2024-2028">1st Year (2024-2028)</option>
                        <option value="2023-2027">2nd Year (2023-2027)</option>
                        <option value="2022-2026">3rd Year (2022-2026)</option>
                        <option value="2021-2025">4th Year (2021-2025)</option>
                      </select>
                    </div>

                    <div className="send-notif-form-group">
                      <label className="send-notif-label">Section</label>
                      <select
                        className="send-notif-select"
                        value={sendForm.targetSection}
                        onChange={(e) => setSendForm({ ...sendForm, targetSection: e.target.value })}
                      >
                        <option value="all">All Sections</option>
                        <option value="Section A">Section A</option>
                        <option value="Section B">Section B</option>
                        <option value="Section C">Section C</option>
                      </select>
                    </div>
                  </div>

                  {/* SPECIFIC STUDENTS SELECTION */}
                  <div className="send-notif-recipients-box">
                    <div className="recipients-box-header">
                      <label className="send-notif-label">Select Specific Students (Optional)</label>
                      <span className="recipients-hint">Leave unchecked to target all students matching selected Branch/Year/Section</span>
                    </div>
                    <div className="recipients-checkbox-grid">
                      {filteredStudentsList.map((st) => (
                        <label key={st.id} className="recipient-checkbox-item">
                          <input
                            type="checkbox"
                            checked={sendForm.selectedRecipients.includes(st.name) || sendForm.selectedRecipients.includes(st.usn)}
                            onChange={(e) => handleToggleRecipient(st.name, e.target.checked)}
                          />
                          <span className="recipient-name"><strong>{st.name}</strong> ({st.usn} • {st.branch} {st.section})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* IF FACULTY SELECTED */}
              {sendForm.targetRole === "faculty" && (
                <>
                  <div className="send-notif-form-group">
                    <label className="send-notif-label">Department / Branch</label>
                    <select
                      className="send-notif-select"
                      value={sendForm.targetBranch}
                      onChange={(e) => setSendForm({ ...sendForm, targetBranch: e.target.value })}
                    >
                      <option value="all">All Departments</option>
                      <option value="Computer Science & Engineering">Computer Science & Engineering</option>
                      <option value="Information Science & Engineering">Information Science & Engineering</option>
                      <option value="Electronics & Communication">Electronics & Communication</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                    </select>
                  </div>

                  {/* SPECIFIC FACULTY SELECTION */}
                  <div className="send-notif-recipients-box">
                    <div className="recipients-box-header">
                      <label className="send-notif-label">Select Specific Faculty (Optional)</label>
                      <span className="recipients-hint">Leave unchecked to target all faculty in selected department</span>
                    </div>
                    <div className="recipients-checkbox-grid">
                      {filteredFacultyList.map((fc) => (
                        <label key={fc.id} className="recipient-checkbox-item">
                          <input
                            type="checkbox"
                            checked={sendForm.selectedRecipients.includes(fc.name)}
                            onChange={(e) => handleToggleRecipient(fc.name, e.target.checked)}
                          />
                          <span className="recipient-name"><strong>{fc.name}</strong> ({fc.role} • {fc.branch})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* SUBJECT & MESSAGE */}
              <div className="send-notif-form-group">
                <label className="send-notif-label">Notification Subject / Title *</label>
                <input
                  type="text"
                  required
                  className="send-notif-input"
                  placeholder="e.g., Campus Placement Drive Schedule"
                  value={sendForm.title}
                  onChange={(e) => setSendForm({ ...sendForm, title: e.target.value })}
                />
              </div>

              <div className="send-notif-form-group">
                <label className="send-notif-label">Message Content *</label>
                <textarea
                  required
                  rows="5"
                  className="send-notif-textarea"
                  placeholder="Write your notification message here..."
                  value={sendForm.message}
                  onChange={(e) => setSendForm({ ...sendForm, message: e.target.value })}
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardLayout;

