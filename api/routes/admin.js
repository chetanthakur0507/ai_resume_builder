const express = require("express");
const multer = require("multer");
const path = require("path");
const Template = require("../models/Template");

const router = express.Router();

// Basic Admin Auth
const ADMIN_USERNAME = "admin";
const ADMIN_PASSWORD = "password";

// Upload config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const isEJS = file.mimetype === 'text/html';
    cb(null, isEJS ? "views" : "public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// Admin login page
router.get("/login", (req, res) => {
  res.render("admin-login", { error: null });
});

// Admin login POST
router.post("/login", (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    req.session.isAdmin = true;
    res.redirect("/admin/panel");
  } else {
    res.render("admin-login", { error: "Invalid credentials" });
  }
});

// Middleware to check admin session
const isAdmin = (req, res, next) => {
  if (req.session.isAdmin) return next();
  res.redirect("/admin/login");
};

// Admin panel
router.get("/panel", isAdmin, async (req, res) => {
  const templates = await Template.find();
  res.render("admin-panel", { templates });
});

// Upload template
router.post("/upload", isAdmin, upload.fields([{ name: "template" }, { name: "image" }]), async (req, res) => {
  const templateFile = req.files["template"][0];
  const imageFile = req.files["image"][0];

  await Template.create({
    name: req.body.name,
    file: templateFile.filename,
    previewImage: "/uploads/" + imageFile.filename,
  });

  res.redirect("/admin/panel");
});

// Delete template
router.post("/delete/:id", isAdmin, async (req, res) => {
  await Template.findByIdAndDelete(req.params.id);
  res.redirect("/admin/panel");
});

module.exports = router;
