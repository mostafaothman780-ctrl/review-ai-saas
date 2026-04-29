const User = require("../models/user");

module.exports = async function subscriptionCheck(req, res, next) {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    const now = new Date();

    // ======================
    // TRIAL EXPIRY LOGIC
    // ======================
    const trialEnd = new Date(user.trialStart);
    trialEnd.setDate(trialEnd.getDate() + 7);

    if (user.subscriptionStatus === "trial" && now > trialEnd) {
      user.subscriptionStatus = "expired";
      await user.save();
    }

    // ======================
    // SUBSCRIPTION EXPIRY LOGIC
    // ======================
    if (
      user.subscriptionStatus === "active" &&
      user.subscriptionEnd &&
      now > user.subscriptionEnd
    ) {
      user.subscriptionStatus = "expired";
      await user.save();
    }

    // ======================
    // BLOCK ACCESS
    // ======================
    if (user.subscriptionStatus !== "active") {
      return res.status(403).json({
        error: "Subscription required",
        status: user.subscriptionStatus,
      });
    }

    req.user = user; // useful later
    next();

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Subscription check failed" });
  }
};