const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected");
    console.log("📦 DB Name:", conn.connection.name);

  } catch (err) {
    console.error("DB connection error:", err);
  }
};

module.exports = connectDB;