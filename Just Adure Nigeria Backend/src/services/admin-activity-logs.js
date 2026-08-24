import { AdminActivityLog } from "../models/admin-activity-log.js";
import { User } from "../models/user.js";

const sensitiveKeys = new Set(["password", "passwordHash", "token", "secret", "apiKey", "authorization", "accessCode"]);

function sanitizeDetails(value) {
  if (Array.isArray(value)) return value.map(sanitizeDetails);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !sensitiveKeys.has(key))
      .map(([key, nestedValue]) => [key, sanitizeDetails(nestedValue)]),
  );
}

export function serializeAdminActivityLog(log) {
  return {
    id: String(log._id),
    administratorId: log.administratorId ? String(log.administratorId) : null,
    administratorName: log.administratorName ?? "Unknown administrator",
    administratorEmail: log.administratorEmail ?? "",
    administratorRoles: log.administratorRoles ?? [],
    action: log.action,
    resourceType: log.resourceType,
    resourceId: log.resourceId ?? "",
    requestId: log.requestId ?? "",
    details: log.details ?? {},
    createdAt: log.createdAt,
  };
}

export async function logAdminActivity(request, { action, resourceType, resourceId, details = {} }) {
  if (!request.user?.id) return null;
  const administrator = await User.findById(request.user.id).select("name email roles").lean();
  return AdminActivityLog.create({
    administratorId: request.user.id,
    administratorName: administrator?.name,
    administratorEmail: administrator?.email,
    administratorRoles: administrator?.roles ?? request.user.roles ?? [],
    action,
    resourceType,
    resourceId: resourceId ? String(resourceId) : undefined,
    requestId: request.res?.locals?.requestId,
    details: sanitizeDetails(details),
  });
}