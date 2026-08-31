import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, BadgeCheck, CreditCard, LockKeyhole, PackageCheck, Tag, Truck } from "lucide-react";
import { calculateDeliveryFee, createCheckoutOrder, getCart, initializePaystackPayment } from "@/lib/api.js";
import { formatNaira } from "@/lib/utils.js";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  state: "Lagos",
  city: "Ikeja",
  deliveryInstructions: "",
  couponCode: "",
  orderNotes: "",
};

export function CheckoutClient() {
  const [cart, setCart] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [deliveryQuote, setDeliveryQuote] = useState(null);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [error, setError] = useState("");
  const [paymentMessage, setPaymentMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;
    getCart()
      .then((nextCart) => {
        if (mounted) setCart(nextCart);
      })
      .catch(() => {
        if (mounted) setError("Checkout is not available yet. Please confirm the backend is running on port 4000.");
      });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!form.state || !form.city) return;
    let mounted = true;
    calculateDeliveryFee({ state: form.state, city: form.city, deliveryMethod: "delivery" })
      .then((quote) => {
        if (mounted) setDeliveryQuote(quote);
      })
      .catch(() => {
        if (mounted) setDeliveryQuote(null);
      });
    return () => {
      mounted = false;
    };
  }, [form.state, form.city]);

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function submitCheckout(event) {
    event.preventDefault();
    startTransition(async () => {
      try {
        setError("");
        setPaymentMessage("");
        const order = await createCheckoutOrder({
          customer: {
            name: form.name,
            email: form.email,
            phone: form.phone,
            addressLine1: form.addressLine1,
            addressLine2: form.addressLine2 || undefined,
            state: form.state,
            city: form.city,
            deliveryInstructions: form.deliveryInstructions || undefined,
          },
          deliveryMethod: "delivery",
          couponCode: form.couponCode || undefined,
          orderNotes: form.orderNotes || undefined,
        });
        setCreatedOrder(order);
        setCart({ items: [], itemCount: 0, subtotalKobo: 0, discountKobo: 0, totalKobo: 0 });
      } catch (checkoutError) {
        setError(checkoutError instanceof Error ? checkoutError.message : "Checkout failed. Please try again.");
      }
    });
  }

  function startPaystackPayment() {
    if (!createdOrder?.id) return;
    startTransition(async () => {
      try {
        setError("");
        setPaymentMessage("Connecting securely to Paystack...");
        const payment = await initializePaystackPayment({ orderId: createdOrder.id });
        if (!payment.authorizationUrl) throw new Error("Paystack did not return a checkout URL.");
        window.location.href = payment.authorizationUrl;
      } catch (paymentError) {
        setPaymentMessage("");
        setError(paymentError instanceof Error ? paymentError.message : "Could not start Paystack payment.");
      }
    });
  }

  const deliveryFeeKobo = createdOrder?.deliveryFeeKobo ?? deliveryQuote?.deliveryFeeKobo ?? 0;
  const subtotalKobo = createdOrder?.subtotalKobo ?? cart?.subtotalKobo ?? 0;
  const discountKobo = createdOrder?.discountKobo ?? cart?.discountKobo ?? 0;
  const finalTotalKobo = createdOrder?.totalKobo ?? subtotalKobo + deliveryFeeKobo - discountKobo;
  const activeCoupon = createdOrder?.coupon ?? null;

  return (
    <main className="min-h-screen">
      <section className="hero-grid border-b border-black/8">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="section-kicker">Secure checkout</p>
          <h1 className="mt-4 font-serif text-5xl font-bold leading-none tracking-[-.06em] sm:text-7xl">Reserve your exact item.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">The backend recalculates stock, product prices, delivery fee and order total before creating a pending order.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_24rem] lg:px-8">
        <form onSubmit={submitCheckout} className="rounded-[2rem] border border-black/8 bg-[#fbfaf6]0 p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)] sm:p-8">
          <div className="flex items-center gap-3">
            <LockKeyhole className="size-5 text-[var(--accent-dark)]" />
            <h2 className="text-2xl font-black tracking-[-.03em]">Delivery details</h2>
          </div>

          {error ? <div className="mt-6 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold text-[var(--ink)]"><AlertTriangle className="mb-2 size-5 text-[var(--accent-dark)]" />{error}</div> : null}

          {createdOrder ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><BadgeCheck className="mb-3 size-6 text-emerald-700" /><p className="font-black">Pending order created: {createdOrder.orderNumber}</p><p className="mt-2 text-sm leading-6 text-emerald-900">Inventory has been temporarily reserved. Continue to Paystack to complete payment securely.</p></div> : null}
          {createdOrder ? <button className="cta-primary mt-4 w-full" disabled={isPending} type="button" onClick={startPaystackPayment}><CreditCard className="size-4" /> {isPending ? "Opening Paystack..." : "Pay with Paystack"}</button> : null}
          {paymentMessage ? <p className="mt-3 text-center text-sm font-bold text-[var(--accent-dark)]">{paymentMessage}</p> : null}

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">Full name<input name="name" value={form.name} onChange={updateField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold">Email address<input name="email" type="email" value={form.email} onChange={updateField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold">Phone number<input name="phone" value={form.phone} onChange={updateField} required placeholder="08012345678" className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold">State<input name="state" value={form.state} onChange={updateField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold sm:col-span-2">Delivery address<input name="addressLine1" value={form.addressLine1} onChange={updateField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold">Apartment or landmark<input name="addressLine2" value={form.addressLine2} onChange={updateField} className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold">City or LGA<input name="city" value={form.city} onChange={updateField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold sm:col-span-2">Delivery instructions<textarea name="deliveryInstructions" value={form.deliveryInstructions} onChange={updateField} rows={3} className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold sm:col-span-2">Coupon code<input name="couponCode" value={form.couponCode} onChange={updateField} placeholder="Example: LAUNCH10" className="rounded-2xl border border-black/10 px-4 py-3 uppercase outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold sm:col-span-2">Order notes<textarea name="orderNotes" value={form.orderNotes} onChange={updateField} rows={3} className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
          </div>

          <button disabled={isPending || !cart || cart.items.length === 0 || Boolean(createdOrder)} className="cta-primary mt-8 w-full disabled:cursor-not-allowed disabled:opacity-50" type="submit">
            <PackageCheck className="size-4" /> {isPending ? "Creating order..." : "Create pending order"}
          </button>
        </form>

        <aside className="h-fit rounded-[2rem] border border-black/8 bg-white p-6 text-[var(--ink)] shadow-[0_18px_50px_rgba(28,34,31,.06)]">
          <p className="section-kicker text-[var(--accent)]">Backend totals</p>
          {!cart ? <p className="mt-6 font-bold text-[var(--muted)]">Loading cart...</p> : null}
          {cart?.items.length === 0 && !createdOrder ? <p className="mt-6 font-bold text-[var(--muted)]">Your cart is empty. Add a product before checkout.</p> : null}
          <div className="mt-6 grid gap-4">
            {cart?.items.map((item) => <div key={item.productId} className="rounded-2xl bg-[#fbfaf6] p-4"><p className="font-black">{item.name}</p><p className="mt-1 text-sm text-[var(--muted)]">Qty {item.quantity} x {formatNaira(item.unitPriceKobo)}</p></div>)}
          </div>
          <div className="mt-6 grid gap-3 border-t border-black/10 pt-5 text-sm">
            <div className="flex justify-between"><span className="text-[var(--muted)]">Subtotal</span><strong>{formatNaira(subtotalKobo)}</strong></div>
            <div className="flex justify-between"><span className="text-[var(--muted)]">Discount</span><strong>{formatNaira(discountKobo)}</strong></div>
            {activeCoupon ? <div className="flex items-center justify-between rounded-2xl bg-emerald-400/15 px-3 py-2 text-emerald-100"><span className="inline-flex items-center gap-2"><Tag className="size-4" /> Coupon</span><strong>{activeCoupon.code}</strong></div> : null}
            <div className="flex justify-between"><span className="text-[var(--muted)]">Delivery</span><strong>{deliveryQuote || createdOrder ? formatNaira(deliveryFeeKobo) : "Checking..."}</strong></div>
          </div>
          <div className="mt-6 flex items-baseline justify-between border-t border-black/10 pt-5"><span className="font-black">Total</span><strong className="text-2xl">{formatNaira(finalTotalKobo)}</strong></div>
          <div className="mt-6 rounded-2xl bg-[#fbfaf6] p-4 text-sm leading-6 text-[var(--muted)]"><Truck className="mb-2 size-5 text-[var(--accent)]" />After payment, Paystack redirects back to the payment result page and the backend verifies the transaction before marking the order as paid.</div>
        </aside>
      </section>
    </main>
  );
}
