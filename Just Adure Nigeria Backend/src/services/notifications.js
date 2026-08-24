import { logger } from "../config/logger.js";
import { Notification } from "../models/notification.js";

export function serializeNotification(notification) {
  return {
    id: String(notification._id),
    audience: notification.audience,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    resourceType: notification.resourceType ?? null,
    resourceId: notification.resourceId ?? null,
    actionUrl: notification.actionUrl ?? null,
    readAt: notification.readAt ?? null,
    createdAt: notification.createdAt,
  };
}

export async function createNotification(input) {
  try {
    return await Notification.create(input);
  } catch (error) {
    logger.error({ err: error, notification: input }, "In-app notification creation failed.");
    return null;
  }
}

export async function notifyCustomer(userId, input) {
  if (!userId) return null;
  return createNotification({ ...input, audience: "customer", recipientUserId: userId });
}

export async function notifyAdmins(input) {
  return createNotification({ ...input, audience: "admin" });
}