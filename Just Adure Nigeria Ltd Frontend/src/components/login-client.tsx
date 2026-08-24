import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, LockKeyhole, LogIn, ShieldCheck } from "lucide-react";
import { getCurrentUser, loginUser } from "@/lib/api.js";

function isAdminUser(user) {
  return user?.roles?.some((role) => ["admin", "super_admin", "inventory_manager", "order_manager"].includes(role));
}

export function LoginClient() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [currentUser, setCurrentUser] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getCurrentUser().then(setCurrentUser).catch(() => undefined);
  }, []);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function submitLogin(event) {
    event.preventDefault();
    startTransition(async () => {
      try {
        setError("");
        setMessage("");
        const user = await loginUser(form);
        setCurrentUser(user);
        if (isAdminUser(user)) {
          window.location.href = "/admin";
          return;
        }
        setMessage("Login successful. Customer dashboard will be completed in a later milestone.");
      } catch (loginError) {
        setError(loginError instanceof Error ? loginError.message : "Login failed.");
      }
    });
  }

  return (
    <main className="min-h-screen">
      <section className="hero-grid border-b border-black/8">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="section-kicker">Secure login</p>
          <h1 className="mt-4 font-serif text-5xl font-bold leading-none tracking-[-.06em] sm:text-7xl">Access your account.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">Admins and staff can sign in here to manage inventory, orders and store operations.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_.9fr] lg:px-8">
        <form onSubmit={submitLogin} className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)] sm:p-8">
          <div className="flex items-center gap-3"><LockKeyhole className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Login details</h2></div>
          {error ? <div className="mt-6 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold"><AlertTriangle className="mb-2 size-5 text-[var(--accent-dark)]" />{error}</div> : null}
          {message ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{message}</div> : null}
          {currentUser ? <div className="mt-6 rounded-2xl bg-[#f6f3ec] p-4 text-sm font-bold">Signed in as {currentUser.email}</div> : null}
          <div className="mt-8 grid gap-5">
            <label className="grid gap-2 text-sm font-bold">Email address<input name="email" type="email" value={form.email} onChange={updateField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold">Password<input name="password" type="password" value={form.password} onChange={updateField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
          </div>
          <button disabled={isPending} className="cta-primary mt-8 w-full disabled:opacity-50" type="submit"><LogIn className="size-4" /> {isPending ? "Signing in..." : "Sign in"}</button>
        </form>

        <aside className="rounded-[2rem] bg-[var(--ink)] p-8 text-white shadow-[0_24px_70px_rgba(28,34,31,.18)]">
          <ShieldCheck className="size-8 text-[var(--accent)]" />
          <h2 className="mt-5 font-serif text-4xl font-bold tracking-[-.04em]">Admin setup</h2>
          <p className="mt-4 leading-7 text-white/70">Create the first super admin from the backend terminal with `npm run admin:create`, then login here. Staff accounts should be created by a super administrator.</p>
          <a href="/admin" className="cta-primary mt-8 bg-[var(--accent)] text-[var(--ink)]">Go to admin dashboard</a>
        </aside>
      </section>
    </main>
  );
}