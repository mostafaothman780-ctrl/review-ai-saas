const express = require("express");
const router = express.Router();
const Stripe = require("stripe");
const User = require("../models/user");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

// ==========================
// STRIPE WEBHOOK
// ==========================
router.post(
  "/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    let event;

    // ==========================
    // VERIFY SIGNATURE
    // ==========================
    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        req.headers["stripe-signature"],
        endpointSecret
      );
    } catch (err) {
      console.error("❌ Webhook signature failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      const eventId = event.id;

      console.log("🔥 WEBHOOK EVENT RECEIVED:", event.type);

      // ==========================
      // IDEMPOTENCY CHECK
      // ==========================
      const alreadyProcessed = await User.findOne({
        stripeEvents: eventId,
      });

      if (alreadyProcessed) {
        console.log("🔁 Duplicate event ignored:", eventId);
        return res.json({ received: true });
      }

      // ==========================
      // SWITCH EVENTS
      // ==========================
      switch (event.type) {

        // ==========================
        // CHECKOUT COMPLETED
        // ==========================
        case "checkout.session.completed": {
          const session = event.data.object;

          console.log("🔥 CHECKOUT SESSION:", session.id);

          const email =
            session.customer_email ||
            session.customer_details?.email;

          const userId = session.client_reference_id;

          let user = null;

          if (userId) {
            user = await User.findById(userId);
          }

          if (!user && email) {
            user = await User.findOne({ email });
          }

          if (!user) {
            console.log("⚠️ USER NOT FOUND");
            break;
          }

          const customerId = session.customer;
          const subscriptionId = session.subscription;

          user.subscriptionStatus = "active";
          user.stripeCustomerId = customerId || null;
          user.stripeSubscriptionId = subscriptionId || null;

          if (!user.stripeEvents) user.stripeEvents = [];
          user.stripeEvents.push(eventId);

          await user.save();

          console.log("✅ USER UPDATED:", user.email);

          break;
        }

        // ==========================
        // SUBSCRIPTION CANCELLED
        // ==========================
        case "customer.subscription.deleted": {
          const subscription = event.data.object;

          const customerId = subscription.customer;

          const user = await User.findOne({
            stripeCustomerId: customerId,
          });

          if (!user) {
            console.log("⚠️ CANCEL USER NOT FOUND");
            break;
          }

          user.subscriptionStatus = "expired";

          if (!user.stripeEvents) user.stripeEvents = [];
          user.stripeEvents.push(eventId);

          await user.save();

          console.log("❌ SUBSCRIPTION CANCELLED:", user.email);

          break;
        }

        // ==========================
        // DEFAULT
        // ==========================
        default:
          console.log("ℹ️ Unhandled event:", event.type);
      }

      return res.json({ received: true });

    } catch (error) {
      console.error("❌ Webhook processing error:", error.message);
      return res.status(500).json({ error: "Webhook failed" });
    }
  }
);

module.exports = router;