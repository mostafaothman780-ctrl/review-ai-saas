const { generateBusinessInsight } = require("./businessInsightService");
const User = require("../models/user");
const Report = require("../models/report");

async function generateWeeklyReport(userId, reviews) {
  try {
    const user = await User.findById(userId);

    if (!user) throw new Error("User not found");

    // ==========================
    // 🧠 PREP REVIEW TEXT
    // ==========================
    const reviewText = reviews
      .map(r => r.originalText)
      .join("\n");

    // ==========================
    // 🧠 AI ANALYSIS
    // ==========================
    const report = await generateBusinessInsight({
      businessType: user.businessType,
      businessName: user.businessName,
      businessLocation: user.businessLocation,
      reviewText,
    });

    // ==========================
    // 🛡 SAFETY CHECKS
    // ==========================
    if (!report) {
      throw new Error("AI report generation failed");
    }

    if (!report.businessScore) {
      report.businessScore = 50;
    }

    if (!report.summary) report.summary = "No summary generated";
    if (!report.problems) report.problems = [];
    if (!report.actionPlan) {
      report.actionPlan = {
        step1: "No action generated",
        step2: "No action generated",
        step3: "No action generated",
      };
    }
    if (!report.opportunities) report.opportunities = [];

    // ==========================
// 📈 GET LAST REPORT (TREND)
// ==========================
const lastReport = await Report.findOne({ userId })
  .sort({ weekStart: -1 });

let previousScore = null;
let scoreChange = 0;

if (lastReport && lastReport.businessScore) {
  previousScore = lastReport.businessScore;
  const currentScore = Number(report.businessScore || 50);

scoreChange = currentScore - previousScore;

report.businessScore = currentScore;
}

report.scoreTrend = {
  previousScore,
  change: scoreChange,
  direction:
    scoreChange > 0
      ? "improved"
      : scoreChange < 0
      ? "declined"
      : "stable",
};

    // ==========================
    // 💾 SAVE TO DATABASE
    // ==========================
    if (!report.summary) {
  report.summary = "No summary generated";
}

if (!Array.isArray(report.problems)) {
  report.problems = [];
}

if (!report.actionPlan) {
  report.actionPlan = {
    highPriority: "No action generated",
    mediumPriority: "No action generated",
    lowPriority: "No action generated",
  };
}

if (!Array.isArray(report.opportunities)) {
  report.opportunities = [];
}

if (!report.businessScore) {
  report.businessScore = 50;
}
    const savedReport = await Report.create({
  userId,
  weekStart: new Date(),

  summary: report.summary,
  problems: report.problems,
  actionPlan: report.actionPlan,
  opportunities: report.opportunities,

  businessScore: report.businessScore,

  // ✅ ADD THIS
  scoreTrend: report.scoreTrend,
    });

    return savedReport;

  } catch (error) {
    console.error("WEEKLY REPORT ERROR:", error.message);

    return {
      error: error.message,
      summary: "Failed to generate report",
      problems: [],
      actionPlan: {},
      opportunities: [],
      businessScore: 50,
    };
  }
}

module.exports = { generateWeeklyReport };