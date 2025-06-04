const mongoose = require("mongoose");
const Template = require("../models/Template");
require("../db/connect"); // make sure this connects to MongoDB

async function seedTemplates() {
  try {
    await Template.deleteMany(); // optional: clear existing
    await Template.insertMany([
      {
        name: "Professional",
        file: "template1.ejs",
        previewImage: "/images/template1.png"
      },
      {
        name: "Modern",
        file: "template2.ejs",
        previewImage: "/images/template2.png"
      }
    ]);

    console.log("✅ Templates seeded successfully!");
    process.exit();
  } catch (error) {
    console.error("❌ Failed to seed templates:", error);
    process.exit(1);
  }
}

seedTemplates();
