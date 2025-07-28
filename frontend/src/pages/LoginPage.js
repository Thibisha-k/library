import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './LoginPage.css'; // Import the CSS file

function LoginPage({ setRole }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    if (username === "admin" && password === "admin123") {
      setRole("admin");
      navigate("/admin");
    } else if (username === "user" && password === "user123") {
      setRole("user");
      navigate("/user");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">Login to Mini Library</h2>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username (admin/user)"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="login-input"
          /><br />
          <input
            type="password"
            placeholder="Password (admin123/user123)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
          /><br />
          <button type="submit" className="login-btn">Login</button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
