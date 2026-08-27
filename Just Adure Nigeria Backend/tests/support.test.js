import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { connectMongo, disconnectMongo } from "../src/config/mongo.js";
import { Notification } from "../src/models/notification.js";
import { SupportTicket } from "../src/models/support-ticket.js";
import { User } from "../src/models/user.js";
import { hashPassword } from "../src/utils/password.js";

function normalizeCookies(cookieHeader) {
  if (!cookieHeader) return [];
  return Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
}

async function clearCollections() {
  await Promise.all([Notification.deleteMany({}), SupportTicket.deleteMany({}), User.deleteMany({})]);
}

async function createAdminCookies() {
  await User.create({
    name: "Admin User",
    email: "admin@example.com",
    phone: "08012345678",
    passwordHash: await hashPassword("StrongPass123"),
    roles: ["admin"],
    emailVerifiedAt: new Date(),
  });
  const login = await request(app).post("/api/v1/auth/login").send({ email: "admin@example.com", password: "StrongPass123" }).expect(200);
  return normalizeCookies(login.headers["set-cookie"]);
}

beforeAll(async () => {
  await connectMongo(true);
});

beforeEach(async () => {
  await clearCollections();
});

afterAll(async () => {
  await clearCollections();
  await disconnectMongo();
});

describe("support tickets", () => {
  it("creates a contact ticket and admin notification", async () => {
    const response = await request(app)
      .post("/api/v1/support/contact")
      .send({
        name: "Ade Customer",
        email: "customer@example.com",
        phone: "08012345678",
        subject: "Question about delivery",
        message: "Please can you confirm delivery timing for Lagos orders?",
      })
      .expect(201);

    expect(response.body.data.ticket).toMatchObject({ status: "open", type: "contact", email: "customer@example.com" });
    expect(response.body.data.ticket.ticketNumber).toContain("SUP-");
    const notification = await Notification.findOne({ audience: "admin", type: "support" }).lean();
    expect(notification.title).toBe("New support ticket");
  });


  it("creates a product enquiry ticket with the product slug", async () => {
    const response = await request(app)
      .post("/api/v1/support/contact")
      .send({
        type: "product_enquiry",
        name: "Ade Customer",
        email: "customer@example.com",
        phone: "08012345678",
        subject: "Product enquiry: iPhone 13 Pro 256GB",
        productSlug: "iphone-13-pro-256gb",
        message: "Please confirm whether this exact UK-used unit includes a charger.",
      })
      .expect(201);

    expect(response.body.data.ticket).toMatchObject({
      type: "product_enquiry",
      productSlug: "iphone-13-pro-256gb",
      status: "open",
      email: "customer@example.com",
    });
  });
  it("allows customers to look up a ticket by number and email", async () => {
    const created = await request(app)
      .post("/api/v1/support/contact")
      .send({ name: "Ade Customer", email: "customer@example.com", subject: "Order support", message: "I need help with my order delivery update." })
      .expect(201);

    const lookup = await request(app)
      .get("/api/v1/support/tickets/lookup")
      .query({ ticketNumber: created.body.data.ticket.ticketNumber, email: "customer@example.com" })
      .expect(200);

    expect(lookup.body.data.ticket).toMatchObject({ ticketNumber: created.body.data.ticket.ticketNumber, status: "open" });
  });


  it("allows a customer to reply to their support ticket", async () => {
    const created = await request(app)
      .post("/api/v1/support/contact")
      .send({ name: "Ade Customer", email: "customer@example.com", subject: "Order support", message: "I need help with my order delivery update." })
      .expect(201);

    const reply = await request(app)
      .post("/api/v1/support/tickets/reply")
      .send({ ticketNumber: created.body.data.ticket.ticketNumber, email: "customer@example.com", name: "Ade Customer", message: "Here is the extra delivery detail you requested." })
      .expect(200);

    expect(reply.body.data.ticket.replies.at(-1)).toMatchObject({ authorType: "customer", authorName: "Ade Customer", message: "Here is the extra delivery detail you requested." });
    const notification = await Notification.findOne({ audience: "admin", title: "Customer replied to support ticket" }).lean();
    expect(notification).toBeTruthy();
  });

  it("does not allow a customer to reply to another email address ticket", async () => {
    const created = await request(app)
      .post("/api/v1/support/contact")
      .send({ name: "Ade Customer", email: "customer@example.com", subject: "Order support", message: "I need help with my order delivery update." })
      .expect(201);

    const response = await request(app)
      .post("/api/v1/support/tickets/reply")
      .send({ ticketNumber: created.body.data.ticket.ticketNumber, email: "wrong@example.com", message: "Trying to access another ticket." })
      .expect(404);

    expect(response.body.error.code).toBe("SUPPORT_TICKET_NOT_FOUND");
  });
  it("allows admins to list and reply to support tickets", async () => {
    const created = await request(app)
      .post("/api/v1/support/contact")
      .send({ name: "Ade Customer", email: "customer@example.com", subject: "Product question", message: "Does this product include the original charger?" })
      .expect(201);
    const cookies = await createAdminCookies();

    const list = await request(app).get("/api/v1/admin/support-tickets").set("Cookie", cookies).expect(200);
    expect(list.body.data.items).toHaveLength(1);

    const updated = await request(app)
      .patch(`/api/v1/admin/support-tickets/${created.body.data.ticket.id}`)
      .set("Cookie", cookies)
      .send({ status: "waiting_for_customer", reply: "Please share the exact product link.", internalNote: "Needs product confirmation." })
      .expect(200);

    expect(updated.body.data.ticket).toMatchObject({ status: "waiting_for_customer", internalNote: "Needs product confirmation." });
    expect(updated.body.data.ticket.replies[0]).toMatchObject({ authorType: "admin", message: "Please share the exact product link." });
  });
});

