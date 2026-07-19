import app from "./app.js";
import connectDB from "./config/db.js";
import env from "./config/env.js";

connectDB()
  .then(() => {
    app.listen(env.PORT, () => {
      console.log(`Page.AI backend running on http://localhost:${env.PORT}`);
      console.log(`API base: http://localhost:${env.PORT}/api/v1`);
      console.log(`Docs:     http://localhost:${env.PORT}/docs`);
    });
  })
  .catch((error) => {
    console.error(`Database connection failed: ${error.message}`);
    process.exit(1);
  });
