import mongoose from "mongoose";
import chalk from "chalk";

const connectDB = async (): Promise<void> => {

  try {
    const conn = await mongoose.connect(process.env.MONGO_URI!);
    console.log(chalk.bgCyanBright(`🍃 MongoDB Connected: ${conn.connection.host}`));
  } catch (error) {
    console.error(chalk.red(`❌ MongoDB connection error: ${(error as Error).message}`));
    process.exit(1);
  }
};

export default connectDB;