"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, ArrowRight, FileText, ReceiptText, ShoppingBag, Truck, XCircle } from "lucide-react";
import { cancelMyOrder, getMyOrder, getMyOrders } from "@/lib/api.js";
import { formatNaira } from "@/lib/utils.js";

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

type CustomerOrder = {
  id: string;
  orderNumber: string;
  orderStatus: string;
  paymentStatus: string;
  totalKobo: number;
  items?: OrderItem[];
  statusHistory?: StatusHistory[];
};

function readableStatus(status?: string) {
  return String(status ?? "").replaceAll("_", " ");
}

function canCancelOrder(order: CustomerOrder | null) {
  return order?.orderStatus === "pending_payment" && order?.paymentStatus === "pending";
}

function statusBadgeClass(status?: string) {
  if (status === "paid" || status === "delivered" || status === "successful") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (status === "cancelled" || status === "failed" || status === "refunded") return "bg-red-50 text-red-700 border-red-100";
  return "bg-[#fff3e8] text-[var(--accent-dark)] border-[var(--accent)]/20";
}

export function CustomerOrderHistory() {
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function loadOrders() {
    return getMyOrders()
      .then((items) => {
        setOrders(items);
        setError("");
        return items;
      })
      .catch((loadError) => {
        setOrders([]);
        setError(loadError instanceof Error ? loadError.message : "Could not load your orders.");
        return [];
      });
  }

  useEffect(() => {
    loadOrders();
  }, []);

  function openOrder(orderId: string) {
    startTransition(async () => {
      try {
        setError("");
        setSelectedOrder(await getMyOrder(orderId));
      } catch (orderError) {
        setError(orderError instanceof Error ? orderError.message : "Could not open that order.");
      }
    });
  }

  function cancelOrder(orderId: string) {
    if (!window.confirm("Cancel this unpaid order? Reserved stock will be released.")) return;
    startTransition(async () => {
      try {
        setError("");
        setMessage("");
        const order = await cancelMyOrder(orderId, { reason: "Cancelled from customer dashboard." });
        setSelectedOrder(order);
        setMessage(`${order.orderNumber} has been cancelled.`);
        await loadOrders();
      } catch (cancelError) {
        setError(cancelError instanceof Error ? cancelError.message : "Could not cancel that order.");
      }
    });
  }

  return (
    <section className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)] sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="section-kicker">Order history</p>
          <h2 className="mt-2 text-3xl font-black tracking-[-.04em] text-[var(--ink)]">Your purchases</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">View payment status, order progress and product snapshots for every checkout.</p>
        </div>
        <a href="/order-tracking" className="cta-outline w-fit">Track by order number</a>
      </div>

      {message ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{message}</div> : null}
      {error ? <div className="mt-6 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold text-[var(--accent-dark)]"><AlertTriangle className="mb-2 size-5" />{error}</div> : null}

      {!orders.length && !error ? (
        <div className="mt-6 rounded-[1.5rem] border border-dashed border-black/15 bg-[#fbfaf6] p-8 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-3xl bg-white text-[var(--accent-dark)] shadow-sm"><ShoppingBag className="size-7" /></div>
          <h3 className="mt-5 text-2xl font-black tracking-[-.03em] text-[var(--ink)]">No orders yet.</h3>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--muted)]">When you complete checkout, your order timeline and invoice details will appear here.</p>
          <a href="/shop" className="cta-primary mx-auto mt-6 w-fit">Start shopping <ArrowRight className="size-4" /></a>
        </div>
      ) : null}

      {orders.length ? (
        <div className="mt-6 grid gap-4">
          {orders.map((order) => (
            <article key={order.id} className="rounded-[1.5rem] border border-black/8 bg-[#fbfaf6] p-5 transition hover:border-[var(--accent)]/30 hover:bg-white">
              <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-lg font-black text-[var(--ink)]">{order.orderNumber}</p>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${statusBadgeClass(order.orderStatus)}`}>{readableStatus(order.orderStatus)}</span>
                    <span className={`rounded-full border px-3 py-1 text-xs font-black capitalize ${statusBadgeClass(order.paymentStatus)}`}>{readableStatus(order.paymentStatus)}</span>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Total amount: <strong className="text-[var(--ink)]">{formatNaira(order.totalKobo)}</strong></p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" disabled={isPending} onClick={() => openOrder(order.id)} className="cta-primary disabled:opacity-50"><FileText className="size-4" /> View details</button>
                  {canCancelOrder(order) ? <button type="button" disabled={isPending} onClick={() => cancelOrder(order.id)} className="rounded-full border border-[var(--accent)]/40 bg-white px-5 py-3 text-sm font-black text-[var(--accent-dark)] disabled:opacity-50"><XCircle className="inline size-4" /> Cancel</button> : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : null}

      {selectedOrder ? (
        <div className="mt-8 overflow-hidden rounded-[2rem] border border-black/8 bg-white shadow-[0_18px_50px_rgba(28,34,31,.05)]">
          <div className="grid gap-5 bg-white p-6 text-[var(--ink)] sm:p-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="section-kicker text-[var(--accent)]">{selectedOrder.orderNumber}</p>
              <h3 className="mt-2 text-3xl font-black capitalize tracking-[-.04em]">{readableStatus(selectedOrder.orderStatus)}</h3>
              <p className="mt-2 text-sm text-[var(--muted)]">Payment: {readableStatus(selectedOrder.paymentStatus)}</p>
            </div>
            <div className="rounded-3xl bg-[#fff3e8] px-5 py-4 text-left lg:text-right">
              <p className="text-xs font-black uppercase tracking-[.12em] text-[var(--muted)]">Total paid/payable</p>
              <p className="mt-1 text-2xl font-black">{formatNaira(selectedOrder.totalKobo)}</p>
            </div>
          </div>

          <div className="grid gap-6 p-6 sm:p-8 xl:grid-cols-[1fr_22rem]">
            <div>
              <div className="flex items-center gap-3"><ReceiptText className="size-5 text-[var(--accent-dark)]" /><h4 className="text-xl font-black tracking-[-.03em] text-[var(--ink)]">Items in this order</h4></div>
              <div className="mt-5 grid gap-3">
                {(selectedOrder.items ?? []).map((item) => <div key={`${item.productId}-${item.sku}`} className="rounded-2xl border border-black/8 bg-[#fbfaf6] p-4"><p className="font-black text-[var(--ink)]">{item.name}</p><p className="mt-1 text-sm leading-6 text-[var(--muted)]">SKU: {item.sku} | Condition: {item.condition} | Qty: {item.quantity}</p><p className="mt-2 text-sm font-black text-[var(--ink)]">{formatNaira(item.lineSubtotalKobo)}</p></div>)}
              </div>
              <div className="mt-6 flex flex-wrap gap-3">
                <button type="button" className="cta-outline" onClick={() => window.print()}><FileText className="size-4" /> Print invoice</button>
                {canCancelOrder(selectedOrder) ? <button type="button" disabled={isPending} onClick={() => cancelOrder(selectedOrder.id)} className="rounded-full border border-[var(--accent)]/40 px-5 py-3 text-sm font-black text-[var(--accent-dark)] disabled:opacity-50"><XCircle className="inline size-4" /> Cancel order</button> : null}
              </div>
            </div>

            <aside className="rounded-[1.5rem] bg-[#fbfaf6] p-5">
              <Truck className="size-6 text-[var(--accent-dark)]" />
              <h4 className="mt-4 text-xl font-black tracking-[-.03em] text-[var(--ink)]">Order timeline</h4>
              <div className="mt-5 grid gap-4">
                {(selectedOrder.statusHistory ?? []).map((history, index) => <div key={`${history.status}-${history.changedAt}`} className="relative border-l border-black/10 pl-5"><span className="absolute -left-[.42rem] top-1 size-3 rounded-full bg-[var(--accent)]" /><p className="text-xs font-black uppercase tracking-[.12em] text-[var(--muted)]">Step {index + 1}</p><p className="mt-1 font-black capitalize text-[var(--ink)]">{readableStatus(history.status)}</p>{history.note ? <p className="mt-1 text-sm leading-6 text-[var(--muted)]">{history.note}</p> : null}</div>)}
                {!(selectedOrder.statusHistory ?? []).length ? <p className="text-sm font-bold text-[var(--muted)]">No timeline updates yet.</p> : null}
              </div>
            </aside>
          </div>
        </div>
      ) : null}
    </section>
  );
}

export function CustomerOrdersPage() {
  return (
    <main className="min-h-screen bg-[#f6f3ec] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 grid gap-5 rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)] lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
          <div>
            <p className="section-kicker">My orders</p>
            <h1 className="mt-3 font-serif text-4xl font-bold leading-none tracking-[-.05em] text-[var(--ink)] sm:text-6xl">Orders and invoices</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">Review your purchase history, print invoices and follow status updates from payment to delivery.</p>
          </div>
          <a href="/account" className="cta-outline w-fit">Back to dashboard</a>
        </div>
        <CustomerOrderHistory />
      </section>
    </main>
  );
}
