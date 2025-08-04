import React, { useEffect, useState, useRef, useCallback } from "react";
import axios from "axios";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [books, setBooks] = useState([]);
  const [newBook, setNewBook] = useState({
    id: "",
    title: "",
    author: "",
    category: "",
    year: "",
    description: "",
  });
  const [editBookId, setEditBookId] = useState(null);
  const [toastMessage, setToastMessage] = useState("");
  const formRef = useRef(null);

  // ✅ Get auth token from localStorage
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const fetchBooks = useCallback(async () => {
    try {
      const res = await axios.get("http://localhost:5000/books", getAuthHeader());
      setBooks(res.data);
    } catch (err) {
      if (err.response?.status === 401) {
        window.location.href = "/"; // Redirect if unauthorized
      }
      showToast("❌ Failed to fetch books");
    }
  }, []);

  useEffect(() => {
    fetchBooks();
    const interval = setInterval(fetchBooks, 5000);
    return () => clearInterval(interval);
  }, [fetchBooks]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3000);
  };

  const validateForm = () => {
    const { id, title, author, category, year, description } = newBook;
    if (!id || !title || !author || !category || !year || !description) {
      showToast("❌ Please fill in all fields");
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
    });
    setEditBookId(null);
  };

  const handleAddBook = async () => {
    if (!validateForm()) return;

    try {
      // Convert id to number
      const bookToAdd = {
        ...newBook,
        id: parseInt(newBook.id)
      };
      
      await axios.post(
        "http://localhost:5000/books", 
        bookToAdd, 
        getAuthHeader()
      );
      showToast("✅ Book added successfully!");
      resetForm();
    } catch (err) {
      showToast(`❌ Failed to add book: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleEditBook = async () => {
    if (!validateForm()) return;

    try {
      const bookToUpdate = {
        ...newBook,
        id: parseInt(newBook.id)
      };
      
      await axios.put(
        `http://localhost:5000/books/${editBookId}`,
        bookToUpdate,
        getAuthHeader()
      );
      showToast("✏️ Book updated successfully!");
      resetForm();
    } catch (err) {
      showToast(`❌ Failed to update book: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleDelete = async (bookId) => {
    try {
      await axios.delete(
        `http://localhost:5000/books/${bookId}`,
        getAuthHeader()
      );
      showToast("🗑️ Book deleted!");
    } catch (err) {
      showToast(`❌ Delete failed: ${err.response?.data?.error || err.message}`);
    }
  };

  const handleEditClick = (book) => {
    setNewBook({
      ...book,
      id: book.id.toString() // Convert to string for the form
    });
    setEditBookId(book._id);
    if (formRef.current) {
      formRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <div className="admin-container">
      <h1>📚 Admin Dashboard</h1>
      <div className="logout-container">
        <span>Welcome, <strong>{localStorage.getItem("username")}</strong> 👋</span>
        <button className="logout-btn" onClick={() => {
          localStorage.clear();
          window.location.href = "/";
        }}>Logout</button>
      </div>

      {toastMessage && <div className="toast">{toastMessage}</div>}

      <div className="form-row" ref={formRef}>
        <input
          type="number"
          placeholder="ID"
          value={newBook.id}
          onChange={(e) => setNewBook({ ...newBook, id: e.target.value })}
          min="1"
        />
        <input
          type="text"
          placeholder="Title"
          value={newBook.title}
          onChange={(e) => setNewBook({ ...newBook, title: e.target.value })}
        />
        <input
          type="text"
          placeholder="Author"
          value={newBook.author}
          onChange={(e) => setNewBook({ ...newBook, author: e.target.value })}
        />
        <input
          type="text"
          placeholder="Category"
          value={newBook.category}
          onChange={(e) => setNewBook({ ...newBook, category: e.target.value })}
        />
        <input
          type="number"
          placeholder="Year"
          value={newBook.year}
          onChange={(e) => setNewBook({ ...newBook, year: e.target.value })}
        />
        <input
          type="text"
          placeholder="Description"
          value={newBook.description}
          onChange={(e) => setNewBook({ ...newBook, description: e.target.value })}
        />
        {/* ... other input fields ... */}
        {editBookId ? (
          <button onClick={handleEditBook}>✏️ Update Book</button>
        ) : (
          <button onClick={handleAddBook}>➕ Add Book</button>
        )}
      </div>

      <div className="book-list">
        {books.length > 0 ? (
          books.map((book) => (
            <div key={book._id} className="book-card">
              <h3>{book.title}</h3>
              <p><strong>ID:</strong> {book.id}</p>
              <p><strong>Author:</strong> {book.author}</p>
              <p><strong>Category:</strong> {book.category}</p>
              <p><strong>Year:</strong> {book.year}</p>
              <p><strong>Status:</strong> 
                <span className={book.issued ? "issued" : "available"}>
                  {book.issued ? "Issued" : "Available"}
                </span>
              </p>
              <div className="admin-buttons">
                <button onClick={() => handleEditClick(book)}>✏️ Edit</button>
                <button onClick={() => handleDelete(book._id)}>🗑️ Delete</button>
              </div>
            </div>
          ))
        ) : (
          <p className="no-books">No books found in the library</p>
        )}
      </div>
      {/* Issued Books Section */}
<div className="issued-section">
  <h2>📦 All Issued Books</h2>
  {books.filter(book => book.issued).length === 0 ? (
    <p>No books are currently issued.</p>
  ) : (
    <ul>
      {books
        .filter(book => book.issued)
        .map((book) => (
          <li key={book.id}>
            <strong>{book.title}</strong> — Issued By: {book.issuedBy} — Due: {book.dueDate || "N/A"}
          </li>
        ))}
    </ul>
  )}
</div>
    </div>
  );
}

export default AdminDashboard;