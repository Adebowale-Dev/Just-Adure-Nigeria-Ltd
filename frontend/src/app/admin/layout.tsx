import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const adminRoles = new Set(["admin", "super_admin", "inventory_manager", "order_manager", "customer_support", "content_manager"]);

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieHeader = (await cookies()).toString();
  const backendUrl = (process.env.BACKEND_URL || "http://localhost:4000").replace(/\/$/, "");

  let user = null;
  try {
    const response = await fetch(`${backendUrl}/api/v1/auth/me`, {
      headers: { Accept: "application/json", Cookie: cookieHeader },
      cache: "no-store",
    });
    if (response.ok) user = (await response.json()).data?.user ?? null;
  } catch {
    redirect("/login?reason=admin-unavailable");
  }

  if (!user) redirect("/login?reason=admin-required");
  if (!user.roles?.some((role: string) => adminRoles.has(role))) redirect("/account");

  return children;
}
