const mongoose = require("mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/resume-builder", {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log("MongoDB connected"))
.catch(err => console.log("MongoDB error:", err));