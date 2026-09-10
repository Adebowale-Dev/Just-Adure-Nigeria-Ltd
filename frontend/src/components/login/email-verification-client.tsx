import { useEffect, useState } from "react";
import { AlertTriangle, BadgeCheck } from "lucide-react";
import { verifyEmailToken } from "@/lib/api.js";

export function EmailVerificationClient({ token = "" }) {
  const [status, setStatus] = useState("Verifying your email...");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("");
      setError("Verification token is missing from this link.");
      return;
    }
    let mounted = true;
    verifyEmailToken(token)
      .then((data) => {
        if (mounted) setStatus(data.message ?? "Email address verified successfully.");
      })
      .catch((verificationError) => {
        if (mounted) {
          setStatus("");
          setError(verificationError instanceof Error ? verificationError.message : "Email verification failed.");
        }
      });
    return () => {
      mounted = false;
    };
  }, [token]);

  return (
    <main className="min-h-screen">
      <section className="hero-grid border-b border-black/8">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="section-kicker">Email verification</p>
          <h1 className="mt-4 font-serif text-5xl font-bold leading-none tracking-[-.06em] sm:text-7xl">Confirm your email.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">This protects your account and keeps order notifications going to the right person.</p>
        </div>
      </section>
      <section className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)] sm:p-8">
          <div className="flex items-center gap-3"><BadgeCheck className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Verification status</h2></div>
          {status ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{status}</div> : null}
          {error ? <div className="mt-6 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold"><AlertTriangle className="mb-2 size-5 text-[var(--accent-dark)]" />{error}</div> : null}
          <a href="/login" className="cta-primary mt-8">Go to login</a>
        </div>
      </section>
    </main>
  );
}

