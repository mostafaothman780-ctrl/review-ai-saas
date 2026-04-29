const express = require("express");
const mongoose = require("mongoose");
const axios = require("axios");
const router = express.Router();

const User = require("../models/user");
const { google } = require("googleapis");

// ==========================
// 🔐 OAUTH CLIENT
// ==========================
function createOAuthClient() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
}

// ==========================
// 🔐 AUTH
// ==========================
router.get("/auth", (req, res) => {
  const userId = req.query.userId;

  if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
    return res.status(400).json({ message: "Invalid userId" });
  }

  const oauth2Client = createOAuthClient();

  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    state: userId,
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
      "https://www.googleapis.com/auth/business.manage",
    ],
  });

  return res.redirect(url);
});

// ==========================
// 🔁 CALLBACK
// ==========================
router.get("/callback", async (req, res) => {
  try {
    const { code, state } = req.query;

    if (!code) {
      return res.redirect("http://localhost:3000/?google=failed");
    }

    const user = await User.findById(state);

    if (!user) {
      return res.redirect("http://localhost:3000/?google=failed");
    }

    const oauth2Client = createOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);

    await User.findByIdAndUpdate(state, {
      google: {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expiry_date: tokens.expiry_date,
      },
    });

    console.log("✅ Google connected:", state);

    return res.redirect("http://localhost:3000/?google=success");

  } catch (error) {
    console.error("GOOGLE CALLBACK ERROR:", error.message);
    return res.redirect("http://localhost:3000/?google=failed");
  }
});

// ==========================
// 🔁 SYNC (PHASE 3 CLEAN)
// ==========================
router.get("/sync", async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const user = await User.findById(userId);

    if (!user?.google?.access_token) {
      return res.status(401).json({ message: "Google not connected" });
    }

    console.log("🔥 SYNC START");

    // =========================
    // STEP 1: ACCOUNTS
    // =========================
    const retry = require("../utils/retry");

const accountsRes = await retry(() =>
  axios.get(
    "https://mybusinessbusinessinformation.googleapis.com/v1/accounts",
    {
      headers: {
        Authorization: `Bearer ${user.google.access_token}`,
      },
    }
  )
);

    const accounts = accountsRes.data;

    // =========================
    // STEP 2: LOCATIONS
    // =========================
    let locations = [];

    if (accounts.accounts?.length > 0) {
      const accountName = accounts.accounts[0].name;

     const locationsRes = await retry(() =>
  axios.get(
    `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`,
    {
      headers: {
        Authorization: `Bearer ${user.google.access_token}`,
      },
    }
  )
);

      locations = locationsRes.data.locations || [];
    }

    // =========================
    // STEP 3: CACHE SAVE
    // =========================
    await User.findByIdAndUpdate(userId, {
      googleAccounts: accounts,
      googleAccountsUpdatedAt: new Date(),
      googleLocations: locations,
      googleLocationsUpdatedAt: new Date(),
    });

    console.log("💾 SYNC DONE");

    return res.json({
      message: "Sync completed",
      accounts: accounts.accounts?.length || 0,
      locations: locations.length,
    });

  } catch (error) {
    console.error("SYNC ERROR:", error.response?.data || error.message);

    return res.status(500).json({
      message: "Sync failed",
      error: error.response?.data || error.message,
    });
  }
});

// ==========================
// 📍 LOCATIONS (CACHE ONLY)
// ==========================
router.get("/locations", async (req, res) => {
  try {
    const userId = req.query.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      cached: true,
      locations: user.googleLocations || [],
    });

  } catch (error) {
    return res.status(500).json({
      message: "Error fetching locations",
      error: error.message,
    });
  }
});

// ==========================
// 🔍 STATUS
// ==========================
router.get("/status", (req, res) => {
  res.json({
    message: "Google route working",
  });
});

// ==========================
// 🔄 RESET GOOGLE TOKEN
// ==========================
router.get("/reset", async (req, res) => {
  try {
    const userId = req.query.userId;

    if (!userId) {
      return res.status(400).json({ message: "userId required" });
    }

    await User.findByIdAndUpdate(userId, {
      $unset: { google: 1 },
    });

    return res.json({
      message: "Google token reset successfully",
    });

  } catch (error) {
    return res.status(500).json({
      message: "Reset failed",
      error: error.message,
    });
  }
});
router.get("/test-token", async (req, res) => {
  const User = require("../models/user");
  const axios = require("axios");

  const user = await User.findById(req.query.userId);

  try {
    const result = await axios.get(
      "https://mybusinessbusinessinformation.googleapis.com/v1/accounts",
      {
        headers: {
          Authorization: `Bearer ${user.google.access_token}`,
        },
      }
    );

    return res.json(result.data);

  } catch (err) {
    return res.json({
      error: err.response?.data || err.message,
    });
  }
});

module.exports = router;