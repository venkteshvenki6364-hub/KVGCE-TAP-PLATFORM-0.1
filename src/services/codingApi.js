import api from "./api";

export const codingApi = {
  getHealth: async () => {
    const res = await api.get("/coding/health");
    return res.data;
  },

  getLanguages: async () => {
    const res = await api.get("/coding/languages");
    return res.data;
  },

  getQuestions: async (difficulty = "") => {
    const res = await api.get(`/coding/questions${difficulty ? `?difficulty=${difficulty}` : ""}`);
    return res.data;
  },

  getQuestionById: async (questionId) => {
    const res = await api.get(`/coding/questions/${questionId}`);
    return res.data;
  },

  runCode: async ({ questionId, languageId, language, sourceCode, code, stdin, stdinInput }) => {
    const payload = {
      questionId,
      question_id: questionId,
      languageId,
      language_id: languageId,
      language,
      sourceCode: sourceCode || code,
      source_code: sourceCode || code,
      code: sourceCode || code,
      stdin: stdin !== undefined ? stdin : (stdinInput || ""),
      stdinInput: stdin !== undefined ? stdin : (stdinInput || "")
    };
    const res = await api.post("/coding/run", payload);
    return res.data;
  },

  submitCode: async ({ questionId, languageId, language, sourceCode, code }) => {
    const payload = {
      questionId,
      question_id: questionId,
      languageId,
      language_id: languageId,
      language,
      sourceCode: sourceCode || code,
      source_code: sourceCode || code,
      code: sourceCode || code
    };
    const res = await api.post("/coding/submit", payload);
    return res.data;
  },

  saveProgress: async (questionId, { language, code, status }) => {
    const res = await api.put(`/coding/progress/${questionId}`, {
      questionId,
      language,
      code,
      status
    });
    return res.data;
  },

  getProgress: async () => {
    const res = await api.get("/coding/progress");
    return res.data;
  }
};

export default codingApi;
