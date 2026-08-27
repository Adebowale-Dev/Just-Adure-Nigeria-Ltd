import { useState, useTransition } from "react";
import { AlertTriangle, UserPlus } from "lucide-react";
import { registerUser } from "@/lib/api.js";

export function RegisterClient() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function submitRegistration(event) {
    event.preventDefault();
    startTransition(async () => {
      try {
        setError("");
        setMessage("");
        await registerUser(form);
        setMessage("Account created. Please check your email for the verification link.");
      } catch (registrationError) {
        setError(registrationError instanceof Error ? registrationError.message : "Registration failed.");
      }
    });
  }

  return (
    <main className="min-h-screen">
      <section className="hero-grid border-b border-black/8">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="section-kicker">Customer account</p>
          <h1 className="mt-4 font-serif text-5xl font-bold leading-none tracking-[-.06em] sm:text-7xl">Create your account.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">Save delivery addresses, track orders, keep a wishlist and receive secure order updates.</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <form onSubmit={submitRegistration} className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)] sm:p-8">
          <div className="flex items-center gap-3"><UserPlus className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Registration details</h2></div>
          {error ? <div className="mt-6 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold"><AlertTriangle className="mb-2 size-5 text-[var(--accent-dark)]" />{error}</div> : null}
          {message ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{message}</div> : null}
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">Full name<input name="name" value={form.name} onChange={updateField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold">Phone number<input name="phone" value={form.phone} onChange={updateField} required placeholder="08012345678" className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold sm:col-span-2">Email address<input name="email" type="email" value={form.email} onChange={updateField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold sm:col-span-2">Password<input name="password" type="password" value={form.password} onChange={updateField} required minLength={8} className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
          </div>
          <button disabled={isPending} className="cta-primary mt-8 w-full disabled:opacity-50" type="submit">{isPending ? "Creating account..." : "Create account"}</button>
          <p className="mt-5 text-center text-sm font-bold text-[var(--muted)]">Already have an account? <a className="text-[var(--accent-dark)]" href="/login">Sign in</a></p>
        </form>
      </section>
    </main>
  );
}

