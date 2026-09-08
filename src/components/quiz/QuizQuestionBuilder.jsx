import React, { useState } from "react";
import "./QuizQuestionBuilder.css";

// Initial sample questions matching screenshot
const INITIAL_QUESTIONS = [
  {
    id: 1,
    question: "Which of the following data types is used to store a sequence of characters?",
    type: "MCQ (Single Correct)",
    marks: 2,
    options: [
      { text: "String", isCorrect: true },
      { text: "Integer", isCorrect: false },
      { text: "Boolean", isCorrect: false },
      { text: "Float", isCorrect: false },
    ],
    explanation: "In most programming languages, String is used for sequence of characters.",
  },
  {
    id: 2,
    question: "What is the time complexity of binary search algorithm?",
    type: "MCQ (Single Correct)",
    marks: 2,
    options: [
      { text: "O(n)", isCorrect: false },
      { text: "O(log n)", isCorrect: true },
      { text: "O(n^2)", isCorrect: false },
      { text: "O(1)", isCorrect: false },
    ],
    explanation: "Binary search divides search space in half each iteration.",
  },
  {
    id: 3,
    question: "Which keyword is used to inherit a class in Java?",
    type: "MCQ (Single Correct)",
    marks: 2,
    options: [
      { text: "implements", isCorrect: false },
      { text: "extends", isCorrect: true },
      { text: "inherits", isCorrect: false },
      { text: "super", isCorrect: false },
    ],
    explanation: "The 'extends' keyword is used in Java for class inheritance.",
  },
];

