const businessProfiles = require("../config/businessTypeProfiles");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateBusinessInsight({
  businessType,
  businessName,
  businessLocation,
  reviewText,
}) {
  try {
    // ==========================
    // BUSINESS PROFILE
    // ==========================
    const profile =
      businessProfiles[businessType] ||
      businessProfiles.retail_store;

    const industryBaseline = profile.averageScore || 70;

    // ==========================
    // SYSTEM PROMPT
    // ==========================
    const systemPrompt = `
You are a senior business consultant AI.

You must prioritize recommendations based on revenue impact.

Rules:
- High impact = directly affects revenue or customer retention
- Medium impact = improves operations or satisfaction
- Low impact = cosmetic or minor improvements

Ranking rule:
Choose highPriority as the issue that most directly reduces customer complaints or increases repeat customers.

You MUST rank action steps by impact.

You analyze customer reviews for small and medium businesses.

Business type: ${profile.name}
Business name: ${businessName}
Location: ${businessLocation}

You MUST respond ONLY in valid JSON.

No explanations.
No markdown.
No extra text.

Return EXACTLY this structure:

{
  "summary": "string",
  "problems": ["string"],

  "actionPlan": {
    "highPriority": "string",
    "mediumPriority": "string",
    "lowPriority": "string"
  },

  "opportunities": ["string"],

  "businessScore": 0-100 integer only,

  "revenueImpact": {
    "topIssue": "string",
    "estimatedRevenueLift": "low" | "medium" | "high"
  }
}
`;

    // ==========================
    // USER PROMPT
    // ==========================
    const userPrompt = `
Business Profile Context:
- Strength focus: ${profile.customerPriorities.join(", ")}
- Common issues: ${profile.commonIssues.join(", ")}
- Improvement focus: ${profile.improvementFocus.join(", ")}

Customer Reviews:
${reviewText}
`;

    // ==========================
    // OPENAI CALL
    // ==========================
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "user",
          content: userPrompt,
        },
      ],
      temperature: 0.4,
    });

    const responseText =
      response.choices[0].message.content || "";

    // ==========================
    // SAFE JSON PARSE
    // ==========================
    let parsed;

    try {
      const cleanText = responseText
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      parsed = JSON.parse(cleanText);

    } catch (error) {
      console.error("JSON PARSE ERROR:", error.message);

      parsed = {
        summary: "AI response parsing failed",
        problems: [],
        actionPlan: {
          highPriority: "Manual review needed",
          mediumPriority: "Check customer feedback",
          lowPriority: "Monitor next report",
        },
        opportunities: [],
        businessScore: 50,
        revenueImpact: {
          topIssue: "Unknown",
          estimatedRevenueLift: "medium",
        },
      };
    }

    // ==========================
    // SAFE DEFAULTS
    // ==========================
    if (!parsed.businessScore) {
      parsed.businessScore = 50;
    }

    if (!parsed.problems) {
      parsed.problems = [];
    }

    // ==========================
    // REVENUE IMPACT FALLBACK
    // ==========================
    const problems = parsed.problems || [];

    parsed.revenueImpact = {
      topIssue:
        parsed.revenueImpact?.topIssue ||
        problems[0] ||
        "Unknown issue",

      estimatedRevenueLift:
        parsed.revenueImpact?.estimatedRevenueLift ||
        (parsed.businessScore < 50
          ? "high"
          : parsed.businessScore < 75
          ? "medium"
          : "low"),
    };

    // ==========================
    // COMPETITOR BENCHMARK
    // ==========================
    const businessScore = Number(parsed.businessScore || 50);

    const scoreGap = businessScore - industryBaseline;

    parsed.businessScore = businessScore;

    parsed.competitorBenchmark = {
      industryAverage: industryBaseline,
      scoreGap,

      position:
        scoreGap >= 10
          ? "above average"
          : scoreGap >= 0
          ? "average"
          : "below average",

      message:
        scoreGap >= 10
          ? "Your business is performing better than similar businesses in your category."
          : scoreGap >= 0
          ? "Your business is around the industry average."
          : "Your business is underperforming compared to competitors in your category.",
    };

    return parsed;

  } catch (error) {
    console.error(
      "BUSINESS INSIGHT ERROR:",
      error.message
    );

    return {
      summary: "Error generating insight",

      problems: [],

      actionPlan: {
        highPriority: "Review system error",
        mediumPriority: "Check AI service",
        lowPriority: "Retry request",
      },

      opportunities: [],

      businessScore: 50,

      revenueImpact: {
        topIssue: "System issue",
        estimatedRevenueLift: "medium",
      },

      competitorBenchmark: {
        industryAverage: 70,
        scoreGap: 0,
        position: "average",
        message: "Benchmark unavailable",
      },

      error: error.message,
    };
  }
}

module.exports = {
  generateBusinessInsight,
};