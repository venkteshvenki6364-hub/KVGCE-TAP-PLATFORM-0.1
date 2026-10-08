import api from "./api";

export async function startHRInterview(difficulty = "Medium") {
  const response = await api.post("/hr-interview/start", { difficulty });
  return response.data;
}

export async function evaluateAnswer(interviewId, questionIndex, questionText, studentAnswer) {
  const response = await api.post("/hr-interview/evaluate-answer", {
    interview_id: interviewId,
    question_index: questionIndex,
    question_text: questionText,
    student_answer: studentAnswer,
  });
  return response.data;
}

export async function finishHRInterview(interviewId) {
  const response = await api.post("/hr-interview/finish", {
    interview_id: interviewId,
  });
  return response.data;
}

export async function getHRInterviewHistory() {
  const response = await api.get("/hr-interview/history");
  return response.data;
}

export async function getHRInterviewDetails(interviewId) {
  const response = await api.get(`/hr-interview/${interviewId}`);
  return response.data;
}
