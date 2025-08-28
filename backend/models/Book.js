const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  id: { type: Number, required: true, unique: true },  // Ideally unique for each book
  title: { type: String, required: true },
  author: { type: String, required: true },
  category: { type: String, required: true },
  year: { type: Number, required: true },
  description: { type: String, required: true },
  totalCopies: { type: Number, default: 1 },
  availableCopies: { type: Number, default: 1 },
  issued: { type: Boolean, default: false },
  dueDate: { type: String, default: null },
  returnStatus: { type: String, default: "Not Returned" },
  issuedBy: { type: String, default: null }
});

module.exports = mongoose.model('Book', bookSchema);
