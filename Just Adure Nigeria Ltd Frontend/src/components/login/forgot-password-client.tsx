import { useState, useTransition } from "react";
import { AlertTriangle, ArrowLeft, Mail } from "lucide-react";
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
    <main className="auth-shell min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <section className="mx-auto flex min-h-[calc(100vh-9rem)] w-full max-w-lg items-center justify-center">
        <form onSubmit={submitRequest} className="surface-card w-full p-6 sm:p-8">
          <a href="/login" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--muted)] hover:text-[var(--accent-dark)]"><ArrowLeft className="size-4" /> Back to sign in</a>

          <h1 className="mt-8 text-center text-4xl font-black tracking-[-.045em]">Forgot your password?</h1>

          {error ? <div role="alert" className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800"><AlertTriangle className="mb-2 size-5" />{error}</div> : null}
          {message ? <div role="status" className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-900">{message}</div> : null}

          <label className="mt-7 grid gap-2 text-sm font-black">Email address
            <span className="flex items-center gap-3 rounded-xl border border-black/10 bg-[#fbfaf6] px-4 transition focus-within:border-[var(--accent-dark)] focus-within:bg-white">
              <Mail className="size-5 shrink-0 text-[var(--muted)]" />
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="you@example.com" className="min-w-0 flex-1 bg-transparent py-3.5 outline-none" />
            </span>
          </label>

          <button disabled={isPending} className="cta-primary mt-6 w-full disabled:cursor-not-allowed disabled:opacity-50" type="submit">{isPending ? "Sending reset link..." : "Send reset link"}</button>
          <p className="mt-5 text-center text-xs leading-5 text-[var(--muted)]">For your security, the reset link expires after a limited time and can only be used once.</p>
        </form>
      </section>
    </main>
  );
}

