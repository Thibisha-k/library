
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Book = require('./models/Book');
const User = require('./models/user');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const connectDB = require('./db');

const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || "library_secret_key";

const app = express();
// Middlewares
app.use(cors({
  origin: 'https://astonishing-sherbet-0a0dd1.netlify.app/', // replace with your Netlify URL
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

app.use(express.json());
app.use(cookieParser());
app.use(helmet());

// Preload sample data if empty
const preloadData = async () => {
  const [booksCount, usersCount] = await Promise.all([
    Book.countDocuments(),
    User.countDocuments()
  ]);


  if (booksCount === 0) {
    const sampleBooks = [  {
    id: 1,
    title: "The Girl in Room 105",
    author: "Chetan Bhagat",
    category: "Thriller",
    year: 2018,
    description: "A suspense thriller involving a mysterious murder.",
    totalCopies: 5,
    availableCopies: 5,
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
    totalCopies: 4,
    availableCopies: 4,
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
    totalCopies: 6,
    availableCopies: 6,
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
    totalCopies: 6,
    availableCopies: 6,
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
    totalCopies: 7,
    availableCopies: 7,
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
    totalCopies: 5,
    availableCopies: 5,
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
    totalCopies: 8,
    availableCopies: 8,
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
    totalCopies: 6,
    availableCopies: 6,
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
    totalCopies: 5,
    availableCopies: 5,
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
    totalCopies: 7,
    availableCopies: 7,
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

// Auth middleware
const authenticate = (req, res, next) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Authentication required' });

  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    console.error('Token verification failed:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
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
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed', details: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
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
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ message: 'Logged out' });
});

// Book routes
app.get('/books', authenticate, async (req, res) => {
  try {
    const { sortBy } = req.query;
    const currentUser = req.user.username;

    let books = await Book.find();

    books = books.map(book => {
      const isAvailable = book.availableCopies > 0;
      const isBorrowedByMe = book.issuedBy === currentUser && book.returnStatus === "Not Returned";
      const overdue = book.dueDate && new Date(book.dueDate) < new Date();
      
      return {
        ...book._doc,
        isAvailable,
        isBorrowedByMe,
        overdue,
        canReturn: isBorrowedByMe
      };
    });

    if (sortBy === 'title') books.sort((a, b) => a.title.localeCompare(b.title));
    if (sortBy === 'dueDate') books.sort((a, b) =>
      new Date(a.dueDate || Infinity) - new Date(b.dueDate || Infinity)
    );

    res.json(books);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// Get all issued books (Admin only)
app.get('/books/issued', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const issuedBooks = await Book.find({ 
      issued: true,
      returnStatus: "Not Returned"
    }).sort({ dueDate: 1 });

    res.json(issuedBooks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch issued books' });
  }
});

// Get issued books for current user
app.get('/issued', authenticate, async (req, res) => {
  try {
    const username = req.user.username;
    const books = await Book.find({ 
      issuedBy: username,
      returnStatus: "Not Returned"
    });

    const currentDate = new Date();
    const userIssued = books.map(book => ({
      ...book._doc,
      overdue: book.dueDate && new Date(book.dueDate) < currentDate
    }));

    res.json(userIssued);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch issued books" });
  }
});
// Issue a book by _id
app.put("/books/:_id/issue", authenticate, async (req, res) => {
  try {
    const { _id } = req.params;
    const username = req.user.username;

    const book = await Book.findById(_id);
    if (!book) return res.status(404).json({ error: "Book not found" });

    if (book.availableCopies <= 0) {
      return res.status(400).json({ error: "No copies available to issue" });
    }

    // Check user's issue limit
    const issuedCount = await Book.countDocuments({ 
      issuedBy: username, 
      returnStatus: "Not Returned" 
    });
    if (issuedCount >= 3) {
      return res.status(400).json({ error: "Issue limit reached (3 books)" });
    }

    // Update book status
    book.availableCopies -= 1;
    if (book.availableCopies === book.totalCopies - 1) {
      book.issued = true; // First copy being issued
    }

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);
    book.dueDate = dueDate.toISOString().split("T")[0];
    book.returnStatus = "Not Returned";
    book.issuedBy = username;

    await book.save();
    res.json(book);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to issue book" });
  }
});

// Return a book by _id
app.put("/books/:_id/return", authenticate, async (req, res) => {
  try {
    const { _id } = req.params;
    const username = req.user.username;

    const book = await Book.findById(_id);
    if (!book) return res.status(404).json({ error: "Book not found" });

    if (book.issuedBy !== username || book.returnStatus === "Returned") {
      return res.status(403).json({ error: "Unauthorized return attempt" });
    }

    // Update book status
    book.availableCopies += 1;
    if (book.availableCopies === book.totalCopies) {
      book.issued = false; // All copies returned
    }

    book.dueDate = null;
    book.returnStatus = "Returned";
    book.issuedBy = null;

    await book.save();
    res.json(book);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to return book" });
  }
});
// Add new book
app.post("/books", async (req, res) => {
  try {
    const newBook = new Book(req.body);
    // If availableCopies not provided, set equal to totalCopies
    if (newBook.availableCopies === undefined) {
      newBook.availableCopies = newBook.totalCopies;
    }
    newBook.issued = false;
    newBook.dueDate = null;
    newBook.returnStatus = "Not Returned";
    newBook.issuedBy = null;

    await newBook.save();
    res.status(201).json(newBook);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: "Failed to add book", details: err.message });
  }
});

// Delete book by _id
app.delete("/books/:_id", async (req, res) => {
  try {
    const { _id } = req.params;
    const deleted = await Book.findByIdAndDelete(_id);
    if (!deleted) return res.status(404).json({ error: "Book not found" });
    res.json({ message: "Book deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Delete failed", details: err.message });
  }
});

// Edit book by _id
app.put("/books/:_id", async (req, res) => {
  try {
    const { _id } = req.params;
    const updateData = req.body;

    const existingBook = await Book.findById(_id);
    if (!existingBook) return res.status(404).json({ error: "Book not found" });

    // Calculate number of issued copies currently
    const issuedCopies = existingBook.totalCopies - existingBook.availableCopies;

    // Validate totalCopies update does not make it less than issued copies
    if (updateData.totalCopies !== undefined) {
      if (updateData.totalCopies < issuedCopies) {
        return res.status(400).json({
          error: `Total copies (${updateData.totalCopies}) cannot be less than issued copies (${issuedCopies})`
        });
      }
      // Adjust availableCopies accordingly
      updateData.availableCopies = updateData.totalCopies - issuedCopies;
    }

    const updatedBook = await Book.findByIdAndUpdate(_id, updateData, { new: true });
    res.json(updatedBook);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
});
(async () => {
  try {
    await connectDB();

    // preloadData relies on DB, so await it here
    await preloadData();

    app.listen(PORT, () => {
      console.log(`🚀 Server running at http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error("Failed to start server:", err);
  }
})();