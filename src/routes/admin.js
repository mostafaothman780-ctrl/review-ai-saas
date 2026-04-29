const express = require("express");
const router = express.Router();

const User = require("../models/user");


const { runSyncForUser } = require("../jobs/syncjob");

// ======================
// SIMPLE ADMIN AUTH (TEMP)
// ======================
// ⚠️ replace later with real admin auth (JWT role-based)
function adminAuth(req, res, next) {
  next();
}

// ======================
// SYSTEM OVERVIEW
// ======================
router.get("/overview", adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({
      subscriptionStatus: "active",
    });

    const trialUsers = await User.countDocuments({
      subscriptionStatus: "trial",
    });

    const expiredUsers = await User.countDocuments({
      subscriptionStatus: "expired",
    });

    res.json({
      totalUsers,
      activeUsers,
      trialUsers,
      expiredUsers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// ======================
// FORCE USER SYNC
// ======================
router.post(
  "/force-sync/:userId",
  adminAuth,
  async (req, res) => {
    try {
      const result = await runSyncForUser(
        req.params.userId
      );

      res.json({
        success: true,
        processed: result,
      });
    } catch (error) {
      res.status(500).json({
        error: error.message,
      });
    }
  }
);

// ======================
// ALL USERS
// ======================
router.get("/users", adminAuth, async (req, res) => {
  try {
    const users = await User.find()
      .select(
        `
        email
        subscriptionStatus
        lastSyncAt
        lastSyncFailureAt
        lastSyncFailureReason
        lastWeeklyReportSentAt
        lastWeeklyReportFailureAt
        businessName
        createdAt
        googleAccountsUpdatedAt
googleLocationsUpdatedAt
        `
      )
      .sort({ createdAt: -1 });

    res.json({
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});

// ======================
// USERS WITH SYNC ISSUES
// ======================
router.get("/sync-failures", adminAuth, async (req, res) => {
  try {
    const users = await User.find({
      lastSyncFailureAt: { $ne: null },
    }).select(
      "email lastSyncFailureAt lastSyncFailureReason"
    );

    res.json({
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ======================
// USERS WITH EMAIL FAILURES
// ======================
router.get("/email-failures", adminAuth, async (req, res) => {
  try {
    const users = await User.find({
      lastWeeklyReportFailureAt: { $ne: null },
    }).select(
      "email lastWeeklyReportFailureAt lastWeeklyReportFailureReason"
    );

    res.json({
      count: users.length,
      users,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ======================
// SYSTEM HEALTH SNAPSHOT
// ======================
router.get("/health", adminAuth, async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    const syncIssues = await User.countDocuments({
      lastSyncFailureAt: { $ne: null },
    });

    const reportIssues = await User.countDocuments({
      lastWeeklyReportFailureAt: { $ne: null },
    });

    const inactiveUsers = await User.countDocuments({
      lastSyncAt: { $lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    });

    res.json({
      totalUsers,
      syncIssues,
      reportIssues,
      inactiveUsers,
      status:
        syncIssues + reportIssues > 0
          ? "degraded"
          : "healthy",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const Review = require("../models/review");
const Report = require("../models/report");

// ======================
// 🧠 DATABASE DEBUG (TEMP)
// ======================
router.get("/debug/db", adminAuth, async (req, res) => {
  try {
    const users = await User.find()
      .sort({ createdAt: -1 })
      .limit(5);

    const reviews = await Review.find()
      .sort({ createdAt: -1 })
      .limit(10);

    const reports = await Report.find()
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      users,
      reviews,
      reports,
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
    });
  }
});
module.exports = router;