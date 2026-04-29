require("dotenv").config();
const connectDB = require("./src/config/db");
connectDB();
const app = require("./src/server");

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});