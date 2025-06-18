const express = require("express");
const path = require("path");
const session = require("express-session");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const app = express();

// DB connection
require("./db/connect");

// Models
const User = require("./models/User");

// Routes & Middleware
const templateRoutes = require("./routes/templates");
const isAuthenticated = require("../middlewares/isAuthenticated");
const adminRoutes = require("./routes/admin");

app.use("/admin", adminRoutes);

// View engine & static
app.set("view engine", "ejs");
app.set('views', path.join(__dirname, '..', 'views'));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static('public'));

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(session({
  secret: "resume-secret",
  resave: false,
  saveUninitialized: false
}));



// Static folder for images
app.use(express.static('public'));

// URL-encoded middleware (POST data ke liye)
app.use(express.urlencoded({ extended: true }));

const multer = require('multer');


// Storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads/');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  }
});

// File filter (optional)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only images are allowed'), false);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 } // 2MB
});


// Your GET route for templates
app.get('/templates/select', isAuthenticated, (req, res) => {
  const templates = [
    { name: 'Template 1', previewImage: '/images/template1.png', file: 'temp1.ejs' },
    { name: 'Template 2', previewImage: '/images/template1.png', file: 'temp2.ejs' },
     { name: 'Template 3', previewImage: '/images/template1.png', file: 'temp3.ejs' },
    { name: 'Template 4', previewImage: '/images/template1.png', file: 'temp4.ejs' },
     { name: 'Template 5', previewImage: '/images/template1.png', file: 'temp5.ejs' },
    { name: 'Template 6', previewImage: '/images/template1.png', file: 'temp6.ejs' },
     { name: 'Template 7', previewImage: '/images/template1.png', file: 'temp7.ejs' },
    { name: 'Template 8', previewImage: '/images/template1.png', file: 'temp8.ejs' },
     { name: 'Template 9', previewImage: '/images/template1.png', file: 'temp9.ejs' },
    { name: 'Template 10', previewImage: '/images/template1.png', file: 'temp10.ejs' },
    { name: 'Template 11', previewImage: '/images/template1.png', file: 'temp11.ejs' }
  ];

  res.render('select-template', { templates: templates });
});

app.get('/resume/fill-details', isAuthenticated, (req, res) => {
  res.render('resume-form'); // You’ll make this EJS file next
});

app.post('/resume/generate', isAuthenticated, (req, res) => {
  const userData = req.body;
  const selectedTemplate = req.session.selectedTemplate;

  if (!selectedTemplate) {
    return res.redirect('/templates/select');
  }

  res.render(selectedTemplate, { user: userData }); // e.g., renders temp1.ejs
});

// Authentication Protected Route
app.use("/templates", isAuthenticated, templateRoutes);

// Routes
app.get("/", (req, res) => {
  res.redirect("/register");
});

app.get("/register", (req, res) => {
  res.render("register", { error: null });
});

app.post("/users/register", async (req, res) => {
  const { fullname, email, password } = req.body;
  if (!fullname || !email || !password) {
    return res.render("register", { error: "Please fill all fields" });
  }
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res.render("register", { error: "Email already exists" });
  }
  const bcrypt = require("bcrypt");
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ fullname, email, password: hashedPassword });
  await user.save();
  req.session.userId = user._id;
  res.redirect("/templates/select");
});

app.get("/login", (req, res) => {
  res.render("login", { error: null });
});

app.post("/users/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await require("bcrypt").compare(password, user.password))) {
    return res.render("login", { error: "Invalid credentials" });
  }
  req.session.userId = user._id;
  res.redirect("/templates/select");
});

app.get("/logout", (req, res) => {
  req.session.destroy(err => {
    if (err) console.error(err);
    res.redirect("/login");
  });
});


app.post('/templates/select', isAuthenticated, (req, res) => {
  const selectedTemplate = req.body.template; // e.g., 'temp1.ejs'
  req.session.selectedTemplate = selectedTemplate;
  res.redirect('/resume/fill-details'); // Next step: form to fill resume info
});

