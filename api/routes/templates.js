// // routes/templates.js
// const express = require('express');
// const router = express.Router();
// const Template = require('../models/Template');

// router.get("/select", async (req, res) => {
//   try {
//     const templates = await Template.find(); // MongoDB se fetch
//     if (!templates || templates.length === 0) {
//       return res.render("select-template", { templates: [] });
//     }
//     res.render("select-template", { templates });
//   } catch (err) {
//     console.error(err);
//     res.status(500).send("Server error");
//   }
// });

// module.exports = router;


// api/routes/templates.js
const express = require("express");
const router = express.Router();
const Template = require("../models/Template");

router.get("/select", async (req, res) => {
  try {
    const templates = await Template.find({});
    res.render("select-template", { templates });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
});

module.exports = router;
