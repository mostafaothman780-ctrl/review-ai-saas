const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    weekStart: {
      type: Date,
      default: Date.now,
    },

    summary: {
      type: String,
      default: "",
    },

    problems: {
      type: [String],
      default: [],
    },

    actionPlan: {
      step1: { type: String, default: "" },
      step2: { type: String, default: "" },
      step3: { type: String, default: "" },
    },

    opportunities: {
      type: [String],
      default: [],
    },

    // ✅ FIXED POSITION (MUST BE INSIDE SCHEMA)
    businessScore: {
      type: Number,
      default: 50,
    },

    // optional trend tracking
    scoreTrend: {
      type: Object,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Report", reportSchema);