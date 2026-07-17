import chalk from "chalk";
import app from "./app.js";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
dotenv.config();

const PORT = process.env.PORT || 5000;

// Connect to MongoDB, then start server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(chalk.bgGreenBright(`🚀 Server is running on: http://localhost:${PORT}`));
  });
});
