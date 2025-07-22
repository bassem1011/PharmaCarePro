import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import LoginPage from "./components/LoginPage";
import SignUpPage from "./components/SignUpPage";
// import Dashboard from "./components/Dashboard"; // To be implemented

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <LandingPage
              goToLogin={() => (window.location.href = "/login")}
              goToSignUp={() => (window.location.href = "/signup")}
            />
          }
        />
        <Route
          path="/login"
          element={
            <LoginPage
              goToSignUp={() => (window.location.href = "/signup")}
              // onLogin={() => (window.location.href = "/dashboard")}
            />
          }
        />
        <Route
          path="/signup"
          element={
            <SignUpPage
              goToLogin={() => (window.location.href = "/login")}
              // onSignUp={() => (window.location.href = "/dashboard")}
            />
          }
        />
        {/* <Route path="/dashboard" element={<Dashboard />} /> */}
      </Routes>
    </Router>
  );
}

export default App;
