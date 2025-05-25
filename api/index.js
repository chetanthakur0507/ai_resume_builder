const express = require("express")
const path = require("path")
const bodyParser = require("body-parser")
const puppeteer = require("puppeteer")

const app = express()

// Set up EJS as the view engine
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "..", "views"))

// Middleware
app.use(express.static(path.join(__dirname, "..", "public")))
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// Routes
app.get("/", (req, res) => {
  res.render("index")
})

// Handle form submission
app.post("/generate-resume", (req, res) => {
  // Basic validation
  const requiredFields = ["name", "email", "phone"]
  for (const field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).render("index", {
        error: `${field.charAt(0).toUpperCase() + field.slice(1)} is required`,
        formData: req.body,
      })
    }
  }

  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(req.body.email)) {
    return res.status(400).render("index", {
      error: "Please enter a valid email address",
      formData: req.body,
    })
  }

  // Process education and experience arrays
  const education = []
  if (req.body["education.degree"]) {
    const degrees = Array.isArray(req.body["education.degree"])
      ? req.body["education.degree"]
      : [req.body["education.degree"]]

    const institutions = Array.isArray(req.body["education.institution"])
      ? req.body["education.institution"]
      : [req.body["education.institution"]]

    const years = Array.isArray(req.body["education.year"]) ? req.body["education.year"] : [req.body["education.year"]]

    for (let i = 0; i < degrees.length; i++) {
      if (degrees[i]) {
        education.push({
          degree: degrees[i],
          institution: institutions[i] || "",
          year: years[i] || "",
        })
      }
    }
  }

  const experience = []
  if (req.body["experience.position"]) {
    const positions = Array.isArray(req.body["experience.position"])
      ? req.body["experience.position"]
      : [req.body["experience.position"]]

    const companies = Array.isArray(req.body["experience.company"])
      ? req.body["experience.company"]
      : [req.body["experience.company"]]

    const durations = Array.isArray(req.body["experience.duration"])
      ? req.body["experience.duration"]
      : [req.body["experience.duration"]]

    const descriptions = Array.isArray(req.body["experience.description"])
      ? req.body["experience.description"]
      : [req.body["experience.description"]]

    for (let i = 0; i < positions.length; i++) {
      if (positions[i]) {
        experience.push({
          position: positions[i],
          company: companies[i] || "",
          duration: durations[i] || "",
          description: descriptions[i] || "",
        })
      }
    }
  }

  // Process skills
  const skills = req.body.skills ? req.body.skills.split(",").map((skill) => skill.trim()) : []

  // Create resume data object
  const resumeData = {
    name: req.body.name,
    email: req.body.email,
    phone: req.body.phone,
    address: req.body.address,
    summary: req.body.summary,
    education: education,
    experience: experience,
    skills: skills,
  }

  // Render resume template with data
  res.render("resume", { resumeData })
})

