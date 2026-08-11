import { BrowserRouter, Routes, Route } from "react-router-dom";

import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";

import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Landing Page */}
        <Route
          path="/"
          element={<LandingPage />}
        />

        {/* Login Page */}
        <Route
          path="/login"
          element={<LoginPage />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;