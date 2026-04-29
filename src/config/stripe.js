const Stripe = require("stripe");

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY in .env file");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

console.log("Stripe loaded successfully");

module.exports = stripe;