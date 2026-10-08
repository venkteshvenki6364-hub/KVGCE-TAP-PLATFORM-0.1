import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../services/api";
import "./TechnicalQuizModule.css";

const getScoreColorClass = (pct) => {
  const num = parseFloat(pct || 0);
  if (num >= 85) return "green";
  if (num >= 70) return "blue";
  if (num >= 50) return "orange";
  return "red";
};

const formatDateText = (dateStr) => {
  if (!dateStr) return "Oct 4, 2026, 10:00 AM";
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "Oct 4, 2026, 10:00 AM";
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch (e) {
    return "Oct 4, 2026, 10:00 AM";
  }
};

const normalizeOptions = (rawOptions) => {
  if (Array.isArray(rawOptions)) {
    if (rawOptions.length > 0) {
      return rawOptions.map((opt) => {
        if (typeof opt === "object" && opt !== null) {
          return opt.text || opt.value || opt.option || opt.label || JSON.stringify(opt);
        }
        return String(opt);
      });
    }
  } else if (typeof rawOptions === "object" && rawOptions !== null) {
    const vals = Object.values(rawOptions).map((v) => String(v));
    if (vals.length > 0) return vals;
  } else if (typeof rawOptions === "string" && rawOptions.trim().length > 0) {
    const parts = rawOptions.split(/,|\n/).map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts;
  }
  return ["Option A", "Option B", "Option C", "Option D"];
};

const normalizeQuestion = (q, idx = 0) => {
  if (!q || typeof q !== "object") {
    return {
      id: idx + 1,
      question: `Technical Question ${idx + 1}`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correct_answer: 0,
      formula: "Core Engineering Principles & Standard Algorithmic Execution Rules",
      explanation: "Detailed code logic, memory trace, and algorithmic execution complexity analysis."
    };
  }

  const questionText = q.question || q.question_text || q.title || `Technical Question ${idx + 1}`;
  const rawOpts = q.options || q.choices || q.answers || q.option_list;
  const options = normalizeOptions(rawOpts);

  while (options.length < 4) {
    options.push(`Option ${String.fromCharCode(65 + options.length)}`);
  }

  let correctAnswer = q.correct_answer;
  if (correctAnswer === undefined || correctAnswer === null) {
    correctAnswer = q.answer || q.correctAnswer || 0;
  }
  if (typeof correctAnswer === "string") {
    const upper = correctAnswer.trim().toUpperCase();
    if (upper === "A") correctAnswer = 0;
    else if (upper === "B") correctAnswer = 1;
    else if (upper === "C") correctAnswer = 2;
    else if (upper === "D") correctAnswer = 3;
    else {
      const parsed = parseInt(correctAnswer, 10);
      correctAnswer = isNaN(parsed) ? 0 : parsed;
    }
  }

  return {
    ...q,
    id: q.id || idx + 1,
    question: questionText,
    options: options,
    correct_answer: typeof correctAnswer === "number" ? correctAnswer : 0,
    formula: q.formula || q.rule || "Core Engineering Principles & Standard Algorithmic Execution Rules",
    explanation: q.explanation || "Detailed code logic, memory trace, and algorithmic execution complexity analysis."
  };
};

const ensure26Questions = (baseQuestions, categoryName) => {
  let source = Array.isArray(baseQuestions) && baseQuestions.length > 0
    ? baseQuestions.map((q, i) => normalizeQuestion(q, i))
    : DEFAULT_TECHNICAL_TESTS[0].questions.map((q, i) => normalizeQuestion(q, i));
  if (!source || source.length === 0) return [];

  const result = [];
  while (result.length < 25) {
    if (result.length < source.length) {
      result.push(source[result.length]);
    } else {
      const template = source[result.length % source.length];
      const qNum = result.length + 1;
      result.push(
        normalizeQuestion({
          ...template,
          question: `Q${qNum}: [${categoryName || "Technical"} Mastery] ${template.question}`,
          formula: template.formula || "Core Engineering Principles & Standard Algorithmic Execution Rules",
          explanation: template.explanation || "Detailed code logic, memory trace, and algorithmic execution complexity analysis."
        }, result.length)
      );
    }
  }

  // QUESTION 26: LONG 150-WORD COMPREHENSIVE TECHNICAL CASE STUDY
  result.push(
    normalizeQuestion({
      id: 26,
      question: "Q26: [Comprehensive Technical Architecture & Distributed Systems Case Study] In a high-throughput microservices architecture deployed across multiple cloud availability zones, an enterprise backend system receives an average load of 50,000 requests per second (RPS). The primary database cluster uses PostgreSQL with read-replicas, while Redis is integrated as a distributed cache to store hot data records with a Time-To-Live (TTL) of 300 seconds. During a peak traffic burst, database latency spikes dramatically from 12ms to 3,400ms due to a cache stampede (thundering herd) phenomenon when high-volume keys expire simultaneously. To resolve this performance bottleneck, the engineering team evaluates four structural remedies: 1) Probabilistic Early Expiration (XFetch algorithm), 2) Mutex locking around cache regeneration, 3) Pre-warming background workers with stale-while-revalidate headers, and 4) Database connection pool expansion. If 85% of traffic hits expired keys concurrently, determine the most effective concurrency pattern to prevent database connection exhaustion and guarantee zero downstream request dropped SLAs.",
      options: [
        "Distributed Mutex locking combined with Probabilistic Early Expiration (XFetch)",
        "Increasing max_connections in PostgreSQL without changing cache layer",
        "Disabling Redis cache entirely and scaling read-replicas horizontally",
        "Setting Redis TTL to infinity and performing manual flush commands"
      ],
      correct_answer: 0,
      formula: "Cache Stampede Mitigation Principle: XFetch Δ = -β * log(rand()) & Distributed Mutex Lock",
      explanation: "1) Mutex locking prevents duplicate DB queries when a key expires by ensuring only one thread regenerates the cache.\n2) Probabilistic early expiration (XFetch) recomputes cache before actual expiry.\n3) This combination eliminates thundering herd effects under high RPS.",
      category: categoryName || "System Architecture & Performance"
    }, 25)
  );

  return result;
};

