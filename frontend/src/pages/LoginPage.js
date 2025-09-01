import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// MUI imports
import { Box, TextField, Button, Typography, Alert, Link } from '@mui/material';

axios.defaults.withCredentials = true;

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
      const res = await axios.post('https://library-lzho.onrender.com/api/auth/login', { username, password });
      const { token, role } = res.data;
      onLogin({ role, token, username });
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
    <Box
      className="login-page"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        px: 2,
        // NO background here — let body CSS handle background image
      }}
    >
      <Box
        className="login-card"
        component="form"
        onSubmit={handleLogin}
        sx={{
          backgroundColor: 'rgba(255, 255, 255, 0.9)', // slightly transparent white
          p: 4,
          borderRadius: 2,
          boxShadow: 3,
          width: '100%',
          maxWidth: 400,
          textAlign: 'center',
        }}
      >
        <Typography variant="h5" component="h2" gutterBottom color="text.primary">
          🔐 Mini Library Login
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2, fontWeight: 'bold', animation: 'slideDownFade 3s ease-in-out' }}>
            {error}
          </Alert>
        )}

        <TextField
          label="Username"
          variant="outlined"
          fullWidth
          required
          margin="normal"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />

        <TextField
          label="Password"
          variant="outlined"
          fullWidth
          required
          margin="normal"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={isLoading}
          sx={{
            mt: 2,
            mb: 2,
            backgroundColor: '#4e54c8',
            '&:hover': {
              backgroundColor: '#3c40a0',
            },
            fontWeight: 'bold',
            fontSize: '16px',
            borderRadius: '8px',
          }}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </Button>

        <Typography variant="body2" color="text.secondary">
          📘 New user?{' '}
          <Link
            component="button"
            variant="body2"
            onClick={() => navigate('/register')}
            sx={{ color: '#4e54c8', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Register here
          </Link>
        </Typography>
      </Box>
    </Box>
  );
}

export default LoginPage;
