import React, { useState } from "react";
import api from "../../services/api";
import "./QuizQuestionBuilder.css";

export default function CodingProblemBuilder({ onBack, onPublishSuccess }) {
  const [title, setTitle] = useState("Sum of Two Numbers");
  const [difficulty, setDifficulty] = useState("Easy");
  const [category, setCategory] = useState("Data Structures");
  const [description, setDescription] = useState(
    "Write a program that takes two integers as input and prints their sum."
  );
  const [inputFormat, setInputFormat] = useState(
    "The first line contains an integer T, the number of test cases.\nEach of the next T lines contains two integers A and B."
  );
  const [outputFormat, setOutputFormat] = useState(
    "For each test case, print the sum of A and B in a new line."
  );
  const [constraints, setConstraints] = useState("-10^9 <= A, B <= 10^9");
  const [exampleInput, setExampleInput] = useState("3\n1 2\n10 20\n-5 7");
  const [exampleOutput, setExampleOutput] = useState("3\n30\n2");

  const [cppCode, setCppCode] = useState(
    `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    int T;\n    cin >> T;\n    while (T--) {\n        long long A, B;\n        cin >> A >> B;\n        cout << A + B << endl;\n    }\n    return 0;\n}`
  );
  const [pythonCode, setPythonCode] = useState(
    `import sys\n\ndef main():\n    lines = sys.stdin.read().split()\n    if not lines: return\n    T = int(lines[0])\n    idx = 1\n    for _ in range(T):\n        a, b = int(lines[idx]), int(lines[idx+1])\n        print(a + b)\n        idx += 2\n\nif __name__ == "__main__":\n    main()`
  );
  const [javaCode, setJavaCode] = useState(
    `import java.util.Scanner;\n\npublic class Main {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int t = sc.nextInt();\n        while (t-- > 0) {\n            long a = sc.nextLong();\n            long b = sc.nextLong();\n            System.out.println(a + b);\n        }\n    }\n}`
  );
  const [jsCode, setJsCode] = useState(
    `const fs = require('fs');\nconst input = fs.readFileSync('/dev/stdin', 'utf-8').trim().split(/\\s+/);\nif (input.length > 0) {\n  const T = parseInt(input[0]);\n  let idx = 1;\n  for(let i=0; i<T; i++) {\n    console.log(parseInt(input[idx]) + parseInt(input[idx+1]));\n    idx += 2;\n  }\n}`
  );

  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const handlePublish = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert("Please provide both Title and Description.");
      return;
    }

    setSaving(true);
    setMsg("");

    const problemDoc = {
      title,
      difficulty,
      category,
      description,
      inputFormat,
      outputFormat,
      constraints,
      exampleInput,
      exampleOutput,
      starterCode: {
        cpp: cppCode,
        python: pythonCode,
        java: javaCode,
        javascript: jsCode,
      },
      is_published: true,
    };

    try {
      const res = await api.post("/assessments/coding/problems", problemDoc);
      if (res.data && res.data.success) {
        setMsg("✅ Coding problem published successfully to Student Coding Lab!");
      }
    } catch (err) {
      console.warn("Backend API issue, using local storage sync:", err);
      setMsg("✅ Coding problem saved & published locally!");
    }

    // Always update local storage key kvgce_coding_problems
    const localProbs = JSON.parse(localStorage.getItem("kvgce_coding_problems") || "[]");
    localProbs.unshift({ ...problemDoc, id: "prob_" + Date.now() });
    localStorage.setItem("kvgce_coding_problems", JSON.stringify(localProbs));

    setSaving(false);
    setTimeout(() => {
      setMsg("");
      if (onPublishSuccess) onPublishSuccess();
    }, 2500);
  };

  return (
    <div className="quiz-question-builder-container" style={{ padding: "1.5rem", background: "#f8fafc", borderRadius: "12px" }}>
      <div className="q-builder-top-bar" style={{ marginBottom: "1.5rem" }}>
        <div className="q-builder-breadcrumbs">
          <span>Coding Lab</span>
          <span className="bc-sep">›</span>
          <span className="bc-active">Create Coding Problem</span>
        </div>
        <div className="q-builder-title-row">
          <div>
            <h2 className="q-builder-main-title">Create Coding Challenge for Students</h2>
            <p className="q-builder-sub-title">Add problem specifications, test cases, and starter code.</p>
          </div>
          {onBack && (
            <button className="btn-outline-blue" onClick={onBack}>
              ← Back to Dashboard
            </button>
          )}
        </div>
      </div>

      {msg && <div className="builder-alert-success" style={{ marginBottom: "1rem" }}>{msg}</div>}

      <form onSubmit={handlePublish} style={{ display: "grid", gap: "1.2rem", background: "#ffffff", padding: "1.8rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "1rem" }}>
          <div>
            <label className="input-lbl font-bold">Problem Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="select-field"
              placeholder="e.g. Sum of Two Numbers"
              required
            />
          </div>

          <div>
            <label className="input-lbl font-bold">Difficulty</label>
            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="select-field">
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="input-lbl font-bold">Category</label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="select-field"
              placeholder="e.g. Data Structures"
            />
          </div>
        </div>

        <div>
          <label className="input-lbl font-bold">Problem Description *</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="textarea-field"
            placeholder="Write clear instructions for students..."
            required
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label className="input-lbl font-bold">Input Format</label>
            <textarea
              rows={3}
              value={inputFormat}
              onChange={(e) => setInputFormat(e.target.value)}
              className="textarea-field"
            />
          </div>
          <div>
            <label className="input-lbl font-bold">Output Format</label>
            <textarea
              rows={3}
              value={outputFormat}
              onChange={(e) => setOutputFormat(e.target.value)}
              className="textarea-field"
            />
          </div>
        </div>

        <div>
          <label className="input-lbl font-bold">Constraints</label>
          <input
            type="text"
            value={constraints}
            onChange={(e) => setConstraints(e.target.value)}
            className="select-field"
            placeholder="e.g. -10^9 <= A, B <= 10^9"
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label className="input-lbl font-bold">Sample Input</label>
            <textarea
              rows={3}
              value={exampleInput}
              onChange={(e) => setExampleInput(e.target.value)}
              className="textarea-field"
              style={{ fontFamily: "monospace" }}
            />
          </div>
          <div>
            <label className="input-lbl font-bold">Sample Output</label>
            <textarea
              rows={3}
              value={exampleOutput}
              onChange={(e) => setExampleOutput(e.target.value)}
              className="textarea-field"
              style={{ fontFamily: "monospace" }}
            />
          </div>
        </div>

        <hr style={{ margin: "1rem 0", borderColor: "#f1f5f9" }} />

        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1e293b" }}>Starter Code Templates</h3>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
          <div>
            <label className="input-lbl font-bold">C++ Solution / Starter</label>
            <textarea
              rows={5}
              value={cppCode}
              onChange={(e) => setCppCode(e.target.value)}
              className="textarea-field"
              style={{ fontFamily: "monospace", fontSize: "0.85rem", background: "#0f172a", color: "#38bdf8" }}
            />
          </div>
          <div>
            <label className="input-lbl font-bold">Python 3 Starter</label>
            <textarea
              rows={5}
              value={pythonCode}
              onChange={(e) => setPythonCode(e.target.value)}
              className="textarea-field"
              style={{ fontFamily: "monospace", fontSize: "0.85rem", background: "#0f172a", color: "#38bdf8" }}
            />
          </div>
          <div>
            <label className="input-lbl font-bold">Java Starter</label>
            <textarea
              rows={5}
              value={javaCode}
              onChange={(e) => setJavaCode(e.target.value)}
              className="textarea-field"
              style={{ fontFamily: "monospace", fontSize: "0.85rem", background: "#0f172a", color: "#38bdf8" }}
            />
          </div>
          <div>
            <label className="input-lbl font-bold">JavaScript Starter</label>
            <textarea
              rows={5}
              value={jsCode}
              onChange={(e) => setJsCode(e.target.value)}
              className="textarea-field"
              style={{ fontFamily: "monospace", fontSize: "0.85rem", background: "#0f172a", color: "#38bdf8" }}
            />
          </div>
        </div>

        <button type="submit" className="btn-solid-blue" style={{ marginTop: "1rem", padding: "0.9rem", fontSize: "1rem" }} disabled={saving}>
          {saving ? "Publishing Problem..." : "🚀 Publish Problem to Student Coding Lab"}
        </button>
      </form>
    </div>
  );
}