const DEFAULT_TECHNICAL_TESTS = [
  {
    _id: "default-py-ds-1",
    title: "Python & Data Structures Mastery",
    description: "Lists, dicts, memory mutability, time complexity, and core object orientation.",
    category: "Programming",
    prepared_by: "Prof. Computer Science",
    duration_minutes: 30,
    total_marks: 50,
    created_at: "2026-10-04T10:00:00",
    questions: [
      {
        question: "Which data structure in Python is mutable and maintains strict insertion order?",
        options: ["Tuple", "List", "Set", "Frozenset"],
        correct_answer: 1,
        formula: "Python Data Structure Mutability Rule",
        explanation: "1) Lists are mutable sequences that preserve element insertion order.\n2) Tuples and frozensets are immutable; Sets are unordered.",
        category: "Python Programming"
      },
      {
        question: "What is the worst-case time complexity of searching an item in a balanced Binary Search Tree (BST)?",
        options: ["O(log n)", "O(n)", "O(1)", "O(n log n)"],
        correct_answer: 0,
        formula: "BST Height Property: Height H = floor(log2 n)",
        explanation: "1) In a balanced BST, tree height is log2(n).\n2) Worst case search time is proportional to height: O(log n).",
        category: "Data Structures"
      },
      {
        question: "What is the output of `len({'a': 1, 'b': 2, 'a': 3})` in Python?",
        options: ["3", "2", "1", "KeyError"],
        correct_answer: 1,
        formula: "Dictionary Unique Key Mapping Rule",
        explanation: "1) Duplicate key 'a' overwrites value 1 with 3.\n2) Unique keys remaining are 'a' and 'b', so length is 2.",
        category: "Python Programming"
      },
      {
        question: "Which sorting algorithm has the best average-case time complexity of O(n log n) and operates in-place?",
        options: ["QuickSort", "Bubble Sort", "Counting Sort", "Selection Sort"],
        correct_answer: 0,
        formula: "Divide-and-Conquer Partitioning Rule",
        explanation: "1) QuickSort partitions arrays in-place with average O(n log n) comparisons.",
        category: "Algorithms"
      },
      {
        question: "What is the result of evaluating `bool([])` and `bool([0])` in Python?",
        options: ["False and True", "True and False", "False and False", "True and True"],
        correct_answer: 0,
        formula: "Python Truth Value Testing Rule",
        explanation: "1) Empty list `[]` evaluates to False.\n2) Non-empty list `[0]` contains an element and evaluates to True.",
        category: "Python Programming"
      }
    ]
  },
  {
    _id: "default-dbms-sql-1",
    title: "DBMS & SQL Query Architecture",
    description: "Relational normalization, ACID properties, indexing, JOIN execution, and transaction locks.",
    category: "Database",
    duration_minutes: 30,
    total_marks: 50,
    created_at: "2026-10-04T11:00:00",
    questions: [
      {
        question: "Which SQL command is used to remove a table, all its data, and its schema structure permanently?",
        options: ["DELETE", "TRUNCATE", "DROP", "REMOVE"],
        correct_answer: 2,
        formula: "DDL (Data Definition Language) vs DML Rule",
        explanation: "1) DROP TABLE is a DDL command that deletes both data and catalog schema entries.",
        category: "Database Management"
      },
      {
        question: "In transaction processing, what does the 'I' in ACID stand for?",
        options: ["Isolation", "Integrity", "Indexing", "Inheritance"],
        correct_answer: 0,
        formula: "ACID Transaction Guarantees: Atomicity, Consistency, Isolation, Durability",
        explanation: "1) Isolation ensures concurrent transactions execute without interfering with each other.",
        category: "Database Management"
      },
      {
        question: "Which SQL JOIN returns all rows from the left table and matched rows from the right table?",
        options: ["LEFT OUTER JOIN", "INNER JOIN", "RIGHT OUTER JOIN", "FULL JOIN"],
        correct_answer: 0,
        formula: "Relational Algebra Left Outer Join Rule",
        explanation: "1) LEFT OUTER JOIN retains all records from left relation, filling NULLs for unmatched right fields.",
        category: "Database Management"
      },
      {
        question: "What index data structure is most commonly used by relational databases (MySQL InnoDB, PostgreSQL) for range queries?",
        options: ["B+ Tree", "Hash Index", "Binary Heap", "Red-Black Tree"],
        correct_answer: 0,
        formula: "Disk-Optimized B+ Tree Indexing Node Search",
        explanation: "1) B+ Trees keep data in ordered leaf nodes linked together, making range scans O(log n + k).",
        category: "Database Management"
      },
      {
        question: "Which normal form requires removing transitive functional dependencies (X -> Y and Y -> Z)?",
        options: ["3NF (Third Normal Form)", "1NF", "2NF", "BCNF"],
        correct_answer: 0,
        formula: "Normalization Dependency Rule: Non-key attributes must depend solely on key",
        explanation: "1) 3NF eliminates transitive dependencies where non-prime attributes determine other non-prime attributes.",
        category: "Database Management"
      }
    ]
  },
  {
    _id: "default-os-networks-1",
    title: "Operating Systems & Networking Core",
    description: "Process synchronization, deadlock conditions, TCP/IP stack, DNS resolution, and virtual memory.",
    category: "Core CS",
    duration_minutes: 30,
    total_marks: 50,
    created_at: "2026-10-04T11:30:00",
    questions: [
      {
        question: "Which of the following is NOT one of the 4 necessary Coffman conditions for system Deadlock?",
        options: ["Preemption", "Mutual Exclusion", "Hold and Wait", "Circular Wait"],
        correct_answer: 0,
        formula: "Coffman Deadlock Conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait",
        explanation: "1) Preemption breaks deadlocks; 'No Preemption' is the necessary condition for deadlock.",
        category: "Operating Systems"
      },
      {
        question: "Which TCP transport layer protocol feature guarantees in-order delivery of data packets?",
        options: ["Sequence Numbers & ACKs", "UDP Checksum", "ARP Cache", "DHCP Lease"],
        correct_answer: 0,
        formula: "TCP Reliable Sliding Window Protocol",
        explanation: "1) TCP attaches sequence numbers to packets; receiver sends Cumulative Acknowledgments (ACKs).",
        category: "Computer Networks"
      },
      {
        question: "What is the primary function of Page Replacement algorithms like LRU in Virtual Memory?",
        options: ["Swap out least recently used memory pages to disk when RAM is full", "Allocate CPU registers to threads", "Encrypt network packets", "Compile C++ code into machine code"],
        correct_answer: 0,
        formula: "Virtual Memory Page Fault Handler Rule",
        explanation: "1) LRU (Least Recently Used) identifies and evicts pages that haven't been accessed for the longest time.",
        category: "Operating Systems"
      },
      {
        question: "At which OSI Layer does an IP Router operate to forward network packets across subnets?",
        options: ["Layer 3 (Network Layer)", "Layer 2 (Data Link Layer)", "Layer 4 (Transport Layer)", "Layer 7 (Application Layer)"],
        correct_answer: 0,
        formula: "OSI 7-Layer Protocol Stack Mapping",
        explanation: "1) Network Layer (Layer 3) handles IP addressing, packet routing, and subnet management.",
        category: "Computer Networks"
      },
      {
        question: "What is a 'Race Condition' in multi-threaded programming?",
        options: [
          "Multiple threads concurrently modify shared data, causing output dependency on thread scheduling order",
          "CPU clock speed exceeding system bus limits",
          "Memory leak caused by unreferenced pointers",
          "Recursive stack overflow"
        ],
        correct_answer: 0,
        formula: "Critical Section Synchronization Rule",
        explanation: "1) Race condition occurs when timing or execution order of threads impacts program outcome without mutex guards.",
        category: "Operating Systems"
      }
    ]
  },
  {
    _id: "default-web-dev-1",
    title: "Full-Stack Web & API Engineering",
    description: "REST API semantics, HTTP status codes, CORS security, Async JS event loop, and React Virtual DOM.",
    category: "Web Engineering",
    duration_minutes: 30,
    total_marks: 50,
    created_at: "2026-10-04T12:00:00",
    questions: [
      {
        question: "Which HTTP status code signifies that a client lacks valid authentication credentials for the requested resource?",
        options: ["401 Unauthorized", "403 Forbidden", "404 Not Found", "500 Internal Server Error"],
        correct_answer: 0,
        formula: "RFC 7235 HTTP Status Code Standard",
        explanation: "1) 401 Unauthorized means client authentication is required and has failed or not yet been provided.",
        category: "Web Development"
      },
      {
        question: "How does React Virtual DOM optimize web page rendering performance?",
        options: [
          "Compares lightweight Virtual DOM tree with previous tree (reconciliation) and updates only changed real DOM nodes",
          "Executes JavaScript directly inside the GPU",
          "Bypasses browser CSS layout engines",
          "Converts React code into binary WebAssembly modules"
        ],
        correct_answer: 0,
        formula: "React Fiber Reconciliation & Diffing Algorithm O(n)",
        explanation: "1) Virtual DOM diffing finds specific element mutations and patches real DOM efficiently.",
        category: "Web Development"
      },
      {
        question: "What mechanism in JavaScript handles asynchronous callbacks, Promises, and non-blocking I/O operations?",
        options: ["Event Loop & Microtask Queue", "Multi-Threaded Kernel Scheduler", "Garbage Collector", "JIT Compiler"],
        correct_answer: 0,
        formula: "Single-Threaded Event Loop Architecture",
        explanation: "1) JS single thread executes synchronous code first, then processes Microtask queue (Promises) and Task queue.",
        category: "Web Development"
      },
      {
        question: "What is CORS (Cross-Origin Resource Sharing) in web applications?",
        options: [
          "A security mechanism enforced by browsers that restricts cross-origin HTTP requests using HTTP headers",
          "A server database caching protocol",
          "A CSS layout grid framework",
          "An encryption protocol for SSL certificates"
        ],
        correct_answer: 0,
        formula: "Browser Same-Origin Policy Enforcement",
        explanation: "1) CORS header checks (e.g. Access-Control-Allow-Origin) prevent unauthorized cross-domain API calls.",
        category: "Web Development"
      },
      {
        question: "In RESTful API design, which HTTP method is idempotent and used to replace an entire target resource representation?",
        options: ["PUT", "POST", "PATCH", "DELETE"],
        correct_answer: 0,
        formula: "RESTful HTTP Verbs Idempotency Rule",
        explanation: "1) PUT replaces target resource state completely; multiple identical PUT requests produce the exact same server state.",
        category: "Web Development"
      }
    ]
  },
  {
    _id: "default-cloud-devops-1",
    title: "Cloud Architecture & DevOps Systems",
    description: "Docker containerization, Kubernetes pods, CI/CD pipelines, microservices, and Infrastructure as Code.",
    category: "Cloud & DevOps",
    duration_minutes: 30,
    total_marks: 50,
    created_at: "2026-10-04T12:30:00",
    questions: [
      {
        question: "What is the primary difference between a Docker Container and a Virtual Machine (VM)?",
        options: [
          "Containers share the host OS kernel and are lightweight; VMs run full guest OS on hypervisors",
          "Containers require hardware virtualization; VMs do not",
          "VMs start in milliseconds; Containers take minutes",
          "Containers cannot run Linux workloads"
        ],
        correct_answer: 0,
        formula: "OS Level Virtualization (Namespaces/Cgroups) vs Hypervisor Rule",
        explanation: "1) Containers isolate user-space processes while sharing host kernel, providing high density.",
        category: "Cloud Computing"
      },
      {
        question: "What basic smallest deployable execution unit exists in Kubernetes?",
        options: ["Pod", "Node", "Cluster", "Namespace"],
        correct_answer: 0,
        formula: "Kubernetes Object Hierarchy Rule",
        explanation: "1) A Pod is the smallest execution unit in Kubernetes, containing one or more co-located containers.",
        category: "DevOps"
      }
    ]
  }
];

