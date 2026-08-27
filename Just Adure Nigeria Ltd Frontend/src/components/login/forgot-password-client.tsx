import { useState, useTransition } from "react";
import { AlertTriangle, MailCheck } from "lucide-react";
import { requestPasswordReset } from "@/lib/api.js";

export function ForgotPasswordClient() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function submitRequest(event) {
    event.preventDefault();
    startTransition(async () => {
      try {
        setError("");
        const data = await requestPasswordReset({ email });
        setMessage(data.message ?? "If the account exists, a password reset email has been sent.");
      } catch (requestError) {
        setError(requestError instanceof Error ? requestError.message : "Password reset request failed.");
      }
    });
  }

  return (
    <main className="min-h-screen">
      <section className="hero-grid border-b border-black/8">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="section-kicker">Password help</p>
          <h1 className="mt-4 font-serif text-5xl font-bold leading-none tracking-[-.06em] sm:text-7xl">Reset access safely.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">Enter your email and we will send a secure reset link if the account exists.</p>
        </div>
      </section>
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <form onSubmit={submitRequest} className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)] sm:p-8">
          <div className="flex items-center gap-3"><MailCheck className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Forgot password</h2></div>
          {error ? <div className="mt-6 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold"><AlertTriangle className="mb-2 size-5 text-[var(--accent-dark)]" />{error}</div> : null}
          {message ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{message}</div> : null}
          <label className="mt-8 grid gap-2 text-sm font-bold">Email address<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
          <button disabled={isPending} className="cta-primary mt-8 w-full disabled:opacity-50" type="submit">{isPending ? "Sending link..." : "Send reset link"}</button>
        </form>
      </section>
    </main>
  );
}

