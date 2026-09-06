"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, ArrowRight, Clock3, Mail, PackageCheck, ReceiptText, RotateCcw, Search, Truck } from "lucide-react";
import { createReturnRequest, trackOrder } from "@/lib/api.js";
import { formatNaira } from "@/lib/utils.js";

const returnReasons = [
  ["not_as_described", "Not as described"],
  ["damaged", "Damaged on arrival"],
  ["defective", "Defective"],
  ["wrong_item", "Wrong item"],
  ["changed_mind", "Changed mind"],
  ["other", "Other"],
];

type OrderItem = {
  productId: string;
  sku: string;
  name: string;
  condition: string;
  quantity: number;
  lineSubtotalKobo: number;
};

type StatusHistory = {
  status: string;
  note?: string;
  changedAt: string;
};

type TrackedOrder = {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  totalKobo: number;
  items: OrderItem[];
  statusHistory: StatusHistory[];
};

function readableStatus(status?: string) {
  return String(status ?? "").replaceAll("_", " ");
}

export function OrderTrackingClient({ initialOrderNumber = "" }) {
  const [form, setForm] = useState({ orderNumber: initialOrderNumber, email: "" });
  const [returnForm, setReturnForm] = useState({ reason: "not_as_described", details: "" });
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [returnMessage, setReturnMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setForm((current) => ({ ...current, orderNumber: initialOrderNumber }));
  }, [initialOrderNumber]);

  function updateField(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateReturnField(event: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    setReturnForm((current) => ({ ...current, [name]: value }));
  }

  function submitTracking(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        setError("");
        setReturnMessage("");
        setOrder(await trackOrder(form));
      } catch (trackingError) {
        setOrder(null);
        setError(trackingError instanceof Error ? trackingError.message : "Could not find that order.");
      }
    });
  }

  function submitReturn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!order?.id) return;
    startTransition(async () => {
      try {
        setError("");
        const returnRequest = await createReturnRequest(order.id, { email: form.email, ...returnForm });
        setReturnMessage(`Return request ${returnRequest.requestNumber} submitted. Our team will review it.`);
        setOrder(await trackOrder(form));
      } catch (returnError) {
        setError(returnError instanceof Error ? returnError.message : "Return request failed.");
      }
    });
  }

  const canRequestReturn = order?.paymentStatus === "successful" && order?.orderStatus === "delivered";

  return (
    <main className="min-h-screen bg-[#f6f3ec] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="mx-auto max-w-7xl">
        <div className="surface-card mb-8 grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
          <div>
            <p className="section-kicker">Order tracking</p>
            <h1 className="mt-3 font-serif text-4xl font-bold leading-none tracking-[-.05em] text-[var(--ink)] sm:text-6xl">Track your delivery</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">Enter your order number and checkout email to view payment status, delivery progress and item snapshots.</p>
          </div>
          <a href="/shop" className="cta-primary w-fit">Continue shopping <ArrowRight className="size-4" /></a>
        </div>

        <div className="grid gap-8 lg:grid-cols-[25rem_1fr]">
          <form onSubmit={submitTracking} className="surface-card h-fit p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-kicker">Find order</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-.03em] text-[var(--ink)]">Lookup details</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">For privacy, both fields must match your checkout record.</p>
              </div>
              <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#fff3e8] text-[var(--accent-dark)]"><Search className="size-5" /></div>
            </div>

            <div className="mt-7 grid gap-4">
              <label className="grid gap-2 text-sm font-black text-[var(--ink)]">Order number<input name="orderNumber" value={form.orderNumber} onChange={updateField} required placeholder="JA-1001" className="rounded-2xl border border-black/10 bg-[#fbfaf6] px-4 py-3.5 outline-none transition placeholder:text-black/35 focus:border-[var(--accent-dark)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,123,37,.12)]" /></label>
              <label className="grid gap-2 text-sm font-black text-[var(--ink)]">Email used at checkout<input name="email" type="email" value={form.email} onChange={updateField} required placeholder="you@example.com" className="rounded-2xl border border-black/10 bg-[#fbfaf6] px-4 py-3.5 outline-none transition placeholder:text-black/35 focus:border-[var(--accent-dark)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,123,37,.12)]" /></label>
            </div>

            <button disabled={isPending} className="cta-primary mt-6 w-full disabled:opacity-50" type="submit"><PackageCheck className="size-4" /> {isPending ? "Checking..." : "Track order"}</button>

            <div className="mt-6 rounded-3xl bg-white p-5 text-[var(--ink)]">
              <Mail className="size-5 text-[var(--accent)]" />
              <p className="mt-3 text-sm font-black">Need help?</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted)]">If you cannot find your order, contact support with your payment email and order reference.</p>
              <a href="/contact" className="mt-4 inline-flex text-sm font-black text-[var(--accent)]">Contact support</a>
            </div>
          </form>

          <section className="surface-card p-6 sm:p-8">
            {error ? <div className="mb-6 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold text-[var(--accent-dark)]"><AlertTriangle className="mb-2 size-5" />{error}</div> : null}
            {returnMessage ? <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{returnMessage}</div> : null}

            {!order ? (
              <div className="grid min-h-[34rem] place-items-center rounded-[1.5rem] border border-dashed border-black/15 bg-[#fbfaf6] p-8 text-center">
                <div>
                  <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-white text-[var(--accent-dark)] shadow-sm"><Clock3 className="size-8" /></div>
                  <h2 className="mt-6 font-serif text-4xl font-bold tracking-[-.04em] text-[var(--ink)]">Order details will appear here.</h2>
                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">Once the order is found, you will see the order status, payment status, product snapshots and delivery timeline.</p>
                </div>
              </div>
            ) : null}

            {order ? (
              <div>
                <div className="grid gap-4 rounded-[1.5rem] bg-[#fbfaf6] p-5 md:grid-cols-[1fr_auto] md:items-center">
                  <div>
                    <p className="section-kicker">{order.orderNumber}</p>
                    <h2 className="mt-2 text-3xl font-black capitalize tracking-[-.04em] text-[var(--ink)]">{readableStatus(order.orderStatus)}</h2>
                    <p className="mt-2 text-sm text-[var(--muted)]">Payment: <strong className="capitalize text-[var(--ink)]">{readableStatus(order.paymentStatus)}</strong></p>
                  </div>
                  <div className="rounded-3xl bg-white px-5 py-4 text-right shadow-sm">
                    <p className="text-xs font-black uppercase tracking-[.12em] text-[var(--muted)]">Order total</p>
                    <p className="mt-1 text-2xl font-black text-[var(--ink)]">{formatNaira(order.totalKobo)}</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {order.items.map((item) => <article key={`${item.productId}-${item.sku}`} className="rounded-3xl border border-black/8 bg-white p-5 shadow-[0_12px_35px_rgba(28,34,31,.04)]"><ReceiptText className="size-5 text-[var(--accent-dark)]" /><p className="mt-4 font-black text-[var(--ink)]">{item.name}</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">SKU: {item.sku}<br />Condition: {item.condition}<br />Quantity: {item.quantity}</p><p className="mt-3 text-sm font-black text-[var(--ink)]">{formatNaira(item.lineSubtotalKobo)}</p></article>)}
                </div>

                <div className="mt-6 rounded-[1.5rem] bg-white p-6 text-[var(--ink)]">
                  <Truck className="size-6 text-[var(--accent)]" />
                  <h3 className="mt-4 text-2xl font-black tracking-[-.03em]">Delivery timeline</h3>
                  <div className="mt-6 grid gap-4">
                    {order.statusHistory.map((history, index) => <div key={`${history.status}-${history.changedAt}`} className="relative border-l border-black/10 pl-5"><span className="absolute -left-[.42rem] top-1 grid size-3 place-items-center rounded-full bg-[var(--accent)]" /><p className="text-xs font-black uppercase tracking-[.14em] text-[var(--muted)]">Step {index + 1}</p><p className="mt-1 font-black capitalize">{readableStatus(history.status)}</p>{history.note ? <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{history.note}</p> : null}</div>)}
                  </div>
                </div>

                {canRequestReturn ? <form onSubmit={submitReturn} className="mt-6 rounded-[1.5rem] border border-black/8 bg-[#fbfaf6] p-5"><div className="flex items-center gap-3"><RotateCcw className="size-5 text-[var(--accent-dark)]" /><p className="font-black text-[var(--ink)]">Request return or refund</p></div><div className="mt-4 grid gap-4"><label className="grid gap-2 text-sm font-black text-[var(--ink)]">Reason<select name="reason" value={returnForm.reason} onChange={updateReturnField} className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none">{returnReasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="grid gap-2 text-sm font-black text-[var(--ink)]">Details<textarea name="details" value={returnForm.details} onChange={updateReturnField} required minLength={10} rows={4} className="resize-none rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none" placeholder="Explain the issue clearly so support can review it." /></label><button type="submit" disabled={isPending} className="cta-outline"><RotateCcw className="size-4" /> Submit request</button></div></form> : null}
              </div>
            ) : null}
          </section>
        </div>
      </section>
    </main>
  );
}
