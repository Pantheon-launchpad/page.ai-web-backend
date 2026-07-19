import mongoose from "mongoose";

const featureFlagSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    description: { type: String, default: "" },
    enabled: { type: Boolean, default: false },
    rolloutPercent: { type: Number, min: 0, max: 100, default: 0 },
  },
  { timestamps: true },
);

export default mongoose.model("FeatureFlag", featureFlagSchema);
