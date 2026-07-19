import UserSettings from "../models/UserSettings.js";

export const getSettings = async (userId) => {
  let settings = await UserSettings.findOne({ userId });
  if (!settings) settings = await UserSettings.create({ userId });
  return settings;
};

export const updateSettings = async (userId, updates) => {
  const settings = await UserSettings.findOneAndUpdate(
    { userId },
    { $set: flatten(updates) },
    { new: true, upsert: true, runValidators: true },
  );
  return settings;
};

// Merges nested partials (notifications.*, study.*) instead of overwriting
// the whole sub-object on a PATCH with only one flag.
const flatten = (obj, prefix = "") => {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(out, flatten(value, `${prefix}${key}.`));
    } else {
      out[`${prefix}${key}`] = value;
    }
  }
  return out;
};
