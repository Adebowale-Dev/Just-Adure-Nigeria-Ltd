import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";
import { AppError } from "../errors/app-error.js";
import { requireAuth } from "../middleware/auth.js";
import { Notification } from "../models/notification.js";
import { User } from "../models/user.js";
import { serializeNotification } from "../services/notifications.js";

export const notificationsRouter = Router();

const querySchema = z.object({ audience: z.enum(["customer", "admin"]).optional(), limit: z.coerce.number().int().min(1).max(50).default(20) });
const idParamSchema = z.object({ id: z.string().trim().refine((value) => mongoose.Types.ObjectId.isValid(value), "Invalid ID.") });

function isStaff(user) {
  return user.roles.some((role) => role !== "customer");
}

/**
 * @openapi
 * /api/v1/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List in-app notifications for the current user or admin audience
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Notifications returned
 */
notificationsRouter.get("/notifications", requireAuth, async (request, response, next) => {
  try {
    const query = querySchema.parse(request.query);
    const user = await User.findById(request.user.id).select("email roles").lean();
    if (!user) throw new AppError(401, "AUTH_REQUIRED", "Please log in to continue.");

    const audience = query.audience ?? (isStaff(user) ? "admin" : "customer");
    if (audience === "admin" && !isStaff(user)) throw new AppError(403, "INSUFFICIENT_PERMISSION", "Only staff can view admin notifications.");

    const filter = audience === "admin" ? { audience: "admin" } : { audience: "customer", $or: [{ recipientUserId: request.user.id }, { recipientEmail: user.email }] };
    const [items, unreadCount] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).limit(query.limit).lean(),
      Notification.countDocuments({ ...filter, readAt: { $exists: false } }),
    ]);

    response.json({ data: { items: items.map(serializeNotification), unreadCount } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark a notification as read
 *     security:
 *       - cookieAuth: []
 *     responses:
 *       200:
 *         description: Notification marked as read
 */
notificationsRouter.patch("/notifications/:id/read", requireAuth, async (request, response, next) => {
  try {
    const { id } = idParamSchema.parse(request.params);
    const user = await User.findById(request.user.id).select("email roles").lean();
    if (!user) throw new AppError(401, "AUTH_REQUIRED", "Please log in to continue.");

    const accessFilter = isStaff(user) ? { _id: id, $or: [{ audience: "admin" }, { recipientUserId: request.user.id }] } : { _id: id, audience: "customer", $or: [{ recipientUserId: request.user.id }, { recipientEmail: user.email }] };
    const notification = await Notification.findOneAndUpdate(accessFilter, { readAt: new Date() }, { returnDocument: "after" }).lean();
    if (!notification) throw new AppError(404, "NOTIFICATION_NOT_FOUND", "Notification was not found.");

    response.json({ data: { notification: serializeNotification(notification) } });
  } catch (error) {
    next(error);
  }
});