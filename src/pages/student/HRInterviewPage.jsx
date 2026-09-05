import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import "./HRInterviewPage.css";

const QUESTIONS_LIST = [
  {
    id: 1,
    number: "1/8",
    question: "Tell me about yourself and your technical background in Computer Science.",
    aiIntro: "Welcome to your KVGCE HR Mock Interview. Let's start with a brief introduction.",
    sampleResponse:
      "I am a final year Computer Science student at KVGCE. I have a strong foundation in Data Structures, Java, Python, and Web Development. I've worked on full-stack projects including a placement tracking portal.",
    scores: { grammar: "19/20", answers: "36/40", comm: "18/20", voice: "17/20", total: 90, overallLive: 88 },
  },
  {
    id: 2,
    number: "2/8",
    question: "What are your core strengths and areas of improvement?",
    aiIntro: "Good start. Now tell me about your key strengths and areas you are actively working on.",
    sampleResponse:
      "My key strengths are problem-solving, rapid adaptability to new tech stacks, and team collaboration. For improvement, I am working on enhancing my public speaking under pressure.",
    scores: { grammar: "18/20", answers: "35/40", comm: "17/20", voice: "16/20", total: 86, overallLive: 84 },
  },
  {
    id: 3,
    number: "3/8",
    question: "Explain the difference between ArrayList and LinkedList in Java.",
    aiIntro: "Let's test your core data structures knowledge.",
    sampleResponse:
      "In Java, ArrayList is a resizable array implementation of the List interface. It stores elements in contiguous memory locations providing fast random access (O(1)), but insertion and deletion can be slow (O(n)) due to element shifting. On the other hand, LinkedList is a doubly-linked list implementation where elements are nodes containing data and references. It provides fast insertion and deletion (O(1)), but random access is slower (O(n)).",
    scores: { grammar: "18/20", answers: "34/40", comm: "18/20", voice: "16/20", total: 86, overallLive: 81 },
  },
  {
    id: 4,
    number: "4/8",
    question: "How do you handle conflict or tight deadlines in a team project?",
    aiIntro: "Behavioral question: Tell me about a scenario where you faced a project deadline crunch.",
    sampleResponse:
      "During our mini-project, we faced a tight deadline before evaluation. I organized daily 15-minute standup syncs, divided complex modules into subtasks, and assisted teammates with debugging to ship on time.",
    scores: { grammar: "19/20", answers: "37/40", comm: "19/20", voice: "17/20", total: 92, overallLive: 89 },
  },
  {
    id: 5,
    number: "5/8",
    question: "What is the difference between SQL and NoSQL databases? When to use which?",
    aiIntro: "Let's evaluate your relational and non-relational database knowledge.",
    sampleResponse:
      "SQL databases are relational, table-based, and follow ACID properties (e.g., PostgreSQL, MySQL). NoSQL databases are non-relational, document or key-value based (e.g., MongoDB), designed for horizontal scaling and flexible schema.",
    scores: { grammar: "18/20", answers: "33/40", comm: "17/20", voice: "16/20", total: 84, overallLive: 82 },
  },
  {
    id: 6,
    number: "6/8",
    question: "Where do you see yourself in the next 3 to 5 years?",
    aiIntro: "Let's discuss your career aspirations and long-term goals.",
    sampleResponse:
      "In 3 to 5 years, I envision myself as a Senior Software Engineer specializing in scalable cloud applications and mentoring junior developers while continuing to learn modern architectures.",
    scores: { grammar: "19/20", answers: "38/40", comm: "19/20", voice: "18/20", total: 94, overallLive: 91 },
  },
  {
    id: 7,
    number: "7/8",
    question: "Explain the concept of Object-Oriented Programming (OOP) principles with examples.",
    aiIntro: "Explain the 4 fundamental pillars of OOP.",
    sampleResponse:
      "The 4 pillars are Encapsulation (hiding data via private fields), Abstraction (hiding implementation details), Inheritance (reusing parent class methods), and Polymorphism (method overriding/overloading).",
    scores: { grammar: "18/20", answers: "36/40", comm: "18/20", voice: "17/20", total: 89, overallLive: 87 },
  },
  {
    id: 8,
    number: "8/8",
    question: "Do you have any questions for us regarding the role or company culture?",
    aiIntro: "Finally, do you have any questions for me?",
    sampleResponse:
      "Yes! Could you share more about the learning and development opportunities for fresh engineering graduates joining the team?",
    scores: { grammar: "20/20", answers: "39/40", comm: "19/20", voice: "18/20", total: 96, overallLive: 94 },
  },
];

