import { useEffect, useState } from "react";
import { AlertTriangle, BadgeCheck, CheckCircle2, Clock3, CreditCard, ExternalLink, ShieldCheck } from "lucide-react";
import { verifyPaystackPayment } from "@/lib/api.js";
import { formatNaira } from "@/lib/utils.js";

function CheckRow({ done, title, description }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-black/8 bg-[#fbfaf6] p-4">
      {done ? <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" /> : <Clock3 className="mt-0.5 size-5 shrink-0 text-[var(--accent-dark)]" />}
      <div>
        <p className="font-black text-[var(--ink)]">{title}</p>
        <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{description}</p>
      </div>
    </div>
  );
}

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

  const paid = Boolean(result?.paid);
  const payment = result?.payment;
  const order = result?.order;

  return (
    <main className="min-h-screen bg-[#f6f3ec]">
      <section className="border-b border-black/8 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <p className="section-kicker text-[var(--accent-dark)]">Payment result</p>
          <h1 className="mt-3 text-4xl font-black tracking-[-.045em] text-[var(--ink)] sm:text-5xl">Payment verification</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">This page confirms whether Paystack redirected correctly and whether the backend verified the payment before updating the order.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_24rem] lg:px-8">
        <div className="surface-card p-6 sm:p-8">
          {!result && !error ? <div><Clock3 className="mb-4 size-8 text-[var(--accent-dark)]" /><p className="font-black">Verifying payment...</p><p className="mt-2 text-sm text-[var(--muted)]">Please wait while the backend checks Paystack with the secret key.</p></div> : null}
          {error ? <div><AlertTriangle className="mb-4 size-8 text-[var(--accent-dark)]" /><p className="font-black">Payment could not be verified</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{error}</p><a href="/cart" className="cta-outline mt-6">Back to cart</a></div> : null}
          {result ? <div><BadgeCheck className="mb-4 size-8 text-emerald-700" /><p className="text-2xl font-black tracking-[-.03em]">{paid ? "Payment successful" : "Payment not completed"}</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Order {order.orderNumber} is now {order.orderStatus.replaceAll("_", " ")}.</p><div className="mt-6 rounded-2xl bg-[#f6f3ec] p-5"><CreditCard className="mb-3 size-5 text-[var(--accent-dark)]" /><div className="grid gap-2 text-sm"><div className="flex justify-between gap-4"><span>Reference</span><strong className="text-right">{payment.reference}</strong></div><div className="flex justify-between"><span>Status</span><strong className="capitalize">{payment.status}</strong></div><div className="flex justify-between"><span>Amount</span><strong>{formatNaira(payment.amountKobo)}</strong></div><div className="flex justify-between"><span>Currency</span><strong>{payment.currency}</strong></div><div className="flex justify-between"><span>Channel</span><strong>{payment.channel ?? "Not returned yet"}</strong></div></div></div><a href={`/order-tracking?orderNumber=${encodeURIComponent(order.orderNumber)}`} className="cta-primary mt-6">View order tracking</a></div> : null}
        </div>

        <aside className="surface-card p-6">
          <div className="flex items-center gap-3"><ShieldCheck className="size-6 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Payment checklist</h2></div>
          <div className="mt-6 grid gap-3">
            <CheckRow done={Boolean(reference)} title="1. Paystack redirect returned a reference" description={reference ? `Reference received: ${reference}` : "No reference was found in the payment-result URL."} />
            <CheckRow done={Boolean(result || error)} title="2. Payment result page called backend verification" description="The frontend calls /api/v1/payments/paystack/verify/:reference as soon as this page opens." />
            <CheckRow done={Boolean(result)} title="3. Secret key stayed on backend" description="The backend verifies directly with Paystack using PAYSTACK_SECRET_KEY. The frontend never receives the secret key." />
            <CheckRow done={Boolean(result)} title="4. Amount, currency and reference were checked" description={result ? `${payment.currency} ${formatNaira(payment.amountKobo)} matched the stored pending order reference.` : "Waiting for backend verification result."} />
            <CheckRow done={paid} title="5. Order is marked paid only after trusted verification" description={result ? `Order status: ${order.orderStatus.replaceAll("_", " ")}. Payment status: ${payment.status}.` : "If Paystack is not successful, the order remains pending/failed instead of paid."} />
          </div>
          <a href="/checkout" className="mt-6 inline-flex items-center gap-2 text-sm font-black text-[var(--accent-dark)]">Return to checkout <ExternalLink className="size-4" /></a>
        </aside>
      </section>
    </main>
  );
}
