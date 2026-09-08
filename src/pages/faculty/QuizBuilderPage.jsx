import React from "react";
import DashboardLayout from "../../components/DashboardLayout";
import QuizQuestionBuilder from "../../components/quiz/QuizQuestionBuilder";

export default function QuizBuilderPage() {
  return (
    <DashboardLayout title="Quiz & Question Builder">
      <QuizQuestionBuilder
        quizTitle="Technical Quiz"
        onBack={() => window.history.back()}
        onPublish={(quizData) => {
          console.log("Quiz published:", quizData);
        }}
      />
    </DashboardLayout>
  );
}
