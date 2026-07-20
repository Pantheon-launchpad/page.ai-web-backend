import mongoose from "mongoose";
import env from "./env.js";

const isDefaultLocalUri = env.MONGO_URI === "mongodb://127.0.0.1:27017/pageai";

const connectDB = async () => {
  try {
    const connection = await mongoose.connect(env.MONGO_URI);
    console.log(`MongoDB connected: ${connection.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);

    // The most common cause of this in a deployed environment (Render,
    // Railway, etc.) is simply forgetting to set MONGO_URI — the app then
    // silently falls back to a localhost default that can never work on a
    // host without its own local MongoDB. Make that unmistakable instead
    // of leaving it to be inferred from a generic ECONNREFUSED.
    if (isDefaultLocalUri) {
      console.error(
        "\n[startup] MONGO_URI is not set, so the app fell back to " +
          `"${env.MONGO_URI}" — a default meant for local development only. ` +
          "\n[startup] Set MONGO_URI in this environment's variables to a real " +
          "MongoDB connection string (e.g. a MongoDB Atlas URI) and redeploy.\n",
      );
    }

    process.exit(1);
  }
};

export default connectDB;
