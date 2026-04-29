const axios = require("axios");
const User = require("../models/user");

async function refreshGoogleToken(user) {
  try {
    if (!user.google?.refresh_token) {
      throw new Error("No refresh token available");
    }

    const response = await axios.post(
      "https://oauth2.googleapis.com/token",
      null,
      {
        params: {
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
          refresh_token: user.google.refresh_token,
          grant_type: "refresh_token",
        },
      }
    );

    const newAccessToken = response.data.access_token;
    const expiresIn = response.data.expires_in;

    await User.findByIdAndUpdate(user._id, {
      "google.access_token": newAccessToken,
      "google.expiry_date": Date.now() + expiresIn * 1000,
    });

    console.log("🔄 Google token refreshed:", user.email);

    return newAccessToken;
  } catch (error) {
    console.error("❌ Token refresh failed:", error.message);
    throw error;
  }
}

module.exports = { refreshGoogleToken };