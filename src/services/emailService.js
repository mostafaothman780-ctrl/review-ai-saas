const nodemailer = require("nodemailer");

// ==========================
// BUILD EMAIL HTML
// ==========================
function buildWeeklyReportHTML(report) {
  return `
  <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 650px; margin: auto;">

    <h2>📊 Weekly Business Intelligence Report</h2>

    <h3>📈 Business Score: ${report.businessScore || 50}/100</h3>

    <p>
      <b>Trend:</b>
      ${report.scoreTrend?.direction || "stable"}
      (${report.scoreTrend?.change || 0} points)
    </p>

    <hr/>

    <h3>🔥 Top Issue</h3>
    <p>${report.revenueImpact?.topIssue || "Not available"}</p>

    <h3>💰 Revenue Impact</h3>
    <p>
      <b>${report.revenueImpact?.estimatedRevenueLift || "medium"}</b>
    </p>

    <hr/>

    <h3>📌 Action Plan</h3>
    <ul>
      <li><b>High Priority:</b> ${report.actionPlan?.highPriority || "N/A"}</li>
      <li><b>Medium Priority:</b> ${report.actionPlan?.mediumPriority || "N/A"}</li>
      <li><b>Low Priority:</b> ${report.actionPlan?.lowPriority || "N/A"}</li>
    </ul>

    <hr/>

    <h3>📊 Competitor Benchmark</h3>
    <p>
      ${report.competitorBenchmark?.message || "No benchmark available"}
    </p>

    <hr/>

    <h3>🧠 Summary</h3>
    <p>${report.summary || "No summary available"}</p>

    <hr/>

    <p style="font-size: 12px; color: gray; text-align: center;">
      Powered by Review AI SaaS 🚀
    </p>

  </div>
  `;
}

// ==========================
// SEND WEEKLY REPORT
// ==========================
async function sendWeeklyReport(email, report) {
  try {
    // safety check
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      throw new Error("Missing EMAIL_USER or EMAIL_PASS in .env");
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // verify transporter before sending
    await transporter.verify();

    const subject =
      `📊 Weekly Report - Score ${report.businessScore || 50}/100`;

    const html = buildWeeklyReportHTML(report);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject,
      html,
    });

    console.log("✅ Weekly report sent to:", email);

    return {
      success: true,
    };

  } catch (error) {
    console.error("❌ EMAIL ERROR:", error.message);

    return {
      success: false,
      error: error.message,
    };
  }
}

module.exports = {
  sendWeeklyReport,
};