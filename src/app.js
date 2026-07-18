import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";

const app = express();

// middlewares
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));
app.use(cors());

// routes
app.use("/api/auth", authRoutes);
export default app;
