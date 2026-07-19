import FeatureFlag from "../../models/FeatureFlag.js";
import { ApiError } from "../../utils/ApiError.js";

export const listFlags = async () => FeatureFlag.find().sort({ key: 1 });

export const upsertFlag = async ({ key, label, description, enabled, rolloutPercent }) => {
  return FeatureFlag.findOneAndUpdate(
    { key },
    { $set: { label, description, enabled, rolloutPercent } },
    { new: true, upsert: true, runValidators: true },
  );
};

export const deleteFlag = async (key) => {
  const flag = await FeatureFlag.findOneAndDelete({ key });
  if (!flag) throw ApiError.notFound("Feature flag not found");
};
