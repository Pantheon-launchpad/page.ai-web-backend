import mongoose from "mongoose";

const uploadedFileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    fileName: { type: String, required: true },
    kind: { type: String, enum: ["image", "pdf", "video", "document"], required: true },
    mimeType: { type: String, default: "" },
    sizeBytes: { type: Number, default: 0 },
    storageKey: { type: String, required: true },
    url: { type: String, default: "" },
    status: { type: String, enum: ["pending", "confirmed", "failed"], default: "pending" },
  },
  { timestamps: true },
);

export default mongoose.model("UploadedFile", uploadedFileSchema);
