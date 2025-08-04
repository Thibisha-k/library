import React, { useEffect, useState } from "react";
import axios from "axios";
import "../App.css";
import { useNavigate } from "react-router-dom";

function UserDashboard({ onLogout }) {
  const [books, setBooks] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [issuedOnly, setIssuedOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [issuedBooks, setIssuedBooks] = useState([]);
  const [sortBy, setSortBy] = useState("");
  const [username, setUsername] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const savedUser = localStorage.getItem("username");

    if (!token || !savedUser) {
      navigate("/");
    } else {
      setUsername(savedUser);
      fetchAllData(savedUser, token);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy]);

  const fetchAllData = async (savedUser, token) => {
    try {
      const bookRes = await axios.get(
        `http://localhost:5000/books${sortBy ? `?sortBy=${sortBy}` : ""}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setBooks(bookRes.data);

      const issuedRes = await axios.get("http://localhost:5000/issued", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userBooks = issuedRes.data.filter(
        (book) => book.issuedBy === savedUser
      );
      setIssuedBooks(userBooks);
    } catch (err) {
      if (err.response?.status === 401) handleLogout();
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    if (onLogout) onLogout();
    navigate("/");
  };

  const handleIssue = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/books/${id}/issue`,
        { username },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAllData(username, token);
    } catch (err) {
      alert(err.response?.data?.error || "Error issuing book");
    }
  };

  const handleReturn = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `http://localhost:5000/books/${id}/return`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchAllData(username, token);
    } catch (err) {
      alert("Error returning book");
    }
  };

  const categories = ["All", ...new Set(books.map((book) => book.category))];

  const filteredBooks = books.filter((book) => {
    const matchCategory =
      categoryFilter === "All" || book.category === categoryFilter;
    const matchIssued = !issuedOnly || book.issuedBy === username;
    const matchSearch =
      book.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      book.author.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchIssued && matchSearch;
  });

  return (
    <div className="App">
      <div className="top-bar">
        <h1>Mini Library</h1>
        <div>
          <span>Welcome, {username}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <div className="filters">
        <input
          type="text"
          placeholder="Search by title or author"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          {categories.map((cat, i) => (
            <option key={i} value={cat}>
              {cat}
            </option>
          ))}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
          <option value="">Sort by</option>
          <option value="title">Title</option>
          <option value="dueDate">Due Date</option>
        </select>
        <label>
          <input
            type="checkbox"
            checked={issuedOnly}
            onChange={() => setIssuedOnly(!issuedOnly)}
          />
          Show Issued Only
        </label>
      </div>

      <div className="book-container">
        {filteredBooks.map((book) => (
          <div key={book.id} className="book-card">
            <h3>{book.title}</h3>
            <p>
              <strong>Author:</strong> {book.author}
            </p>
            <p>
              <strong>Category:</strong> {book.category}
            </p>
            <p>
              <strong>Status:</strong>{" "}
              {book.issued ? "Issued" : "Available"}
            </p>
            {book.issued && book.issuedBy !== username ? (
              <button disabled>Issued by someone</button>
            ) : book.issued ? (
              <button onClick={() => handleReturn(book.id)}>Return</button>
            ) : (
              <button onClick={() => handleIssue(book.id)}>Issue</button>
            )}
          </div>
        ))}
      </div>

      <div className="issued-section">
        <h2>📦 My Issued Books</h2>
        {issuedBooks.length > 0 ? (
          <ul>
            {issuedBooks.map((book) => (
              <li key={book.id}>
                <strong>{book.title}</strong> — Due: {book.dueDate || "N/A"}
                <button onClick={() => handleReturn(book.id)}>Return</button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No books issued.</p>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
