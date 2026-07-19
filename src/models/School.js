import mongoose from "mongoose";
import { nanoid } from "../utils/nanoid.js";

const schoolSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, default: () => nanoid(8).toUpperCase() },
    address: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    plan: { type: String, enum: ["free", "school_basic", "school_premium"], default: "free" },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // the school_admin who created/owns it
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export default mongoose.model("School", schoolSchema);
