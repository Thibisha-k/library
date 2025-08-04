const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  id: Number,
  title: String,
  author: String,
  category: String,
  year: Number,
  description: String,
  issued: { type: Boolean, default: false },
  dueDate: { type: String, default: null },
  returnStatus: { type: String, default: "Not Returned" },
  issuedBy: { type: String, default: null }  // ✅ Added here correctly
});

module.exports = mongoose.model("Book", bookSchema);
