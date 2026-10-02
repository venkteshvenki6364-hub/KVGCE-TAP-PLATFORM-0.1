import DashboardLayout from "../../components/DashboardLayout";
import AcademicStudentRankingsTable from "../../components/AcademicStudentRankingsTable";
import "./StudentRankingsPage.css";

function StudentRankingsPage() {
  return (
    <DashboardLayout title="Student Rankings">
      <div className="student-rankings-container">
        <AcademicStudentRankingsTable />
      </div>
    </DashboardLayout>
  );
}

export default StudentRankingsPage;
