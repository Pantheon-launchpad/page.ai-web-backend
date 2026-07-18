import "dotenv/config";
import app from "./app.js";
import connectDB from "./config/db.js";
import passport from "./config/passport.js";

app.use(passport.initialize());

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`server is running on: http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error(`Database connection failed: ${error.message}`);
  });