const users = require("../data/users");

const authMiddleware = (req, res, next) => {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({ error: "Missing API key" });
  }

  const user = users.find(u => u.apiKey === apiKey);

  if (!user) {
    return res.status(403).json({ error: "Invalid API key" });
  }

  if (user.used >= user.limit) {
    return res.status(429).json({ error: "Limit reached. Upgrade plan." });
  }

  user.used++;

  req.user = user;

  next();
};

module.exports = authMiddleware;