const apiKeys = {
  "sk_test_123": {
    name: "Free User",
    requests: 0,
    limit: 100,
  },
};

const validateKey = (key) => {
  return apiKeys[key] || null;
};

const incrementUsage = (key) => {
  if (apiKeys[key]) {
    apiKeys[key].requests += 1;
  }
};

module.exports = {
  apiKeys,
  validateKey,
  incrementUsage,
};