import { useState, useTransition } from "react";
import { AlertTriangle, ArrowRight, Eye, EyeOff } from "lucide-react";
import { registerUser } from "@/lib/api.js";
import { GoogleSignInButton } from "@/components/login/google-sign-in-button";

type RegistrationForm = {
  name: string;
  email: string;
  phone: string;
  password: string;
};


export function RegisterClient() {
  const [form, setForm] = useState<RegistrationForm>({ name: "", email: "", phone: "", password: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, startTransition] = useTransition();

  function updateField(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function submitRegistration(event: React.FormEvent<HTMLFormElement>) {
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
    <main className="auth-shell min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-2xl items-center justify-center">
        <form onSubmit={submitRegistration} className="surface-card mx-auto w-full max-w-2xl p-6 sm:p-8">
          <h1 className="text-center text-4xl font-black tracking-[-.045em] text-[var(--ink)] sm:text-5xl">Create account</h1>

          {error ? <div className="mt-6 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold text-[var(--ink)]"><AlertTriangle className="mb-2 size-5 text-[var(--accent-dark)]" />{error}</div> : null}
          {message ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{message}</div> : null}

          <div className="mt-7">
            <GoogleSignInButton registration />
            <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-[.14em] text-[var(--muted)]"><span className="h-px flex-1 bg-black/10" />or register with email<span className="h-px flex-1 bg-black/10" /></div>
          </div>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-black text-[var(--ink)]">Full name<input name="name" value={form.name} onChange={updateField} required autoComplete="name" placeholder="Your full name" className="rounded-2xl border border-black/10 bg-[#fbfaf6] px-4 py-3.5 outline-none transition focus:border-[var(--accent-dark)] focus:bg-white" /></label>
            <label className="grid gap-2 text-sm font-black text-[var(--ink)]">Phone number<input name="phone" value={form.phone} onChange={updateField} required autoComplete="tel" inputMode="tel" placeholder="08012345678" className="rounded-2xl border border-black/10 bg-[#fbfaf6] px-4 py-3.5 outline-none transition focus:border-[var(--accent-dark)] focus:bg-white" /></label>
            <label className="grid gap-2 text-sm font-black text-[var(--ink)] sm:col-span-2">Email address<input name="email" type="email" value={form.email} onChange={updateField} required autoComplete="email" placeholder="you@example.com" className="rounded-2xl border border-black/10 bg-[#fbfaf6] px-4 py-3.5 outline-none transition focus:border-[var(--accent-dark)] focus:bg-white" /></label>
            <label className="grid gap-2 text-sm font-black text-[var(--ink)] sm:col-span-2">Password<div className="flex items-center rounded-2xl border border-black/10 bg-[#fbfaf6] px-4 transition focus-within:border-[var(--accent-dark)] focus-within:bg-white"><input name="password" type={showPassword ? "text" : "password"} value={form.password} onChange={updateField} required minLength={8} autoComplete="new-password" placeholder="Minimum 8 characters" className="min-w-0 flex-1 bg-transparent py-3.5 outline-none" /><button type="button" onClick={() => setShowPassword((current) => !current)} className="text-[var(--muted)] hover:text-[var(--ink)]" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}</button></div></label>
          </div>

          <p className="mt-5 rounded-2xl bg-[#fbfaf6] px-4 py-3 text-sm leading-6 text-[var(--muted)]">By creating an account, you can manage orders, delivery addresses, wishlist items and support requests from one dashboard.</p>
          <button disabled={isPending} className="cta-primary mt-6 w-full disabled:opacity-50" type="submit">{isPending ? "Creating account..." : "Create account"} <ArrowRight className="size-5" /></button>
          <p className="mt-5 text-center text-sm font-bold text-[var(--muted)]">Already have an account? <a className="text-[var(--accent-dark)] hover:underline" href="/login">Sign in</a></p>
        </form>
      </section>
    </main>
  );
}
