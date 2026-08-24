import { useEffect, useState } from "react";
import { AlertTriangle, BadgeCheck, Clock3, CreditCard } from "lucide-react";
import { verifyPaystackPayment } from "@/lib/api.js";
import { formatNaira } from "@/lib/utils.js";

export function PaymentResultClient({ reference }) {
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!reference) {
      setError("Payment reference is missing from the Paystack redirect.");
      return;
    }

    let mounted = true;
    verifyPaystackPayment(reference)
      .then((data) => {
        if (mounted) setResult(data);
      })
      .catch((verificationError) => {
        if (mounted) setError(verificationError instanceof Error ? verificationError.message : "Payment verification failed.");
      });

    return () => {
      mounted = false;
    };
  }, [reference]);

  return (
    <main className="min-h-screen">
      <section className="hero-grid border-b border-black/8">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="section-kicker">Payment result</p>
          <h1 className="mt-4 font-serif text-5xl font-bold leading-none tracking-[-.06em] sm:text-7xl">Payment verification.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">We verify every Paystack payment on the backend before updating the order and stock.</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-black/8 bg-white p-8 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
          {!result && !error ? <div><Clock3 className="mb-4 size-8 text-[var(--accent-dark)]" /><p className="font-black">Verifying payment...</p><p className="mt-2 text-sm text-[var(--muted)]">Please wait while the backend checks Paystack.</p></div> : null}
          {error ? <div><AlertTriangle className="mb-4 size-8 text-[var(--accent-dark)]" /><p className="font-black">Payment could not be verified</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{error}</p><a href="/cart" className="cta-outline mt-6">Back to cart</a></div> : null}
          {result ? <div><BadgeCheck className="mb-4 size-8 text-emerald-700" /><p className="font-black">{result.paid ? "Payment successful" : "Payment not completed"}</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Order {result.order.orderNumber} is now {result.order.orderStatus.replaceAll("_", " ")}.</p><div className="mt-6 rounded-2xl bg-[#f6f3ec] p-5"><CreditCard className="mb-3 size-5 text-[var(--accent-dark)]" /><div className="grid gap-2 text-sm"><div className="flex justify-between"><span>Reference</span><strong>{result.payment.reference}</strong></div><div className="flex justify-between"><span>Status</span><strong>{result.payment.status}</strong></div><div className="flex justify-between"><span>Amount</span><strong>{formatNaira(result.payment.amountKobo)}</strong></div></div></div><a href={`/order-tracking?orderNumber=${encodeURIComponent(result.order.orderNumber)}`} className="cta-primary mt-6">View order tracking</a></div> : null}
        </div>
      </section>
    </main>
  );
}