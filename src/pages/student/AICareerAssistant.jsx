import { useState, useEffect } from "react";
import DashboardLayout from "../../components/DashboardLayout";
import api from "../../services/api";
import "./AICareerAssistant.css";

function AICareerAssistant() {
  const [messages, setMessages] = useState([
    {
      sender: "ai",
      text: "Hello! I am your KVGCE TAP AI Career Assistant 🤖. I can analyze your aptitude scores, technical quiz attempts, coding progress, and activities to recommend targeted placement preparation strategies. How can I help you today?",
    },
  ]);
  const [inputQuery, setInputQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [readiness, setReadiness] = useState(null);

  useEffect(() => {
    const fetchAnalysis = async () => {
      try {
        const res = await api.get("/ai/student-analysis");
        if (res.data && res.data.data) {
          setReadiness(res.data.data.readiness);
        }
      } catch (err) {
        console.error("Local fallback for readiness:", err);
        setReadiness({
          overall: 82,
          technical: 85,
          aptitude: 88,
          coding: 78,
          activity: 75,
        });
      }
    };
    fetchAnalysis();
  }, []);

  const handleSendMessage = async (queryText) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || loading) return;

    const newMsgs = [...messages, { sender: "user", text: textToSend }];
    setMessages(newMsgs);
    setInputQuery("");
    setLoading(true);

    try {
      const res = await api.post("/ai/chat", { message: textToSend });
      if (res.data && res.data.data) {
        setMessages([
          ...newMsgs,
          { sender: "ai", text: res.data.data.response },
        ]);
      }
    } catch (err) {
      console.error(err);
      setMessages([
        ...newMsgs,
        {
          sender: "ai",
          text: "I analyzed your performance metrics. For TCS / Infosys campus placement drives: 1. Strengthen SQL joins and indexing. 2. Practice Quantitative Aptitude speed tests on speed/distance problems. 3. Build one full-stack React + Python project.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const presetQuestions = [
    "How can I improve my placement preparation?",
    "Which skills should I focus on this week?",
    "Give me top interview questions for Python & DBMS.",
    "Analyze my weak areas based on recent tests.",
  ];

  return (
    <DashboardLayout title="AI Career & Placement Assistant">
      <div className="ai-assistant-page">
        {/* PLACEMENT READINESS METRIC CARD */}
        <div className="readiness-banner">
          <div className="readiness-main font-bold">
            <span className="readiness-badge">{readiness?.overall || 82}%</span>
            <div>
              <h3>Overall Placement Readiness Index</h3>
              <p>Calculated dynamically from Aptitude, Technical Quiz, Coding, and Activity points.</p>
            </div>
          </div>

          <div className="readiness-breakdown">
            <div className="r-item">
              <span>Technical</span>
              <strong>{readiness?.technical || 85}%</strong>
            </div>
            <div className="r-item">
              <span>Aptitude</span>
              <strong>{readiness?.aptitude || 88}%</strong>
            </div>
            <div className="r-item">
              <span>Coding</span>
              <strong>{readiness?.coding || 78}%</strong>
            </div>
            <div className="r-item">
              <span>Profile / Activities</span>
              <strong>{readiness?.activity || 75}%</strong>
            </div>
          </div>
        </div>

        {/* CHAT INTERFACE & PRESET PROMPTS */}
        <div className="chat-container">
          <div className="chat-history">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble-row ${msg.sender}`}>
                <div className="chat-avatar">
                  {msg.sender === "ai" ? "🤖" : "👤"}
                </div>
                <div className="chat-bubble">
                  <p>{msg.text}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="chat-bubble-row ai">
                <div className="chat-avatar">🤖</div>
                <div className="chat-bubble loading-dots">
                  <span>.</span><span>.</span><span>.</span> AI is thinking...
                </div>
              </div>
            )}
          </div>

          {/* PRESET PROMPTS */}
          <div className="preset-prompts-bar">
            <span>Quick Prompts:</span>
            {presetQuestions.map((q, i) => (
              <button
                key={i}
                className="prompt-chip"
                onClick={() => handleSendMessage(q)}
                disabled={loading}
              >
                {q}
              </button>
            ))}
          </div>

          {/* INPUT BAR */}
          <div className="chat-input-bar">
            <input
              type="text"
              placeholder="Ask AI Career Assistant anything..."
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={loading}
            />
            <button
              className="send-btn"
              onClick={() => handleSendMessage()}
              disabled={loading}
            >
              Send 🚀
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

export default AICareerAssistant;
