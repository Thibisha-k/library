import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';

function App() {
  const [role, setRole] = useState(localStorage.getItem("role"));
  const [username, setUsername] = useState(localStorage.getItem("username"));

  const handleLogout = () => {
    localStorage.clear();
    setRole(null);
    setUsername(null);
  };

  const handleLogin = ({ role, token, username }) => {
    localStorage.setItem("role", role);
    localStorage.setItem("token", token);
    localStorage.setItem("username", username);
    setRole(role);
    setUsername(username);
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage setRole={setRole} onLogin={handleLogin} />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route
          path="/admin"
          element={
            role === "admin" ? (
              <AdminDashboard username={username} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" />
            )
          }
        />

        <Route
          path="/user"
          element={
            role === "user" ? (
              <UserDashboard username={username} onLogout={handleLogout} />
            ) : (
              <Navigate to="/" />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
