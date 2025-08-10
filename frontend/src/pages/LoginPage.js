import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginPage.css'


axios.defaults.withCredentials = true;  // Send cookies with every request

function LoginPage({ setRole, onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
  

// In LoginPage.js handleLogin
const res = await axios.post('http://localhost:5000/api/auth/login', { username, password });


      const { token, role } = res.data;

      onLogin({ role, token, username });  // pass to parent (App)

      setTimeout(() => {
        navigate(role === 'admin' ? '/admin' : '/user');
      }, 100);

    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">🔐 Mini Library Login</h2>

        {error && <div className="toast error">{error}</div>}

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="login-input"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="login-input"
          />
          <button 
            type="submit" 
            className="login-btn"
            disabled={isLoading}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="register-link">
          📘 New user?{' '}
          <span onClick={() => navigate('/register')} className="register-span">Register here</span>
        </p>
      </div>
    </div>
  );
}

export default LoginPage;
