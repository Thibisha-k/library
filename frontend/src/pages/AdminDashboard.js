import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Snackbar,
  Alert,
  Grid,
  Container,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Tooltip,
  Divider,
  Paper,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  useTheme,
  useMediaQuery,
  Collapse,
  //IconButton,
  //CardActions,
  //CardHeader,
  //Avatar,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  Book as BookIcon,
  Logout as LogoutIcon,
  Visibility as VisibilityIcon,
  Search as SearchIcon,
  Autorenew as AutorenewIcon,
  //ExpandMore as ExpandMoreIcon,
  //ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";

function AdminDashboard({ username, onLogout }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  
  const colors = {
    primary: theme.palette.primary.main,
    secondary: theme.palette.secondary.main,
    error: theme.palette.error.main,
    background: {
      panel: theme.palette.mode === "dark" ? "rgba(0, 0, 0, 0.85)" : "rgba(255, 255, 255, 0.98)",
      card: theme.palette.mode === "dark" ? "rgba(40, 40, 40, 0.9)" : "rgba(255, 255, 255, 0.95)",
    },
    status: {
      available: theme.palette.success.main,
      unavailable: theme.palette.error.main,
      issued: theme.palette.warning.main,
    }
  };

  const [books, setBooks] = useState([]);
  const [newBook, setNewBook] = useState({
    id: "",
    title: "",
    author: "",
    category: "",
    year: "",
    description: "",
    totalCopies: 1,
  });
  const [editBookId, setEditBookId] = useState(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("");
  const [formExpanded, setFormExpanded] = useState(false);
  const navigate = useNavigate();
  const formRef = useRef(null);

  const categories = ["All", ...new Set(books.map(book => book.category))];

  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };
  };

  const fetchBooks = useCallback(async () => {
    try {
      const res = await axios.get(`http://localhost:5000/books${sortBy ? `?sortBy=${sortBy}` : ""}`, getAuthHeader());
      setBooks(res.data);
      setLoading(false);
    } catch (err) {
      setLoading(false);
      if (err.response?.status === 401) {
        onLogout();
      } else {
        showToast("❌ Failed to fetch books");
      }
    }
  }, [onLogout, sortBy]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setToastOpen(true);
  };

  const validateForm = () => {
    const { id, title, author, category, year, description, totalCopies } = newBook;
    if (!id || !title || !author || !category || !year || !description || !totalCopies) {
      showToast("❌ Please fill in all fields");
      return false;
    }
    if (isNaN(id) || parseInt(id) <= 0) {
      showToast("❌ ID must be a positive number");
      return false;
    }
    if (isNaN(year) || parseInt(year) <= 0) {
      showToast("❌ Year must be a positive number");
      return false;
    }
    if (isNaN(totalCopies) || parseInt(totalCopies) <= 0) {
      showToast("❌ Total Copies must be a positive number");
      return false;
    }
    return true;
  };

  const resetForm = () => {
    setNewBook({
      id: "",
      title: "",
      author: "",
      category: "",
      year: "",
      description: "",
      totalCopies: 1,
    });
    setEditBookId(null);
    setFormExpanded(false);
  };

  const handleAddBook = async () => {
    if (!validateForm()) return;
    try {
      const bookToAdd = {
        ...newBook,
        id: parseInt(newBook.id),
        year: parseInt(newBook.year),
        totalCopies: parseInt(newBook.totalCopies),
        availableCopies: parseInt(newBook.totalCopies),
        issued: false,
        dueDate: null,
        issuedBy: null,
      };
      await axios.post("http://localhost:5000/books", bookToAdd, getAuthHeader());
      showToast("✅ Book added successfully!");
      resetForm();
      fetchBooks();
    } catch (err) {
      showToast(`❌ Failed to add book: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleEditBook = async () => {
    if (!validateForm()) return;
    try {
      const existingBook = books.find((b) => b._id === editBookId);
      if (!existingBook) {
        showToast("❌ Book to update not found");
        return;
      }
      const totalCopiesNum = parseInt(newBook.totalCopies);
      const copiesIssued = existingBook.totalCopies - existingBook.availableCopies;
      if (totalCopiesNum < copiesIssued) {
        showToast(`❌ Total copies cannot be less than issued copies (${copiesIssued})`);
        return;
      }
      const updatedBook = {
        ...newBook,
        id: parseInt(newBook.id),
        year: parseInt(newBook.year),
        totalCopies: totalCopiesNum,
        availableCopies: totalCopiesNum - copiesIssued,
      };
      await axios.put(`http://localhost:5000/books/${editBookId}`, updatedBook, getAuthHeader());
      showToast("✏️ Book updated successfully!");
      resetForm();
      fetchBooks();
    } catch (err) {
      showToast(`❌ Failed to update book: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDeleteClick = (book) => {
    setBookToDelete(book);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      await axios.delete(`http://localhost:5000/books/${bookToDelete._id}`, getAuthHeader());
      showToast("🗑️ Book deleted!");
      fetchBooks();
    } catch (err) {
      showToast(`❌ Delete failed: ${err.response?.data?.error || err.message}`);
    } finally {
      setDeleteDialogOpen(false);
      setBookToDelete(null);
    }
  };

  const handleEditClick = (book) => {
    setNewBook({
      ...book,
      id: book.id.toString(),
      year: book.year.toString(),
    });
    setEditBookId(book._id);
    setFormExpanded(true);
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleToggleIssued = async (book) => {
    try {
      const updatedBook = { ...book, issued: !book.issued };
      await axios.put(`http://localhost:5000/books/${book._id}`, updatedBook, getAuthHeader());
      showToast(`Book marked as ${updatedBook.issued ? "Issued" : "Available"}`);
      fetchBooks();
    } catch (err) {
      showToast(`❌ Failed to update book status: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleIssueBook = async (book) => {
    try {
      await axios.put(`http://localhost:5000/books/${book._id}/issue`, {}, getAuthHeader());
      showToast("✅ Book issued");
      fetchBooks();
    } catch (err) {
      showToast(`❌ ${err.response?.data?.error || err.message}`);
    }
  };

  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         book.author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         book.id.toString().includes(searchTerm);
    const matchesCategory = categoryFilter === "All" || book.category === categoryFilter;
    return matchesSearch && matchesCategory;
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
            <BookIcon fontSize="large" color="primary" />
            <Typography variant="h4" fontWeight={700}>
              Library Admin Dashboard
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            <Tooltip title="View issued books">
              <Button
                variant="outlined"
                color="primary"
                startIcon={<VisibilityIcon />}
                onClick={() => navigate('/admin/issued-books')}
                sx={{ fontWeight: 600 }}
              >
                {isMobile ? "Issued" : "Issued Books"}
              </Button>
            </Tooltip>
            
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
        <Grid container spacing={4}>
          {/* Books Section (75% width) */}
          <Grid item xs={12} md={9}>
            <Paper
              elevation={3}
              sx={{
                p: 4,
                borderRadius: 2,
                bgcolor: colors.background.panel,
                mb: 4,
              }}
            >
              {/* Filter/Search Bar */}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={2}
                alignItems={{ xs: "stretch", sm: "center" }}
                mb={4}
              >
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search books..."
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
                
                <FormControl sx={{ minWidth: 120 }} size="small">
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    label="Category"
                    sx={{
                      bgcolor: colors.background.card,
                      borderRadius: 1,
                    }}
                  >
                    {categories.map((cat) => (
                      <MenuItem key={cat} value={cat}>{cat}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 120 }} size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    label="Sort By"
                    sx={{
                      bgcolor: colors.background.card,
                      borderRadius: 1,
                    }}
                  >
                    <MenuItem value="">None</MenuItem>
                    <MenuItem value="title">Title</MenuItem>
                    <MenuItem value="author">Author</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              {/* Add Book Button */}
              <Box display="flex" justifyContent="flex-end" mb={2}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={formExpanded ? <CloseIcon /> : <AddIcon />}
                  onClick={() => {
                    setFormExpanded(!formExpanded);
                    if (!formExpanded && formRef.current) {
                      formRef.current.scrollIntoView({ behavior: "smooth" });
                    }
                  }}
                  sx={{ fontWeight: 600 }}
                >
                  {formExpanded ? "Cancel" : "Add New Book"}
                </Button>
              </Box>

              {/* Book Form - Collapsible */}
              <Collapse in={formExpanded || !!editBookId}>
                <Box 
                  ref={formRef}
                  component="form"
                  sx={{ 
                    mb: 4,
                    p: 3,
                    borderRadius: 2,
                    bgcolor: colors.background.card,
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
                    gap: 2,
                    boxShadow: theme.shadows[2],
                  }}
                >
                  <TextField
                    label="ID"
                    type="number"
                    value={newBook.id}
                    onChange={(e) => setNewBook({ ...newBook, id: e.target.value })}
                    inputProps={{ min: 1 }}
                    size="small"
                    sx={{ bgcolor: colors.background.paper }}
                  />
                  <TextField
                    label="Title"
                    value={newBook.title}
                    onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
                    size="small"
                    sx={{ bgcolor: colors.background.paper }}
                  />
                  <TextField
                    label="Author"
                    value={newBook.author}
                    onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
                    size="small"
                    sx={{ bgcolor: colors.background.paper }}
                  />
                  <TextField
                    label="Category"
                    value={newBook.category}
                    onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
                    size="small"
                    sx={{ bgcolor: colors.background.paper }}
                  />
                  <TextField
                    label="Year"
                    type="number"
                    value={newBook.year}
                    onChange={(e) => setNewBook({ ...newBook, year: e.target.value })}
                    size="small"
                    sx={{ bgcolor: colors.background.paper }}
                  />
                  <TextField
                    label="Total Copies"
                    type="number"
                    value={newBook.totalCopies}
                    onChange={(e) => setNewBook({ ...newBook, totalCopies: e.target.value })}
                    size="small"
                    sx={{ bgcolor: colors.background.paper }}
                  />
                  <TextField
                    label="Description"
                    value={newBook.description}
                    onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
                    size="small"
                    sx={{ 
                      gridColumn: { xs: "1 / -1", md: "span 2" },
                      bgcolor: colors.background.paper
                    }}
                    multiline
                    rows={2}
                  />
                  <Box sx={{ 
                    gridColumn: "1 / -1",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 2
                  }}>
                    {editBookId ? (
                      <>
                        <Button 
                          variant="outlined"
                          color="secondary"
                          onClick={resetForm}
                          startIcon={<CloseIcon />}
                          sx={{ fontWeight: 600 }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          variant="contained" 
                          color="primary"
                          onClick={handleEditBook}
                          startIcon={<EditIcon />}
                          sx={{ fontWeight: 600 }}
                        >
                          Update Book
                        </Button>
                      </>
                    ) : (
                      <Button 
                        variant="contained" 
                        color="primary"
                        onClick={handleAddBook}
                        startIcon={<AddIcon />}
                        sx={{ fontWeight: 600 }}
                      >
                        Add Book
                      </Button>
                    )}
                  </Box>
                </Box>
              </Collapse>

              {/* Books Grid */}
               {loading ? (
                <Box display="flex" justifyContent="center" py={10}>
                  <CircularProgress color="primary" size={60} />
                </Box>
              ) : filteredBooks.length === 0 ? (
                <Typography 
                  textAlign="center" 
                  py={4} 
                  color="text.secondary"
                  variant="h6"
                >
                  {searchTerm ? "No matching books found" : "No books available"}
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
                            {book.description && (
                              <Typography 
                                variant="body2" 
                                color="text.secondary" 
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 3,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  mb: 2
                                }}
                              >
                                {book.description}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.secondary" display="block">
                              Copies: {book.availableCopies}/{book.totalCopies} available
                            </Typography>
                            <Chip 
                              label={book.category} 
                              size="small" 
                              sx={{ mt: 1, mb: 1 }} 
                            />
                          </Box>
                          
                          <Box 
                            display="flex" 
                            justifyContent="space-between" 
                            alignItems="center" 
                            mt={2}
                            sx={{
                              '& .MuiButton-root': {
                                minWidth: '120px',
                                height: '36px'
                              }
                            }}
                          >
                            <Chip
                              label={book.issued ? "Issued" : "Available"}
                              color={book.issued ? "warning" : "success"}
                              size="small"
                            />
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              disabled={book.availableCopies === 0}
                              onClick={() => handleIssueBook(book)}
                              sx={{ fontWeight: 600 }}
                            >
                              {isMobile ? "Issue" : "Issue Book"}
                            </Button>
                          </Box>

                          <Box display="flex" gap={1} mt={1}>
                            <Button
                              variant={book.issued ? "contained" : "outlined"}
                              color={book.issued ? "secondary" : "primary"}
                              size="small"
                              onClick={() => handleToggleIssued(book)}
                              fullWidth
                              sx={{ fontWeight: 600 }}
                              startIcon={book.issued ? <CheckIcon fontSize="small" /> : <BookIcon fontSize="small" />}
                            >
                              {book.issued ? "Mark Available" : "Mark Issued"}
                            </Button>
                          </Box>

                          <Box display="flex" gap={1} mt={1}>
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              onClick={() => handleEditClick(book)}
                              fullWidth
                              sx={{ fontWeight: 600 }}
                              startIcon={<EditIcon fontSize="small" />}
                            >
                              {isMobile ? "Edit" : "Edit Book"}
                            </Button>
                            <Button
                              variant="outlined"
                              color="error"
                              size="small"
                              onClick={() => handleDeleteClick(book)}
                              fullWidth
                              sx={{ fontWeight: 600 }}
                              startIcon={<DeleteIcon fontSize="small" />}
                            >
                              {isMobile ? "Delete" : "Delete Book"}
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Paper>
          </Grid>
          {/* Admin Actions Sidebar (25% width) */}
          <Grid item xs={12} md={3}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                borderRadius: 2,
                bgcolor: colors.background.panel,
                height: "100%",
                position: "sticky",
                top: 20,
              }}
            >
              <Typography variant="h5" fontWeight={700} gutterBottom>
                <BookIcon sx={{ verticalAlign: "middle", mr: 1 }} />
                Quick Stats
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Box sx={{ p: 2, bgcolor: colors.background.card, borderRadius: 1, mb: 3 }}>
                <Stack spacing={1}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body1">Total Books:</Typography>
                    <Typography variant="body1" fontWeight={600}>{books.length}</Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body1">Available:</Typography>
                    <Typography variant="body1" fontWeight={600} color={colors.status.available}>
                      {books.filter(b => b.availableCopies > 0).length}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body1">Issued:</Typography>
                    <Typography variant="body1" fontWeight={600} color={colors.status.issued}>
                      {books.filter(b => b.issued).length}
                    </Typography>
                  </Box>
                </Stack>
              </Box>

              <Typography variant="h5" fontWeight={700} gutterBottom>
                <AutorenewIcon sx={{ verticalAlign: "middle", mr: 1 }} />
                System Controls
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Button
                variant="contained"
                color="primary"
                fullWidth
                startIcon={<AutorenewIcon />}
                onClick={fetchBooks}
                sx={{ mb: 2, fontWeight: 600 }}
              >
                Refresh Data
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the book "{bookToDelete?.title}" by {bookToDelete?.author}?
          </Typography>
          <Typography variant="body2" color="error" sx={{ mt: 2 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" startIcon={<DeleteIcon />}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Toast Snackbar */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        sx={{ mb: 4, mr: 2 }}
      >
        <Alert
          severity={
            toastMessage.startsWith("❌")
              ? "error"
              : toastMessage.startsWith("✅") ||
                toastMessage.startsWith("✏️") ||
                toastMessage.startsWith("🗑️")
              ? "success"
              : "info"
          }
          sx={{ width: "100%", boxShadow: theme.shadows[6] }}
          variant="filled"
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {toastMessage.startsWith("❌") && <CloseIcon />}
            {toastMessage.startsWith("✅") && <CheckIcon />}
            {toastMessage.startsWith("✏️") && <EditIcon />}
            {toastMessage.startsWith("🗑️") && <DeleteIcon />}
            <span>{toastMessage}</span>
          </Box>
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default AdminDashboard;