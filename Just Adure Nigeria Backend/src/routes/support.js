import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { SupportTicket, supportTicketTypes } from "../models/support-ticket.js";
import { notifyAdmins } from "../services/notifications.js";

export const supportRouter = Router();

const contactSchema = z.object({
  type: z.enum(supportTicketTypes).default("contact"),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().toLowerCase(),
  phone: z.string().trim().max(30).optional(),
  subject: z.string().trim().min(3).max(160),
  message: z.string().trim().min(10).max(2000),
  orderNumber: z.string().trim().max(80).optional(),
  productSlug: z.string().trim().max(180).optional(),
});

const lookupSchema = z.object({
  ticketNumber: z.string().trim().min(4).max(80),
  email: z.string().trim().email().toLowerCase(),
});

const customerReplySchema = lookupSchema.extend({
  message: z.string().trim().min(2).max(2000),
  name: z.string().trim().min(2).max(120).optional(),
});

function createTicketNumber() {
  const stamp = new Date().toISOString().slice(0, 10).replaceAll("-", "");
  return `SUP-${stamp}-${randomUUID().slice(0, 8).toUpperCase()}`;
}

export function serializeSupportTicket(ticket) {
  return {
    id: String(ticket._id),
    ticketNumber: ticket.ticketNumber,
    type: ticket.type,
    subject: ticket.subject,
    name: ticket.name,
    email: ticket.email,
    phone: ticket.phone ?? null,
    orderNumber: ticket.orderNumber ?? null,
    productSlug: ticket.productSlug ?? null,
    message: ticket.message,
    status: ticket.status,
    replies: ticket.replies ?? [],
    internalNote: ticket.internalNote ?? null,
    resolvedAt: ticket.resolvedAt ?? null,
    createdAt: ticket.createdAt,
    updatedAt: ticket.updatedAt,
  };
}

/**
 * @openapi
 * /api/v1/support/contact:
 *   post:
 *     tags: [Support]
 *     summary: Submit a contact, product-enquiry or order-support ticket
 *     responses:
 *       201:
 *         description: Support ticket created
 */
supportRouter.post("/support/contact", async (request, response, next) => {
  try {
    const input = contactSchema.parse(request.body);
    const ticket = await SupportTicket.create({ ...input, ticketNumber: createTicketNumber(), status: "open" });
    await notifyAdmins({ type: "support", title: "New support ticket", message: `${ticket.email} submitted ${ticket.ticketNumber}.`, resourceType: "support_ticket", resourceId: String(ticket._id), actionUrl: "/admin" });
    response.status(201).json({ data: { ticket: serializeSupportTicket(ticket) } });
  } catch (error) {
    next(error);
  }
});

/**
 * @openapi
 * /api/v1/support/tickets/lookup:
 *   get:
 *     tags: [Support]
 *     summary: Look up a support ticket by ticket number and email
 *     responses:
 *       200:
 *         description: Support ticket returned
 */
supportRouter.get("/support/tickets/lookup", async (request, response, next) => {
  try {
    const input = lookupSchema.parse(request.query);
    const ticket = await SupportTicket.findOne({ ticketNumber: input.ticketNumber, email: input.email }).lean();
    if (!ticket) {
      response.status(404).json({ error: { code: "SUPPORT_TICKET_NOT_FOUND", message: "We could not find a ticket with those details." } });
      return;
    }
    response.json({ data: { ticket: serializeSupportTicket(ticket) } });
  } catch (error) {
    next(error);
  }
});
/**
 * @openapi
 * /api/v1/support/tickets/reply:
 *   post:
 *     tags: [Support]
 *     summary: Add a customer reply to an existing support ticket
 *     responses:
 *       200:
 *         description: Support ticket updated
 */
supportRouter.post("/support/tickets/reply", async (request, response, next) => {
  try {
    const input = customerReplySchema.parse(request.body);
    const ticket = await SupportTicket.findOne({ ticketNumber: input.ticketNumber, email: input.email });
    if (!ticket) {
      response.status(404).json({ error: { code: "SUPPORT_TICKET_NOT_FOUND", message: "We could not find a ticket with those details." } });
      return;
    }
    if (["resolved", "closed"].includes(ticket.status)) {
      ticket.status = "open";
      ticket.resolvedAt = undefined;
    } else if (ticket.status === "waiting_for_customer") {
      ticket.status = "in_progress";
    }
    ticket.replies.push({ authorType: "customer", authorName: input.name || ticket.name, message: input.message });
    await ticket.save();
    await notifyAdmins({ type: "support", title: "Customer replied to support ticket", message: `${ticket.email} replied to ${ticket.ticketNumber}.`, resourceType: "support_ticket", resourceId: String(ticket._id), actionUrl: "/admin" });
    response.json({ data: { ticket: serializeSupportTicket(ticket) } });
  } catch (error) {
    next(error);
  }
});
