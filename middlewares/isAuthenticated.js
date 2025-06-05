// middlewares/isAuthenticated.js
module.exports = (req, res, next) => {
  if (req.session && req.session.userId) {
    next(); // User is logged in
  } else {
    res.redirect("/login"); // Not logged in
  }
};
