import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, Clock3, PackageCheck, RotateCcw, Search, Truck } from "lucide-react";
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

export function OrderTrackingClient({ initialOrderNumber = "" }) {
  const [form, setForm] = useState({ orderNumber: initialOrderNumber, email: "" });
  const [returnForm, setReturnForm] = useState({ reason: "not_as_described", details: "" });
  const [order, setOrder] = useState(null);
  const [returnMessage, setReturnMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setForm((current) => ({ ...current, orderNumber: initialOrderNumber }));
  }, [initialOrderNumber]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateReturnField(event) {
    const { name, value } = event.target;
    setReturnForm((current) => ({ ...current, [name]: value }));
  }

  function submitTracking(event) {
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

  function submitReturn(event) {
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
    <main className="min-h-screen">
      <section className="hero-grid border-b border-black/8">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="section-kicker">Order tracking</p>
          <h1 className="mt-4 font-serif text-5xl font-bold leading-none tracking-[-.06em] sm:text-7xl">Follow your order.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">Enter your order number and checkout email to view payment status, delivery status and item snapshots.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[24rem_1fr] lg:px-8">
        <form onSubmit={submitTracking} className="h-fit rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
          <div className="flex items-center gap-3"><Search className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Find order</h2></div>
          <div className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-bold">Order number<input name="orderNumber" value={form.orderNumber} onChange={updateField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold">Email used at checkout<input name="email" type="email" value={form.email} onChange={updateField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
          </div>
          <button disabled={isPending} className="cta-primary mt-6 w-full disabled:opacity-50" type="submit"><PackageCheck className="size-4" /> {isPending ? "Checking..." : "Track order"}</button>
          {error ? <div className="mt-5 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold text-[var(--ink)]"><AlertTriangle className="mb-2 size-5 text-[var(--accent-dark)]" />{error}</div> : null}
          {returnMessage ? <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{returnMessage}</div> : null}
        </form>

        <div className="rounded-[2rem] border border-black/8 bg-white/80 p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)] sm:p-8">
          {!order ? <div><Clock3 className="mb-4 size-8 text-[var(--accent-dark)]" /><p className="font-black">Order details will appear here.</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">For privacy, we match both the order number and customer email.</p></div> : null}
          {order ? <div><p className="section-kicker">{order.orderNumber}</p><h2 className="mt-3 text-3xl font-black tracking-[-.04em]">{order.orderStatus.replaceAll("_", " ")}</h2><p className="mt-2 text-sm text-[var(--muted)]">Payment: {order.paymentStatus.replaceAll("_", " ")} | Total: {formatNaira(order.totalKobo)}</p><div className="mt-8 grid gap-4">{order.items.map((item) => <article key={`${item.productId}-${item.sku}`} className="rounded-2xl border border-black/8 bg-white p-4"><p className="font-black">{item.name}</p><p className="mt-1 text-sm text-[var(--muted)]">SKU: {item.sku} | Condition: {item.condition} | Qty: {item.quantity}</p><p className="mt-2 text-sm font-black">{formatNaira(item.lineSubtotalKobo)}</p></article>)}</div><div className="mt-8 rounded-2xl bg-[var(--ink)] p-5 text-white"><Truck className="mb-3 size-5 text-[var(--accent)]" /><p className="font-black">Timeline</p><div className="mt-4 grid gap-3">{order.statusHistory.map((history) => <div key={`${history.status}-${history.changedAt}`} className="border-l border-white/20 pl-4"><p className="font-bold capitalize">{history.status.replaceAll("_", " ")}</p>{history.note ? <p className="text-sm text-white/65">{history.note}</p> : null}</div>)}</div></div>{canRequestReturn ? <form onSubmit={submitReturn} className="mt-8 rounded-2xl border border-black/8 bg-[#fbfaf6] p-5"><div className="flex items-center gap-3"><RotateCcw className="size-5 text-[var(--accent-dark)]" /><p className="font-black">Request return or refund</p></div><div className="mt-4 grid gap-4"><label className="grid gap-2 text-sm font-bold">Reason<select name="reason" value={returnForm.reason} onChange={updateReturnField} className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none">{returnReasons.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label className="grid gap-2 text-sm font-bold">Details<textarea name="details" value={returnForm.details} onChange={updateReturnField} required minLength={10} rows={4} className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none" placeholder="Explain the issue clearly so support can review it." /></label><button type="submit" disabled={isPending} className="cta-outline"><RotateCcw className="size-4" /> Submit request</button></div></form> : null}</div> : null}
        </div>
      </section>
    </main>
  );
}