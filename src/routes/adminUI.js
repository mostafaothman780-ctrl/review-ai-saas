const express = require("express");
const router = express.Router();

// ======================
// ADMIN DASHBOARD UI
// ======================
router.get("/", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html>
<head>
  <title>Admin Dashboard</title>
  <style>
    body {
      font-family: Arial;
      background: #0f172a;
      color: white;
      margin: 0;
      padding: 20px;
    }

    h1 {
      text-align: center;
      margin-bottom: 30px;
    }

    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      max-width: 1100px;
      margin: auto;
    }

    .card {
      background: #1e293b;
      padding: 20px;
      border-radius: 12px;
    }

    button {
      width: 100%;
      padding: 10px;
      margin-top: 10px;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      background: #3b82f6;
      color: white;
      font-size: 14px;
    }

    input {
      width: 100%;
      padding: 10px;
      margin-top: 10px;
      border-radius: 8px;
      border: none;
    }

    pre {
      background: #0f172a;
      padding: 12px;
      border-radius: 8px;
      overflow: auto;
      margin-top: 15px;
      max-height: 300px;
    }
  </style>
</head>

<body>

<h1>📊 Review AI Admin Dashboard</h1>

<div class="grid">

  <div class="card">
    <h3>System Overview</h3>
    <button onclick="load('/admin/overview', 'overview')">
      Load Overview
    </button>
    <pre id="overview"></pre>
  </div>

  <div class="card">
    <h3>System Health</h3>
    <button onclick="load('/admin/health', 'health')">
      Load Health
    </button>
    <pre id="health"></pre>
  </div>

  <div class="card">
    <h3>Sync Failures</h3>
    <button onclick="load('/admin/sync-failures', 'sync')">
      Load Sync Failures
    </button>
    <pre id="sync"></pre>
  </div>

  <div class="card">
    <h3>Email Failures</h3>
    <button onclick="load('/admin/email-failures', 'email')">
      Load Email Failures
    </button>
    <pre id="email"></pre>
  </div>

  <div class="card">
    <h3>All Users</h3>
    <button onclick="load('/admin/users', 'users')">
      Load Users
    </button>
    <pre id="users"></pre>
  </div>

  <div class="card">
    <h3>Force User Sync</h3>

    <input
      id="userId"
      placeholder="Enter User ID"
    />

    <button onclick="forceSync()">
      Run Manual Sync
    </button>

    <pre id="force"></pre>
  </div>

</div>

<script>
const adminKey = prompt("Enter Admin Key");

async function load(endpoint, targetId) {
  const res = await fetch(endpoint, {
    headers: {
      "x-admin-key": adminKey
    }
  });

  const data = await res.json();

  document.getElementById(targetId).innerText =
    JSON.stringify(data, null, 2);
}

async function forceSync() {
  const userId = document.getElementById("userId").value;

  if (!userId) {
    alert("User ID required");
    return;
  }

  const res = await fetch(
    "/admin/force-sync/" + userId,
    {
      method: "POST",
      headers: {
        "x-admin-key": adminKey
      }
    }
  );

  const data = await res.json();

  document.getElementById("force").innerText =
    JSON.stringify(data, null, 2);
}
</script>

</body>
</html>
  `);
});

module.exports = router;