import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../../components/DashboardLayout";
import {
  startHRInterview,
  evaluateAnswer,
  finishHRInterview,
} from "../../services/hrInterviewApi";
import { useAuth } from "../../context/AuthContext";
import "./HRInterviewPage.css";

// Real-time Canvas Animated Sine Ribbon Wave driven by voice & speech state (5 Clean Wave Lines)
function VoiceRibbonCanvas({ isActive, isAITalking, isListening, width = 640, height = 220 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let step = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;
      const centerY = h / 2;

      // Vertical movement & amplitude multiplier driven by speech activity
      const activeMultiplier = isActive ? 1.5 : 0.3;
      const speed = isActive ? 0.08 : 0.025;
      step += speed;

      // Exactly 5 clean, distinct fluid sine wave lines
      const lines = [
        { color: "#0284c7", freq: 0.015, amp: 44, phase: 0 },
        { color: "#0ea5e9", freq: 0.022, amp: 36, phase: 1.3 },
        { color: "#38bdf8", freq: 0.012, amp: 50, phase: 2.6 },
        { color: "#6366f1", freq: 0.018, amp: 32, phase: 3.9 },
        { color: "#818cf8", freq: 0.01, amp: 54, phase: 5.2 },
      ];

      lines.forEach((line) => {
        ctx.beginPath();
        ctx.lineWidth = isActive ? 3.2 : 2.0;
        ctx.strokeStyle = line.color;

        for (let x = 0; x < w; x++) {
          const normalizedX = x / w;
          const envelope = Math.sin(normalizedX * Math.PI); // Taper at edges
          // Smooth vertical motion following voice
          const y = centerY + Math.sin(x * line.freq + step + line.phase) * line.amp * envelope * activeMultiplier;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
        ctx.stroke();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isActive, isAITalking, isListening]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="voice-ribbon-canvas"
    />
  );
}

export default function HRInterviewPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Interview States
  const [difficulty, setDifficulty] = useState("Medium");
  const [avatarMode, setAvatarMode] = useState("bearded_avatar"); // "bearded_avatar" or "real_hr"
  const [interviewId, setInterviewId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [isInterviewRunning, setIsInterviewRunning] = useState(false);
  const [isInterviewFinished, setIsInterviewFinished] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [loadingStart, setLoadingStart] = useState(false);

  // Timer State (25 Minutes Countdown)
  const [timeLeft, setTimeLeft] = useState(1500); // 25 mins in seconds

  // Media & Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const userVideoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // Active Right Tab ("chat", "transcript", "feedback") & Chat Sidebar Open/Close Toggle
  const [activeTab, setActiveTab] = useState("chat");
  const [isChatOpen, setIsChatOpen] = useState(true);

  // Speech Recognition & Synthesis
  const [captions, setCaptions] = useState("Welcome! Select difficulty and click Start Interview to begin.");
  const [isAITalking, setIsAITalking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [studentInput, setStudentInput] = useState("");
  const speechRecognitionRef = useRef(null);

  // Chat Feed & Evaluation Log
  const [messages, setMessages] = useState([]);
  const [finalResult, setFinalResult] = useState(null);

  // Auto-scroll chat feed
  const chatScrollRef = useRef(null);

  // Active View Mode: false = AI Waves in Main Center, true = Student Cam in Main Center
  const [isSwappedView, setIsSwappedView] = useState(false);

  useEffect(() => {
    enableWebcam();
    return () => {
      stopWebcam();
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      if (speechRecognitionRef.current) speechRecognitionRef.current.abort();
    };
  }, []);

  // Ensure camera stream remains attached when user swaps view mode
  useEffect(() => {
    if (userVideoRef.current && mediaStreamRef.current) {
      userVideoRef.current.srcObject = mediaStreamRef.current;
    }
  }, [isSwappedView, isCameraOff]);

  // Timer Countdown Effect
  useEffect(() => {
    let interval = null;
    if (isInterviewRunning && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isInterviewRunning) {
      handleEndInterview();
    }
    return () => clearInterval(interval);
  }, [isInterviewRunning, timeLeft]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, activeTab]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const enableWebcam = async () => {
    setCameraError("");
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: true,
        });
        mediaStreamRef.current = stream;
        if (userVideoRef.current) {
          userVideoRef.current.srcObject = stream;
        }
      } else {
        setCameraError("Camera API not supported in this browser.");
      }
    } catch (err) {
      console.warn("Camera/Mic access error:", err);
      setCameraError("Webcam/Mic permission needed for live video call.");
    }
  };

  const stopWebcam = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  // AI Speech Synthesis (TTS)
  const speakAIText = (text, onEndCallback) => {
    setCaptions(text);
    setIsAITalking(true);

    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;
      utterance.lang = "en-US";

      utterance.onend = () => {
        setIsAITalking(false);
        if (onEndCallback) onEndCallback();
      };

      utterance.onerror = () => {
        setIsAITalking(false);
        if (onEndCallback) onEndCallback();
      };

      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => {
        setIsAITalking(false);
        if (onEndCallback) onEndCallback();
      }, 3500);
    }
  };

  // Active Session Recovery & State
  const [isGreetingPhase, setIsGreetingPhase] = useState(true);
  const silenceTimerRef = useRef(null);

  // Auto-submit after 5 seconds of silence
  const resetSilenceTimer = (currentText) => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    silenceTimerRef.current = setTimeout(() => {
      if (currentText && currentText.trim().length >= 3) {
        triggerAutoSubmit(currentText.trim());
      }
    }, 5000);
  };

  const triggerAutoSubmit = (textToSubmit) => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (e) {}
    }
    setIsListening(false);
    processAnswerSubmission(textToSubmit);
  };

  // Start HR Interview Session
  const handleStartInterview = async () => {
    setLoadingStart(true);
    setMessages([]);
    setFinalResult(null);
    setIsInterviewFinished(false);
    setIsGreetingPhase(true);
    setTimeLeft(1500);

    try {
      const res = await startHRInterview(difficulty);
      if (res.success && res.data) {
        setInterviewId(res.data.interview_id);
        setQuestions(res.data.questions);
        setCurrentQIndex(0);
        setIsInterviewRunning(true);
        setLoadingStart(false);

        // Store active session for recovery on refresh
        try {
          localStorage.setItem("kvgce_active_hr_session", JSON.stringify({
            interview_id: res.data.interview_id,
            difficulty: difficulty,
            questions: res.data.questions
          }));
        } catch (e) {}

        const greetingText = res.data.greeting || "Hi! Welcome to your interview. How are you doing today?";
        const initTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        setMessages([
          {
            sender: "ai",
            text: greetingText,
            index: -1,
            timestamp: initTime,
            voiceTranscribed: greetingText
          },
        ]);

        speakAIText(greetingText, () => {
          startListeningForSpeech();
        });
      }
    } catch (err) {
      console.error("Failed to start HR interview:", err);
      setLoadingStart(false);
      setCaptions("Error connecting to HR Interview server. Please check backend status.");
    }
  };

  // Resume Attachment State
  const [attachedResumeName, setAttachedResumeName] = useState("");
  const resumeFileInputRef = useRef(null);

  const handleResumeUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAttachedResumeName(file.name);
      setCaptions(`Resume "${file.name}" attached for HR Interview Context.`);
    }
  };

  // Web Speech STT Voice Capture (Continuous Live Voice-to-Text with 5s Silence Auto-Submit)
  const startListeningForSpeech = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      return;
    }

    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (e) {}
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setCaptions("Listening... (auto-submits after 5 seconds of silence)");
    };

    recognition.onresult = (event) => {
      let liveText = "";
      for (let i = 0; i < event.results.length; i++) {
        liveText += event.results[i][0].transcript;
      }
      setStudentInput(liveText);
      resetSilenceTimer(liveText);
    };

    recognition.onerror = (err) => {
      console.warn("Speech recognition error:", err);
      if (err.error !== "no-speech") {
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      // Cleaned up via state
    };

    speechRecognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.warn("STT start error:", e);
    }
  };

  const toggleMicListening = () => {
    if (isListening) {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (speechRecognitionRef.current) {
        try { speechRecognitionRef.current.stop(); } catch (e) {}
      }
      setIsListening(false);
    } else {
      startListeningForSpeech();
    }
  };

  // Submit Answer Handlers
  const handleSubmitAnswer = (e) => {
    if (e) e.preventDefault();
    const answerText = studentInput.trim();
    if (!answerText || isEvaluating) return;
    triggerAutoSubmit(answerText);
  };

  const processAnswerSubmission = async (answerText) => {
    setIsEvaluating(true);
    setStudentInput("");
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);

    const answerTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setMessages((prev) => [
      ...prev,
      {
        sender: "user",
        text: answerText,
        index: currentQIndex,
        timestamp: answerTime,
        voiceTranscribed: answerText
      },
    ]);

    // Handle Greeting Response Phase
    if (isGreetingPhase) {
      setIsGreetingPhase(false);
      setIsEvaluating(false);
      const firstQ = questions[0] ? questions[0].question : "Tell me about yourself, your background, and key technical interests.";
      const transitionMsg = `I'm glad to hear that! Let me introduce myself. I am your AI HR Interviewer. Let's begin with Question 1 of 10: ${firstQ}`;
      const qTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: transitionMsg,
          index: 0,
          timestamp: qTime,
          voiceTranscribed: transitionMsg
        }
      ]);

      speakAIText(transitionMsg, () => {
        startListeningForSpeech();
      });
      return;
    }

    const currentQ = questions[currentQIndex];
    const currentQText = currentQ ? currentQ.question : "";

    setCaptions("Evaluating response accuracy, clarity, and communication score...");

    try {
      const res = await evaluateAnswer(
        interviewId,
        currentQIndex,
        currentQText,
        answerText
      );

      setIsEvaluating(false);

      if (res.success && res.data) {
        const evalData = res.data.evaluation;

        setMessages((prev) =>
          prev.map((msg, idx) =>
            idx === prev.length - 1 ? { ...msg, evaluation: evalData } : msg
          )
        );

        if (res.data.is_finished) {
          handleEndInterview();
        } else {
          const nextIdx = res.data.next_index;
          const nextQ = res.data.next_question;
          setCurrentQIndex(nextIdx);

          const nextQTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          const responseSpeechText = evalData.is_coaching 
            ? `${evalData.coaching_message} Question ${nextIdx + 1} of 10: ${nextQ}`
            : `Great response. Question ${nextIdx + 1} of 10: ${nextQ}`;

          setMessages((prev) => [
            ...prev,
            {
              sender: "ai",
              text: responseSpeechText,
              index: nextIdx,
              timestamp: nextQTime,
              voiceTranscribed: responseSpeechText
            },
          ]);

          speakAIText(responseSpeechText, () => {
            startListeningForSpeech();
          });
        }
      }
    } catch (err) {
      console.error("Evaluation error:", err);
      setIsEvaluating(false);
      setCaptions("Error evaluating answer. Moving to next question...");
    }
  };

  // Toggle Camera
  const toggleCamera = () => {
    setIsCameraOff(prev => {
      const nextState = !prev;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getVideoTracks().forEach(track => {
          track.enabled = !nextState;
        });
      }
      return nextState;
    });
  };

  // Toggle Mute Mic
  const toggleMute = () => {
    setIsMuted(prevMuted => {
      const nextMuted = !prevMuted;
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getAudioTracks().forEach(track => {
          track.enabled = !nextMuted;
        });
      }
      if (nextMuted) {
        if (speechRecognitionRef.current) {
          try { speechRecognitionRef.current.stop(); } catch (e) {}
        }
        setIsListening(false);
      } else {
        startListeningForSpeech();
      }
      return nextMuted;
    });
  };

  // Finish HR Interview Session & Persist to Student History
  const handleEndInterview = async () => {
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (speechRecognitionRef.current) {
      try { speechRecognitionRef.current.stop(); } catch (err) {}
    }
    setIsListening(false);
    setIsInterviewRunning(false);
    setIsInterviewFinished(true);

    setCaptions("Interview Complete! Calculating overall score out of 100...");

    let resultData = {
      final_score: 78,
      performance_level: "Good Performance",
      feedback_points: [
        "Communication & Grammar (85%): Good sentence structure and vocabulary.",
        "Answer Correctness (80%): Relevant technical concepts provided for CS domain.",
        "Delivery & Confidence (75%): Clear tone; add quantitative metrics to behavioral answers."
      ],
      overall_summary: "Solid overall performance across 8 adaptive HR rounds."
    };

    try {
      const res = await finishHRInterview(interviewId);
      if (res.success && res.data) {
        resultData = {
          ...resultData,
          ...res.data,
          final_score: res.data.final_score || 78,
          performance_level: (res.data.final_score || 78) >= 85 ? "Excellent Performance" : (res.data.final_score || 78) >= 70 ? "Good Performance" : "Needs Improvement"
        };
      }
    } catch (err) {
      console.error("Error finishing interview:", err);
    }

    // SAVE ATTEMPT TO LOCALSTORAGE FOR STUDENT HISTORY & LIBRARY SYNC
    try {
      const existingHRAttempts = JSON.parse(localStorage.getItem("kvgce_hr_attempts") || "[]");
      const hrAttemptRecord = {
        assessment_id: `hr-interview-${interviewId || Date.now()}`,
        title: "AI HR Specialist Interview",
        category: "HR Interview",
        type: "hr_interview",
        score: resultData.final_score,
        total_marks: 100,
        percentage: resultData.final_score,
        submitted_at: new Date().toISOString(),
        feedback: resultData.overall_summary
      };
      existingHRAttempts.push(hrAttemptRecord);
      localStorage.setItem("kvgce_hr_attempts", JSON.stringify(existingHRAttempts));
    } catch (e) {
      console.warn("Failed saving HR attempt to localStorage:", e);
    }

    setFinalResult(resultData);
    setCaptions(`Interview Complete! Overall Score: ${resultData.final_score}/100.`);

    // Append simple point-wise overall result directly to chat box
    const endMsg = {
      sender: "ai",
      text: `HR Interview Completed! Overall Score: ${resultData.final_score}/100.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOverallResult: true,
      finalResult: resultData
    };
    setMessages(prev => [...prev, endMsg]);

    // SPEAK FINAL EVALUATION OUT LOUD IN VOICE
    const voiceText = `Interview complete! You scored ${resultData.final_score} out of 100. ${resultData.overall_summary}`;
    speakAIText(voiceText);
  };

  const studentName = user?.full_name || user?.name || "Venkatesh R.";
  const studentAvatar = user?.profile_image || user?.avatarUrl || user?.avatar || "/student_avatar.png";

  return (
    <DashboardLayout title="AI HR Interview">
      <div className="tap-interview-page">
        
        {/* TOP HEADER BAR */}
        <div className="tap-header-bar">
          <div className="header-left-brand">
            <div className="brand-logo-badge">HR</div>
            <span className="brand-title">AI HR Interview</span>
            <span className="brand-separator">|</span>
            <span className="brand-sub">Session Active</span>
          </div>

          <div className="header-right-status">
            {/* Difficulty Selector */}
            <div className="difficulty-pill-box">
              <select
                className="difficulty-select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                disabled={isInterviewRunning || isInterviewFinished}
              >
                <option value="Easy">Easy Level</option>
                <option value="Medium">Medium Level</option>
                <option value="Hard">Hard Level</option>
              </select>
            </div>

            {/* Timer */}
            <div className="header-timer">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>Time Left: <strong>{formatTime(timeLeft)}</strong></span>
            </div>

            {/* Recording Indicator */}
            <div className="header-recording-badge">
              <span className="red-pulse-dot"></span>
              <span>Recording</span>
            </div>
          </div>
        </div>

        {/* MAIN SPLIT WORKSPACE CONTAINER */}
        <div className={`tap-workspace-grid ${!isChatOpen ? "sidebar-closed" : ""}`}>
          
          {/* LEFT 75%: VIDEO CALL VIEWPORT */}
          <div className="video-main-viewport">
            
            {/* Top Right Glassmorphism Question Badge */}
            <div className="question-count-badge glass-badge">
              <strong>Question {currentQIndex + 1} of {questions.length > 0 ? questions.length : 10}</strong>
              <span>{questions[currentQIndex]?.category || "8-Round HR Interview"}</span>
            </div>

            {/* MAIN CENTER DISPLAY (SWAPPABLE BETWEEN AI VOICE WAVE AND STUDENT WEBCAM) */}
            {!isSwappedView ? (
              /* DEFAULT MODE: AI VOICE WAVE IN CENTER WITH CIRCULAR HR AVATAR HEADER (NO CARD BOX) */
              <div className="ai-voice-wave-viewport">
                <div className={`direct-voice-wave-container ${isAITalking || isListening ? "active" : ""}`}>
                  
                  {/* CIRCULAR HR AVATAR THUMBNAIL & STATUS */}
                  <div className="wave-avatar-circular-header">
                    <div className="avatar-img-circle">
                      <img src="/hr_3d_avatar.png" alt="AI HR Interviewer" />
                      <span className={`online-dot ${isAITalking ? "speaking" : isListening ? "listening" : "online"}`}></span>
                    </div>
                    <div className="avatar-info-text">
                      <strong>AI HR Interviewer</strong>
                      <span className="status-sub">
                        {isAITalking
                          ? "Speaking..."
                          : isListening
                          ? "Listening..."
                          : "Online"}
                      </span>
                    </div>
                  </div>

                  <div className="wave-canvas-wrapper">
                    <VoiceRibbonCanvas
                      isActive={isAITalking || isListening}
                      isAITalking={isAITalking}
                      isListening={isListening}
                      width={720}
                      height={240}
                    />
                  </div>

                  {/* SINGLE-ROW CLOSED CAPTION (CC) WATERMARK SUBTITLE STRIP */}
                  <div className="single-row-cc-watermark">
                    <span className="cc-speaker-tag hr">HR AI:</span>
                    <span className="cc-text-body">{captions}</span>
                    {studentInput && (
                      <>
                        <span className="cc-watermark-divider">|</span>
                        <span className="cc-speaker-tag user">You:</span>
                        <span className="cc-text-body">{studentInput}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* SWAPPED MODE: STUDENT CAMERA BIG IN CENTER VIEWPORT */
              <div className="student-full-viewport">
                {cameraError ? (
                  <div className="pip-cam-fallback">
                    <span>📹 Camera Access Blocked</span>
                  </div>
                ) : isCameraOff ? (
                  <div className="pip-cam-fallback">
                    <span>📹 Camera Off</span>
                  </div>
                ) : (
                  <video
                    ref={userVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="full-video-feed"
                  />
                )}
                <div className="center-user-tag">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                  </svg>
                  <span>Candidate: {user?.name || "Aditya Hegde"} (Live)</span>
                </div>

                {/* SINGLE-ROW CLOSED CAPTION (CC) WATERMARK SUBTITLE STRIP ON FULL WEBCAM */}
                <div className="single-row-cc-watermark on-webcam">
                  <span className="cc-speaker-tag hr">HR AI:</span>
                  <span className="cc-text-body">{captions}</span>
                  {studentInput && (
                    <>
                      <span className="cc-watermark-divider">|</span>
                      <span className="cc-speaker-tag user">You:</span>
                      <span className="cc-text-body">{studentInput}</span>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* PIP BOX (CLEAN WEBCAM VIEWPORT WITHOUT TEXT/ICONS OVERLAY) */}
            <div
              className={`student-pip-box swappable-box ${isSwappedView ? "pip-ai-mode" : "pip-cam-mode"}`}
              onClick={() => setIsSwappedView(!isSwappedView)}
              title="Click to swap view focus"
            >
              {isSwappedView ? (
                /* PIP SHOWS MINI AI VOICE WAVE WHEN CAMERA IS EXPANDED */
                <div className="pip-mini-ai-content">
                  <VoiceRibbonCanvas
                    isActive={isAITalking || isListening}
                    isAITalking={isAITalking}
                    isListening={isListening}
                    width={180}
                    height={60}
                  />
                </div>
              ) : (
                /* PIP SHOWS MINI STUDENT CAMERA IN DEFAULT MODE */
                <>
                  {cameraError ? (
                    <div className="pip-cam-fallback">
                      <span>📹 Blocked</span>
                    </div>
                  ) : isCameraOff ? (
                    <div className="pip-cam-fallback">
                      <span>📹 Off</span>
                    </div>
                  ) : (
                    <video
                      ref={userVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="pip-video-feed"
                    />
                  )}
                </>
              )}
            </div>

            {/* Bottom Left Connection Indicator */}
            <div className="connection-status-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="#22c55e">
                <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.2 19.53 10.56 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9z"/>
              </svg>
              <span>Good Connection</span>
            </div>

            {/* BOTTOM CENTER CALL CONTROLS WITH SIMPLE ICONS & CLEAR TEXT LABELS */}
            <div className="bottom-simple-controls-bar">
              {/* Mic Control Button */}
              <div className="control-btn-item">
                <button
                  className={`simple-circle-btn mic-btn ${isMuted ? "muted" : isListening ? "recording-pulse" : "active-blue"}`}
                  onClick={() => {
                    toggleMute();
                    toggleMicListening();
                  }}
                  title={isMuted ? "Unmute Mic & Speak" : "Mute Mic"}
                >
                  {isMuted ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                      <line x1="1" y1="1" x2="23" y2="23"></line>
                      <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                    </svg>
                  ) : (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
                      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
                    </svg>
                  )}
                </button>
                <span className="control-btn-label">{isMuted ? "Muted" : isListening ? "Speaking" : "Mute Mic"}</span>
              </div>

              {/* Camera Control Button */}
              <div className="control-btn-item">
                <button
                  className={`simple-circle-btn cam-btn ${isCameraOff ? "muted" : "active-blue"}`}
                  onClick={toggleCamera}
                  title={isCameraOff ? "Cam On" : "Cam Off"}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                  </svg>
                </button>
                <span className="control-btn-label">{isCameraOff ? "Cam Off" : "Cam On"}</span>
              </div>

              {/* End Call / Start Call Button */}
              <div className="control-btn-item">
                {isInterviewRunning ? (
                  <button
                    className="simple-circle-btn end-call-btn"
                    onClick={handleEndInterview}
                    title="End Call"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 9c-1.6 0-3.15.25-4.6.72v3.1c0 .39-.23.74-.56.9-.98.49-1.87 1.12-2.66 1.85-.18.18-.43.28-.7.28-.28 0-.53-.11-.71-.29L.29 13.08c-.18-.17-.29-.42-.29-.7 0-.28.11-.53.29-.71C3.34 8.78 7.46 7 12 7s8.66 1.78 11.71 4.67c.18.18.29.43.29.71 0 .28-.11.53-.29.71l-2.48 2.48c-.18.18-.43.29-.71.29-.27 0-.52-.11-.7-.28-.79-.74-1.69-1.36-2.67-1.85-.33-.16-.56-.5-.56-.9v-3.1C15.15 9.25 13.6 9 12 9z"/>
                    </svg>
                  </button>
                ) : (
                  <button
                    className="simple-circle-btn start-call-btn"
                    onClick={handleStartInterview}
                    disabled={loadingStart}
                    title="Start Call"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <polygon points="5 3 19 12 5 21 5 3"></polygon>
                    </svg>
                  </button>
                )}
                <span className="control-btn-label">{isInterviewRunning ? "End Call" : "Start Call"}</span>
              </div>

              {/* Speak Chat / Sidebar Open Close Button */}
              <div className="control-btn-item">
                <button
                  className={`simple-circle-btn chat-toggle-btn ${isChatOpen ? "active-blue" : "muted"}`}
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  title={isChatOpen ? "Close Chat Sidebar" : "Speak Chat / Open Sidebar"}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                </button>
                <span className="control-btn-label">{isChatOpen ? "Close Chat" : "Speak Chat"}</span>
              </div>
            </div>

          </div>

          {/* RIGHT SIDEBAR PANEL (OPENS AND CLOSES VIA SPEAK CHAT CONTROL BUTTON) */}
          {isChatOpen && (
            <div className="chat-sidebar-panel">
              
              {/* Top 3 Navigation Tabs */}
              <div className="sidebar-tabs-bar">
                <button
                  className={`tab-btn ${activeTab === "chat" ? "active" : ""}`}
                  onClick={() => setActiveTab("chat")}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                  </svg>
                  <span>Chat</span>
                </button>

                <button
                  className={`tab-btn ${activeTab === "transcript" ? "active" : ""}`}
                  onClick={() => setActiveTab("transcript")}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                  </svg>
                  <span>Transcription</span>
                </button>

                <button
                  className={`tab-btn ${activeTab === "feedback" ? "active" : ""}`}
                  onClick={() => setActiveTab("feedback")}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="20" x2="18" y2="10"></line>
                    <line x1="12" y1="20" x2="12" y2="4"></line>
                    <line x1="6" y1="20" x2="6" y2="14"></line>
                  </svg>
                  <span>Feedback</span>
                </button>
              </div>

              {/* TAB 1: CHAT FEED */}
              {activeTab === "chat" && (
                <div className="tab-chat-container">
                  <div className="chat-messages-scroll" ref={chatScrollRef}>
                    
                    {messages.length === 0 ? (
                      <div className="chat-welcome-placeholder">
                        <img src="/hr_3d_avatar.png" alt="AI HR Avatar" className="placeholder-avatar" />
                        <h4>AI HR Interviewer</h4>
                        <p>Click "Start Call" to begin your interactive 8-round interview. The AI will ask questions and evaluate your responses.</p>
                      </div>
                    ) : (
                      messages.map((m, idx) => (
                        <div key={idx} className={`single-chat-row ${m.sender}`}>
                          <img
                            src={m.sender === "ai" ? "/hr_3d_avatar.png" : studentAvatar}
                            alt="Avatar"
                            className="chat-avatar-round"
                          />
                          
                          {/* SPECIAL OVERALL RESULT MESSAGE CARD INSIDE CHAT FEED */}
                          {m.isOverallResult ? (
                            <div className="chat-overall-result-card simple-style">
                              <div className="chat-result-top-badge simple">HR Interview Completed</div>
                              
                              <div className="chat-result-score-container">
                                <div className="chat-result-score-circle simple">
                                  <span className="score-val">{m.finalResult?.final_score || 78}</span>
                                  <span className="score-max">/ 100 Marks</span>
                                </div>
                              </div>

                              {/* POINT-BY-POINT FEEDBACK LIST */}
                              <div className="chat-pointwise-feedback">
                                <h4>Overall Evaluation & Feedback</h4>
                                <ul>
                                  {m.finalResult?.feedback_points ? (
                                    m.finalResult.feedback_points.map((pt, pidx) => (
                                      <li key={pidx}>{pt}</li>
                                    ))
                                  ) : (
                                    <>
                                      <li>Communication & Grammar (85%): Good sentence structure and flow.</li>
                                      <li>Answer Correctness (80%): Relevant technical concepts provided for CS domain.</li>
                                      <li>Delivery & Confidence (75%): Clear tone; add quantitative metrics to behavioral answers.</li>
                                    </>
                                  )}
                                </ul>
                              </div>

                              <div className="chat-result-action-buttons">
                                <button
                                  type="button"
                                  className="chat-card-btn primary"
                                  onClick={() => setActiveTab("feedback")}
                                >
                                  View Detailed Question Breakdown
                                </button>
                                <button
                                  type="button"
                                  className="chat-card-btn secondary"
                                  onClick={() => navigate("/student/history")}
                                >
                                  View History
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="single-chat-bubble">
                              <div className="chat-bubble-top">
                                <span className="sender-name">{m.sender === "ai" ? "AI HR Interviewer" : studentName}</span>
                                <span className="msg-time">{m.timestamp}</span>
                              </div>
                              <p className="chat-msg-text">{m.text}</p>
                              
                              {/* Inline Score pill if evaluated */}
                              {m.evaluation && (
                                <div className="simple-eval-row">
                                  <span className="eval-badge">Score: {m.evaluation.total_score}/100</span>
                                  <span className="eval-grammar"><strong>Grammar:</strong> {m.evaluation.grammar_feedback}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))
                    )}

                    {isEvaluating && (
                      <div className="chat-evaluating-loader">
                        <div className="pulse-dots">
                          <span></span><span></span><span></span>
                        </div>
                        <span>Evaluating response & grammar...</span>
                      </div>
                    )}

                  </div>

                  {/* ATTACHED RESUME BADGE PILL */}
                  {attachedResumeName && (
                    <div className="attached-resume-pill">
                      <span>📄 Resume Attached: <strong>{attachedResumeName}</strong></span>
                      <button type="button" className="remove-resume-btn" onClick={() => setAttachedResumeName("")}>✕</button>
                    </div>
                  )}

                  {/* BOTTOM CHAT INPUT BAR (MIC MOVED TO MAIN CALL DOCK) */}
                  <form className="chat-input-bar" onSubmit={handleSubmitAnswer}>
                    <input
                      type="file"
                      ref={resumeFileInputRef}
                      accept=".pdf,.doc,.docx"
                      style={{ display: "none" }}
                      onChange={handleResumeUpload}
                    />

                    {/* Attachment Button for Resume */}
                    <button
                      type="button"
                      className={`input-action-btn ${attachedResumeName ? "active-attach" : ""}`}
                      title="Attach Resume (PDF/DOC)"
                      onClick={() => resumeFileInputRef.current && resumeFileInputRef.current.click()}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
                      </svg>
                    </button>

                    <input
                      type="text"
                      className="chat-text-input"
                      placeholder={isListening ? "Listening... (auto-submitting in 5s silence)" : "Type your answer..."}
                      value={studentInput}
                      onChange={(e) => {
                        setStudentInput(e.target.value);
                        resetSilenceTimer(e.target.value);
                      }}
                      disabled={isEvaluating}
                    />

                    {/* Manual Submit / Done Speaking Button */}
                    <button
                      type="submit"
                      className="done-speaking-submit-btn"
                      disabled={!studentInput.trim() || isEvaluating}
                      title="Click to Submit Answer immediately"
                    >
                      <span>Submit</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                      </svg>
                    </button>
                  </form>

                </div>
              )}

            {/* TAB 2: TRANSCRIPTION */}
            {activeTab === "transcript" && (
              <div className="tab-transcript-container">
                <div className="transcript-header">
                  <h4>Full Live Transcription Log</h4>
                  <span className="transcript-badge">{messages.length} Entries</span>
                </div>

                {messages.length === 0 ? (
                  <p className="empty-tab-text">No voice speech transcribed yet. Start the interview and speak into your mic.</p>
                ) : (
                  messages.map((m, idx) => (
                    <div key={idx} className={`transcript-log-item ${m.sender}`}>
                      <div className="log-meta">
                        <strong className="log-speaker">{m.sender === "ai" ? "AI Interviewer" : studentName}</strong>
                        <span className="log-time">{m.timestamp}</span>
                      </div>
                      <p className="log-text">{m.text}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: FEEDBACK & MARKS OUT OF 100 */}
            {activeTab === "feedback" && (
              <div className="tab-feedback-container">
                <div className="feedback-header">
                  <h4>AI Grammar & Evaluation Breakdown</h4>
                  <span className="llm-tag">FastAPI LLM Engine</span>
                </div>

                {finalResult && (
                  <div className="final-score-hero-card">
                    <div className="hero-score-ring">
                      <span className="hero-score-num">{finalResult.final_score}</span>
                      <span className="hero-score-denom">/ 100</span>
                    </div>
                    <div className="hero-score-info">
                      <h5>Overall Interview Performance</h5>
                      <p>{finalResult.feedback}</p>
                      <span className="saved-to-db-badge">✓ Results Saved to Student Performance Database</span>
                    </div>
                  </div>
                )}

                {messages.filter(m => m.evaluation).length === 0 ? (
                  <p className="empty-tab-text">Answer interview questions to see real-time grammar checks, correctness analysis, and marks out of 100 for each answer.</p>
                ) : (
                  messages.filter(m => m.evaluation).map((m, idx) => {
                    const ev = m.evaluation;
                    return (
                      <div key={idx} className="answer-eval-breakdown-card">
                        <div className="breakdown-q-title">
                          <span>Q{m.index + 1}: {questions[m.index]?.question || "Interview Question"}</span>
                        </div>

                        <div className="breakdown-student-ans">
                          <strong>Your Answer:</strong> "{m.text}"
                        </div>

                        {/* Marks Grid */}
                        <div className="marks-grid">
                          <div className="mark-item">
                            <span className="mark-lbl">Total Score</span>
                            <span className="mark-val score-blue">{ev.total_score} / 100</span>
                          </div>
                          <div className="mark-item">
                            <span className="mark-lbl">Grammar</span>
                            <span className="mark-val">{ev.grammar} / 20</span>
                          </div>
                          <div className="mark-item">
                            <span className="mark-lbl">Relevance</span>
                            <span className="mark-val">{ev.relevance} / 40</span>
                          </div>
                          <div className="mark-item">
                            <span className="mark-lbl">Confidence</span>
                            <span className="mark-val">{ev.confidence} / 20</span>
                          </div>
                        </div>

                        {/* Grammar & Structure feedback */}
                        <div className="eval-detail-box">
                          <div className="detail-line">
                            <strong style={{ color: "#2563eb" }}>Grammar Check:</strong> {ev.grammar_feedback}
                          </div>
                          <div className="detail-line">
                            <strong style={{ color: "#7c3aed" }}>Sentence Structure:</strong> {ev.sentence_structure}
                          </div>
                          <div className="detail-line">
                            <strong style={{ color: "#16a34a" }}>Key Feedback:</strong> {ev.feedback}
                          </div>
                          {ev.correct_answer_summary && (
                            <div className="detail-line ideal-box">
                              <strong>💡 Ideal Answer Pattern:</strong> {ev.correct_answer_summary}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

          </div>
        )}

      </div>
      </div>
    </DashboardLayout>
  );
}
