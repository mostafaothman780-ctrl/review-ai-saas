const User = require("../models/user");

// =========================
// GET CACHE
// =========================
async function getCachedLocations(userId) {
  const user = await User.findById(userId);

  if (!user) return null;

  return {
    data: user.googleLocations,
    updatedAt: user.googleLocationsUpdatedAt,
  };
}

// =========================
// SET CACHE
// =========================
async function setCachedLocations(userId, locations) {
  await User.findByIdAndUpdate(userId, {
    googleLocations: locations,
    googleLocationsUpdatedAt: new Date(),
  });
}

module.exports = {
  getCachedLocations,
  setCachedLocations,
};