import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './LoginPage.css';
axios.defaults.withCredentials = true;

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user'
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      // In RegisterPage.js handleSubmit
const res = await axios.post('http://localhost:5000/api/auth/register', formData);



      if (res.status === 201) {
        setMessage('✅ Registration successful! Redirecting...');
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || '❌ Registration failed');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h2 className="login-title">📝 Register for Mini Library</h2>

        {message && <div className="toast success">{message}</div>}
        {error && <div className="toast error">{error}</div>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
            className="login-input"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
            className="login-input"
          />
          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="login-input"
          >
            <option value="user">Regular User</option>
            <option value="admin">Administrator</option>
          </select>
          <button type="submit" className="login-btn">Register</button>
        </form>

        <p className="register-link">
          🔙 Already registered?{' '}
          <span onClick={() => navigate('/')} className="register-span">Login here</span>
        </p>
      </div>
    </div>
  );
}

export default RegisterPage;
