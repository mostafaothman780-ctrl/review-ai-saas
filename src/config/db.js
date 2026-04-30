const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log("MongoDB connected");
    console.log("📦 DB Name:", conn.connection.name);

  } catch (err) {
    console.error("❌ DB connection error:", err.message);

    // 🔥 STOP the app completely
    process.exit(1);
  }
};

module.exports = connectDB;