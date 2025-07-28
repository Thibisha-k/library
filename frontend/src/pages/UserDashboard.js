import React, { useEffect, useState } from "react";
import axios from "axios";
import "../App.css";

function App() {
  const [books, setBooks] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [issuedOnly, setIssuedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [sortBy, setSortBy] = useState("");

  useEffect(() => {
    fetchBooks();
    fetchIssuedBooks();
  }, [sortBy]);

  const fetchBooks = async () => {
    const res = await axios.get(`http://localhost:5000/books${sortBy ? `?sortBy=${sortBy}` : ""}`);
    setBooks(res.data);
  };

  const fetchIssuedBooks = async () => {
    const res = await axios.get("http://localhost:5000/issued");
    setIssuedBooks(res.data);
  };

  const handleIssue = async (id) => {
    try {
      await axios.put(`http://localhost:5000/books/${id}/issue`);
      fetchBooks();
      fetchIssuedBooks();
    } catch (err) {
      alert(err.response?.data?.error || "Error issuing book");
    }
  };

  const handleReturn = async (id) => {
    try {
      await axios.put(`http://localhost:5000/books/${id}/return`);
      fetchBooks();
      fetchIssuedBooks();
    } catch (err) {
      alert("Error returning book");
    }
  };

  const categories = ["All", ...new Set(books.map((book) => book.category))];

  const filteredBooks = books.filter((book) => {
    const matchesCategory =
      categoryFilter === "All" || book.category === categoryFilter;
    const matchesIssued = !issuedOnly || book.issued;
    const matchesSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesIssued && matchesSearch;
  });

  const openModal = (book) => setSelectedBook(book);
  const closeModal = () => setSelectedBook(null);

  return (
    <div className="App">
      <h1 className="heading">Mini Library</h1>

      {/* Filters */}
      <div className="filters">
        <input
          type="text"
          placeholder="Search by title or author"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          {categories.map((cat, index) => (
            <option key={index} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="">Sort by</option>
          <option value="title">Title</option>
          <option value="dueDate">Due Date</option>
        </select>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={issuedOnly}
            onChange={() => setIssuedOnly(!issuedOnly)}
          />
          Show Issued Only
        </label>
      </div>

      {/* Book Cards */}
      {filteredBooks.length === 0 ? (
        <div className="no-books">📚 No books found matching your filters.</div>
      ) : (
        <div className="book-container">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className={`book-card ${book.overdue ? "overdue" : ""}`}
              onClick={() => openModal(book)}
            >
              <h2>{book.title}</h2>
              <p><strong>Author:</strong> {book.author}</p>
              <p><strong>Category:</strong> {book.category}</p>
              <p><strong>Status:</strong> {book.issued ? "Issued" : "Available"}</p>
              {book.overdue && <p className="overdue-text">⚠️ Overdue</p>}
              {book.issued ? (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleReturn(book.id);
                  }}
                >
                  Return
                </button>
              ) : (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleIssue(book.id);
                  }}
                >
                  Issue
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedBook && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{selectedBook.title}</h2>
            <p><strong>Author:</strong> {selectedBook.author}</p>
            <p><strong>Category:</strong> {selectedBook.category}</p>
            <p><strong>Status:</strong> {selectedBook.issued ? "Issued" : "Available"}</p>
            {selectedBook.issued && selectedBook.dueDate && (
              <p><strong>Due Date:</strong> {selectedBook.dueDate}</p>
            )}
            {selectedBook.returnStatus && (
              <p><strong>Return Status:</strong> {selectedBook.returnStatus}</p>
            )}
            {selectedBook.overdue && <p className="overdue-text">⚠️ This book is overdue!</p>}
            <button onClick={closeModal}>Close</button>
          </div>
        </div>
      )}

      {/* Issued Books */}
      <div className="issued-section">
        <h2>📦 Issued Books</h2>
        {issuedBooks.length === 0 ? (
          <p>No books currently issued.</p>
        ) : (
          <ul>
            {issuedBooks.map((book) => (
              <li key={book.id} className={book.overdue ? "overdue" : ""}>
                <strong>{book.title}</strong> — Due: {book.dueDate}
                {book.overdue && <span className="overdue-text"> ⚠️ Overdue</span>}
                <span> — {book.returnStatus}</span>
                <button onClick={() => handleReturn(book.id)}>Return</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default App;
