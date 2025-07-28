import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import UserDashboard from './pages/UserDashboard';

function App() {
  const [role, setRole] = useState(null);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage setRole={setRole} />} />
        <Route
          path="/admin"
          element={role === "admin" ? <AdminDashboard /> : <Navigate to="/" />}
        />
        <Route
          path="/user"
          element={role === "user" ? <UserDashboard /> : <Navigate to="/" />}
        />
      </Routes>
    </Router>
  );
}

export default App;
