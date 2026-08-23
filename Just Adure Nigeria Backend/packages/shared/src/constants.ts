export const USER_ROLES = ["customer", "admin", "super_admin"] as const;

export const ORDER_STATUSES = [
  "pending_payment",
  "paid",
  "processing",
  "ready_for_delivery",
  "shipped",
  "delivered",
  "cancelled",
  "refunded",
] as const;

export const CONDITION_GRADE_CODES = [
  "like_new",
  "excellent",
  "good",
  "fair",
] as const;

export const PAYMENT_STATUSES = [
  "pending",
  "successful",
  "failed",
  "refunded",
] as const;

export const CURRENCY = "NGN" as const;

export type UserRole = (typeof USER_ROLES)[number];
export type OrderStatus = (typeof ORDER_STATUSES)[number];
export type ConditionGradeCode = (typeof CONDITION_GRADE_CODES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
