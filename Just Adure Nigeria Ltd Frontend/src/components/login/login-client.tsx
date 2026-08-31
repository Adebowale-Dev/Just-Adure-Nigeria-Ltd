import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, ArrowRight, BadgeCheck, Eye, EyeOff, LogIn } from "lucide-react";
import { getCurrentUser, loginUser } from "@/lib/api.js";

function isAdminUser(user) {
  return user?.roles?.some((role) => ["admin", "super_admin", "inventory_manager", "order_manager"].includes(role));
}

export function LoginClient() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [currentUser, setCurrentUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
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
        window.location.href = "/account";
      } catch (loginError) {
        setError(loginError instanceof Error ? loginError.message : "Login failed.");
      }
    });
  }

  return (
    <main className="min-h-screen bg-[#ededed]">
      <section className="mx-auto flex min-h-[calc(100vh-9rem)] max-w-7xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <form onSubmit={submitLogin} className="w-full max-w-xl rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_24px_80px_rgba(28,34,31,.08)] sm:p-8 lg:p-10">
          <div>
            <h1 className="font-serif text-5xl font-bold leading-[.95] tracking-[-.055em]">Sign in.</h1>
            <p className="mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">Use your customer, admin or staff account to continue.</p>
          </div>

          {error ? <div className="mt-6 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold"><AlertTriangle className="mb-2 size-5 text-[var(--accent-dark)]" />{error}</div> : null}
          {message ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{message}</div> : null}
          {currentUser ? <div className="mt-6 rounded-2xl bg-[#f6f3ec] p-4 text-sm font-bold">Signed in as {currentUser.email}</div> : null}

          <div className="mt-8 grid gap-5">
            <label className="grid gap-2 text-sm font-bold">Email address
              <input name="email" type="email" value={form.email} onChange={updateField} required placeholder="you@example.com" className="rounded-2xl border border-black/10 bg-[#fbfaf6] px-4 py-4 outline-none transition focus:border-[var(--accent-dark)] focus:bg-white" />
            </label>
            <label className="grid gap-2 text-sm font-bold">Password
              <span className="flex rounded-2xl border border-black/10 bg-[#fbfaf6] px-4 py-1 transition focus-within:border-[var(--accent-dark)] focus-within:bg-white">
                <input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={updateField} required placeholder="Enter your password" className="min-h-12 flex-1 bg-transparent outline-none" />
                <button type="button" onClick={() => setShowPassword((current) => !current)} className="grid place-items-center text-[var(--muted)]" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button>
              </span>
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm font-bold">
            <label className="flex items-center gap-2 text-[var(--muted)]"><input type="checkbox" className="size-4 accent-[var(--accent)]" /> Remember this device</label>
            <a className="text-[var(--accent-dark)] hover:underline" href="/forgot-password">Forgot password?</a>
          </div>

          <button disabled={isPending} className="cta-primary mt-8 w-full disabled:cursor-not-allowed disabled:opacity-50" type="submit"><LogIn className="size-4" /> {isPending ? "Signing in..." : "Sign in securely"}</button>

          <div className="mt-6 grid gap-3 rounded-2xl bg-[#fbfaf6] p-4 text-sm font-bold text-[var(--muted)] sm:grid-cols-2">
            <a className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-[var(--ink)] hover:text-[var(--accent-dark)]" href="/register">Create account <ArrowRight className="size-4" /></a>
            <a className="flex items-center justify-between rounded-xl bg-white px-4 py-3 text-[var(--ink)] hover:text-[var(--accent-dark)]" href="/contact">Need help? <ArrowRight className="size-4" /></a>
          </div>

          <p className="mt-5 flex items-center gap-2 text-xs font-bold leading-5 text-[var(--muted)]"><BadgeCheck className="size-4 text-[var(--accent-dark)]" /> Admin and staff access is redirected automatically after login.</p>
        </form>
      </section>
    </main>
  );
}
