import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, Clock3, FileText, PackageCheck, Truck, XCircle } from "lucide-react";
import { cancelMyOrder, getMyOrder, getMyOrders } from "@/lib/api.js";
import { formatNaira } from "@/lib/utils.js";

function readableStatus(status) {
  return String(status ?? "").replaceAll("_", " ");
}

function canCancelOrder(order) {
  return order?.orderStatus === "pending_payment" && order?.paymentStatus === "pending";
}

export function CustomerOrderHistory() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
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

  function openOrder(orderId) {
    startTransition(async () => {
      try {
        setError("");
        setSelectedOrder(await getMyOrder(orderId));
      } catch (orderError) {
        setError(orderError instanceof Error ? orderError.message : "Could not open that order.");
      }
    });
  }

  function cancelOrder(orderId) {
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
      <div className="flex items-center gap-3"><PackageCheck className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Order history</h2></div>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">View your paid, pending and delivered orders from this customer dashboard.</p>

      {message ? <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{message}</div> : null}
      {error ? <div className="mt-5 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold"><AlertTriangle className="mb-2 size-5 text-[var(--accent-dark)]" />{error}</div> : null}

      {!orders.length && !error ? <div className="mt-6 rounded-2xl border border-dashed border-black/15 p-5"><Clock3 className="mb-3 size-5 text-[var(--accent-dark)]" /><p className="text-sm font-bold text-[var(--muted)]">No orders yet. When you checkout, your order timeline will appear here.</p></div> : null}

      {orders.length ? <div className="mt-6 grid gap-4">{orders.map((order) => <article key={order.id} className="rounded-2xl border border-black/8 bg-[#fbfaf6] p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black">{order.orderNumber}</p><p className="mt-1 text-sm capitalize text-[var(--muted)]">Order: {readableStatus(order.orderStatus)} | Payment: {readableStatus(order.paymentStatus)}</p><p className="mt-2 text-sm font-black">{formatNaira(order.totalKobo)}</p></div><div className="flex flex-wrap gap-2"><button type="button" disabled={isPending} onClick={() => openOrder(order.id)} className="cta-outline disabled:opacity-50"><FileText className="size-4" /> View details</button>{canCancelOrder(order) ? <button type="button" disabled={isPending} onClick={() => cancelOrder(order.id)} className="rounded-full border border-[var(--accent)]/40 px-5 py-3 text-sm font-black text-[var(--accent-dark)] disabled:opacity-50"><XCircle className="inline size-4" /> Cancel</button> : null}</div></div></article>)}</div> : null}

      {selectedOrder ? <div className="mt-8 rounded-[1.5rem] border border-black/8 bg-white p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="section-kicker">{selectedOrder.orderNumber}</p><h3 className="mt-2 text-2xl font-black capitalize tracking-[-.03em]">{readableStatus(selectedOrder.orderStatus)}</h3><p className="mt-1 text-sm text-[var(--muted)]">Total paid/payable: {formatNaira(selectedOrder.totalKobo)}</p></div><div className="flex flex-wrap gap-2"><button type="button" className="cta-outline" onClick={() => window.print()}><FileText className="size-4" /> Print invoice</button>{canCancelOrder(selectedOrder) ? <button type="button" disabled={isPending} onClick={() => cancelOrder(selectedOrder.id)} className="rounded-full border border-[var(--accent)]/40 px-5 py-3 text-sm font-black text-[var(--accent-dark)] disabled:opacity-50"><XCircle className="inline size-4" /> Cancel order</button> : null}</div></div><div className="mt-6 grid gap-3">{selectedOrder.items.map((item) => <div key={`${item.productId}-${item.sku}`} className="rounded-2xl border border-black/8 p-4"><p className="font-black">{item.name}</p><p className="mt-1 text-sm text-[var(--muted)]">SKU: {item.sku} | Condition: {item.condition} | Qty: {item.quantity}</p><p className="mt-2 text-sm font-black">{formatNaira(item.lineSubtotalKobo)}</p></div>)}</div><div className="mt-6 rounded-2xl bg-[var(--ink)] p-5 text-white"><Truck className="mb-3 size-5 text-[var(--accent)]" /><p className="font-black">Order timeline</p><div className="mt-4 grid gap-3">{selectedOrder.statusHistory.map((history) => <div key={`${history.status}-${history.changedAt}`} className="border-l border-white/20 pl-4"><p className="font-bold capitalize">{readableStatus(history.status)}</p>{history.note ? <p className="text-sm text-white/65">{history.note}</p> : null}</div>)}</div></div></div> : null}
    </section>
  );
}
