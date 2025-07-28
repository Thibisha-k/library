// server.js
const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

let books = [
  // Thriller
  {
    id: 1,
    title: "The Girl in Room 105",
    author: "Chetan Bhagat",
    category: "Thriller",
    year: 2018,
    description: "A suspense thriller involving a mysterious murder.",
    issued: false,
    dueDate: null
  },
  {
    id: 6,
    title: "The Mahabharata Secret",
    author: "Christopher C. Doyle",
    category: "Thriller",
    year: 2013,
    description: "A gripping historical thriller based on ancient Indian secrets.",
    issued: false,
    dueDate: null
  },

  // Fantasy
  {
    id: 2,
    title: "The Immortals of Meluha",
    author: "Amish Tripathi",
    category: "Fantasy",
    year: 2010,
    description: "A mythological fantasy reimagining Lord Shiva’s life.",
    issued: false,
    dueDate: null
  },
  {
    id: 7,
    title: "The Secret of the Nagas",
    author: "Amish Tripathi",
    category: "Fantasy",
    year: 2011,
    description: "Sequel to Immortals of Meluha, diving deeper into Indian mythology.",
    issued: false,
    dueDate: null
  },

  // Kids
  {
    id: 3,
    title: "Grandma's Bag of Stories",
    author: "Sudha Murty",
    category: "Kids",
    year: 2012,
    description: "A delightful collection of moral stories for kids.",
    issued: false,
    dueDate: null
  },
  {
    id: 8,
    title: "The Magic Drum and Other Favourite Stories",
    author: "Sudha Murty",
    category: "Kids",
    year: 2008,
    description: "Traditional folk tales retold for children.",
    issued: false,
    dueDate: null
  },

  // Romance
  {
    id: 4,
    title: "2 States",
    author: "Chetan Bhagat",
    category: "Romance",
    year: 2009,
    description: "A love story about a couple from different Indian states.",
    issued: false,
    dueDate: null
  },
  {
    id: 9,
    title: "I Too Had a Love Story",
    author: "Ravinder Singh",
    category: "Romance",
    year: 2008,
    description: "A heart-touching romantic tale based on a true story.",
    issued: false,
    dueDate: null
  },

  // Comedy
  {
    id: 5,
    title: "Serious Men",
    author: "Manu Joseph",
    category: "Comedy",
    year: 2010,
    description: "A satirical novel exploring ambition and caste in India.",
    issued: false,
    dueDate: null
  },
  {
    id: 10,
    title: "Don’t Tell the Governor",
    author: "Ravi Subramanian",
    category: "Comedy",
    year: 2018,
    description: "A humorous political fiction novel.",
    issued: false,
    dueDate: null
  }
];
let issuedBooks = []; // Stores issued books for the single user

// GET all books with optional sorting and overdue flag
app.get("/books", (req, res) => {
  const { sortBy } = req.query;
  const currentDate = new Date();
  let result = books.map(book => {
    if (book.issued && book.dueDate && new Date(book.dueDate) < currentDate) {
      return { ...book, overdue: true };
    }
    return { ...book, overdue: false };
  });

  if (sortBy === "title") {
    result.sort((a, b) => a.title.localeCompare(b.title));
  } else if (sortBy === "dueDate") {
    result.sort((a, b) => new Date(a.dueDate || Infinity) - new Date(b.dueDate || Infinity));
  }

  res.json(result);
});

// GET only issued books (with overdue flag and returnStatus)
app.get("/issued", (req, res) => {
  const currentDate = new Date();
  const issued = books
    .filter(book => book.issued)
    .map(book => {
      const overdue = book.dueDate && new Date(book.dueDate) < currentDate;
      return {
        ...book,
        overdue,
        returnStatus: "Not Returned"
      };
    });

  res.json(issued);
});

// Issue a book
app.put("/books/:id/issue", (req, res) => {
  const id = parseInt(req.params.id);
  const book = books.find((b) => b.id === id);

  if (!book) return res.status(404).json({ error: "Book not found" });
  if (book.issued) return res.status(400).json({ error: "Already issued" });
  if (issuedBooks.length >= 3) return res.status(400).json({ error: "Issue limit reached" });

  book.issued = true;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 7);
  book.dueDate = dueDate.toISOString().split("T")[0];
  book.returnStatus = "Not Returned";

  issuedBooks.push(book);
  res.json(book);
});

// Return a book
app.put("/books/:id/return", (req, res) => {
  const id = parseInt(req.params.id);
  const book = books.find((b) => b.id === id);
  if (!book || !book.issued) return res.status(400).json({ error: "Book not issued" });

  book.issued = false;
  book.dueDate = null;
  book.returnStatus = "Returned";

  issuedBooks = issuedBooks.filter((b) => b.id !== id);
  res.json(book);
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
