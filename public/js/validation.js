document.addEventListener("DOMContentLoaded", () => {
  // Form validation
  const resumeForm = document.getElementById("resumeForm")

  if (resumeForm) {
    resumeForm.addEventListener("submit", (event) => {
      const name = document.getElementById("name").value.trim()
      const email = document.getElementById("email").value.trim()
      const phone = document.getElementById("phone").value.trim()

      let isValid = true
      let errorMessage = ""

      // Validate required fields
      if (!name) {
        errorMessage = "Name is required"
        isValid = false
      } else if (!email) {
        errorMessage = "Email is required"
        isValid = false
      } else if (!phone) {
        errorMessage = "Phone is required"
        isValid = false
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (email && !emailRegex.test(email)) {
        errorMessage = "Please enter a valid email address"
        isValid = false
      }

      // Validate phone format (simple validation)
      const phoneRegex = /^[0-9\-+$$$$\s]{10,20}$/
      if (phone && !phoneRegex.test(phone)) {
        errorMessage = "Please enter a valid phone number"
        isValid = false
      }

      if (!isValid) {
        event.preventDefault()

        // Display error message
        let errorDiv = document.querySelector(".error-message")
        if (!errorDiv) {
          errorDiv = document.createElement("div")
          errorDiv.className = "error-message"
          resumeForm.parentNode.insertBefore(errorDiv, resumeForm)
        }

        errorDiv.textContent = errorMessage

        // Scroll to error message
        errorDiv.scrollIntoView({ behavior: "smooth", block: "center" })
      }
    })
  }

  // Add more education entries
  const addEducationBtn = document.getElementById("add-education")
  const educationContainer = document.getElementById("education-container")

  if (addEducationBtn && educationContainer) {
    let educationCount = 1

    addEducationBtn.addEventListener("click", () => {
      const newEducation = document.createElement("div")
      newEducation.className = "education-entry"
      newEducation.innerHTML = `
        <button type="button" class="remove-entry">&times;</button>
        <div class="form-group">
          <label for="education-degree-${educationCount}">Degree/Certificate</label>
          <input type="text" id="education-degree-${educationCount}" name="education.degree">
        </div>
        <div class="form-group">
          <label for="education-institution-${educationCount}">Institution</label>
          <input type="text" id="education-institution-${educationCount}" name="education.institution">
        </div>
        <div class="form-group">
          <label for="education-year-${educationCount}">Year</label>
          <input type="text" id="education-year-${educationCount}" name="education.year">
        </div>
      `

      educationContainer.appendChild(newEducation)
      educationCount++

      // Add event listener to remove button
      const removeBtn = newEducation.querySelector(".remove-entry")
      removeBtn.addEventListener("click", () => {
        educationContainer.removeChild(newEducation)
      })
    })
  }

  // Add more experience entries
  const addExperienceBtn = document.getElementById("add-experience")
  const experienceContainer = document.getElementById("experience-container")

  if (addExperienceBtn && experienceContainer) {
    let experienceCount = 1

    addExperienceBtn.addEventListener("click", () => {
      const newExperience = document.createElement("div")
      newExperience.className = "experience-entry"
      newExperience.innerHTML = `
        <button type="button" class="remove-entry">&times;</button>
        <div class="form-group">
          <label for="experience-position-${experienceCount}">Position</label>
          <input type="text" id="experience-position-${experienceCount}" name="experience.position">
        </div>
        <div class="form-group">
          <label for="experience-company-${experienceCount}">Company</label>
          <input type="text" id="experience-company-${experienceCount}" name="experience.company">
        </div>
        <div class="form-group">
          <label for="experience-duration-${experienceCount}">Duration</label>
          <input type="text" id="experience-duration-${experienceCount}" name="experience.duration">
        </div>
        <div class="form-group">
          <label for="experience-description-${experienceCount}">Description</label>
          <textarea id="experience-description-${experienceCount}" name="experience.description" rows="3"></textarea>
        </div>
      `

      experienceContainer.appendChild(newExperience)
      experienceCount++

      // Add event listener to remove button
      const removeBtn = newExperience.querySelector(".remove-entry")
      removeBtn.addEventListener("click", () => {
        experienceContainer.removeChild(newExperience)
      })
    })
  }
})
