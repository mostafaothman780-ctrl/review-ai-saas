const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      console.error("❌ MONGO_URI is missing");
      process.exit(1);
    }

    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4, // 🔥 Force IPv4 (important for Render)
    });

    console.log("✅ MongoDB connected");
    console.log("📦 DB Name:", conn.connection.name);

  } catch (err) {
    console.error("❌ DB connection error:", err.message);

    // 🔥 Stop app if DB fails (prevents hidden crashes)
    process.exit(1);
  }
};

module.exports = connectDB;