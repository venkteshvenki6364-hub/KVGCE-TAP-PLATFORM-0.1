import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/loginPage";

// Student Pages
import StudentHomePage from "./pages/student/StudentHomePage";
import StudentProfile from "./pages/student/StudentProfile";
import StudentSkills from "./pages/student/StudentSkills";
import AptitudeModule from "./pages/student/AptitudeModule";
import TechnicalQuizModule from "./pages/student/TechnicalQuizModule";
import CodingPracticeModule from "./pages/student/CodingPracticeModule";
import ActivitiesModule from "./pages/student/ActivitiesModule";
import AICareerAssistant from "./pages/student/AICareerAssistant";

// Faculty & Admin Pages
import FacultyHomePage from "./pages/faculty/FacultyHomePage";
import AdminHomePage from "./pages/admin/AdminHomePage";

import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Student Protected Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute allowedRoles={["student", "admin"]}>
                <StudentHomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute allowedRoles={["student", "admin"]}>
                <StudentProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/skills"
            element={
              <ProtectedRoute allowedRoles={["student", "admin"]}>
                <StudentSkills />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/aptitude"
            element={
              <ProtectedRoute allowedRoles={["student", "admin"]}>
                <AptitudeModule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/assessments"
            element={
              <ProtectedRoute allowedRoles={["student", "admin"]}>
                <AptitudeModule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/quiz"
            element={
              <ProtectedRoute allowedRoles={["student", "admin"]}>
                <TechnicalQuizModule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/coding"
            element={
              <ProtectedRoute allowedRoles={["student", "admin"]}>
                <CodingPracticeModule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/activities"
            element={
              <ProtectedRoute allowedRoles={["student", "admin"]}>
                <ActivitiesModule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/achievements"
            element={
              <ProtectedRoute allowedRoles={["student", "admin"]}>
                <ActivitiesModule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/certificates"
            element={
              <ProtectedRoute allowedRoles={["student", "admin"]}>
                <ActivitiesModule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/performance"
            element={
              <ProtectedRoute allowedRoles={["student", "admin"]}>
                <StudentHomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/ai"
            element={
              <ProtectedRoute allowedRoles={["student", "admin"]}>
                <AICareerAssistant />
              </ProtectedRoute>
            }
          />

          {/* Faculty Protected Routes */}
          <Route
            path="/faculty/dashboard"
            element={
              <ProtectedRoute allowedRoles={["faculty", "admin"]}>
                <FacultyHomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/students"
            element={
              <ProtectedRoute allowedRoles={["faculty", "admin"]}>
                <FacultyHomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/assessments"
            element={
              <ProtectedRoute allowedRoles={["faculty", "admin"]}>
                <FacultyHomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/questions"
            element={
              <ProtectedRoute allowedRoles={["faculty", "admin"]}>
                <FacultyHomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/activities"
            element={
              <ProtectedRoute allowedRoles={["faculty", "admin"]}>
                <FacultyHomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/performance"
            element={
              <ProtectedRoute allowedRoles={["faculty", "admin"]}>
                <FacultyHomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/faculty/feedback"
            element={
              <ProtectedRoute allowedRoles={["faculty", "admin"]}>
                <FacultyHomePage />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminHomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminHomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminHomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/faculty"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminHomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/departments"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminHomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminHomePage />
              </ProtectedRoute>
            }
          />

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;