export default function HRInterviewPage() {
  const navigate = useNavigate();

  // State management
  const [currentQIndex, setCurrentQIndex] = useState(2); // Starts on Question 3/8 like screenshot
  const [activeTab, setActiveTab] = useState("transcription"); // "transcription" | "notes"
  const [notesText, setNotesText] = useState(
    "Candidate demonstrates strong knowledge of Java Collections framework. Clear distinction between ArrayList and LinkedList."
  );
  
  // Timer state (seconds initialized to 18 mins 42 secs = 1122 s)
  const [secondsElapsed, setSecondsElapsed] = useState(1122);
  const [isPaused, setIsPaused] = useState(false);

  // Audio/Video control states
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isSharingScreen, setIsSharingScreen] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [customAnswer, setCustomAnswer] = useState("");
  const [showEndModal, setShowEndModal] = useState(false);

  // Dynamic Live Transcripts
  const [transcripts, setTranscripts] = useState([
    {
      sender: "ai",
      name: "AI Interviewer",
      time: "00:15:30",
      text: "Explain the difference between ArrayList and LinkedList in Java.",
    },
    {
      sender: "user",
      name: "You",
      time: "00:15:42",
      text: "In Java, ArrayList is a resizable array implementation of the List interface. It stores elements in a contiguous memory location. It provides fast random access but insertion and deletion operations are slow because it may require shifting the elements.",
    },
    {
      sender: "user",
      name: "You",
      time: "00:16:10",
      text: "On the other hand, LinkedList is a doubly-linked list implementation of the List interface. It stores elements in nodes where each node contains the data and reference to the next and previous node.",
    },
    {
      sender: "user",
      name: "You",
      time: "00:16:32",
      text: "It provides fast insertion and deletion operations but random access is slow.",
    },
    {
      sender: "ai",
      name: "AI Interviewer",
      time: "00:16:45",
      text: "Great! Can you also explain when you would prefer to use ArrayList over LinkedList?",
    },
  ]);

  const transcriptBottomRef = useRef(null);
  const speechRef = useRef(null);
  const userVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);
  const [hasWebcam, setHasWebcam] = useState(false);

  // Initialize live webcam video stream
  useEffect(() => {
    let stream = null;
    async function enableWebcam() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
            audio: false,
          });
          mediaStreamRef.current = stream;
          if (userVideoRef.current) {
            userVideoRef.current.srcObject = stream;
          }
          setHasWebcam(true);
        }
      } catch (err) {
        console.warn("Webcam access warning:", err);
        setHasWebcam(false);
      }
    }

    enableWebcam();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const toggleCamera = () => {
    const nextState = !isCameraOff;
    setIsCameraOff(nextState);
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getVideoTracks().forEach((track) => {
        track.enabled = !nextState;
      });
    }
  };

  // Timer Tick Effect
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Format Timer output (HH:MM:SS)
  const formatTimer = (totalSecs) => {
    const hrs = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const pad = (n) => String(n).padStart(2, "0");
    if (hrs > 0) {
      return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
    }
    return `${pad(mins)}:${pad(secs)}`;
  };

  // Format specific time string
  const getFormattedTimeNow = () => {
    const mins = Math.floor(secondsElapsed / 60);
    const secs = secondsElapsed % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `00:${pad(mins)}:${pad(secs)}`;
  };

  // Auto scroll transcript container
  useEffect(() => {
    if (autoScroll && transcriptBottomRef.current) {
      transcriptBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [transcripts, autoScroll]);

  // Question Navigator
  const handleSelectQuestion = (index) => {
    setCurrentQIndex(index);
    const qData = QUESTIONS_LIST[index];
    const timeNow = getFormattedTimeNow();
    
    // Append AI question to transcript stream
    setTranscripts((prev) => [
      ...prev,
      {
        sender: "ai",
        name: "AI Interviewer",
        time: timeNow,
        text: qData.question,
      },
    ]);
  };

  // Handle Submit Answer
  const handleSendAnswer = (e) => {
    if (e) e.preventDefault();
    if (!customAnswer.trim()) return;

    const timeNow = getFormattedTimeNow();
    const newEntry = {
      sender: "user",
      name: "You",
      time: timeNow,
      text: customAnswer.trim(),
    };

    setTranscripts((prev) => [...prev, newEntry]);
    setCustomAnswer("");

    // Simulate AI response after 1.5s
    setTimeout(() => {
      setTranscripts((prev) => [
        ...prev,
        {
          sender: "ai",
          name: "AI Interviewer",
          time: getFormattedTimeNow(),
          text: "Thank you for your detailed response. Your answer has been recorded and evaluated by our AI engine.",
        },
      ]);
    }, 1500);
  };

  // Handle Speech Recognition API if supported
  const toggleVoiceCapture = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in this browser. You can type your response below!");
      return;
    }

    if (isListening) {
      if (speechRef.current) speechRef.current.stop();
      setIsListening(false);
    } else {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map((result) => result[0].transcript)
          .join("");
        setCustomAnswer(transcript);
      };

      recognition.onerror = (err) => {
        console.error("Speech Recognition Error:", err);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      speechRef.current = recognition;
      recognition.start();
    }
  };

  // Toggle Fullscreen
  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => console.log(err));
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  const currentQ = QUESTIONS_LIST[currentQIndex];

  return (
    <DashboardLayout title="HR Interview">
      <div className="hr-interview-page-wrapper">
        {/* TOP INTERVIEW NAVIGATION BAR */}
        <header className="hr-interview-topbar">
          <div className="topbar-left-brand">
            <div className="brand-logo-frame">
              <img src="/KVGCE_logo.png" alt="KVGCE Logo" className="hr-logo-img" />
            </div>
            <div className="brand-title-group">
              <span className="brand-app-name">KVGCE-TAP</span>
              <span className="brand-divider">|</span>
              <span className="brand-page-title">HR Interview</span>
            </div>
          </div>

          {/* STATUS PILL & TIMER */}
          <div className="topbar-center-status">
            <div className="status-live-pill">
              <span className="pulse-red-dot"></span>
              <span className="status-text">Interview in Progress</span>
            </div>
            <div className="timer-display-box">
              <span className="timer-clock">{formatTimer(secondsElapsed)}</span>
            </div>
          </div>

          {/* RIGHT ACTION BUTTONS */}
          <div className="topbar-right-actions">
            <button
              className="end-interview-btn"
              onClick={() => setShowEndModal(true)}
              title="End this HR Interview session"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4 11H8v-2h8v2z" />
              </svg>
              <span>End Interview</span>
            </button>

            <button
              className="icon-fullscreen-btn"
              onClick={toggleFullScreen}
              title="Toggle Fullscreen"
              aria-label="Toggle Fullscreen"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            </button>
          </div>
        </header>

        {/* MAIN BODY LAYOUT GRID */}
        <div className="hr-interview-body-grid">
          {/* LEFT VIEWPORT COLUMN */}
          <div className="interview-left-column">
            {/* 1. MAIN INTERVIEWER VIDEO STREAM CONTAINER */}
            <div className="interviewer-video-card">
              <div className="video-viewport">
                <video
                  ref={userVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`interviewer-feed-img user-webcam-feed ${isCameraOff ? "camera-off-dim" : ""}`}
                />

                {isCameraOff && (
                  <div className="camera-off-overlay">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5">
                      <path d="M16 16L12 12M12 12L8 8M12 12L16 8M12 12L8 16" />
                      <line x1="1" y1="1" x2="23" y2="23" stroke="#e2e8f0" strokeWidth="2" />
                    </svg>
                    <span>Camera Stream Paused</span>
                  </div>
                )}

                {/* OVERLAY BADGE TOP LEFT */}
                <div className="video-badge-topleft">
                  <span className="badge-sparkles-icon">✨</span>
                  <span className="badge-text">AI Interviewer</span>
                </div>

                {/* OVERLAY BADGE TOP RIGHT */}
                <div className="video-badge-topright">
                  <span className="rec-red-dot"></span>
                  <span className="rec-text">Recording</span>
                </div>

                {/* BOTTOM QUESTION OVERLAY BOX */}
                <div className="video-question-overlay">
                  <div className="q-badge-icon">
                    <span className="q-icon">?</span>
                  </div>
                  <div className="q-content-box">
                    <div className="q-meta-row">
                      <span className="q-number">Question {currentQ.number}</span>
                      <div className="q-nav-buttons">
                        <button
                          disabled={currentQIndex === 0}
                          onClick={() => handleSelectQuestion(currentQIndex - 1)}
                          title="Previous Question"
                          className="q-arrow-btn"
                        >
                          ‹
                        </button>
                        <button
                          disabled={currentQIndex === QUESTIONS_LIST.length - 1}
                          onClick={() => handleSelectQuestion(currentQIndex + 1)}
                          title="Next Question"
                          className="q-arrow-btn"
                        >
                          ›
                        </button>
                      </div>
                    </div>
                    <h3 className="q-text">{currentQ.question}</h3>
                  </div>
                </div>

                {/* FLOATING CONTROL BAR AT BOTTOM CENTER */}
                <div className="floating-video-controls">
                  <button
                    className={`ctrl-btn ${isMuted ? "active-alert" : ""}`}
                    onClick={() => setIsMuted(!isMuted)}
                    title={isMuted ? "Unmute Mic" : "Mute Mic"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                      <line x1="12" y1="19" x2="12" y2="23" />
                      <line x1="8" y1="23" x2="16" y2="23" />
                    </svg>
                    <span>{isMuted ? "Unmute" : "Mute"}</span>
                  </button>

                  <button
                    className={`ctrl-btn ${isCameraOff ? "active-alert" : ""}`}
                    onClick={toggleCamera}
                    title={isCameraOff ? "Turn Camera On" : "Turn Camera Off"}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M23 7l-7 5 7 5V7z" />
                      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                    </svg>
                    <span>Camera</span>
                  </button>

                  <button
                    className={`ctrl-btn ${isSharingScreen ? "active-info" : ""}`}
                    onClick={() => setIsSharingScreen(!isSharingScreen)}
                    title="Share Screen"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                    <span>{isSharingScreen ? "Sharing..." : "Share Screen"}</span>
                  </button>

                  <button
                    className="ctrl-btn end-call-red"
                    onClick={() => setShowEndModal(true)}
                    title="End Call"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4 11H8v-2h8v2z" />
                    </svg>
                    <span>End Call</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 2. BOTTOM TWO CARDS ROW (WAVEFORM & LIVE ANALYSIS) */}
            <div className="bottom-cards-row">
              {/* CARD A: LIVE VOICE WAVEFORM & CONVERTED SPEECH */}
              <div className="half-card waveform-speech-card">
                <div className="card-header-bar">
                  <h4 className="card-title">Live Voice Waveform</h4>
                  <div className="speaking-badge">
                    <span className="green-pulse-dot"></span>
                    <span>Speaking</span>
                  </div>
                </div>

                {/* ANIMATED WAVEFORM VISUALIZER */}
                <div className="waveform-visualizer-box">
                  <div className="equalizer-bars">
                    <span className="eq-bar bar-1"></span>
                    <span className="eq-bar bar-2"></span>
                    <span className="eq-bar bar-3"></span>
                    <span className="eq-bar bar-4"></span>
                    <span className="eq-bar bar-5"></span>
                    <span className="eq-bar bar-6"></span>
                    <span className="eq-bar bar-7"></span>
                    <span className="eq-bar bar-8"></span>
                    <span className="eq-bar bar-9"></span>
                    <span className="eq-bar bar-10"></span>
                    <span className="eq-bar bar-11"></span>
                    <span className="eq-bar bar-12"></span>
                    <span className="eq-bar bar-13"></span>
                    <span className="eq-bar bar-14"></span>
                    <span className="eq-bar bar-15"></span>
                    <span className="eq-bar bar-16"></span>
                    <span className="eq-bar bar-17"></span>
                    <span className="eq-bar bar-18"></span>
                    <span className="eq-bar bar-19"></span>
                    <span className="eq-bar bar-20"></span>
                    <span className="eq-bar bar-21"></span>
                    <span className="eq-bar bar-22"></span>
                    <span className="eq-bar bar-23"></span>
                    <span className="eq-bar bar-24"></span>
                  </div>
                  <span className="waveform-timestamp">{formatTimer(secondsElapsed)}</span>
                </div>

                <div className="converted-speech-section">
                  <h5 className="sub-section-title">Converted Speech (Real-time)</h5>
                  <div className="speech-scroll-container">
                    <p className="speech-paragraph">
                      In Java, <strong>ArrayList</strong> is a resizable array implementation of the List interface. It stores elements in a contiguous memory location. It provides fast random access but insertion and deletion operations are slow because it may require shifting the elements.
                    </p>
                    <p className="speech-paragraph">
                      On the other hand, <strong>LinkedList</strong> is a doubly-linked list implementation of the List interface. It stores elements in nodes where each node contains the data and reference to the next and previous node. It provides fast insertion and deletion operations but random access is slow.
                    </p>
                  </div>
                </div>

                <div className="speech-card-footer">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={autoScroll}
                      onChange={(e) => setAutoScroll(e.target.checked)}
                    />
                    <span>Auto Scroll</span>
                  </label>

                  <button
                    className={`voice-record-btn ${isListening ? "recording-active" : ""}`}
                    onClick={toggleVoiceCapture}
                    title="Speak answer using microphone"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                    </svg>
                    <span>{isListening ? "Listening..." : "Speak Answer"}</span>
                  </button>
                </div>
              </div>

              {/* CARD B: AI ANALYSIS (LIVE) */}
              <div className="half-card ai-analysis-card">
                <div className="card-header-bar">
                  <h4 className="card-title">AI Analysis (Live)</h4>
                </div>

                <div className="metrics-list-container">
                  {/* Metric 1: Grammar */}
                  <div className="metric-row">
                    <div className="metric-info-left">
                      <span className="metric-icon icon-grammar">📝</span>
                      <span className="metric-name">Grammar</span>
                      <span className="metric-rating-tag tag-good">Good</span>
                    </div>
                    <div className="metric-progress-right">
                      <div className="metric-bar-track">
                        <div className="metric-bar-fill green-fill" style={{ width: "82%" }}></div>
                      </div>
                      <span className="metric-percentage">82%</span>
                    </div>
                  </div>

                  {/* Metric 2: Clarity */}
                  <div className="metric-row">
                    <div className="metric-info-left">
                      <span className="metric-icon icon-clarity">✨</span>
                      <span className="metric-name">Clarity</span>
                      <span className="metric-rating-tag tag-good">Good</span>
                    </div>
                    <div className="metric-progress-right">
                      <div className="metric-bar-track">
                        <div className="metric-bar-fill green-fill" style={{ width: "78%" }}></div>
                      </div>
                      <span className="metric-percentage">78%</span>
                    </div>
                  </div>

                  {/* Metric 3: Relevance */}
                  <div className="metric-row">
                    <div className="metric-info-left">
                      <span className="metric-icon icon-relevance">🛡️</span>
                      <span className="metric-name">Relevance</span>
                      <span className="metric-rating-tag tag-excellent">Excellent</span>
                    </div>
                    <div className="metric-progress-right">
                      <div className="metric-bar-track">
                        <div className="metric-bar-fill green-fill" style={{ width: "90%" }}></div>
                      </div>
                      <span className="metric-percentage">90%</span>
                    </div>
                  </div>

                  {/* Metric 4: Communication */}
                  <div className="metric-row">
                    <div className="metric-info-left">
                      <span className="metric-icon icon-comm">🗣️</span>
                      <span className="metric-name">Communication</span>
                      <span className="metric-rating-tag tag-good">Good</span>
                    </div>
                    <div className="metric-progress-right">
                      <div className="metric-bar-track">
                        <div className="metric-bar-fill green-fill" style={{ width: "80%" }}></div>
                      </div>
                      <span className="metric-percentage">80%</span>
                    </div>
                  </div>

                  {/* Metric 5: Confidence */}
                  <div className="metric-row">
                    <div className="metric-info-left">
                      <span className="metric-icon icon-conf">💠</span>
                      <span className="metric-name">Confidence</span>
                      <span className="metric-rating-tag tag-good">Good</span>
                    </div>
                    <div className="metric-progress-right">
                      <div className="metric-bar-track">
                        <div className="metric-bar-fill green-fill" style={{ width: "77%" }}></div>
                      </div>
                      <span className="metric-percentage">77%</span>
                    </div>
                  </div>
                </div>

                {/* OVERALL LIVE SCORE FOOTER */}
                <div className="overall-live-summary">
                  <span className="overall-lbl font-semibold">Overall (Live)</span>
                  <span className="overall-val-blue">{currentQ.scores.overallLive}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDEBAR COLUMN */}
          <div className="interview-right-sidebar">
            {/* TABS CONTAINER */}
            <div className="sidebar-tabs-header">
              <button
                className={`tab-btn ${activeTab === "transcription" ? "active" : ""}`}
                onClick={() => setActiveTab("transcription")}
              >
                Live Transcription
              </button>
              <button
                className={`tab-btn ${activeTab === "notes" ? "active" : ""}`}
                onClick={() => setActiveTab("notes")}
              >
                Interview Notes
              </button>
            </div>

            {/* TAB CONTENT: LIVE TRANSCRIPTION */}
            {activeTab === "transcription" ? (
              <div className="transcription-tab-content">
                <div className="transcript-messages-feed">
                  {transcripts.map((msg, idx) => (
                    <div key={idx} className={`transcript-bubble-row ${msg.sender}`}>
                      <div className="bubble-meta">
                        <span className="speaker-name">
                          {msg.sender === "ai" ? "✨ " : "👤 "}
                          {msg.name}
                        </span>
                        <span className="timestamp-tag">{msg.time}</span>
                      </div>
                      <div className="bubble-text">
                        <p>{msg.text}</p>
                      </div>
                    </div>
                  ))}
                  <div ref={transcriptBottomRef} />
                </div>

                <div className="transcription-status-footer">
                  <div className="live-status-dot">
                    <span className="green-dot"></span>
                    <span>Transcription is live</span>
                  </div>
                </div>

                {/* DIRECT ANSWER INPUT FORM */}
                <form className="transcript-input-form" onSubmit={handleSendAnswer}>
                  <input
                    type="text"
                    placeholder="Type or dictate your response..."
                    value={customAnswer}
                    onChange={(e) => setCustomAnswer(e.target.value)}
                    className="transcript-text-input"
                  />
                  <button type="submit" className="send-answer-btn" title="Submit response">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                </form>
              </div>
            ) : (
              /* TAB CONTENT: INTERVIEW NOTES */
              <div className="notes-tab-content">
                <div className="notes-editor-header">
                  <h5 className="notes-title">Personal Interview Notes</h5>
                  <span className="notes-hint">Saved locally</span>
                </div>
                <textarea
                  className="notes-textarea"
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  placeholder="Take scratchpad notes during the interview..."
                />
              </div>
            )}

            {/* CARD 3: FINAL INTERVIEW SCORE */}
            <div className="final-score-card">
              <div className="card-header-bar">
                <h4 className="card-title">Final Interview Score</h4>
              </div>

              <div className="score-main-flex">
                {/* DONUT CIRCLE CHART */}
                <div className="donut-circle-wrapper">
                  <svg className="donut-svg" viewBox="0 0 100 100">
                    <circle className="donut-bg-track" cx="50" cy="50" r="40" />
                    <circle
                      className="donut-fill-ring"
                      cx="50"
                      cy="50"
                      r="40"
                      strokeDasharray="251.2"
                      strokeDashoffset={251.2 - (251.2 * currentQ.scores.total) / 100}
                    />
                  </svg>
                  <div className="donut-center-text">
                    <span className="score-big-num">{currentQ.scores.total}</span>
                    <span className="score-denom">/100</span>
                  </div>
                </div>

                {/* BREAKDOWN METRICS LIST */}
                <div className="score-breakdown-list">
                  <div className="score-item">
                    <span className="item-dot">📊</span>
                    <span className="item-label">Grammar</span>
                    <span className="item-score">{currentQ.scores.grammar}</span>
                  </div>

                  <div className="score-item">
                    <span className="item-dot">💡</span>
                    <span className="item-label">Right Answers</span>
                    <span className="item-score">{currentQ.scores.answers}</span>
                  </div>

                  <div className="score-item">
                    <span className="item-dot">🗣️</span>
                    <span className="item-label">Communication</span>
                    <span className="item-score">{currentQ.scores.comm}</span>
                  </div>

                  <div className="score-item">
                    <span className="item-dot">🎙️</span>
                    <span className="item-label">Voice & Confidence</span>
                    <span className="item-score">{currentQ.scores.voice}</span>
                  </div>

                  <div className="score-total-row">
                    <span className="total-label">Total Score</span>
                    <span className="total-val">{currentQ.scores.total}/100</span>
                  </div>
                </div>
              </div>

              {/* SUCCESS BANNER ALERT BOX */}
              <div className="performance-alert-banner">
                <div className="alert-medal-icon">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2">
                    <circle cx="12" cy="8" r="7" />
                    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                  </svg>
                </div>
                <div className="alert-text-block">
                  <strong className="alert-title font-bold">Excellent Performance!</strong>
                  <p className="alert-sub">You have performed well in this interview.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* END INTERVIEW SUMMARY MODAL */}
        {showEndModal && (
          <div className="modal-backdrop-overlay">
            <div className="end-interview-modal">
              <div className="modal-header">
                <h3>Interview Session Summary</h3>
                <button className="modal-close-x" onClick={() => setShowEndModal(false)}>
                  ×
                </button>
              </div>

              <div className="modal-body-content">
                <div className="summary-score-hero">
                  <div className="summary-badge">86%</div>
                  <div>
                    <h4>Great Job, Candidate!</h4>
                    <p>Your HR Mock Interview evaluation has been completed.</p>
                  </div>
                </div>

                <div className="summary-details-grid">
                  <div className="s-box">
                    <span>Duration</span>
                    <strong>{formatTimer(secondsElapsed)}</strong>
                  </div>
                  <div className="s-box">
                    <span>Questions Attempted</span>
                    <strong>8 / 8</strong>
                  </div>
                  <div className="s-box">
                    <span>Grammar Rating</span>
                    <strong>Good (18/20)</strong>
                  </div>
                  <div className="s-box">
                    <span>Confidence Score</span>
                    <strong>High (16/20)</strong>
                  </div>
                </div>
              </div>

              <div className="modal-footer-actions">
                <button
                  className="modal-btn secondary-btn"
                  onClick={() => setShowEndModal(false)}
                >
                  Resume Interview
                </button>
                <button
                  className="modal-btn primary-btn"
                  onClick={() => navigate("/student/dashboard")}
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
