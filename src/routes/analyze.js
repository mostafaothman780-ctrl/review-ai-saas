const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const User = require("../models/user");
const Review = require("../models/review");

const subscriptionCheck = require("../middleware/subscriptionCheck");
const creditCheck = require("../middleware/creditCheck");

const {
  processReview,
  processReviewsBulk,
} = require("../services/reviewProcessor");

const {
  generateInsights,
} = require("../services/aiService");


// ======================
// AUTH MIDDLEWARE
// ======================
function auth(req, res, next) {
  const token = req.cookies.token;

  if (!token) {
    return res.status(401).json({ error: "Not logged in" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}


// ======================
// SINGLE REVIEW ANALYSIS
// ======================
router.post(
  "/",
  auth,
  subscriptionCheck,
  creditCheck,   // ✅ ADDED HERE
  async (req, res) => {
    const { review } = req.body;

    if (!review) {
      return res.status(400).json({ error: "Review is required" });
    }

    try {
      const result = await processReview({
        userId: req.userId,
        review,
      });

      res.json(result);
    } catch (error) {
      console.error("ANALYZE ERROR:", error);
      res.status(500).json({
        error: "Processing failed",
        detail: error.message,
      });
    }
  }
);


// ======================
// BULK AUTO PROCESSING
// ======================
router.post(
  "/auto",
  auth,
  subscriptionCheck,
  creditCheck,   // ✅ ADDED HERE TOO
  async (req, res) => {
    const { reviews } = req.body;

    if (!reviews || !Array.isArray(reviews)) {
      return res.status(400).json({ error: "Reviews array is required" });
    }

    try {
      const results = await processReviewsBulk({
        userId: req.userId,
        reviews,
      });

      res.json({
        message: "Auto processing completed",
        count: results.length,
        data: results,
      });

    } catch (error) {
      console.error("AUTO ERROR:", error);
      res.status(500).json({
        error: "Auto processing failed",
        detail: error.message,
      });
    }
  }
);


// ======================
// INSIGHTS
// ======================
router.post(
  "/insights",
  auth,
  subscriptionCheck,
  creditCheck,   // ✅ ADDED HERE TOO
  async (req, res) => {
    const { reviews } = req.body;

    if (!reviews || !Array.isArray(reviews)) {
      return res.status(400).json({ error: "Reviews array is required" });
    }

    try {
      const insights = await generateInsights(reviews);

      res.json({ insights });

    } catch (error) {
      console.error("INSIGHTS ERROR:", error);
      res.status(500).json({
        error: "Insights generation failed",
        detail: error.message,
      });
    }
  }
);


// ======================
// HISTORY
// ======================
router.get("/history", auth, subscriptionCheck, async (req, res) => {
  try {
    const data = await Review.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json(data);

  } catch (error) {
    console.error("HISTORY ERROR:", error);
    res.status(500).json({
      error: "Failed to fetch history",
      detail: error.message,
    });
  }
});

module.exports = router;