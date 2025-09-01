import React, { useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Paper,
  Container,
  Button,
  TextField,
  Divider,
  CircularProgress,
  Alert,
  Grid,
  Chip,
  useTheme,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack
} from "@mui/material";
import {
  Book as BookIcon,
  ArrowBack as ArrowBackIcon,
  Add as AddIcon,
  Check as CheckIcon,
  Close as CloseIcon
} from "@mui/icons-material";

function AddBookPage({ username, onLogout }) {
  const theme = useTheme();
  const navigate = useNavigate();

  const colors = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    error: theme.palette.error.main,
    background: {
      panel: theme.palette.mode === "dark" ? "rgba(0, 0, 0, 0.85)" : "rgba(255, 255, 255, 0.98)",
      card: theme.palette.mode === "dark" ? "rgba(40, 40, 40, 0.9)" : "rgba(255, 255, 255, 0.95)",
    }
  };

  const [formData, setFormData] = useState({
    id: "",
    title: "",
    author: "",
    category: "",
    year: "",
    description: "",
    totalCopies: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const categories = ["Fiction", "Non-Fiction", "Science", "Technology", "History", "Biography", "Fantasy", "Mystery"];

  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateForm = useCallback(() => {
    if (!formData.id || !formData.title || !formData.author || !formData.category) {
      setError("Please fill in all required fields");
      return false;
    }
    if (isNaN(formData.id) || parseInt(formData.id) <= 0) {
      setError("ID must be a positive number");
      return false;
    }
    if (formData.year && (isNaN(formData.year) || parseInt(formData.year) <= 0)) {
      setError("Year must be a positive number");
      return false;
    }
    if (isNaN(formData.totalCopies) || parseInt(formData.totalCopies) <= 0) {
      setError("Total Copies must be a positive number");
      return false;
    }
    return true;
  }, [formData]);

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);

    try {
      const bookData = {
        ...formData,
        id: parseInt(formData.id),
        year: formData.year ? parseInt(formData.year) : null,
        totalCopies: parseInt(formData.totalCopies),
        availableCopies: parseInt(formData.totalCopies)
      };
      
      await axios.post(
        "https://library-lzho.onrender.com/books",
        bookData,
        getAuthHeader()
      );
      setSuccess(true);
      setTimeout(() => navigate('/admin'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to add book");
      if (err.response?.status === 401) {
        onLogout();
      }
    } finally {
      setLoading(false);
    }
  }, [formData, validateForm, getAuthHeader, navigate, onLogout]);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundImage: theme.palette.mode === "dark" 
          ? "linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)), url(https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=1400&q=80)"
          : "linear-gradient(rgba(255, 255, 255, 0.9), rgba(255, 255, 255, 0.9)), url(https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=1400&q=80)",
        backgroundSize: "cover",
        backgroundAttachment: "fixed",
        pt: 4,
        pb: 8,
      }}
    >
      <Container maxWidth="md">
        {/* Header */}
        <Paper
          elevation={3}
          sx={{
            mb: 4,
            p: 3,
            borderRadius: 2,
            bgcolor: colors.background.panel,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <BookIcon fontSize="large" color="primary" />
            <Typography variant="h4" fontWeight={700}>
              Add New Book
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              label={`Admin: ${username}`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            
            <Button
              variant="outlined"
              color="error"
              onClick={onLogout}
              sx={{ fontWeight: 600 }}
            >
              Logout
            </Button>
          </Box>
        </Paper>

        {/* Back Button */}
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/admin')}
          sx={{ mb: 3 }}
        >
          Back to Dashboard
        </Button>

        {/* Form */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            bgcolor: colors.background.panel,
          }}
        >
          {success ? (
            <Alert
              severity="success"
              sx={{ mb: 3 }}
              icon={<CheckIcon fontSize="inherit" />}
            >
              Book added successfully! Redirecting to dashboard...
            </Alert>
          ) : error ? (
            <Alert
              severity="error"
              sx={{ mb: 3 }}
              icon={<CloseIcon fontSize="inherit" />}
            >
              {error}
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Book ID*"
                  name="id"
                  type="number"
                  value={formData.id}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  InputProps={{
                    sx: { bgcolor: colors.background.card },
                    inputProps: { min: 1 }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Title*"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  InputProps={{
                    sx: { bgcolor: colors.background.card }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Author*"
                  name="author"
                  value={formData.author}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  InputProps={{
                    sx: { bgcolor: colors.background.card }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Category*</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    label="Category*"
                    required
                    sx={{ bgcolor: colors.background.card }}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Publication Year"
                  name="year"
                  type="number"
                  value={formData.year}
                  onChange={handleChange}
                  variant="outlined"
                  InputProps={{
                    sx: { bgcolor: colors.background.card },
                    inputProps: { min: 0 }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Total Copies*"
                  name="totalCopies"
                  type="number"
                  value={formData.totalCopies}
                  onChange={handleChange}
                  required
                  variant="outlined"
                  InputProps={{
                    sx: { bgcolor: colors.background.card },
                    inputProps: { min: 1 }
                  }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  multiline
                  rows={4}
                  variant="outlined"
                  InputProps={{
                    sx: { bgcolor: colors.background.card }
                  }}
                />
              </Grid>
            </Grid>

            <Divider sx={{ my: 4 }} />

            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => navigate('/admin')}
                disabled={loading}
                sx={{ minWidth: 120 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} /> : <AddIcon />}
                sx={{ minWidth: 150 }}
              >
                {loading ? "Adding..." : "Add Book"}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Container>
    </Box>
  );
}

export default AddBookPage;