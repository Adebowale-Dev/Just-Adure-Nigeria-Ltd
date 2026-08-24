import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { app } from "../src/app.js";
import { connectMongo, disconnectMongo } from "../src/config/mongo.js";
import { Notification } from "../src/models/notification.js";
import { User } from "../src/models/user.js";
import { createNotification } from "../src/services/notifications.js";
import { hashPassword } from "../src/utils/password.js";

function normalizeCookies(cookieHeader) {
  if (!cookieHeader) return [];
  return Array.isArray(cookieHeader) ? cookieHeader : [cookieHeader];
}

async function clearCollections() {
  await Promise.all([Notification.deleteMany({}), User.deleteMany({})]);
}

async function createUser({ role = "customer", email = "customer@example.com" } = {}) {
  const user = await User.create({
    name: role === "customer" ? "Ade Customer" : "Admin User",
    email,
    phone: "08012345678",
    passwordHash: await hashPassword("StrongPass123"),
    roles: [role],
    emailVerifiedAt: new Date(),
  });
  const login = await request(app).post("/api/v1/auth/login").send({ email, password: "StrongPass123" }).expect(200);
  return { user, cookies: normalizeCookies(login.headers["set-cookie"]) };
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

describe("notifications API", () => {
  it("lists customer notifications and marks them as read", async () => {
    const { user, cookies } = await createUser();
    const notification = await createNotification({
      audience: "customer",
      recipientUserId: user._id,
      type: "order",
      title: "Order created",
      message: "Your order is awaiting payment.",
    });

    const list = await request(app).get("/api/v1/notifications").set("Cookie", cookies).expect(200);
    expect(list.body.data.unreadCount).toBe(1);
    expect(list.body.data.items[0]).toMatchObject({ title: "Order created", readAt: null });

    const marked = await request(app).patch(`/api/v1/notifications/${String(notification._id)}/read`).set("Cookie", cookies).expect(200);
    expect(marked.body.data.notification.readAt).toBeTruthy();
  });

  it("prevents customers from reading admin notifications", async () => {
    const { cookies } = await createUser();
    await createNotification({ audience: "admin", type: "return", title: "New return", message: "A return is pending." });

    const response = await request(app).get("/api/v1/notifications?audience=admin").set("Cookie", cookies).expect(403);
    expect(response.body.error.code).toBe("INSUFFICIENT_PERMISSION");
  });

  it("allows admins to read admin notifications", async () => {
    const { cookies } = await createUser({ role: "admin", email: "admin@example.com" });
    await createNotification({ audience: "admin", type: "payment", title: "Payment received", message: "An order was paid." });

    const response = await request(app).get("/api/v1/notifications?audience=admin").set("Cookie", cookies).expect(200);
    expect(response.body.data.unreadCount).toBe(1);
    expect(response.body.data.items[0]).toMatchObject({ audience: "admin", title: "Payment received" });
  });
});