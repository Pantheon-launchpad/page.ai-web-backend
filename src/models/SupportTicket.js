import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ["open", "in_progress", "resolved"], default: "open" },
  },
  { timestamps: true },
);

export default mongoose.model("SupportTicket", supportTicketSchema);
