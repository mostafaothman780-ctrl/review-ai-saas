const User = require("../models/user");

module.exports = async function creditCheck(req, res, next) {
  try {
    const userId = req.userId || req.user?.id;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // =========================
    // CHECK CREDITS
    // =========================
    if (user.credits <= 0) {
      return res.status(403).json({
        error: "No credits left",
        upgradeRequired: true,
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("CREDIT CHECK ERROR:", error.message);

    return res.status(500).json({
      error: "Credit check failed",
    });
  }
};