import Notification from "../../models/Notification.js";

/**
 * Centralizes Notification-document creation so achievement/streak/mission
 * triggers don't each hand-roll a write — and so it's queueable (a burst of
 * "5 achievements earned at once" shouldn't do 5 synchronous DB writes in
 * the request path that triggered them).
 */
export const createNotification = async ({ userId, title, body, type }) => {
  await Notification.create({ userId, title, body, type });
};

export const notificationsProcessors = {
  "create": createNotification,
};
