import { connectMongo, disconnectMongo } from "../config/mongo.js";
import { User } from "../models/user.js";
import { hashPassword } from "../utils/password.js";

const admin = {
  name: process.env.ADMIN_NAME || "Just Adure Super Admin",
  email: process.env.ADMIN_EMAIL,
  phone: process.env.ADMIN_PHONE,
  password: process.env.ADMIN_PASSWORD,
  role: process.env.ADMIN_ROLE || "super_admin",
};

function validateAdminInput() {
  const missing = [];
  if (!admin.email) missing.push("ADMIN_EMAIL");
  if (!admin.phone) missing.push("ADMIN_PHONE");
  if (!admin.password) missing.push("ADMIN_PASSWORD");
  if (missing.length > 0) throw new Error(`Missing required admin setup values: ${missing.join(", ")}`);
  if (admin.password.length < 8) throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
  if (!["admin", "super_admin", "inventory_manager", "order_manager", "customer_support", "content_manager"].includes(admin.role)) throw new Error("ADMIN_ROLE is not supported.");
}

async function main() {
  validateAdminInput();
  await connectMongo();

  const existing = await User.findOne({ email: admin.email.toLowerCase() }).select("+passwordHash");
  if (existing) {
    existing.name = admin.name;
    existing.phone = admin.phone;
    existing.roles = [admin.role];
    existing.isActive = true;
    existing.emailVerifiedAt = existing.emailVerifiedAt ?? new Date();
    existing.passwordHash = await hashPassword(admin.password);
    await existing.save();
    console.log(`Updated ${admin.role} account: ${existing.email}`);
    return;
  }

  const user = await User.create({
    name: admin.name,
    email: admin.email.toLowerCase(),
    phone: admin.phone,
    passwordHash: await hashPassword(admin.password),
    roles: [admin.role],
    emailVerifiedAt: new Date(),
    isActive: true,
  });

  console.log(`Created ${admin.role} account: ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo();
  });