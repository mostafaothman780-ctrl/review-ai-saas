const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    userId: String,

    googleReviewId: {
      type: String,
      index: true,
    },

    authorName: String,
    rating: Number,
    originalText: String,
    reviewTime: Date,

    analysis: Object,
    reply: String,
    dispute: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Review", reviewSchema);