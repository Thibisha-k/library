import { Box, Paper, Typography, TextField, Button, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import React, { useState } from 'react';
import axios from 'axios';

axios.defaults.withCredentials = true;

function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    role: 'user',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    try {
      const res = await axios.post('https://library-lzho.onrender.com/api/auth/register', formData);
      if (res.status === 201) {
        setMessage('✅ Registration successful! Redirecting...');
        setTimeout(() => navigate('/'), 1500);
      }
    } catch (err) {
      setError(err.response?.data?.error || '❌ Registration failed');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 2,
        // NO background here — rely on body CSS background image
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%',
          borderRadius: 3,
          backgroundColor: 'rgba(255, 255, 255, 0.9)', // slightly transparent white for subtle background
        }}
      >
        <Typography variant="h5" fontWeight="bold" mb={3}>
          📝 Register for Mini Library
        </Typography>

        {message && (
          <Typography variant="body1" color="success.main" mb={2}>
            {message}
          </Typography>
        )}
        {error && (
          <Typography variant="body1" color="error.main" mb={2}>
            {error}
          </Typography>
        )}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            select
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            margin="normal"
          >
            <MenuItem value="user">Regular User</MenuItem>
            <MenuItem value="admin">Administrator</MenuItem>
          </TextField>

          <Button
            type="submit"
            variant="contained"
            fullWidth
            sx={{ mt: 3, mb: 2, fontWeight: 'bold', backgroundColor: '#4e54c8', '&:hover': { backgroundColor: '#3c40a0' } }}
          >
            Register
          </Button>
        </form>

        <Typography
          variant="body2"
          sx={{ cursor: 'pointer', color: '#4e54c8', fontWeight: 'bold' }}
          onClick={() => navigate('/')}
          align="center"
        >
          🔙 Already registered? Login here
        </Typography>
      </Paper>
    </Box>
  );
}

export default RegisterPage;
