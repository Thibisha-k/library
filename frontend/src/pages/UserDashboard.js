import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  TextField,
  Grid,
  Container,
  Chip,
  Divider,
  Stack,
  CircularProgress,
  Snackbar,
  Alert,
  IconButton,
  Tooltip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  useTheme,
  useMediaQuery,
  LinearProgress,
  //Slider
} from "@mui/material";
import {
  Book as BookIcon,
  Logout as LogoutIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ExpandMore,
  ExpandLess
} from "@mui/icons-material";

function UserDashboard({ username, onLogout }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();

  // Theme-aware colors
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
      issued: theme.palette.warning.main,
    }
  };

  // State
  const [books, setBooks] = useState([]);
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [sortBy, setSortBy] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showBorrowed, setShowBorrowed] = useState(false);
  const [showWishlist, setShowWishlist] = useState(false);

  // Frontend-only state
  const [wishlist, setWishlist] = useState(() => {
    const saved = localStorage.getItem('wishlist');
    return saved ? JSON.parse(saved) : [];
  });
  

  const [popularityData, setPopularityData] = useState(() => {
    const saved = localStorage.getItem('popularityData');
    if (saved) return JSON.parse(saved);
    
    const generated = {};
    books.forEach(book => {
      generated[book._id] = Math.floor(Math.random() * 100);
    });
    return generated;
  });

  // Memoized handlers
  const handleLogout = useCallback(() => {
    localStorage.clear();
    onLogout();
    navigate("/");
  }, [onLogout, navigate]);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setToastOpen(true);
  }, []);

  const fetchBooks = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`https://library-lzho.onrender.com/books${sortBy ? `?sortBy=${sortBy}` : ""}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBooks(response.data);
      
      setPopularityData(prev => {
        const newData = {...prev};
        let needsUpdate = false;
        
        response.data.forEach(book => {
          if (!newData[book._id]) {
            newData[book._id] = Math.floor(Math.random() * 100);
            needsUpdate = true;
          }
        });
        
        if (needsUpdate) {
          localStorage.setItem('popularityData', JSON.stringify(newData));
        }
        
        return newData;
      });
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        showToast("Error fetching books");
      }
    }
  }, [sortBy, handleLogout, showToast]);

  const fetchIssuedBooks = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("https://library-lzho.onrender.com/issued", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setIssuedBooks(response.data.filter(book => book.issuedBy === username));
    } catch (err) {
      if (err.response?.status === 401) {
        handleLogout();
      } else {
        showToast("Error fetching issued books");
      }
    }
  }, [username, handleLogout, showToast]);

  // Wishlist handlers
  const toggleWishlist = useCallback((bookId) => {
    setWishlist(prev => {
      const newWishlist = prev.includes(bookId) 
        ? prev.filter(id => id !== bookId)
        : [...prev, bookId];
      localStorage.setItem('wishlist', JSON.stringify(newWishlist));
      return newWishlist;
    });
  }, []);

  

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        await Promise.all([fetchBooks(), fetchIssuedBooks()]);
      } catch (err) {
        showToast("Error fetching data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [fetchBooks, fetchIssuedBooks, showToast]);

  const handleIssue = useCallback(async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `https://library-lzho.onrender.com/books/${id}/issue`,
        { username },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("✅ Book issued successfully!");
      await Promise.all([fetchBooks(), fetchIssuedBooks()]);
    } catch (err) {
      showToast(`❌ ${err.response?.data?.error || "Failed to issue book"}`);
    }
  }, [username, showToast, fetchBooks, fetchIssuedBooks]);

  const handleReturn = useCallback(async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `https://library-lzho.onrender.com/books/${id}/return`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("📘 Book returned successfully!");
      await Promise.all([fetchBooks(), fetchIssuedBooks()]);
    } catch (err) {
      showToast(`❌ ${err.response?.data?.error || "Failed to return book"}`);
    }
  }, [showToast, fetchBooks, fetchIssuedBooks]);

  // Filter and sort logic
  const categories = ["All", ...new Set(books.map(book => book.category))];
  
  const filteredBooks = books.filter(book => {
    const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         book.author.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "All" || book.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const sortedBooks = [...filteredBooks].sort((a, b) => {
    if (sortBy === "title") return a.title.localeCompare(b.title);
    if (sortBy === "author") return a.author.localeCompare(b.author);
    if (sortBy === "popularity") return (popularityData[b._id] || 0) - (popularityData[a._id] || 0);
    return 0;
  });

  const availableBooks = sortedBooks.filter(book => book.availableCopies > 0);
  const otherBorrowedBooks = sortedBooks.filter(book => 
    book.availableCopies === 0 && book.issuedBy !== username
    
  );

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
              Library User Dashboard
            </Typography>
          </Box>
          {/* Quick-Access Buttons for Borrowed Books & Wishlist */}
<Box sx={{ 
  display: 'flex', 
  gap: 2, 
  mb: 3,
  justifyContent: 'center',
  flexWrap: 'wrap'
}}>
  <Button
    variant={showBorrowed ? "contained" : "outlined"}
    color="primary"
    startIcon={<BookIcon />}
    onClick={() => setShowBorrowed(!showBorrowed)}
    sx={{ 
      fontWeight: 600,
      borderRadius: 50, // Pill-shaped
      px: 3,
      textTransform: 'none' // Prevents uppercase
    }}
  >
    My Borrowed Books
  </Button>

  <Button
    variant={showWishlist ? "contained" : "outlined"}
    color="secondary"
    startIcon={<FavoriteIcon />}
    onClick={() => setShowWishlist(!showWishlist)}
    sx={{ 
      fontWeight: 600,
      borderRadius: 50, // Pill-shaped
      px: 3,
      textTransform: 'none'
    }}
  >
    My Wishlist
  </Button>
</Box>
          
          <Box display="flex" alignItems="center" gap={2}>
            <Chip
              label={`Welcome, ${username}`}
              color="primary"
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
            <Button
              variant="outlined"
              color="error"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
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
                    <MenuItem value="popularity">Popularity</MenuItem>
                  </Select>
                </FormControl>
              </Stack>

              {/* Books Grid */}
              {loading ? (
                <Box display="flex" justifyContent="center" py={10}>
                  <CircularProgress color="primary" size={60} />
                </Box>
              ) : sortedBooks.length === 0 ? (
                <Typography 
                  textAlign="center" 
                  py={4} 
                  color="text.secondary"
                  variant="h6"
                >
                  {searchTerm ? "No matching books found" : "No books available"}
                </Typography>
              ) : (
                <>
                  {/* Available Books Section */}
                  {availableBooks.length > 0 && (
                    <Box mb={4}>
                      <Typography variant="h6" gutterBottom color="text.primary" fontWeight={600}>
                        Available Books
                      </Typography>
                      <Grid container spacing={3}>
                        {availableBooks.map((book) => (
                          <Grid item xs={12} sm={6} md={3} key={book._id}>
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
                                  <Box display="flex" justifyContent="space-between">
                                    <Typography variant="h6" fontWeight={600} gutterBottom noWrap sx={{ maxWidth: '80%' }}>
                                      {book.title}
                                    </Typography>
                                    <IconButton 
                                      onClick={() => toggleWishlist(book._id)}
                                      sx={{ p: 0 }}
                                    >
                                      {wishlist.includes(book._id) ? (
                                        <FavoriteIcon color="error" />
                                      ) : (
                                        <FavoriteBorderIcon />
                                      )}
                                    </IconButton>
                                  </Box>
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
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" display="block" gutterBottom>
                                      Popularity
                                    </Typography>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={popularityData[book._id] || 0} 
                                      sx={{ height: 8, borderRadius: 4 }}
                                    />
                                    <Typography variant="caption" display="block" textAlign="right">
                                      {popularityData[book._id] || 0}%
                                    </Typography>
                                  </Box>
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
                                    label={`Available (${book.availableCopies} left)`}
                                    color="success"
                                    size="small"
                                  />
                                  <Button
                                    variant="contained"
                                    color="primary"
                                    size="small"
                                    startIcon={<CheckCircleIcon />}
                                    onClick={() => handleIssue(book._id)}
                                    sx={{ fontWeight: 600 }}
                                  >
                                    {isMobile ? "Borrow" : "Borrow Book"}
                                  </Button>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}

                  {/* Other Borrowed Books Section */}
                  {otherBorrowedBooks.length > 0 && (
                    <Box>
                      <Typography variant="h6" gutterBottom color="text.secondary" fontWeight={600}>
                        Currently Unavailable (Borrowed by Others)
                      </Typography>
                      <Grid container spacing={3}>
                        {otherBorrowedBooks.map((book) => (
                          <Grid item xs={12} sm={6} md={3} key={book._id}>
                            <Card
                              sx={{
                                height: "100%",
                                display: "flex",
                                flexDirection: "column",
                                bgcolor: colors.background.card,
                                opacity: 0.7,
                                transition: "transform 0.3s, box-shadow 0.3s",
                                "&:hover": {
                                  transform: "translateY(-5px)",
                                  boxShadow: theme.shadows[6],
                                },
                              }}
                            >
                              <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                                <Box flexGrow={1}>
                                  <Box display="flex" justifyContent="space-between">
                                    <Typography variant="h6" fontWeight={600} gutterBottom noWrap sx={{ maxWidth: '80%' }}>
                                      {book.title}
                                    </Typography>
                                    <IconButton 
                                      onClick={() => toggleWishlist(book._id)}
                                      sx={{ p: 0 }}
                                    >
                                      {wishlist.includes(book._id) ? (
                                        <FavoriteIcon color="error" />
                                      ) : (
                                        <FavoriteBorderIcon />
                                      )}
                                    </IconButton>
                                  </Box>
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
                                  <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" display="block" gutterBottom>
                                      Popularity
                                    </Typography>
                                    <LinearProgress 
                                      variant="determinate" 
                                      value={popularityData[book._id] || 0} 
                                      sx={{ height: 8, borderRadius: 4 }}
                                    />
                                    <Typography variant="caption" display="block" textAlign="right">
                                      {popularityData[book._id] || 0}%
                                    </Typography>
                                  </Box>
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
                                    label={`All copies borrowed`}
                                    color="warning"
                                    size="small"
                                  />
                                  <Button
                                    variant="outlined"
                                    color="inherit"
                                    size="small"
                                    disabled
                                    sx={{ fontWeight: 600 }}
                                  >
                                    Unavailable
                                  </Button>
                                </Box>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  )}
                </>
              )}
            </Paper>
          </Grid>

          {/* Sidebar (25% width) */}
          <Grid item xs={12} md={3}>
            <Stack spacing={4}>
              {/* Borrowed Books Section */}
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: colors.background.panel,
                  cursor: 'pointer',
                }}
                onClick={() => setShowBorrowed(!showBorrowed)}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h5" fontWeight={700}>
                    <BookIcon sx={{ verticalAlign: "middle", mr: 1 }} />
                    My Borrowed Books
                  </Typography>
                  <IconButton>
                    {showBorrowed ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>
                
                {showBorrowed && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    {issuedBooks.length === 0 ? (
                      <Typography color="text.secondary" textAlign="center" py={2}>
                        You haven't borrowed any books yet
                      </Typography>
                    ) : (
                      <List dense>
                        {issuedBooks.map((book) => (
                          <React.Fragment key={book._id}>
                            <ListItem
                              secondaryAction={
                                <Tooltip title="Return book">
                                  <IconButton
                                    edge="end"
                                    color="error"
                                    onClick={() => handleReturn(book._id)}
                                  >
                                    <CancelIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              }
                            >
                              <ListItemText
                                primary={
                                  <Typography fontWeight={500} noWrap>
                                    {book.title}
                                  </Typography>
                                }
                                secondary={
                                  <>
                                    <Typography component="span" variant="body2" color="text.secondary">
                                      Due: {book.dueDate || "Not specified"}
                                    </Typography>
                                    <br />
                                    <Typography component="span" variant="caption" color="text.secondary">
                                      {book.availableCopies}/{book.totalCopies} copies available
                                    </Typography>
                                    
                                  </>
                                }
                              />
                            </ListItem>
                            <Divider sx={{ my: 1 }} />
                          </React.Fragment>
                        ))}
                      </List>
                    )}
                  </>
                )}
              </Paper>

              {/* Wishlist Section */}
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: colors.background.panel,
                  cursor: 'pointer',
                }}
                onClick={() => setShowWishlist(!showWishlist)}
              >
                <Box display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="h5" fontWeight={700}>
                    <FavoriteIcon sx={{ verticalAlign: "middle", mr: 1, color: 'error.main' }} />
                    My Wishlist
                  </Typography>
                  <IconButton>
                    {showWishlist ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                </Box>
                
                {showWishlist && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    {wishlist.length === 0 ? (
                      <Typography color="text.secondary" textAlign="center" py={2}>
                        Your wishlist is empty
                      </Typography>
                    ) : (
                      <List dense>
                        {wishlist
                          .filter(bookId => books.some(b => b._id === bookId))
                          .map(bookId => {
                            const book = books.find(b => b._id === bookId);
                            if (!book) return null;
                            
                            return (
                              <React.Fragment key={book._id}>
                                <ListItem>
                                  <ListItemText
                                    primary={
                                      <Typography fontWeight={500} noWrap>
                                        {book.title}
                                      </Typography>
                                    }
                                    secondary={
                                      <>
                                        <Typography component="span" variant="body2" color="text.secondary">
                                          {book.author}
                                        </Typography>
                                        <br />
                                        <Typography component="span" variant="caption" color="text.secondary">
                                          Status: {book.availableCopies > 0 ? 'Available' : 'Borrowed'}
                                        </Typography>
                                      </>
                                    }
                                  />
                                </ListItem>
                                <Divider sx={{ my: 1 }} />
                              </React.Fragment>
                            );
                          })}
                      </List>
                    )}
                  </>
                )}
              </Paper>
            </Stack>
          </Grid>
        </Grid>
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
            toastMessage.startsWith("❌") ? "error" : 
            toastMessage.startsWith("✅") || toastMessage.startsWith("📘") ? "success" : 
            "info"
          }
          sx={{ width: "100%", boxShadow: theme.shadows[6] }}
          variant="filled"
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {toastMessage.startsWith("❌") && <CancelIcon />}
            {toastMessage.startsWith("✅") && <CheckCircleIcon />}
            {toastMessage.startsWith("📘") && <BookIcon />}
            <span>{toastMessage}</span>
          </Box>
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default UserDashboard;