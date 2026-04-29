const express = require("express");
const router = express.Router();
const stripe = require("../config/stripe");

console.log("PRICE ID:", process.env.STRIPE_PRICE_ID);

// ======================
// CREATE CHECKOUT SESSION
// ======================
router.post("/create-checkout-session", async (req, res) => {
  console.log("🔥 Checkout route hit");

  if (!process.env.STRIPE_PRICE_ID) {
    return res.status(500).json({
      error: "STRIPE_PRICE_ID is not configured in .env",
    });
  }

  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: "Email is required",
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "subscription",

      customer_email: email,

      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],

      success_url: `${process.env.BASE_URL}/success`,
cancel_url: `${process.env.BASE_URL}/cancel`,
    });

    res.json({
      url: session.url,
    });

  } catch (err) {
    console.error("FULL STRIPE ERROR:", err);

    return res.status(500).json({
      error: err.message,
      raw: err.raw || null,
    });
  }
});

module.exports = router;