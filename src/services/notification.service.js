import Notification from "../models/Notification.js";
import { ApiError } from "../utils/ApiError.js";

export const listNotifications = async (userId) => {
  const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
  return notifications.map((n) => ({
    id: n._id,
    title: n.title,
    body: n.body,
    type: n.type,
    read: n.read,
    createdAt: n.createdAt,
  }));
};

export const markRead = async (userId, id) => {
  const notification = await Notification.findOneAndUpdate({ _id: id, userId }, { read: true }, { new: true });
  if (!notification) throw ApiError.notFound("Notification not found");
  return { id: notification._id, read: true };
};

export const markAllRead = async (userId) => {
  await Notification.updateMany({ userId, read: false }, { read: true });
  return { markedAllRead: true };
};
