import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';
import IssuedBooksPage from './pages/IssuedBooks';
import AddBookPage from './pages/AddBookPage';

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

  // Protected route component
  const ProtectedRoute = ({ children, requiredRole }) => {
    if (role !== requiredRole) {
      return <Navigate to="/" replace />;
    }
    return children;
  };

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LoginPage setRole={setRole} onLogin={handleLogin} />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* User routes */}
        <Route
          path="/user"
          element={
            <ProtectedRoute requiredRole="user">
              <UserDashboard username={username} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute requiredRole="admin">
              <AdminDashboard username={username} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/add-book"
          element={
            <ProtectedRoute requiredRole="admin">
              <AddBookPage username={username} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/issued-books"
          element={
            <ProtectedRoute requiredRole="admin">
              <IssuedBooksPage username={username} onLogout={handleLogout} />
            </ProtectedRoute>
          }
        />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
