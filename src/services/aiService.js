const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔍 1. ANALYSIS (your original — slightly improved)
const runAnalysis = async (review) => {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content: `
You are a SaaS review intelligence engine.

Return JSON:
{
  "sentiment": "positive|negative|neutral",
  "risk_score": 0-100,
  "topics": [],
  "claims": [],
  "flags": [],
  "disputable": boolean,
  "explanation": string,
  "action": "approve|flag|remove"
}
        `,
      },
      {
        role: "user",
        content: review,
      },
    ],
  });

  return JSON.parse(response.choices[0].message.content);
};

// 💬 2. SMART REPLY GENERATOR
const generateReply = async (review, analysis = null) => {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
You are a professional business owner responding to customer reviews.

Use the analysis context if provided.

Rules:
- Human tone
- Natural language
- No robotic phrasing
- If negative sentiment → show empathy
- If high risk → reassure and take responsibility
        `,
      },
      {
        role: "user",
        content: `
Review:
${review}

Analysis (if available):
${JSON.stringify(analysis)}
        `,
      },
    ],
  });

  return response.choices[0].message.content;
};

// ⚖️ 3. DISPUTE GENERATOR

const generateDispute = async (review) => {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
You are writing a professional dispute request to Google.

The review has already been flagged as violating policies.

Write a strong, professional message requesting removal.

Focus on:
- false claims
- potential defamation
- lack of real experience
- damage to business reputation

DO NOT say it's not suitable.
ALWAYS write the dispute.
        `,
      },
      {
        role: "user",
        content: review,
      },
    ],
  });

  return response.choices[0].message.content;
};

// 📊 4. INSIGHTS (batch reviews)
const generateInsights = async (reviews) => {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
Analyze customer reviews and return:

- top complaints
- top strengths
- improvement suggestions
- summary

Be concise and actionable.
        `,
      },
      {
        role: "user",
        content: reviews.join("\n"),
      },
    ],
  });

  return response.choices[0].message.content;
};

module.exports = {
  runAnalysis,
  generateReply,
  generateDispute,
  generateInsights,
};