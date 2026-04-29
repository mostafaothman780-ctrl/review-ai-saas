const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },

    plan: {
      type: String,
      enum: ["free", "pro"],
      default: "free",
    },

    apiKey: { type: String },

    limit: { type: Number, default: 100 },
    used: { type: Number, default: 0 },

    google: {
      access_token: String,
      refresh_token: String,
      expiry_date: Number,
    },

    googleAccounts: Object,
    googleAccountsUpdatedAt: Date,

    googleLocations: Object,
    googleLocationsUpdatedAt: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);