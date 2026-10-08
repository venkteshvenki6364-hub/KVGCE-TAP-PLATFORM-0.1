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
    const res = await api.post("/coding/run", {
      questionId,
      languageId,
      language,
      sourceCode: sourceCode || code,
      code: sourceCode || code,
      stdin: stdin !== undefined ? stdin : (stdinInput || ""),
      stdinInput: stdin !== undefined ? stdin : (stdinInput || "")
    });
    return res.data;
  },

  submitCode: async ({ questionId, languageId, language, sourceCode, code }) => {
    const res = await api.post("/coding/submit", {
      questionId,
      languageId,
      language,
      sourceCode: sourceCode || code,
      code: sourceCode || code
    });
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
