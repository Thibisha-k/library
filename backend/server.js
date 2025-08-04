require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./db');
const Book = require('./models/Book');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.json());
app.use(cookieParser());
connectDB();

const JWT_SECRET = process.env.JWT_SECRET || "library_secret_key";

// ✅ Preload Sample Data
const preloadData = async () => {
  const [booksCount, usersCount] = await Promise.all([
    Book.countDocuments(),
    User.countDocuments()
  ]);

  if (booksCount === 0) {
    const sampleBooks = [
      {
        id: 1,
        title: "The Girl in Room 105",
        author: "Chetan Bhagat",
        category: "Thriller",
        year: 2018,
        description: "A suspense thriller involving a mysterious murder.",
        issued: false,
        dueDate: null,
        returnStatus: "Not Returned",
        issuedBy: null
      },
      {
        id: 2,
        title: "The Mahabharata Secret",
        author: "Christopher C. Doyle",
        category: "Thriller",
        year: 2013,
        description: "A gripping historical thriller based on ancient Indian secrets.",
        issued: false,
        dueDate: null,
        returnStatus: "Not Returned",
        issuedBy: null
      },
      {
        id: 3,
        title: "The Immortals of Meluha",
        author: "Amish Tripathi",
        category: "Fantasy",
        year: 2010,
        description: "A mythological fantasy reimagining Lord Shiva’s life.",
        issued: false,
        dueDate: null,
        returnStatus: "Not Returned",
        issuedBy: null
      },
      {
        id: 4,
        title: "The Secret of the Nagas",
        author: "Amish Tripathi",
        category: "Fantasy",
        year: 2011,
        description: "Sequel to Immortals of Meluha, diving deeper into Indian mythology.",
        issued: false,
        dueDate: null,
        returnStatus: "Not Returned",
        issuedBy: null
      },
      {
        id: 5,
        title: "Grandma's Bag of Stories",
        author: "Sudha Murty",
        category: "Kids",
        year: 2012,
        description: "A delightful collection of moral stories for kids.",
        issued: false,
        dueDate: null,
        returnStatus: "Not Returned",
        issuedBy: null
      },
      {
        id: 6,
        title: "The Magic Drum and Other Favourite Stories",
        author: "Sudha Murty",
        category: "Kids",
        year: 2008,
        description: "Traditional folk tales retold for children.",
        issued: false,
        dueDate: null,
        returnStatus: "Not Returned",
        issuedBy: null
      },
      {
        id: 7,
        title: "2 States",
        author: "Chetan Bhagat",
        category: "Romance",
        year: 2009,
        description: "A love story about a couple from different Indian states.",
        issued: false,
        dueDate: null,
        returnStatus: "Not Returned",
        issuedBy: null
      },
      {
        id: 8,
        title: "I Too Had a Love Story",
        author: "Ravinder Singh",
        category: "Romance",
        year: 2008,
        description: "A heart-touching romantic tale based on a true story.",
        issued: false,
        dueDate: null,
        returnStatus: "Not Returned",
        issuedBy: null
      },
      {
        id: 9,
        title: "Serious Men",
        author: "Manu Joseph",
        category: "Comedy",
        year: 2010,
        description: "A satirical novel exploring ambition and caste in India.",
        issued: false,
        dueDate: null,
        returnStatus: "Not Returned",
        issuedBy: null
      },
      {
        id: 10,
        title: "Don’t Tell the Governor",
        author: "Ravi Subramanian",
        category: "Comedy",
        year: 2018,
        description: "A humorous political fiction novel.",
        issued: false,
        dueDate: null,
        returnStatus: "Not Returned",
        issuedBy: null
      }
    ];
    await Book.insertMany(sampleBooks);
    console.log("📚 Sample books loaded");
  }

  if (usersCount === 0) {
    const adminUser = new User({
      username: 'admin',
      password: await bcrypt.hash('admin123', 10),
      role: 'admin'
    });
    await adminUser.save();
    console.log("👑 Admin user created (admin:admin123)");
  }
};
preloadData();

// 🔐 Auth Middleware
const authenticate = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// 🔐 Auth Routes
app.post('/register', async (req, res) => {
  try {
    const { username, password, role } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).json({ error: 'Username already exists' });

    const user = new User({
      username,
      password: await bcrypt.hash(password, 10),
      role: role || 'user'
    });
    await user.save();

    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 86400000
    });

    res.json({ token, username: user.username, role: user.role });
  } catch (err) {
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// 📚 BOOK ROUTES

// ✅ GET all books (authenticated and user-aware)
app.get('/books', authenticate, async (req, res) => {
  try {
    const { sortBy } = req.query;
    const currentUser = req.user.username;

    let books = await Book.find();

    books = books.map(book => {
      const overdue = book.issued && book.dueDate && new Date(book.dueDate) < new Date();
      return {
        ...book._doc,
        overdue,
        canReturn: book.issuedBy === currentUser
      };
    });

    if (sortBy === 'title') books.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === 'dueDate') books.sort((a, b) =>
      new Date(a.dueDate || Infinity) - new Date(b.dueDate || Infinity)
    );

    res.json(books);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// ✅ GET /issued — Books issued by current user only
app.get('/issued', authenticate, async (req, res) => {
  try {
    const username = req.user.username;
    const books = await Book.find({ issued: true, issuedBy: username });

    const currentDate = new Date();
    const userIssued = books.map(book => {
      const overdue = book.dueDate && new Date(book.dueDate) < currentDate;
      return {
        ...book._doc,
        overdue,
        returnStatus: book.returnStatus || "Not Returned"
      };
    });

    res.json(userIssued);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch issued books" });
  }
});

// ✅ Issue book to user
app.put("/books/:id/issue", authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  const username = req.user.username;

  const book = await Book.findOne({ id });
  if (!book) return res.status(404).json({ error: "Book not found" });
  if (book.issued) return res.status(400).json({ error: "Already issued" });

  const issuedCount = await Book.countDocuments({ issued: true, issuedBy: username });
  if (issuedCount >= 3) return res.status(400).json({ error: "Issue limit reached (3 books)" });

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);

  book.issued = true;
  book.dueDate = dueDate.toISOString().split("T")[0];
  book.returnStatus = "Not Returned";
  book.issuedBy = username;

  await book.save();
  res.json(book);
});

// ✅ Return book — Only by the user who issued it
app.put("/books/:id/return", authenticate, async (req, res) => {
  const id = parseInt(req.params.id);
  const username = req.user.username;

  const book = await Book.findOne({ id });
  if (!book || !book.issued || book.issuedBy !== username) {
    return res.status(403).json({ error: "Unauthorized return attempt" });
  }

  book.issued = false;
  book.dueDate = null;
  book.returnStatus = "Returned";
  book.issuedBy = null;

  await book.save();
  res.json(book);
});

// ➕ Add new book
app.post("/books", async (req, res) => {
  try {
    const newBook = new Book(req.body);
    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    res.status(400).json({ error: "Failed to add book", details: err.message });
  }
});

// 🗑️ Delete book
app.delete("/books/:id", async (req, res) => {
  try {
    const deleted = await Book.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Book not found" });
    res.json({ message: "Book deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed", details: err.message });
  }
});

// ✏️ Edit book
app.put("/books/:id", async (req, res) => {
  try {
    const updatedBook = await Book.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedBook);
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
