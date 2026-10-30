import DashboardLayout from "../../components/DashboardLayout";
import CreationWorkspace from "../../components/quiz/CreationWorkspace";

export default function QuizBuilderPage({ mode = "quiz" }) {
  return (
    <DashboardLayout title="Quiz & Question Builder">
      <CreationWorkspace mode={mode} />
    </DashboardLayout>
  );
}