const puppeteer = require("puppeteer");

app.post('/resume/download', isAuthenticated, async (req, res) => {
  const userData = req.body;
  const selectedTemplate = req.session.selectedTemplate;

  if (!selectedTemplate) return res.redirect('/templates/select');

  try {
    // Launch Puppeteer browser
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Render the EJS template to HTML
    const ejs = require('ejs');
    const fs = require('fs');
    const path = require('path');

    const filePath = path.join(__dirname, '..', 'views', selectedTemplate);
    const html = await ejs.renderFile(filePath, { user: userData });

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true
    });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="resume.pdf"',
    });

    res.send(pdfBuffer);
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).send("Something went wrong while generating PDF");
  }
});





app.post("/generate-resume", upload.single("photo"), (req, res) => {
  const selectedTemplate = req.session.selectedTemplate || "resume"; // Default template

  // Basic validation
  const requiredFields = ["name", "email", "phone"];
  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).render("index", {
        error: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
        formData: req.body,
      });
    }
  }

  // Email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(req.body.email)) {
    return res.status(400).render("index", {
      error: "Please enter a valid email address",
      formData: req.body,
    });
  }

  // Process education entries
  const education = [];
  const degrees = Array.isArray(req.body["education.degree"])
    ? req.body["education.degree"]
    : [req.body["education.degree"]];
  const institutions = Array.isArray(req.body["education.institution"])
    ? req.body["education.institution"]
    : [req.body["education.institution"]];
  const years = Array.isArray(req.body["education.year"])
    ? req.body["education.year"]
    : [req.body["education.year"]];

  for (let i = 0; i < degrees.length; i++) {
    if (degrees[i]) {
      education.push({
        degree: degrees[i],
        institution: institutions[i] || "",
        year: years[i] || "",
      });
    }
  }

  // Process experience entries
  const experience = [];
  const positions = Array.isArray(req.body["experience.position"])
    ? req.body["experience.position"]
    : [req.body["experience.position"]];
  const companies = Array.isArray(req.body["experience.company"])
    ? req.body["experience.company"]
    : [req.body["experience.company"]];
  const durations = Array.isArray(req.body["experience.duration"])
    ? req.body["experience.duration"]
    : [req.body["experience.duration"]];
  const descriptions = Array.isArray(req.body["experience.description"])
    ? req.body["experience.description"]
    : [req.body["experience.description"]];

  for (let i = 0; i < positions.length; i++) {
    if (positions[i]) {
      experience.push({
        position: positions[i],
        company: companies[i] || "",
        duration: durations[i] || "",
        description: descriptions[i] || "",
      });
    }
  }

  // Process skills
  const skills = req.body.skills
    ? req.body.skills.split(",").map((s) => s.trim())
    : [];

  // Final resume data object
  const resumeData = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    summary: req.body.summary,
    education: education,
    experience: experience,
    skills: skills,
    photoPath: req.file ? `/uploads/${req.file.filename}` : null,
  };

  req.session.userData = resumeData;

  // Render selected template
 res.render(selectedTemplate, { resumeData });

});







const ejs = require("ejs");



app.get("/download-pdf", async (req, res) => {
  try {
    const resumeData = JSON.parse(decodeURIComponent(req.query.data || "{}"));


   

    // Render EJS template to HTML
     const html = await ejs.renderFile(
  path.join(__dirname, "../views/temp11.ejs"),
  { resumeData } // no need to send `pdfRender` anymore unless you’re conditionally excluding code
);

    const browser = await puppeteer.launch({
      headless: "new",
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
      ],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    });

    await browser.close();

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=resume.pdf");
    res.send(pdf);
  } catch (error) {
    console.error("PDF generation error:", error);
    res.status(500).send("Failed to generate PDF");
  }
});





module.exports = app
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});


