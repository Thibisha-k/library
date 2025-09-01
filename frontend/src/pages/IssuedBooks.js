import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Paper,
  Container,
  Chip,
  useTheme,
  Stack,
  TextField,
  IconButton
} from "@mui/material";
import {
  Book as BookIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon
} from "@mui/icons-material";

function IssuedBooks({ username, onLogout }) {
  const theme = useTheme();
  const navigate = useNavigate();

  const colors = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    error: theme.palette.error.main,
    background: {
      panel: theme.palette.mode === "dark" ? "rgba(0, 0, 0, 0.85)" : "rgba(255, 255, 255, 0.98)",
      card: theme.palette.mode === "dark" ? "rgba(40, 40, 40, 0.9)" : "rgba(255, 255, 255, 0.95)",
    },
    status: {
      issued: theme.palette.warning.main,
      returned: theme.palette.success.main,
    }
  };

  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setToastOpen(true);
  }, []);

  const getAuthHeader = useCallback(() => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  }, []);

  const fetchIssuedBooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get("https://library-lzho.onrender.com/books/issued", getAuthHeader());
      setBooks(response.data);
    } catch (err) {
      console.error("Error fetching issued books:", err);
      setError(err.response?.data?.error || "Failed to fetch issued books");
      if (err.response?.status === 401) {
        showToast("Session expired. Please login again.");
        setTimeout(() => onLogout(), 2000);
      }
    } finally {
      setLoading(false);
    }
  }, [getAuthHeader, onLogout, showToast]);

  useEffect(() => {
    fetchIssuedBooks();
  }, [fetchIssuedBooks]);

  const handleRefresh = useCallback(() => {
    showToast("Refreshing borrowed books...");
    fetchIssuedBooks();
  }, [fetchIssuedBooks, showToast]);

  const filteredBooks = books.filter(book => {
    const searchLower = searchTerm.toLowerCase();
    return (
      book.title.toLowerCase().includes(searchLower) ||
      book.author.toLowerCase().includes(searchLower) ||
      (book.issuedBy && book.issuedBy.toLowerCase().includes(searchLower)) ||
      book.id.toString().includes(searchTerm)
    );
  });

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
      <Container maxWidth="xl">
        {/* Header */}
        <Paper
          elevation={3}
          sx={{
            mb: 4,
            p: 3,
            borderRadius: 2,
            bgcolor: colors.background.panel,
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Box display="flex" alignItems="center" gap={2}>
            <IconButton onClick={() => navigate(-1)} color="primary">
              <ArrowBackIcon />
            </IconButton>
            <BookIcon fontSize="large" color="primary" />
            <Typography variant="h4" fontWeight={700}>
              Borrowed Books Management
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
              startIcon={<LogoutIcon />}
              onClick={onLogout}
              sx={{ fontWeight: 600 }}
            >
              Logout
            </Button>
          </Box>
        </Paper>

        {/* Main Content */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            borderRadius: 2,
            bgcolor: colors.background.panel,
            mb: 4,
          }}
        >
          {/* Search Bar */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", sm: "center" }}
            mb={4}
          >
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search borrowed books by title, author, borrower or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: theme.palette.text.secondary, mr: 1 }} />
                ),
                sx: {
                  bgcolor: colors.background.card,
                  borderRadius: 1,
                }
              }}
            />
            <Button
              variant="outlined"
              color="primary"
              startIcon={<RefreshIcon />}
              onClick={handleRefresh}
              sx={{ fontWeight: 600, minWidth: '120px' }}
            >
              Refresh
            </Button>
          </Stack>

          {loading ? (
            <Box display="flex" justifyContent="center" py={10}>
              <CircularProgress color="primary" size={60} />
            </Box>
          ) : error ? (
            <Alert severity="error" sx={{ mb: 4 }}>
              {error}
            </Alert>
          ) : filteredBooks.length === 0 ? (
            <Typography 
              textAlign="center" 
              py={4} 
              color="text.secondary"
              variant="h6"
            >
              {searchTerm ? "No matching borrowed books found" : "No books are currently borrowed"}
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {filteredBooks.map((book) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={book._id}>
                  <Card
                    sx={{
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      bgcolor: colors.background.card,
                      transition: "transform 0.3s, box-shadow 0.3s",
                      "&:hover": {
                        transform: "translateY(-5px)",
                        boxShadow: theme.shadows[6],
                      },
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Box flexGrow={1}>
                        <Typography variant="h6" fontWeight={600} gutterBottom noWrap>
                          {book.title}
                        </Typography>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                          {book.author}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Borrowed By:</strong> {book.issuedBy || "Unknown"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Due Date:</strong> {book.dueDate || "Not specified"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>ID:</strong> {book.id}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          <strong>Category:</strong> {book.category}
                        </Typography>
                        {book.description && (
                          <Typography 
                            variant="body2" 
                            color="text.secondary" 
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 3,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                              mb: 2,
                              fontStyle: 'italic'
                            }}
                          >
                            {book.description}
                          </Typography>
                        )}
                      </Box>
                      <Box 
                        display="flex" 
                        justifyContent="space-between" 
                        alignItems="center" 
                        mt={2}
                      >
                        <Chip
                          label="Borrowed"
                          color="warning"
                          size="small"
                        />
                        {book.dueDate && new Date(book.dueDate) < new Date() && (
                          <Chip
                            label="Overdue"
                            color="error"
                            size="small"
                          />
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      </Container>
      
      {/* Toast Notification */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        sx={{ mb: 4, mr: 2 }}
      >
        <Alert
          severity={
            toastMessage.startsWith("❌") ? "error" : "success"
          }
          sx={{ width: "100%", boxShadow: theme.shadows[6] }}
          variant="filled"
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {toastMessage.startsWith("❌") && <CheckCircleIcon />}
            {toastMessage.startsWith("✅") && <CheckCircleIcon />}
            <span>{toastMessage}</span>
          </Box>
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default IssuedBooks;