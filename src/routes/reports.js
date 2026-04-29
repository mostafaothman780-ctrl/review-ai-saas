const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const Report = require("../models/report");
const subscriptionCheck = require("../middleware/subscriptionCheck");

// ======================
// AUTH MIDDLEWARE
// ======================
function auth(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({
      error: "Not logged in",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({
      error: "Invalid token",
    });
  }
}

// ======================
// GET MY REPORTS ONLY
// ======================
router.get(
  "/",
  auth,
  subscriptionCheck,
  async (req, res) => {
    try {
      const reports = await Report.find({
        userId: req.userId,
      }).sort({ createdAt: -1 });

      res.json(reports);
    } catch (error) {
      console.error(
        "REPORT FETCH ERROR:",
        error.message
      );

      res.status(500).json({
        error: "Failed to fetch reports",
      });
    }
  }
);

module.exports = router;