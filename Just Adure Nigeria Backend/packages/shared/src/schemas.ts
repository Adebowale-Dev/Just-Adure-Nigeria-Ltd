import { z } from "zod";

const nigerianPhonePattern = /^(?:\+?234|0)[789][01]\d{8}$/;

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address")
  .max(254);

export const passwordSchema = z
  .string()
  .min(10, "Password must contain at least 10 characters")
  .max(128)
  .regex(/[a-z]/, "Password must contain a lowercase letter")
  .regex(/[A-Z]/, "Password must contain an uppercase letter")
  .regex(/\d/, "Password must contain a number");

export const nigerianPhoneSchema = z
  .string()
  .trim()
  .regex(nigerianPhonePattern, "Enter a valid Nigerian phone number");

export const addressSchema = z.object({
  recipientName: z.string().trim().min(2).max(120),
  phone: nigerianPhoneSchema,
  line1: z.string().trim().min(5).max(200),
  line2: z.string().trim().max(200).optional(),
  landmark: z.string().trim().max(160).optional(),
  city: z.string().trim().min(2).max(100),
  state: z.string().trim().min(2).max(100),
  postalCode: z.string().trim().max(20).optional(),
  deliveryInstructions: z.string().trim().max(500).optional(),
});

export const registerSchema = z.object({
  firstName: z.string().trim().min(2).max(80),
  lastName: z.string().trim().min(2).max(80),
  email: emailSchema,
  phone: nigerianPhoneSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(128),
});

export const productListQuerySchema = z.object({
  search: z.string().trim().max(120).optional(),
  category: z.string().trim().max(100).optional(),
  brand: z.string().trim().max(100).optional(),
  condition: z.string().trim().max(50).optional(),
  minPrice: z.coerce.number().int().min(0).optional(),
  maxPrice: z.coerce.number().int().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(60).default(24),
  sort: z
    .enum(["newest", "price_asc", "price_desc", "name_asc"])
    .default("newest"),
});

export type AddressInput = z.infer<typeof addressSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ProductListQuery = z.infer<typeof productListQuerySchema>;
