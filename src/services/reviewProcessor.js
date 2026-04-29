const User = require("../models/user");
const Review = require("../models/review");
const { generateBusinessInsight } = require("./businessInsightService");

const {
  runAnalysis,
  generateReply,
  generateDispute,
} = require("./aiService");

async function processReview({ userId, review, reviewData }) {
  try {
    const text = review || reviewData?.originalText;
    const user = await User.findById(userId);

if (!user) {
  throw new Error("User not found");
}

    if (!text) {
      throw new Error("No review text provided");
    }
    const existing = await Review.findOne({
  userId,
  googleReviewId: reviewData?.reviewId,
});

if (existing) {
  console.log("⏭️ Skipping duplicate:", reviewData?.reviewId);
  return existing;
}

    const analysis = await runAnalysis(text);
    const reply = await generateReply(text, analysis);

    let dispute = null;
    if (analysis?.disputable === true) {
  dispute = await generateDispute(text, analysis);
}
const businessInsight = await generateBusinessInsight({
  businessType: user.businessType,
  reviewText: text,
  analysis
});

    const saved = await Review.create({
      userId,
      googleReviewId: reviewData?.reviewId || null,
      authorName: reviewData?.authorName || null,
      rating: reviewData?.starRating || null,
      originalText: text,
      reviewTime: reviewData?.createTime || new Date(),
      analysis,
      reply,
      dispute,
      businessInsight,
    });

    return saved;

  } catch (error) {
    console.error("PROCESS REVIEW ERROR:", error.message);

    return {
      userId,
      review: review || reviewData,
      error: error.message,
    };
  }
}

module.exports = {
  processReview,
};