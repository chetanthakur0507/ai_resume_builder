// models/Template.js
const mongoose = require('mongoose');

const templateSchema = new mongoose.Schema({
  name: String,
  file: String, // e.g., "template1.ejs"
  previewImage: String, // optional: for UI thumbnails
  createdByAdmin: { type: Boolean, default: true },
});

module.exports = mongoose.model('Template', templateSchema);