// Generate PDF from resume
app.get("/download-pdf", async (req, res) => {
  try {
    // Configure Puppeteer for Vercel
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
    })

    const page = await browser.newPage()

    // Create HTML content from the resume data
    const resumeData = JSON.parse(decodeURIComponent(req.query.data || "{}"))

    // Generate HTML content
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${resumeData.name || "Resume"}</title>
        <style>
          ${getResumeCSS()}
        </style>
      </head>
      <body>
        <div class="resume">
          ${generateResumeHTML(resumeData)}
        </div>
      </body>
      </html>
    `

    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    // Generate PDF
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        right: "20px",
        bottom: "20px",
        left: "20px",
      },
    })

    await browser.close()

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf")
    res.setHeader("Content-Disposition", "attachment; filename=resume.pdf")

    // Send the PDF as response
    res.send(pdf)
  } catch (error) {
    console.error("Error generating PDF:", error)
    res.status(500).send("Error generating PDF")
  }
})

// Helper function to get resume CSS
function getResumeCSS() {
  return `
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
    .resume { padding: 40px; }
    .resume-header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #3498db; }
    .resume-name { font-size: 28px; color: #2c3e50; margin-bottom: 15px; }
    .resume-contact { display: flex; flex-wrap: wrap; justify-content: center; gap: 15px; }
    .contact-item { font-size: 14px; }
    .contact-label { font-weight: 600; margin-right: 5px; }
    .resume-section { margin-bottom: 25px; }
    .section-title { color: #3498db; font-size: 20px; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 1px solid #eee; }
    .section-content { padding-left: 10px; }
    .education-item, .experience-item { margin-bottom: 15px; }
    .edu-header, .exp-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 5px; }
    .edu-degree, .exp-position { font-size: 18px; font-weight: 600; color: #2c3e50; }
    .edu-year, .exp-duration { font-style: italic; color: #7f8c8d; }
    .edu-institution, .exp-company { font-size: 16px; color: #34495e; }
    .exp-description { font-size: 15px; color: #555; text-align: justify; margin-top: 8px; }
    .skills-list { display: flex; flex-wrap: wrap; gap: 10px; list-style-type: none; }
    .skill-item { background-color: #ecf0f1; color: #2c3e50; padding: 5px 12px; border-radius: 15px; font-size: 14px; }
  `
}

// Helper function to generate resume HTML
function generateResumeHTML(resumeData) {
  let html = `
    <header class="resume-header">
      <h1 class="resume-name">${resumeData.name || ""}</h1>
      <div class="resume-contact">
  `

  if (resumeData.email) {
    html += `<div class="contact-item"><span class="contact-label">Email:</span><span class="contact-value">${resumeData.email}</span></div>`
  }
  if (resumeData.phone) {
    html += `<div class="contact-item"><span class="contact-label">Phone:</span><span class="contact-value">${resumeData.phone}</span></div>`
  }
  if (resumeData.address) {
    html += `<div class="contact-item"><span class="contact-label">Address:</span><span class="contact-value">${resumeData.address}</span></div>`
  }

  html += `</div></header>`

  if (resumeData.summary) {
    html += `
      <section class="resume-section">
        <h2 class="section-title">Professional Summary</h2>
        <div class="section-content">
          <p>${resumeData.summary}</p>
        </div>
      </section>
    `
  }

  if (resumeData.education && resumeData.education.length > 0) {
    html += `
      <section class="resume-section">
        <h2 class="section-title">Education</h2>
        <div class="section-content">
    `
    resumeData.education.forEach((edu) => {
      html += `
        <div class="education-item">
          <div class="edu-header">
            <h3 class="edu-degree">${edu.degree || ""}</h3>
            <span class="edu-year">${edu.year || ""}</span>
          </div>
          <div class="edu-institution">${edu.institution || ""}</div>
        </div>
      `
    })
    html += `</div></section>`
  }

  if (resumeData.experience && resumeData.experience.length > 0) {
    html += `
      <section class="resume-section">
        <h2 class="section-title">Work Experience</h2>
        <div class="section-content">
    `
    resumeData.experience.forEach((exp) => {
      html += `
        <div class="experience-item">
          <div class="exp-header">
            <h3 class="exp-position">${exp.position || ""}</h3>
            <span class="exp-duration">${exp.duration || ""}</span>
          </div>
          <div class="exp-company">${exp.company || ""}</div>
          ${exp.description ? `<p class="exp-description">${exp.description}</p>` : ""}
        </div>
      `
    })
    html += `</div></section>`
  }

  if (resumeData.skills && resumeData.skills.length > 0) {
    html += `
      <section class="resume-section">
        <h2 class="section-title">Skills</h2>
        <div class="section-content">
          <ul class="skills-list">
    `
    resumeData.skills.forEach((skill) => {
      html += `<li class="skill-item">${skill}</li>`
    })
    html += `</ul></div></section>`
  }

  return html
}

module.exports = app
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});