export default function QuizQuestionBuilder({ quizTitle = "Technical Quiz", onBack, onPublish }) {
  // Stepper state: 1 = Add Question, 2 = Question List, 3 = Review & Publish
  const [currentStep, setCurrentStep] = useState(1);

  // Question list state
  const [questions, setQuestions] = useState(INITIAL_QUESTIONS);

  // Active question being edited or created
  const [editingQuestionId, setEditingQuestionId] = useState(null);

  // Question Form State
  const [questionType, setQuestionType] = useState("MCQ (Single Correct)");
  const [marks, setMarks] = useState(2);
  const [questionText, setQuestionText] = useState("");
  const [explanationText, setExplanationText] = useState("");
  const [options, setOptions] = useState([
    { text: "Option A", isCorrect: true },
    { text: "Option B", isCorrect: false },
    { text: "Option C", isCorrect: false },
    { text: "Option D", isCorrect: false },
  ]);

  // Quiz Settings State
  const [timeLimit, setTimeLimit] = useState(60); // minutes
  const [passingScore, setPassingScore] = useState(40); // percent
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Calculate totals
  const totalQuestions = questions.length;
  const totalMarks = questions.reduce((acc, q) => acc + (q.marks || 0), 0);

  // Handle Option Text Change
  const handleOptionTextChange = (index, text) => {
    const updated = [...options];
    updated[index].text = text;
    setOptions(updated);
  };

  // Handle Selecting Correct Answer
  const handleSetCorrectOption = (index) => {
    const updated = options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index,
    }));
    setOptions(updated);
  };

  // Add Option
  const handleAddOption = () => {
    if (options.length >= 6) return;
    const letter = String.fromCharCode(65 + options.length);
    setOptions([...options, { text: `Option ${letter}`, isCorrect: false }]);
  };

  // Remove Option
  const handleRemoveOption = (index) => {
    if (options.length <= 2) return;
    const updated = options.filter((_, i) => i !== index);
    // If we removed the correct option, default first to correct
    if (!updated.some((o) => o.isCorrect) && updated.length > 0) {
      updated[0].isCorrect = true;
    }
    setOptions(updated);
  };

  // Clear Options
  const handleClearOptions = () => {
    setOptions([
      { text: "", isCorrect: true },
      { text: "", isCorrect: false },
    ]);
  };

  // Reset Question Form
  const resetForm = () => {
    setEditingQuestionId(null);
    setQuestionText("");
    setExplanationText("");
    setMarks(2);
    setOptions([
      { text: "Option A", isCorrect: true },
      { text: "Option B", isCorrect: false },
      { text: "Option C", isCorrect: false },
      { text: "Option D", isCorrect: false },
    ]);
  };

  // Save Question (and stay or reset)
  const handleSaveQuestion = (addNext = false) => {
    if (!questionText.trim()) {
      alert("Please enter question text before saving.");
      return;
    }

    if (editingQuestionId !== null) {
      // Update existing
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === editingQuestionId
            ? {
                ...q,
                question: questionText,
                type: questionType,
                marks: Number(marks),
                options: [...options],
                explanation: explanationText,
              }
            : q
        )
      );
      setSuccessMsg("Question updated successfully!");
    } else {
      // Add new question
      const newQ = {
        id: Date.now(),
        question: questionText,
        type: questionType,
        marks: Number(marks),
        options: [...options],
        explanation: explanationText,
      };
      setQuestions((prev) => [...prev, newQ]);
      setSuccessMsg("Question added successfully!");
    }

    setTimeout(() => setSuccessMsg(""), 3000);

    if (addNext) {
      resetForm();
    }
  };

  // Edit existing question from question list
  const handleEditQuestion = (q) => {
    setEditingQuestionId(q.id);
    setQuestionText(q.question);
    setQuestionType(q.type || "MCQ (Single Correct)");
    setMarks(q.marks || 2);
    setOptions(q.options || []);
    setExplanationText(q.explanation || "");
    setCurrentStep(1);
  };

  // Delete question
  const handleDeleteQuestion = (id) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      setQuestions((prev) => prev.filter((q) => q.id !== id));
      if (editingQuestionId === id) {
        resetForm();
      }
    }
  };

  // Publish Quiz
  const handlePublishQuiz = () => {
    alert("Quiz published successfully! Students can now access this assessment.");
    if (onPublish) onPublish({ questions, timeLimit, passingScore, totalMarks });
  };

  return (
    <div className="quiz-question-builder-container">
      {/* 1. TOP BREADCRUMB & HEADER ACTION BAR */}
      <div className="q-builder-top-bar">
        <div className="q-builder-breadcrumbs">
          <span>{quizTitle}</span>
          <span className="bc-sep">›</span>
          <span>Create New Quiz</span>
          <span className="bc-sep">›</span>
          <span className="bc-active">Add Questions</span>
        </div>

        <div className="q-builder-title-row">
          <div>
            <h2 className="q-builder-main-title">Add Questions to Quiz</h2>
            <p className="q-builder-sub-title">
              Create and manage questions for your quiz. You can add, edit, reorder and review questions.
            </p>
          </div>

          <div className="q-builder-top-actions">
            <button className="btn-outline-blue" onClick={onBack || (() => window.history.back())}>
              ← Back to Quiz Settings
            </button>
            <button className="btn-solid-blue" onClick={() => setShowPreviewModal(true)}>
              👁️ Preview Quiz
            </button>
          </div>
        </div>
      </div>

      {successMsg && <div className="builder-alert-success">✅ {successMsg}</div>}

      {/* 2. THREE COLUMN / STEPPER MAIN LAYOUT */}
      <div className="q-builder-main-grid">
        {/* LEFT STEPPER COLUMN */}
        <div className="q-stepper-left-card">
          <div className={`stepper-item ${currentStep === 1 ? "active" : currentStep > 1 ? "completed" : ""}`}>
            <button className="stepper-circle-btn" onClick={() => setCurrentStep(1)}>
              1
            </button>
            <span className="stepper-lbl">Add Question</span>
          </div>
          <div className="stepper-line"></div>

          <div className={`stepper-item ${currentStep === 2 ? "active" : currentStep > 2 ? "completed" : ""}`}>
            <button className="stepper-circle-btn" onClick={() => setCurrentStep(2)}>
              2
            </button>
            <span className="stepper-lbl">Question List</span>
          </div>
          <div className="stepper-line"></div>

          <div className={`stepper-item ${currentStep === 3 ? "active" : ""}`}>
            <button className="stepper-circle-btn" onClick={() => setCurrentStep(3)}>
              3
            </button>
            <span className="stepper-lbl">Review & Publish</span>
          </div>
        </div>

        {/* CENTER QUESTION FORM / WORKSPACE */}
        <div className="q-form-center-card">
          {currentStep === 1 && (
            <div className="question-form-workspace">
              {/* Question Type & Marks */}
              <div className="type-marks-row">
                <div className="form-group-item flex-2">
                  <label className="input-lbl">Question Type</label>
                  <select
                    value={questionType}
                    onChange={(e) => setQuestionType(e.target.value)}
                    className="select-field"
                  >
                    <option value="MCQ (Single Correct)">Multiple Choice (Single Correct)</option>
                    <option value="MCQ (Multiple Correct)">Multiple Choice (Multiple Correct)</option>
                    <option value="True / False">True / False</option>
                  </select>
                </div>

                <div className="form-group-item flex-1">
                  <label className="input-lbl">Marks</label>
                  <div className="marks-input-wrapper">
                    <input
                      type="number"
                      min="1"
                      max="10"
                      value={marks}
                      onChange={(e) => setMarks(e.target.value)}
                      className="number-field"
                    />
                    <span className="marks-unit">marks</span>
                  </div>
                </div>
              </div>

              {/* Question Text Area */}
              <div className="form-group-item">
                <label className="input-lbl">Question <span className="req-star">*</span></label>
                <div className="textarea-wrapper">
                  <textarea
                    rows={4}
                    maxLength={500}
                    placeholder="Enter your question here..."
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    className="textarea-field"
                  ></textarea>
                  <span className="char-count">{questionText.length}/500</span>
                </div>
              </div>

              {/* Options Section */}
              <div className="form-group-item">
                <label className="input-lbl">Options <span className="req-star">*</span></label>
                <div className="options-stack">
                  {options.map((opt, idx) => (
                    <div key={idx} className={`option-row ${opt.isCorrect ? "correct-selected" : ""}`}>
                      <input
                        type="radio"
                        name="correctOption"
                        checked={opt.isCorrect}
                        onChange={() => handleSetCorrectOption(idx)}
                        className="radio-select"
                        title="Mark as correct answer"
                      />
                      <input
                        type="text"
                        value={opt.text}
                        onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                        className="option-text-input"
                      />
                      {opt.isCorrect && <span className="correct-badge">Correct Answer</span>}
                      <button
                        type="button"
                        className="delete-opt-btn"
                        onClick={() => handleRemoveOption(idx)}
                        title="Remove option"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>

                <div className="options-actions-bar">
                  <button type="button" className="btn-outline-blue-small" onClick={handleAddOption}>
                    + Add Option
                  </button>
                  <button type="button" className="btn-outline-red-small" onClick={handleClearOptions}>
                    🗑️ Clear Options
                  </button>
                </div>
              </div>

              {/* Explanation Section */}
              <div className="form-group-item">
                <label className="input-lbl">Explanation (Optional)</label>
                <div className="textarea-wrapper">
                  <textarea
                    rows={3}
                    maxLength={300}
                    placeholder="Explain the correct answer (optional)..."
                    value={explanationText}
                    onChange={(e) => setExplanationText(e.target.value)}
                    className="textarea-field"
                  ></textarea>
                  <span className="char-count">{explanationText.length}/300</span>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="q-form-bottom-actions">
                <button type="button" className="btn-cancel" onClick={resetForm}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-outline-blue"
                  onClick={() => handleSaveQuestion(false)}
                >
                  Save Question
                </button>
                <button
                  type="button"
                  className="btn-solid-blue"
                  onClick={() => handleSaveQuestion(true)}
                >
                  Save & Add Next →
                </button>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="question-list-full-view">
              <h3 className="section-heading">Full Question List ({questions.length})</h3>
              <div className="full-q-stack">
                {questions.map((q, idx) => (
                  <div key={q.id} className="full-q-card">
                    <div className="q-card-head">
                      <span className="q-num-badge">Q{idx + 1}</span>
                      <span className="q-type-tag">{q.type}</span>
                      <span className="q-marks-tag">{q.marks} Marks</span>
                      <div className="q-card-actions">
                        <button className="q-action-icon" onClick={() => handleEditQuestion(q)}>✏️ Edit</button>
                        <button className="q-action-icon text-red" onClick={() => handleDeleteQuestion(q.id)}>🗑️ Delete</button>
                      </div>
                    </div>
                    <p className="q-text-body">{q.question}</p>
                    <div className="q-opts-grid">
                      {q.options.map((o, i) => (
                        <div key={i} className={`q-opt-pill ${o.isCorrect ? "opt-correct" : ""}`}>
                          <span className="opt-letter">{String.fromCharCode(65 + i)}.</span> {o.text}
                          {o.isCorrect && " ✓"}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="review-publish-workspace">
              <h3 className="section-heading">Review & Publish Assessment</h3>
              <div className="review-summary-card">
                <div className="review-stat-item">
                  <span className="r-lbl">Quiz Name:</span>
                  <span className="r-val">{quizTitle}</span>
                </div>
                <div className="review-stat-item">
                  <span className="r-lbl">Total Questions:</span>
                  <span className="r-val">{totalQuestions}</span>
                </div>
                <div className="review-stat-item">
                  <span className="r-lbl">Total Marks:</span>
                  <span className="r-val">{totalMarks}</span>
                </div>
                <div className="review-stat-item">
                  <span className="r-lbl">Time Limit:</span>
                  <span className="r-val">{timeLimit} minutes</span>
                </div>
                <div className="review-stat-item">
                  <span className="r-lbl">Passing Score:</span>
                  <span className="r-val">{passingScore}%</span>
                </div>
              </div>

              <button className="btn-publish-large" onClick={handlePublishQuiz}>
                🚀 Publish Quiz Now
              </button>
            </div>
          )}
        </div>

        {/* RIGHT SUMMARY & QUESTION LIST SIDEBAR */}
        <div className="q-summary-right-card">
          {/* Quiz Summary Box */}
          <div className="quiz-summary-box">
            <h4 className="summary-box-title">Quiz Summary</h4>
            <div className="summary-4-grid">
              <div className="sum-metric-card">
                <span className="sum-icon font-blue">📑</span>
                <span className="sum-lbl">Total Questions</span>
                <span className="sum-val">{totalQuestions}</span>
              </div>

              <div className="sum-metric-card">
                <span className="sum-icon font-orange">🏆</span>
                <span className="sum-lbl">Total Marks</span>
                <span className="sum-val">{totalMarks}</span>
              </div>

              <div className="sum-metric-card">
                <span className="sum-icon font-blue">⏱️</span>
                <span className="sum-lbl">Time</span>
                <span className="sum-val">{timeLimit} min</span>
              </div>

              <div className="sum-metric-card">
                <span className="sum-icon font-purple">💼</span>
                <span className="sum-lbl">Passing Score</span>
                <span className="sum-val">{passingScore}%</span>
              </div>
            </div>
          </div>

          {/* Question List Box */}
          <div className="sidebar-q-list-box">
            <div className="q-list-header">
              <h4 className="q-list-title">Question List ( {questions.length} )</h4>
              <button className="reorder-btn" title="Reorder Questions">
                ⇆ Reorder
              </button>
            </div>

            <div className="q-items-scroll-stack">
              {questions.map((q, index) => (
                <div key={q.id} className="q-item-card">
                  <span className="grip-icon">⋮⋮</span>
                  <span className="q-number-circle">{index + 1}</span>
                  <div className="q-item-text-col">
                    <p className="q-item-text-truncated">{q.question}</p>
                    <div className="q-item-sub-meta">
                      <span className="meta-tag">{q.type || "MCQ"}</span>
                      <span className="meta-marks">{q.marks} Marks</span>
                    </div>
                  </div>
                  <div className="q-item-actions">
                    <button className="icon-edit-btn" onClick={() => handleEditQuestion(q)} title="Edit">
                      ✏️
                    </button>
                    <button className="icon-delete-btn" onClick={() => handleDeleteQuestion(q.id)} title="Delete">
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button className="add-new-q-full-btn" onClick={resetForm}>
              + Add New Question
            </button>
          </div>

          {/* Bottom Stepper Nav */}
          <div className="sidebar-stepper-footer">
            {currentStep > 1 ? (
              <button className="btn-outline-blue" onClick={() => setCurrentStep((prev) => prev - 1)}>
                ← Previous
              </button>
            ) : (
              <div></div>
            )}

            {currentStep < 3 ? (
              <button className="btn-dark-blue" onClick={() => setCurrentStep((prev) => prev + 1)}>
                Next: {currentStep === 1 ? "Question List" : "Review Quiz"} →
              </button>
            ) : (
              <button className="btn-dark-blue" onClick={handlePublishQuiz}>
                Publish Quiz →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* PREVIEW MODAL */}
      {showPreviewModal && (
        <div className="preview-modal-overlay" onClick={() => setShowPreviewModal(false)}>
          <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Quiz Preview (Student View)</h3>
              <button className="close-btn" onClick={() => setShowPreviewModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <h2>{quizTitle}</h2>
              <p>Time Limit: {timeLimit} mins | Total Questions: {totalQuestions} | Total Marks: {totalMarks}</p>
              <hr />
              {questions.map((q, idx) => (
                <div key={q.id} className="preview-q-block">
                  <p><strong>Q{idx + 1}. {q.question}</strong> ({q.marks} Marks)</p>
                  <div className="preview-opts">
                    {q.options.map((opt, oIdx) => (
                      <label key={oIdx} className="preview-opt-item">
                        <input type="radio" name={`prev_q_${q.id}`} disabled />
                        {opt.text}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button className="btn-solid-blue" onClick={() => setShowPreviewModal(false)}>Close Preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
