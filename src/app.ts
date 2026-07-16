import express, {Request, Response} from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
dotenv.config();

const app = express();

// middleware
app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(morgan("dev"));

app.get("/", (req: Request, res: Response) => {
  res.status(200).json({ sucess: true, message: "API IS RUNNING" });
});
export default app;
