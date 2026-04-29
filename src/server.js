require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");

const connectDB = require("./config/db");
const subscriptionCheck = require("./middleware/subscriptionCheck");

// ======================
// INIT APP
// ======================
const app = express();

// ======================
// MIDDLEWARE
// ======================
app.use(cookieParser());

// ⚠️ IMPORTANT: Webhook route needs raw body BEFORE JSON parsing
const webhookRoute = require("./routes/webhook");
app.use("/webhook", webhookRoute);

// Now apply JSON parsing for other routes
app.use(express.json());

// ======================
// ROUTES
// ======================
const googleRoute = require("./routes/google");
const billingRoute = require("./routes/billing");
const analyzeRoute = require("./routes/analyze");
const authRoute = require("./routes/auth");
const reportRoute = require("./routes/reports");
const adminRoute = require("./routes/admin");
const adminUI = require("./routes/adminUI");

app.use("/google", googleRoute);
app.use("/billing", billingRoute);
app.use("/auth", authRoute);
app.use("/admin", adminRoute);
app.use("/admin-ui", adminUI);

// 🔐 PROTECT ROUTES FIRST
app.use("/analyze", subscriptionCheck);
app.use("/reports", subscriptionCheck);
app.use("/sync", subscriptionCheck);

// THEN ROUTES
app.use("/analyze", analyzeRoute);
app.use("/reports", reportRoute);

// ======================
// BASIC ROUTES
// ======================
app.get("/success", (req, res) => {
  res.send("<h1>Payment Successful ✅</h1>");
});

app.get("/cancel", (req, res) => {
  res.send("<h1>Payment Cancelled ❌</h1>");
});

// ======================
// DASHBOARD UI (TEMP)
// ======================
app.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Review AI</title>
  <style>
    body {
      font-family: Arial;
      max-width: 800px;
      margin: auto;
      padding: 20px;
      background: #f9f9f9;
    }

    h1 { text-align: center; }

    textarea {
      width: 100%;
      padding: 10px;
      border-radius: 6px;
      border: 1px solid #ccc;
    }

    button {
      padding: 10px 15px;
      margin-top: 10px;
      cursor: pointer;
      border: none;
      border-radius: 6px;
      background: #007bff;
      color: white;
    }

    .box {
      background: white;
      padding: 15px;
      margin-top: 15px;
      border-radius: 10px;
      box-shadow: 0 2px 5px rgba(0,0,0,0.1);
    }
  </style>
</head>

<body>
  <h1>🚀 Review AI Dashboard</h1>

  <h3>Upgrade</h3>
  <button onclick="subscribe()">Start Trial</button>

  <h3>Analyze Review</h3>
  <textarea id="review" rows="4"></textarea>
  <button onclick="analyze()">Analyze</button>

  <div id="result" class="box"></div>

<script>

const params = new URLSearchParams(window.location.search);

if (params.get("google") === "success") {
  alert("Google connected successfully ✅");
}

if (params.get("google") === "failed") {
  alert("Google connection failed ❌");
}

async function analyze() {
  const review = document.getElementById("review").value;

  const res = await fetch("/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ review })
  });

  const data = await res.json();

  document.getElementById("result").innerText =
    JSON.stringify(data, null, 2);
}

async function subscribe() {
  const email = prompt("Enter your account email");

  const res = await fetch("/billing/create-checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ email })
  });

  const data = await res.json();

  if (data.url) {
    window.location.href = data.url;
  } else {
    alert("Stripe error: " + (data.error || "Unknown error"));
  }
}

</script>

</body>
</html>
  `);
});

// ======================
// START SERVER (SAFE)
// ======================
const PORT = process.env.PORT || 3000;

(async () => {
  try {
    await connectDB();

    // ======================
    // START JOBS (AFTER DB)
    // ======================
    const {
  startSyncJob,
} = require("./jobs/syncjob");
    const startWeeklyReportJob = require("./jobs/weeklyReportJob");

    startSyncJob();
    startWeeklyReportJob();

    // ======================
    // START SERVER
    // ======================
    const server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });

    server.on("error", (error) => {
      if (error.code === "EADDRINUSE") {
        const newPort = Number(PORT) + 1;

        console.warn(`Port ${PORT} in use. Switching to ${newPort}...`);

        app.listen(newPort, () => {
          console.log(`🚀 Server running on http://localhost:${newPort}`);
        });

        return;
      }

      console.error("Server error:", error);
      process.exit(1);
    });

  } catch (error) {
    console.error("❌ Failed to start server:", error);
  }
})();