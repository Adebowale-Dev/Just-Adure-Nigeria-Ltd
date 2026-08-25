import { Router } from "express";
import { z } from "zod";
import { AppError } from "../errors/app-error.js";
import { requireAuth } from "../middleware/auth.js";
import { User } from "../models/user.js";

export const accountRouter = Router();

const nigerianPhoneSchema = z.string().trim().regex(/^(\+234|0)[789][01]\d{8}$/, "Enter a valid Nigerian phone number.");
const profileSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  phone: nigerianPhoneSchema.optional(),
});
const addressSchema = z.object({
  label: z.string().trim().min(2).max(80),
  recipientName: z.string().trim().min(2).max(120),
  phone: nigerianPhoneSchema,
  addressLine1: z.string().trim().min(3).max(240),
  addressLine2: z.string().trim().max(240).optional(),
  state: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(120),
  deliveryInstructions: z.string().trim().max(300).optional(),
  isDefault: z.boolean().default(false),
});
const addressUpdateSchema = addressSchema.partial();
const addressParamSchema = z.object({ addressId: z.string().trim().min(1) });

function serializeAddress(address) {
  return {
    id: String(address._id),
    label: address.label,
    recipientName: address.recipientName,
    phone: address.phone,
    addressLine1: address.addressLine1,
    addressLine2: address.addressLine2 ?? null,
    state: address.state,
    city: address.city,
    deliveryInstructions: address.deliveryInstructions ?? null,
    isDefault: address.isDefault,
  };
}

export function serializeAccount(user) {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    phone: user.phone,
    roles: user.roles,
    emailVerified: Boolean(user.emailVerifiedAt),
    addresses: (user.addresses ?? []).map(serializeAddress),
    createdAt: user.createdAt,
  };
}

async function getCurrentUser(userId) {
  const user = await User.findById(userId);
  if (!user || !user.isActive) throw new AppError(401, "AUTH_REQUIRED", "Please log in to continue.");
  return user;
}

function applyDefaultAddressRule(user, selectedAddress) {
  if (selectedAddress?.isDefault || user.addresses.length === 1) {
    user.addresses.forEach((address) => {
      address.isDefault = String(address._id) === String(selectedAddress._id);
    });
  }
}

/**
 * @openapi
 * /api/v1/account:
 *   get:
 *     tags: [Account]
 *     summary: Get the logged-in customer's profile and saved addresses
 *     responses:
 *       200:
 *         description: Account profile returned
 */
accountRouter.get("/account", requireAuth, async (request, response, next) => {
  try {
    const user = await getCurrentUser(request.user.id);
    response.json({ data: { account: serializeAccount(user) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/account:
 *   patch:
 *     tags: [Account]
 *     summary: Update the logged-in customer's profile
 *     responses:
 *       200:
 *         description: Account profile updated
 */
accountRouter.patch("/account", requireAuth, async (request, response, next) => {
  try {
    const input = profileSchema.parse(request.body);
    const user = await getCurrentUser(request.user.id);
    if (input.name !== undefined) user.name = input.name;
    if (input.phone !== undefined) user.phone = input.phone;
    await user.save();
    response.json({ data: { account: serializeAccount(user) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/account/addresses:
 *   post:
 *     tags: [Account]
 *     summary: Add a saved delivery address
 *     responses:
 *       201:
 *         description: Address added
 */
accountRouter.post("/account/addresses", requireAuth, async (request, response, next) => {
  try {
    const input = addressSchema.parse(request.body);
    const user = await getCurrentUser(request.user.id);
    user.addresses.push(input);
    const address = user.addresses[user.addresses.length - 1];
    applyDefaultAddressRule(user, address);
    await user.save();
    response.status(201).json({ data: { account: serializeAccount(user), address: serializeAddress(address) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/account/addresses/{addressId}:
 *   patch:
 *     tags: [Account]
 *     summary: Update a saved delivery address
 *     responses:
 *       200:
 *         description: Address updated
 */
accountRouter.patch("/account/addresses/:addressId", requireAuth, async (request, response, next) => {
  try {
    const { addressId } = addressParamSchema.parse(request.params);
    const input = addressUpdateSchema.parse(request.body);
    const user = await getCurrentUser(request.user.id);
    const address = user.addresses.id(addressId);
    if (!address) throw new AppError(404, "ADDRESS_NOT_FOUND", "Delivery address was not found.");
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) address[key] = value;
    }
    applyDefaultAddressRule(user, address);
    await user.save();
    response.json({ data: { account: serializeAccount(user), address: serializeAddress(address) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/account/addresses/{addressId}:
 *   delete:
 *     tags: [Account]
 *     summary: Delete a saved delivery address
 *     responses:
 *       200:
 *         description: Address deleted
 */
accountRouter.delete("/account/addresses/:addressId", requireAuth, async (request, response, next) => {
  try {
    const { addressId } = addressParamSchema.parse(request.params);
    const user = await getCurrentUser(request.user.id);
    const address = user.addresses.id(addressId);
    if (!address) throw new AppError(404, "ADDRESS_NOT_FOUND", "Delivery address was not found.");
    const wasDefault = address.isDefault;
    address.deleteOne();
    if (wasDefault && user.addresses.length > 0) user.addresses[0].isDefault = true;
    await user.save();
    response.json({ data: { account: serializeAccount(user) } });
  } catch (error) {
    next(error);
  }
});