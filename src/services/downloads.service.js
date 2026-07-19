import Download from "../models/Download.js";

export const listDownloads = async (userId) => {
  const downloads = await Download.find({ userId }).sort({ createdAt: -1 });
  const storageUsedMb = downloads.reduce((sum, d) => sum + (d.sizeMb || 0), 0);
  return {
    items: downloads.map((d) => ({ id: d._id, title: d.title, kind: d.kind, sizeMb: d.sizeMb, createdAt: d.createdAt })),
    storageUsedMb,
  };
};

export const deleteDownload = async (userId, id) => {
  await Download.deleteOne({ _id: id, userId });
};