function TechnicalQuizModule() {
  const location = useLocation();
  const navigate = useNavigate();

  const [availableTests, setAvailableTests] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);

  // Active test state
  const [activeTest, setActiveTest] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(1800);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [viewingAnswerSheet, setViewingAnswerSheet] = useState(false);
  const [result, setResult] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [malpracticeCount, setMalpracticeCount] = useState(0);
  const [showMalpracticeModal, setShowMalpracticeModal] = useState(false);

  // Pagination for 5x5 Grid Question Palette (25 questions per page)
  const [palettePage, setPalettePage] = useState(0);

  // Camera verification popup & Granted State logic
  const [showCamModal, setShowCamModal] = useState(false);
  const [pendingTest, setPendingTest] = useState(null);
  const [camStatus, setCamStatus] = useState("prompt"); // "prompt" | "requesting" | "granted" | "denied" | "unavailable" | "error"
  const [camErrorMsg, setCamErrorMsg] = useState("");
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const modalVideoRef = useRef(null);
  const videoRef = useRef(null);

  // Live mid-screen camera preview modal state
  const [showLiveCamModal, setShowLiveCamModal] = useState(false);
  const liveCamVideoRef = useRef(null);

  // Debouncing ref for malpractice strikes
  const lastStrikeTimestampRef = useRef(0);

  const requestCameraPermission = async () => {
    setCamStatus("requesting");
    setCamErrorMsg("");

    if (!navigator?.mediaDevices?.getUserMedia) {
      setCamStatus("unavailable");
      setCamErrorMsg("Camera access is not supported by your browser.");
      setCameraAllowed(false);
      return null;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setCamStatus("granted");
      setCamErrorMsg("");
      setCameraAllowed(true);

      if (modalVideoRef.current) {
        modalVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.warn("Camera permission error:", err);
      let msg = "Failed to access webcam feed.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCamStatus("denied");
        msg = "Camera permission was blocked by your browser. Please allow camera access in your browser settings and try again.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setCamStatus("unavailable");
        msg = "No camera device found on your system. Please connect a webcam.";
      } else {
        setCamStatus("error");
        msg = err.message || "An error occurred while initializing webcam hardware.";
      }
      setCamErrorMsg(msg);
      setCameraAllowed(false);
      return null;
    }
  };

  // Stream handler for live camera preview popup
  useEffect(() => {
    let stream = null;
    if (showLiveCamModal && liveCamVideoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((s) => {
          stream = s;
          if (liveCamVideoRef.current) {
            liveCamVideoRef.current.srcObject = s;
          }
        })
        .catch((err) => console.log("Live camera stream error:", err));
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showLiveCamModal]);

  // Auto-sync palette pagination with current question index
  useEffect(() => {
    setPalettePage(Math.floor(currentIdx / 25));
  }, [currentIdx]);

  // Fetch tests and attempts
  const fetchTestsAndAttempts = async () => {
    setLoadingTests(true);
    try {
      const [testsRes, attemptsRes] = await Promise.all([
        api.get("/assessments?category=Technical").catch(() => ({ data: { data: [] } })),
        api.get("/assessments/attempts/my").catch(() => ({ data: { data: [] } }))
      ]);

      let tests = testsRes.data?.data || [];
      let attempts = attemptsRes.data?.data || [];

      // Fetch published quizzes from local storage created by faculty/admin
      const localQuizzes = JSON.parse(localStorage.getItem("kvgce_published_quizzes") || "[]");
      const localTechQuizzes = localQuizzes.filter(
        (q) => q.category === "Technical" || q.category === "Technical Quiz" || q.category === "Programming"
      );
      localTechQuizzes.forEach((t) => {
        if (!tests.some((existing) => existing._id === t._id || existing.title === t.title)) {
          tests.unshift({
            _id: t._id || "local-" + Date.now(),
            title: t.title,
            description: t.description || "Faculty published technical assessment.",
            category: t.category || "Technical",
            duration_minutes: t.duration_minutes || 30,
            questions: t.questions || [],
            created_at: t.created_at || new Date().toISOString()
          });
        }
      });

      // Load attempts from local storage
      const localAttempts = JSON.parse(localStorage.getItem("kvgce_technical_attempts") || "[]");
      localAttempts.forEach((la) => {
        if (!attempts.some((a) => a.assessment_id === la.assessment_id)) {
          attempts.push(la);
        }
      });

      // Fallback default tests
      const existingIds = new Set(tests.map((t) => t._id));
      DEFAULT_TECHNICAL_TESTS.forEach((dt) => {
        if (!existingIds.has(dt._id)) {
          tests.push(dt);
        }
      });

      setAvailableTests(tests);
      setMyAttempts(attempts);
    } catch (err) {
      console.error("Error fetching technical quizzes:", err);
      setAvailableTests(DEFAULT_TECHNICAL_TESTS);
    } finally {
      setLoadingTests(false);
    }
  };

  useEffect(() => {
    fetchTestsAndAttempts();
  }, []);

  // Handle URL params (for viewing answer sheet directly from History)
  useEffect(() => {
    if (availableTests.length > 0 && !activeTest) {
      const searchParams = new URLSearchParams(location.search);
      const targetTestId = searchParams.get("testId");
      const shouldViewResult = searchParams.get("viewResult") === "true";

      if (targetTestId) {
        const found = availableTests.find((t) => t._id === targetTestId);
        if (found) {
          if (shouldViewResult) {
            handleViewResultSheet(found);
          } else {
            handleStartTestClick(found);
          }
        }
      }
    }
  }, [availableTests, location.search]);

  // Camera setup popup effect
  useEffect(() => {
    let activeStream = null;
    if (showCamModal) {
      requestCameraPermission().then((st) => {
        activeStream = st;
      });
    }
    return () => {
      if (activeStream && activeStream.getTracks) {
        try {
          activeStream.getTracks().forEach((track) => track.stop());
        } catch (e) {
          console.warn("Error stopping modal camera track:", e);
        }
      }
    };
  }, [showCamModal]);

  // Active Webcam Proctoring Feed during test
  useEffect(() => {
    let activeStream = null;
    if (activeTest && !isSubmitted) {
      if (navigator?.mediaDevices?.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: false })
          .then((stream) => {
            activeStream = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
              setCameraActive(true);
            }
          })
          .catch((err) => {
            console.warn("Proctoring camera access denied:", err);
            setCameraActive(false);
          });
      }

      return () => {
        if (activeStream && activeStream.getTracks) {
          try {
            activeStream.getTracks().forEach((track) => track.stop());
          } catch (e) {
            console.warn("Error stopping proctoring camera track:", e);
          }
        }
      };
    }
  }, [activeTest, isSubmitted]);

  // Malpractice Detection: Visibility Change, Window Blur, Navigation
  useEffect(() => {
    if (!activeTest || isSubmitted) return;

    const triggerMalpracticeWarning = () => {
      const now = Date.now();
      if (now - lastStrikeTimestampRef.current < 2500) {
        return;
      }
      lastStrikeTimestampRef.current = now;

      setMalpracticeCount((prev) => {
        const nextCount = prev + 1;
        if (nextCount >= 3) {
          alert("Malpractice Limit Reached: 3 strikes recorded. Your technical quiz is now submitted.");
          handleSubmitTest();
        } else {
          setShowMalpracticeModal(true);
        }
        return nextCount;
      });
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        triggerMalpracticeWarning();
      }
    };

    const handleWindowBlur = () => {
      triggerMalpracticeWarning();
    };

    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = "Leaving this test page will record a malpractice strike. Are you sure?";
      return e.returnValue;
    };

    window.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [activeTest, isSubmitted]);

  // Countdown timer effect
  useEffect(() => {
    if (!activeTest || isSubmitted || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activeTest, isSubmitted, timeLeft]);

  // Open camera verification modal
  const handleStartTestClick = (test) => {
    const prevAttempt = getAttemptForTest(test._id);
    if (prevAttempt) {
      handleViewResultSheet(test);
      return;
    }
    setPendingTest(test);
    setShowCamModal(true);
  };

  // Launch active test
  const handleConfirmStartTest = (optTest) => {
    let test = (optTest && optTest.title) ? optTest : (pendingTest || activeTest || availableTests[0] || DEFAULT_TECHNICAL_TESTS[0]);
    if (!test) return;

    if (activeTest && activeTest._id === test._id && !isSubmitted) {
      setCameraAllowed(true);
      setShowCamModal(false);
      setPendingTest(null);
      return;
    }

    try {
      const testQs = ensure26Questions(test.questions || [], test.title);
      setQuestions(testQs);
      setCurrentIdx(0);
      setAnswers({});
      setTimeLeft((test.duration_minutes || 30) * 60);
      setIsSubmitted(false);
      setResult(null);
      setMalpracticeCount(0);
      setPalettePage(0);
      setCameraAllowed(true);
      setShowCamModal(false);
      setPendingTest(null);
      setActiveTest(test);
    } catch (err) {
      console.error("Error launching technical quiz:", err);
      const fallbackTest = DEFAULT_TECHNICAL_TESTS[0];
      const safeQs = ensure26Questions(fallbackTest.questions, fallbackTest.title);
      setQuestions(safeQs);
      setCurrentIdx(0);
      setAnswers({});
      setTimeLeft(1800);
      setIsSubmitted(false);
      setResult(null);
      setShowCamModal(false);
      setPendingTest(null);
      setActiveTest(fallbackTest);
    }
  };

  // View Result / Answer sheet anytime
  const handleViewResultSheet = (test) => {
    const prevAttempt = getAttemptForTest(test._id);
    setActiveTest(test);
    const testQs = ensure26Questions(test.questions || [], test.title);
    setQuestions(testQs);
    setIsSubmitted(true);

    if (prevAttempt) {
      setResult({
        assessment_title: test.title,
        total_questions: testQs.length,
        correct_answers: prevAttempt.correct_answers || Math.round((prevAttempt.score / (prevAttempt.total_marks || 50)) * testQs.length),
        score: prevAttempt.score,
        total_marks: prevAttempt.total_marks || 50,
        percentage: prevAttempt.percentage,
        time_taken_seconds: prevAttempt.time_taken_seconds || 120,
        evaluated_questions: prevAttempt.evaluated_questions || testQs.map((q, i) => ({
          ...q,
          user_choice: prevAttempt.answers ? prevAttempt.answers[i] : q.correct_answer,
          is_correct: prevAttempt.answers ? prevAttempt.answers[i] === q.correct_answer : true
        }))
      });
    }
  };

  const handleSelectOption = (qIdx, optionIdx) => {
    setAnswers({ ...answers, [qIdx]: optionIdx });
  };

  // Submit Technical Quiz
  const handleSubmitTest = async () => {
    if (submitting || !activeTest) return;
    setSubmitting(true);
    const durationTotal = (activeTest.duration_minutes || 30) * 60;
    const timeTaken = durationTotal - timeLeft;

    let correct = 0;
    let evaluatedQs = [];
    questions.forEach((q, idx) => {
      const userChoice = answers[idx];
      const isCorrect = userChoice === q.correct_answer;
      if (isCorrect) correct++;
      evaluatedQs.push({
        ...q,
        user_choice: userChoice,
        is_correct: isCorrect
      });
    });

    const totalQuestionsCount = questions.length || 1;
    const totalMarks = totalQuestionsCount;
    const score = correct;
    const rawPct = (correct / totalQuestionsCount) * 100;
    const pct = parseFloat(rawPct.toFixed(2));

    const resultPayload = {
      assessment_title: activeTest.title,
      total_questions: questions.length,
      correct_answers: correct,
      wrong_answers: Object.keys(answers).length - correct,
      unanswered: questions.length - Object.keys(answers).length,
      score: score,
      total_marks: totalMarks,
      percentage: pct,
      time_taken_seconds: timeTaken,
      evaluated_questions: evaluatedQs,
      answers: answers,
      camera_verified: cameraAllowed,
      malpractice_strikes: malpracticeCount
    };

    setResult(resultPayload);
    setIsSubmitted(true);
    setSubmitting(false);

    // Save attempt record in local storage
    const newAttemptRecord = {
      assessment_id: activeTest._id,
      assessment_title: activeTest.title,
      score: score,
      total_marks: totalMarks,
      percentage: pct,
      submitted_at: new Date().toISOString(),
      correct_answers: correct,
      time_taken_seconds: timeTaken,
      evaluated_questions: evaluatedQs,
      answers: answers,
      camera_verified: cameraAllowed,
      malpractice_strikes: malpracticeCount
    };

    const existingLocal = JSON.parse(localStorage.getItem("kvgce_technical_attempts") || "[]");
    const updatedLocal = [...existingLocal.filter((a) => a.assessment_id !== activeTest._id), newAttemptRecord];
    localStorage.setItem("kvgce_technical_attempts", JSON.stringify(updatedLocal));

    setMyAttempts((prev) => [...prev.filter((a) => a.assessment_id !== activeTest._id), newAttemptRecord]);

    try {
      const apiRes = await api.post(`/assessments/${activeTest._id}/attempt`, {
        assessment_id: activeTest._id,
        answers: answers,
        time_taken_seconds: timeTaken,
        camera_verified: cameraAllowed,
        malpractice_strikes: malpracticeCount
      });
      if (apiRes?.data?.data?.percentage !== undefined) {
        const backendPct = parseFloat(apiRes.data.data.percentage);
        setResult((prev) => ({
          ...prev,
          percentage: backendPct
        }));
      }
    } catch (e) {
      console.warn("Backend attempt sync warning:", e);
    }
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const getAttemptForTest = (testId) => {
    const matches = myAttempts.filter((a) => a.assessment_id === testId);
    if (matches.length === 0) return null;
    return matches.sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at))[0];
  };

  const pageStart = palettePage * 25;
  const pageEnd = pageStart + 25;
  const visibleQuestions = questions.slice(pageStart, pageEnd);

  // Render Test Selection Grid
  if (!activeTest) {
    return (
      <DashboardLayout title="Technical Subject Quizzes">
        <div className="tech-container">
          {/* CAMERA POPUP BEFORE STARTING TEST */}
          {showCamModal && (
            <div className="cam-setup-overlay">
              <div className="cam-setup-modal">
                <div className="cam-setup-header">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <h3>Camera Verification</h3>
                </div>

                <p className="cam-bold-info">
                  Webcam Access Required for Technical Test
                </p>
                <p className="cam-normal-sub">
                  Position your face clearly in front of the camera before starting <strong>{pendingTest?.title}</strong>.
                </p>

                {camErrorMsg ? (
                  <div className="cam-error-box">
                    <strong>Camera Access Notice:</strong>
                    {camErrorMsg}
                  </div>
                ) : (
                  <div className="cam-setup-preview-box">
                    <video ref={modalVideoRef} autoPlay playsInline muted className="cam-modal-video" />
                    <div className="cam-modal-badge">
                      <span className={`cam-dot ${camStatus === "granted" ? "active" : camStatus === "denied" ? "denied" : ""}`}></span>
                      {camStatus === "granted" ? "Camera Ready" : camStatus === "requesting" ? "Connecting Camera..." : "Camera Verification"}
                    </div>
                  </div>
                )}

                <div className="cam-setup-actions">
                  <button className="btn-modal-cancel" onClick={() => setShowCamModal(false)}>
                    Cancel
                  </button>

                  {camStatus === "denied" || camStatus === "unavailable" || camStatus === "error" ? (
                    <>
                      <button className="btn-modal-retry" onClick={requestCameraPermission}>
                        Retry Access
                      </button>
                      <button className="btn-modal-proceed" onClick={() => handleConfirmStartTest(pendingTest)}>
                        Allow Camera & Start Test
                      </button>
                    </>
                  ) : (
                    <button className="btn-modal-confirm" onClick={() => handleConfirmStartTest(pendingTest)}>
                      Allow Camera & Start Test
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="tech-header-banner">
            <div>
              <h2>Technical Subject Quizzes</h2>
              <p>Proctored core computer science and engineering skill evaluations. Live face camera active during tests.</p>
            </div>
          </div>

          {loadingTests ? (
            <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>Loading technical quizzes...</div>
          ) : (
            <div className="tests-grid-4col">
              {availableTests.map((test) => {
                const prevAttempt = getAttemptForTest(test._id);
                const isCompleted = Boolean(prevAttempt);
                const qCount = 25;
                const duration = test.duration_minutes || 30;

                return (
                  <div key={test._id} className="test-card-simple">
                    <div className="test-card-header">
                      <h3 className="test-card-title">{test.title}</h3>
                      <p className="test-card-desc">{test.description || "Core engineering and programming competence quiz."}</p>
                    </div>

                    <div className="test-card-meta-simple">
                      <div className="meta-text-item">Prepared by: {test.prepared_by || test.faculty_name || test.created_by || "KVGCE Faculty"}</div>
                      <div className="meta-text-item">Timing: {duration} Minutes</div>
                      <div className="meta-text-item">Total Questions: {qCount} Questions</div>
                      <div className="meta-text-item">Date & Time: {formatDateText(test.created_at)}</div>
                    </div>

                    <div className="test-card-action-wrap">
                      {isCompleted ? (
                        <button
                          className="btn-test-action btn-view-sheet"
                          onClick={() => handleViewResultSheet(test)}
                        >
                          View Result
                        </button>
                      ) : (
                        <button
                          className="btn-test-action btn-start"
                          onClick={() => handleStartTestClick(test)}
                        >
                          Start Test
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Active Test or Result Sheet View
  const safeQuestions = Array.isArray(questions) && questions.length > 0 
    ? questions.map((q, i) => normalizeQuestion(q, i))
    : ensure26Questions(activeTest?.questions || [], activeTest?.title || "Technical");

  const safeIdx = Math.min(Math.max(0, currentIdx), safeQuestions.length - 1);
  const currentQ = normalizeQuestion(safeQuestions[safeIdx], safeIdx);

  const rawPct = result?.percentage !== undefined ? parseFloat(result.percentage) : 0;
  const formattedPct = rawPct.toFixed(2);
  const scoreColor = getScoreColorClass(rawPct);

  return (
    <DashboardLayout title={`Technical Quiz: ${activeTest?.title || "Assessment"}`}>
      <div className="tech-container">
        {/* HIDDEN BACKGROUND WEBCAM STREAM */}
        <video ref={videoRef} autoPlay playsInline muted style={{ display: "none" }} />

        {/* MALPRACTICE WARNING MODAL OVERLAY */}
        {showMalpracticeModal && (
          <div className="malpractice-overlay">
            <div className="malpractice-modal">
              <div className="malpractice-header">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span>Malpractice Warning (Strike {malpracticeCount} of 3)</span>
              </div>
              <p className="malpractice-text">
                Do not switch tabs or leave this window during the technical quiz.
              </p>
              <div className="malpractice-warning-note">
                <strong>{3 - malpracticeCount} strike{3 - malpracticeCount > 1 ? "s" : ""} remaining.</strong> Strike 3 will automatically submit your test.
              </div>
              <button
                className="malpractice-acknowledge-btn"
                onClick={() => setShowMalpracticeModal(false)}
              >
                Understand & Continue
              </button>
            </div>
          </div>
        )}

        {/* SMALL FLOATING LIVE CAMERA PREVIEW DIV AT BOTTOM RIGHT */}
        {showLiveCamModal && (
          <div className="small-floating-cam-box">
            <div className="floating-cam-header">
              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                  <circle cx="12" cy="13" r="4"/>
                </svg>
                <span>Live Proctoring Cam</span>
              </div>
              <button
                type="button"
                className="floating-cam-close-btn"
                onClick={() => setShowLiveCamModal(false)}
                title="Close camera preview"
              >
                ✕
              </button>
            </div>
            <div className="floating-cam-video-wrap">
              <video
                ref={liveCamVideoRef}
                autoPlay
                playsInline
                muted
                className="floating-cam-video"
              />
              <div className="floating-cam-badge">
                <span className="live-dot green-dot"></span> LIVE PROCTOR
              </div>
            </div>
          </div>
        )}

        {!isSubmitted || viewingAnswerSheet ? (
          <div className="active-test-container">
            {/* FULL ROW TOP TITLE BAR */}
            <div className="test-top-bar full-width-bar">
              <div className="test-top-left">
                <h2 className="active-test-heading">
                  {!isSubmitted
                    ? (activeTest?.title || "Proctored Technical Assessment")
                    : `${activeTest?.title || "Assessment"} (Answer Review)`}
                </h2>
                <p className="active-test-desc">
                  {!isSubmitted
                    ? "Proctored technical assessment mode. Complete all questions within allocated time."
                    : "Answer Key & Code Logic Breakdown Review Mode. Use Question Palette to switch questions."}
                </p>
              </div>

              <div className="top-bar-right-group">
                {!isSubmitted ? (
                  <div className="malpractice-inline-right clean-strike-normal">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <span>Malpractice Strikes: {malpracticeCount}/3</span>
                  </div>
                ) : (
                  <div className="malpractice-inline-right review-badge-mode">
                    <span>Review Mode: Test Submitted ✓</span>
                  </div>
                )}

                <div className="top-bar-timer-black">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  <div className="timer-black-text">
                    <span className="timer-black-label">{!isSubmitted ? "Remaining Time" : "Time Taken"}</span>
                    <span className="timer-black-val">
                      {!isSubmitted
                        ? formatTime(timeLeft)
                        : formatTime(result?.time_taken_seconds || (30 * 60 - timeLeft))}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* 2-COLUMN GRID ALIGNED AT SAME TOP ROW LEVEL & EQUAL HEIGHT */}
            <div className="test-interface-grid equal-height-grid">
              {/* LEFT AREA: QUESTION CARD */}
              <div className="left-test-area flex-fill">
                <div className="question-card clean-question-card">
                  <div className="q-progress-segmented-header">
                    <div className="segmented-bar">
                      {questions.map((_, idx) => {
                        let segClass = idx <= currentIdx ? "active" : "";
                        if (isSubmitted) {
                          const uAns = answers[idx];
                          const cIdx = questions[idx]?.correct_answer !== undefined ? questions[idx].correct_answer : 0;
                          if (uAns === undefined) segClass = "unanswered-seg";
                          else if (uAns === cIdx) segClass = "correct-seg";
                          else segClass = "wrong-seg";
                        }
                        return <div key={idx} className={`segment-bar-item ${segClass}`} />;
                      })}
                    </div>
                    <div className="segment-step-count">
                      {currentIdx + 1} / {questions.length}
                    </div>
                  </div>

                  <h3 className="q-text screenshot-bold-q">
                    Q{currentIdx + 1}: {currentQ.question}
                  </h3>

                  <div className="screenshot-options-list">
                    {(currentQ.options || []).map((opt, optIdx) => {
                      const userAns = answers[currentIdx];
                      const correctIdx = currentQ.correct_answer !== undefined ? currentQ.correct_answer : 0;
                      const letter = String.fromCharCode(65 + optIdx);

                      let optionStyleClass = "";
                      let badgeTag = null;

                      if (isSubmitted) {
                        if (optIdx === correctIdx) {
                          optionStyleClass = "option-correct-highlight";
                          badgeTag = <span className="opt-badge-tag green-tag">✓ Correct Answer</span>;
                        } else if (userAns === optIdx && userAns !== correctIdx) {
                          optionStyleClass = "option-wrong-highlight";
                          badgeTag = <span className="opt-badge-tag red-tag">✗ Your Choice (Wrong)</span>;
                        } else {
                          optionStyleClass = "option-disabled-neutral";
                        }
                      } else {
                        if (userAns === optIdx) {
                          optionStyleClass = "selected";
                        }
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`screenshot-option-block ${optionStyleClass}`}
                          onClick={() => {
                            if (!isSubmitted) handleSelectOption(currentIdx, optIdx);
                          }}
                        >
                          <span className="opt-letter-prefix">{letter}.</span>
                          <span className="opt-text-val">{opt}</span>
                          {badgeTag}
                        </div>
                      );
                    })}
                  </div>

                  {/* FORMULA & STEP-BY-STEP SOLUTION CONTAINER */}
                  {isSubmitted && (
                    <div className="review-solution-container">
                      <div className="review-solution-header">
                        <span>Code Principle & Technical Solution</span>
                      </div>

                      {currentQ.formula && (
                        <div className="formula-item-box">
                          <strong>Key Principle / Rule: </strong>
                          <code>{currentQ.formula}</code>
                        </div>
                      )}

                      <div className="explanation-item-box">
                        <strong>Technical Explanation & Analysis:</strong>
                        <p className="solution-explanation-text">
                          {currentQ.explanation || "Apply standard computer science principles and code logic step by step."}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="screenshot-card-footer">
                    {isSubmitted ? (
                      <button
                        type="button"
                        className="screenshot-pill-btn prev-gray-pill"
                        onClick={() => setViewingAnswerSheet(false)}
                      >
                        ← Back to Result Summary
                      </button>
                    ) : (
                      <button
                        onClick={() => setCurrentIdx(currentIdx - 1)}
                        className="screenshot-pill-btn prev-gray-pill"
                        disabled={currentIdx === 0}
                      >
                        ← Previous
                      </button>
                    )}

                    <div className="footer-right-nav">
                      {isSubmitted ? (
                        <>
                          <button
                            type="button"
                            className="screenshot-pill-btn prev-gray-pill"
                            onClick={() => setCurrentIdx((prev) => Math.max(0, prev - 1))}
                            disabled={currentIdx === 0}
                            style={{ marginRight: "0.5rem" }}
                          >
                            ← Prev Q
                          </button>
                          <button
                            type="button"
                            className="screenshot-pill-btn next-blue-pill"
                            onClick={() => setCurrentIdx((prev) => Math.min(questions.length - 1, prev + 1))}
                            disabled={currentIdx === questions.length - 1}
                          >
                            Next Q →
                          </button>
                        </>
                      ) : currentIdx < questions.length - 1 ? (
                        <button
                          onClick={() => setCurrentIdx(currentIdx + 1)}
                          className="screenshot-pill-btn next-blue-pill"
                        >
                          Next →
                        </button>
                      ) : (
                        <button
                          onClick={handleSubmitTest}
                          className="screenshot-pill-btn submit-green-pill"
                          disabled={submitting}
                        >
                          {submitting ? "Submitting..." : "Submit Test ✓"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT TEST AREA: QUESTION PALETTE */}
              <div className="right-test-area flex-fill">
                <div className="palette-card compact-palette flex-fill-card">
                  <div className="palette-header-row">
                    <h4 className="palette-title">Question Palette</h4>
                    <div className="palette-arrow-nav">
                      <button
                        type="button"
                        className="arrow-nav-btn"
                        disabled={palettePage === 0}
                        onClick={() => setPalettePage((prev) => Math.max(0, prev - 1))}
                        title="Previous Questions"
                      >
                        ←
                      </button>
                      <span className="arrow-nav-text">
                        {palettePage + 1}/{Math.ceil(questions.length / 25)}
                      </span>
                      <button
                        type="button"
                        className="arrow-nav-btn"
                        disabled={(palettePage + 1) * 25 >= questions.length}
                        onClick={() => setPalettePage((prev) => prev + 1)}
                        title="Next Questions"
                      >
                        →
                      </button>
                    </div>
                  </div>

                  <div className="palette-grid grid-5x5">
                    {visibleQuestions.map((_, pIdx) => {
                      const globalIdx = pageStart + pIdx;
                      const userAns = answers[globalIdx];
                      const qObj = safeQuestions[globalIdx];
                      const correctIdx = qObj?.correct_answer !== undefined ? qObj.correct_answer : 0;
                      const isCurrent = globalIdx === currentIdx;

                      let statusClass = "";
                      if (isSubmitted) {
                        if (userAns === undefined) {
                          statusClass = "review-unanswered";
                        } else if (userAns === correctIdx) {
                          statusClass = "review-correct";
                        } else {
                          statusClass = "review-wrong";
                        }
                      } else {
                        statusClass = `${isCurrent ? "current" : ""} ${userAns !== undefined ? "answered" : ""}`;
                      }

                      return (
                        <button
                          key={globalIdx}
                          className={`palette-num tight-num ${statusClass} ${isCurrent ? "current-ring" : ""}`}
                          onClick={() => setCurrentIdx(globalIdx)}
                        >
                          {globalIdx + 1}
                        </button>
                      );
                    })}
                  </div>

                  {isSubmitted ? (
                    <div className="palette-legend tight-legend">
                      <span><span className="legend-box review-correct-box"></span> Correct</span>
                      <span><span className="legend-box review-wrong-box"></span> Wrong</span>
                      <span><span className="legend-box review-unanswered-box"></span> Unanswered</span>
                    </div>
                  ) : (
                    <div className="palette-legend tight-legend">
                      <span><span className="legend-box answered"></span> Answered</span>
                      <span><span className="legend-box"></span> Unanswered</span>
                    </div>
                  )}

                  <div
                    className={`palette-bottom-cam-status static-cam-box ${!isSubmitted && cameraActive !== false ? "cam-active-box" : "cam-inactive-box"}`}
                    onClick={() => {
                      if (!isSubmitted) {
                        if (!cameraActive) {
                          setPendingTest(activeTest);
                          setShowCamModal(true);
                        } else {
                          setShowLiveCamModal((prev) => !prev);
                        }
                      }
                    }}
                    title={!isSubmitted ? (!cameraActive ? "Camera is OFF. Click to allow camera" : "Click to view live webcam preview popup") : "Test Submitted"}
                  >
                    <div className="cam-status-top-line">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isSubmitted ? "#16a34a" : (cameraActive !== false ? "#16a34a" : "#dc2626")} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        {isSubmitted ? (
                          <polyline points="20 6 9 17 4 12" />
                        ) : (
                          <>
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                            <circle cx="12" cy="13" r="4"/>
                          </>
                        )}
                      </svg>
                      <span className={`cam-status-label ${isSubmitted || cameraActive !== false ? "cam-green-text" : "cam-red-text"}`}>
                        {isSubmitted ? "Test Completed & Submitted" : (cameraActive !== false ? "Camera On" : "Camera Off (Click to Allow)")}
                      </span>
                    </div>
                    <p className="cam-status-bottom-text">
                      {!isSubmitted ? (
                        <>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="cam-warning-icon">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="12"/>
                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                          </svg>
                          Keep your eyes on the test to avoid flagging the camera tracker.
                        </>
                      ) : (
                        "Answers, scores, and code principles evaluated successfully."
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* RESULT SUMMARY CARD */
          <div className="result-card clean-result-summary-card text-center">
            <div className="result-header-text">
              <h2 className="result-card-title">Result & Performance Score: {activeTest?.title}</h2>
              <p className="result-card-subtitle">
                Evaluation complete. Review your technical test statistics below or click "View Answers" to inspect solution logic.
              </p>
            </div>

            <div className="result-center-content">
              <div className={`score-summary-circle ${scoreColor}`}>
                <div className="big-score">{formattedPct}%</div>
                <span className="score-total-sub">Score: {result?.score} / {result?.total_marks}</span>
              </div>

              <div className="result-stats-grid">
                <div className="res-stat-item green">
                  <span className="res-val">{result?.correct_answers}</span>
                  <span className="res-lbl">Correct Answers</span>
                </div>
                <div className="res-stat-item red">
                  <span className="res-val">{result?.wrong_answers || 0}</span>
                  <span className="res-lbl">Wrong Answers</span>
                </div>
                <div className="res-stat-item gray">
                  <span className="res-val">{result?.unanswered || 0}</span>
                  <span className="res-lbl">Unanswered</span>
                </div>
                <div className="res-stat-item blue">
                  <span className="res-val">{formatTime(result?.time_taken_seconds || 120)}</span>
                  <span className="res-lbl">Time Taken</span>
                </div>
              </div>
            </div>

            <div className="result-three-actions-row">
              <button
                type="button"
                className="result-btn-action btn-back-assessments"
                onClick={() => {
                  setActiveTest(null);
                  setIsSubmitted(false);
                  setViewingAnswerSheet(false);
                }}
              >
                ← Back to Quizzes
              </button>

              <button
                type="button"
                className="result-btn-action btn-view-answers"
                onClick={() => {
                  setViewingAnswerSheet(true);
                  setCurrentIdx(0);
                  setPalettePage(0);
                }}
              >
                View Answers & Solutions →
              </button>

              <button
                type="button"
                className="result-btn-action btn-view-history"
                onClick={() => navigate("/student/history")}
              >
                View History →
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

export default TechnicalQuizModule;
