import { useEffect, useMemo, useState } from "react";
import QuizQuestionBuilder from "./QuizQuestionBuilder";
import CodingProblemBuilder from "./CodingProblemBuilder";
import api from "../../services/api";
import "./CreationWorkspace.css";
import { useAuth } from "../../context/AuthContext";

function CreationWorkspace({ mode = "quiz", onDone }) {
  const [records, setRecords] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  const isQuiz = mode === "quiz";
  const endpoint = isQuiz ? "/assessments" : "/assessments/coding/problems";
  const title = isQuiz ? "Quiz & Aptitude Workspace" : "Coding Lab Workspace";

  const loadRecords = async () => {
    try {
      setError("");
      const response = await api.get(endpoint);
      setRecords(response.data?.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.detail || `Unable to load ${title.toLowerCase()}.`);
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    loadRecords();
  }, [endpoint]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const mine = useMemo(() => records.filter((record) => record.created_by === user?.email), [records, user?.email]);
  const others = useMemo(() => records.filter((record) => !mine.includes(record)), [records, mine]);

  const handleSaved = () => {
    setSelected(null);
    loadRecords();
    if (onDone) onDone();
  };

  const renderBuilder = () => {
    if (isQuiz) {
      return (
        <QuizQuestionBuilder
          quizTitle={selected?.title || "Technical Quiz"}
          initialQuiz={selected}
          onBack={() => setSelected(null)}
          onPublish={handleSaved}
        />
      );
    }
    return (
      <CodingProblemBuilder
        initialProblem={selected}
        onBack={() => setSelected(null)}
        onPublishSuccess={handleSaved}
      />
    );
  };

  if (selected || selected === "new") {
    return renderBuilder();
  }

  const renderRecord = (record) => (
    <article className="creation-record" key={record._id || record.id}>
      <div>
        <strong>{record.title}</strong>
        <span>{record.category || record.difficulty || (isQuiz ? "Assessment" : "Coding Problem")}</span>
      </div>
      <button onClick={() => setSelected(record)}>Edit</button>
    </article>
  );

  return (
    <div className="creation-workspace">
      <div className="creation-workspace-header">
        <div>
          <p className="creation-workspace-kicker">{isQuiz ? "Admin & Faculty" : "Admin & Faculty"}</p>
          <h2>{title}</h2>
          <p>Edit your existing work or create a new one. Other users' work is view-only.</p>
        </div>
        <button className="creation-new-button" onClick={() => setSelected("new")}>
          + Create new
        </button>
      </div>
      {error && <p className="creation-error">{error}</p>}
      {loading ? <p>Loading...</p> : (
        <div className="creation-columns">
          <section>
            <h3>Your created {isQuiz ? "quizzes & aptitude tests" : "coding problems"}</h3>
            {mine.length ? mine.map(renderRecord) : <p className="creation-empty">You have not created anything yet.</p>}
          </section>
          <section>
            <h3>Other tests</h3>
            {others.length ? others.map(renderRecord) : <p className="creation-empty">No other published tests.</p>}
          </section>
        </div>
      )}
    </div>
  );
}

export default CreationWorkspace;
