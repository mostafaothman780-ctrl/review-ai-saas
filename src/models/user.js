const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      index: true,
      unique: true,
    },

    password: {
      type: String,
      default: null,
    },

    // ======================
    // SUBSCRIPTION SYSTEM
    // ======================
    subscriptionStatus: {
      type: String,
      enum: ["trial", "active", "expired"],
      default: "trial",
    },

    trialStart: {
      type: Date,
      default: Date.now,
    },

    // ======================
    // STRIPE INTEGRATION
    // ======================
    stripeCustomerId: {
      type: String,
      default: null,
      index: true,
    },

    stripeSubscriptionId: {
      type: String,
      default: null,
      index: true,
    },

    stripeEvents: {
      type: [String],
      default: [],
    },

    // ======================
    // BUSINESS INFO
    // ======================
    businessType: {
      type: String,
      default: "retail_store",
    },

    businessName: {
      type: String,
      default: "",
    },

    businessLocation: {
      type: String,
      default: "",
    },

    // ======================
    // GOOGLE AUTH
    // ======================
    google: {
      access_token: String,
      refresh_token: String,
      expiry_date: Number,
    },

    // ======================
    // SYNC STATUS
    // ======================
    lastSyncAt: Date,
    lastSyncFailureAt: Date,
    lastSyncFailureReason: String,

    // ======================
    // REPORTS
    // ======================
    lastWeeklyReportSentAt: Date,
    lastWeeklyReportFailureAt: Date,
    lastWeeklyReportFailureReason: String,

    // ======================
    // GOOGLE CACHE
    // ======================
    googleAccounts: {
      type: Object,
      default: null,
    },

    googleAccountsUpdatedAt: Date,

    googleLocations: {
      type: Object,
      default: null,
    },

    googleLocationsUpdatedAt: Date,
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("User", userSchema);