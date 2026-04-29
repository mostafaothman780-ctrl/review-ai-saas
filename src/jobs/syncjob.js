const cron = require("node-cron");
const axios = require("axios");

const User = require("../models/user");
const { processReview } = require("../services/reviewProcessor");
const { refreshGoogleToken } = require("../services/googleAuthService");

// ==========================
// 🔒 GLOBAL LOCK
// ==========================
let isSyncRunning = false;

// ==========================
// ⚙️ AXIOS INSTANCE
// ==========================
const api = axios.create({
  timeout: 15000,
});

// ==========================
// 🔐 SAFE GOOGLE REQUEST (AUTO REFRESH)
// ==========================
async function safeGoogleRequest(user, requestFn) {
  try {
    return await requestFn(user.google.access_token);
  } catch (error) {
    if (error.response?.status === 401) {
      console.log("🔐 Token expired → refreshing...");

      const newToken = await refreshGoogleToken(user);

      return await requestFn(newToken);
    }

    throw error;
  }
}

// ==========================
// 🔁 GET REVIEWS
// ==========================
async function getReviews(user, locationName) {
  return safeGoogleRequest(user, async (token) => {
    const res = await api.get(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${locationName}/reviews`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    return res.data.reviews || [];
  });
}

// ==========================
// 🔁 SYNC FOR ONE USER
// ==========================
async function runSyncForUser(userId) {
  let processed = 0;

  let user = await User.findById(userId);

  console.log("🔥 SYNC START:", user.email);

  if (!user?.google?.access_token) {
    throw new Error("No Google token");
  }

  // ==========================
  // STEP 1: ACCOUNTS
  // ==========================
  const accountsRes = await safeGoogleRequest(user, (token) =>
    api.get(
      "https://mybusinessbusinessinformation.googleapis.com/v1/accounts",
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
  );

  const accounts = accountsRes.data.accounts || [];

  if (!accounts.length) {
    throw new Error("No Google accounts found");
  }

  const accountName = accounts[0].name;

  // ==========================
  // STEP 2: LOCATIONS
  // ==========================
  const locationsRes = await safeGoogleRequest(user, (token) =>
    api.get(
      `https://mybusinessbusinessinformation.googleapis.com/v1/${accountName}/locations`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
  );

  const locations = locationsRes.data.locations || [];

  // ==========================
  // STEP 3: REVIEWS
  // ==========================
  for (const location of locations) {
    const reviews = await getReviews(user, location.name);

    for (const review of reviews) {
      const lastSync = user.lastSyncAt;

      if (lastSync && new Date(review.createTime) <= lastSync) {
        continue;
      }

      await processReview({
        userId: user._id,
        reviewData: {
          reviewId: review.reviewId,
          authorName: review.reviewer?.displayName,
          starRating: review.starRating,
          originalText: review.comment,
          createTime: review.createTime,
        },
      });

      processed++;
    }
  }

  // ==========================
  // STEP 4: UPDATE SYNC TIME
  // ==========================
  if (processed > 0) {
    await User.findByIdAndUpdate(user._id, {
      lastSyncAt: new Date(),
    });
  }

  console.log("✅ SYNC DONE:", user.email, "processed:", processed);

  return processed;
}

// ==========================
// ⏰ CRON JOB
// ==========================
function startSyncJob() {
  cron.schedule("*/2 * * * *", async () => {
    if (isSyncRunning) {
      console.log("⏳ Sync already running — skipping cycle");
      return;
    }

    isSyncRunning = true;

    console.log("⏰ Running scheduled sync...");

    try {
      const users = await User.find({
        "google.access_token": { $exists: true },
      });

      for (const user of users) {
  if (
    user.subscriptionStatus !== "active"
  ) {
    console.log(
      `⛔ Skipping ${user.email} (inactive subscription)`
    );
    continue;
  }

  const now = new Date();

        if (user.lastSyncFailureAt) {
          const minutesSinceFailure =
            (now - new Date(user.lastSyncFailureAt)) / (1000 * 60);

          if (minutesSinceFailure < 30) {
            console.log(`⏭ Skipping ${user.email} (recent failure)`);
            continue;
          }
        }

        let success = false;
        let attempts = 0;
        const maxAttempts = 3;

        while (!success && attempts < maxAttempts) {
          try {
            attempts++;

            console.log(`🔁 Attempt ${attempts} → ${user.email}`);

            const processed = await runSyncForUser(user._id);

            success = true;

            console.log(`✅ SUCCESS ${user.email} (${processed})`);

            await User.findByIdAndUpdate(user._id, {
              lastSyncFailureAt: null,
              lastSyncFailureReason: null,
              lastSyncAt: new Date(),
            });

          } catch (error) {
            console.log(`❌ FAILED ${user.email}:`, error.message);

            if (attempts === maxAttempts) {
              await User.findByIdAndUpdate(user._id, {
                lastSyncFailureAt: new Date(),
                lastSyncFailureReason:
                  error.response?.status === 429
                    ? "Google quota exceeded"
                    : error.message,
              });
            }

            if (error.response?.status === 429) {
              console.log("⏳ quota hit → waiting 15s...");
              await new Promise((r) => setTimeout(r, 15000));
            } else {
              break;
            }
          }
        }
      }

      console.log("🎯 SYNC CYCLE COMPLETE");

    } catch (err) {
      console.error("❌ SYNC JOB CRASH:", err.message);
    } finally {
      isSyncRunning = false;
    }
  });
}

module.exports = {
  startSyncJob,
  runSyncForUser,
};