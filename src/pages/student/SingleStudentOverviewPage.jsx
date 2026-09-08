import React from "react";
import DashboardLayout from "../../components/DashboardLayout";
import SingleStudentOverview from "../../components/SingleStudentOverview";
import { useAuth } from "../../context/AuthContext";

export default function SingleStudentOverviewPage() {
  const { user } = useAuth();
  const defaultUsn = user?.student_id || "4KV21CS042";

  return (
    <DashboardLayout title="Student Overview">
      <SingleStudentOverview defaultUsn={defaultUsn} userRole={user?.role || "student"} />
    </DashboardLayout>
  );
}
