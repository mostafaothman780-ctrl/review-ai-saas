const cron = require("node-cron");
const User = require("../models/user");
const Review = require("../models/review");

const {
  generateWeeklyReport,
} = require("../services/weeklyReportService");

const {
  sendWeeklyReport,
} = require("../services/emailService");

// ==========================
// 🔒 GLOBAL LOCK (PREVENT OVERLAP)
// ==========================
let isReportRunning = false;

// ==========================
// WEEKLY REPORT CRON
// Every Monday at 9:00 AM
// ==========================
function startWeeklyReportJob() {
  cron.schedule("0 9 * * MON", async () => {
    if (isReportRunning) {
      console.log("⏳ Weekly report already running — skipping");
      return;
    }

    isReportRunning = true;

    console.log("📊 Running weekly reports...");

    try {
      const users = await User.find({
        "google.access_token": { $exists: true },
      });

      console.log(`👥 Users found: ${users.length}`);

      for (const user of users) {
        if (
  user.subscriptionStatus !== "active"
) {
  console.log(
    `⛔ Skipping ${user.email} (inactive subscription)`
  );
  continue;
}
        try {
          console.log(`📊 Processing: ${user.email}`);

          // ==========================
          // GET LAST 7 DAYS REVIEWS
          // ==========================
          const reviews = await Review.find({
            userId: user._id,
            createTime: {
              $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          });

          console.log(`📝 Reviews found: ${reviews.length}`);

          // skip empty data
          if (!reviews.length) {
            console.log(`⏭ No reviews: ${user.email}`);
            continue;
          }

          // ==========================
          // GENERATE REPORT
          // ==========================
          const report = await generateWeeklyReport(
            user._id,
            reviews
          );

          if (!report || report.error) {
            console.log(`⚠️ Report failed: ${user.email}`);

            await User.findByIdAndUpdate(user._id, {
              lastWeeklyReportFailureAt: new Date(),
              lastWeeklyReportFailureReason: "Report generation failed",
            });

            continue;
          }

          // ==========================
          // SEND EMAIL
          // ==========================
          const emailResult = await sendWeeklyReport(
            user.email,
            report
          );

          // IMPORTANT: your email service currently doesn't return success
          // so we handle it safely
          if (emailResult === false) {
            console.log(`⚠️ Email failed: ${user.email}`);

            await User.findByIdAndUpdate(user._id, {
              lastWeeklyReportFailureAt: new Date(),
              lastWeeklyReportFailureReason: "Email failed",
            });

            continue;
          }

          // ==========================
          // SUCCESS STATE
          // ==========================
          await User.findByIdAndUpdate(user._id, {
            lastWeeklyReportSentAt: new Date(),
            lastWeeklyReportFailureAt: null,
            lastWeeklyReportFailureReason: null,
          });

          console.log(`✅ Sent: ${user.email}`);

        } catch (error) {
          console.error(`❌ USER ERROR ${user.email}:`, error.message);

          await User.findByIdAndUpdate(user._id, {
            lastWeeklyReportFailureAt: new Date(),
            lastWeeklyReportFailureReason: error.message,
          });
        }
      }

      console.log("🎯 Weekly report cycle completed");

    } catch (error) {
      console.error("❌ WEEKLY JOB FAILED:", error.message);
    } finally {
      isReportRunning = false;
    }
  });
}

module.exports = startWeeklyReportJob;