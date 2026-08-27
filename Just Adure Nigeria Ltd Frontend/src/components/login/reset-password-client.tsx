import { useState, useTransition } from "react";
import { AlertTriangle, KeyRound } from "lucide-react";
import { resetPassword } from "@/lib/api.js";

export function ResetPasswordClient({ token = "" }) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function submitReset(event) {
    event.preventDefault();
    startTransition(async () => {
      try {
        setError("");
        const data = await resetPassword({ token, password });
        setMessage(data.message ?? "Password reset successfully. You can now log in.");
      } catch (resetError) {
        setError(resetError instanceof Error ? resetError.message : "Password reset failed.");
      }
    });
  }

  return (
    <main className="min-h-screen">
      <section className="hero-grid border-b border-black/8">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="section-kicker">New password</p>
          <h1 className="mt-4 font-serif text-5xl font-bold leading-none tracking-[-.06em] sm:text-7xl">Choose a fresh password.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">Your reset link expires after 1 hour for account safety.</p>
        </div>
      </section>
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <form onSubmit={submitReset} className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)] sm:p-8">
          <div className="flex items-center gap-3"><KeyRound className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Reset password</h2></div>
          {!token ? <div className="mt-6 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold">Reset token is missing from this link.</div> : null}
          {error ? <div className="mt-6 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold"><AlertTriangle className="mb-2 size-5 text-[var(--accent-dark)]" />{error}</div> : null}
          {message ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{message} <a className="underline" href="/login">Login</a></div> : null}
          <label className="mt-8 grid gap-2 text-sm font-bold">New password<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} required minLength={8} className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
          <button disabled={isPending || !token} className="cta-primary mt-8 w-full disabled:opacity-50" type="submit">{isPending ? "Resetting..." : "Reset password"}</button>
        </form>
      </section>
    </main>
  );
}

