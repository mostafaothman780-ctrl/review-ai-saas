const analyzeReview = async (req, res) => {
  try {
    const { review } = req.body;

    if (!review) {
      return res.status(400).json({ error: "Missing review" });
    }

    // 🔥 TEMP AI LOGIC (works immediately)
    const lower = review.toLowerCase();

    let sentiment = "neutral";
    let risk_score = 50;
    let flags = [];

    if (lower.includes("bad") || lower.includes("terrible")) {
      sentiment = "negative";
      risk_score = 80;
    }

    if (lower.includes("scam") || lower.includes("fraud")) {
      flags.push("accusation");
      risk_score = 90;
    }

    return res.json({
      sentiment,
      risk_score,
      topics: [],
      claims: [],
      flags,
      disputable: risk_score > 70,
    });

  } catch (error) {
    return res.status(500).json({
      error: "Analysis failed",
      details: error.message,
    });
  }
};

module.exports = { analyzeReview };