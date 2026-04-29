const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");

function generateWeeklyReportPDF(report, userEmail) {
  return new Promise((resolve, reject) => {
    try {
      const fileName = `report-${Date.now()}.pdf`;
      const filePath = path.join(__dirname, "../reports", fileName);

      const doc = new PDFDocument();

      // create file stream
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      // =========================
      // HEADER
      // =========================
      doc.fontSize(20).text("Weekly Business Report", {
        align: "center",
      });

      doc.moveDown();

      doc.fontSize(12).text(`User: ${userEmail}`);
      doc.text(`Score: ${report.businessScore}/100`);

      doc.moveDown();

      // =========================
      // SUMMARY
      // =========================
      doc.fontSize(14).text("Summary");
      doc.fontSize(11).text(report.summary || "");

      doc.moveDown();

      // =========================
      // PROBLEMS
      // =========================
      doc.fontSize(14).text("Main Problems");

      (report.problems || []).forEach((p, i) => {
        doc.fontSize(11).text(`${i + 1}. ${p}`);
      });

      doc.moveDown();

      // =========================
      // ACTION PLAN
      // =========================
      doc.fontSize(14).text("Action Plan");

      doc.fontSize(11).text(
        `High Priority: ${report.actionPlan?.highPriority || ""}`
      );

      doc.fontSize(11).text(
        `Medium Priority: ${report.actionPlan?.mediumPriority || ""}`
      );

      doc.fontSize(11).text(
        `Low Priority: ${report.actionPlan?.lowPriority || ""}`
      );

      doc.moveDown();

      // =========================
      // OPPORTUNITIES
      // =========================
      doc.fontSize(14).text("Opportunities");

      (report.opportunities || []).forEach((o) => {
        doc.fontSize(11).text(`• ${o}`);
      });

      doc.end();

      stream.on("finish", () => {
        resolve(filePath);
      });
    } catch (error) {
      reject(error);
    }
  });
}

module.exports = {
  generateWeeklyReportPDF,
};