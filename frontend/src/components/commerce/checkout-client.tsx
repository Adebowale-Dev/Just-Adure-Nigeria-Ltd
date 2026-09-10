import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, ArrowLeft, BadgeCheck, CreditCard, LockKeyhole, MapPin, PackageCheck, Tag, Truck, UserRound } from "lucide-react";
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

  const fieldClass = "min-h-12 rounded-xl border border-black/10 bg-[#fbfaf6] px-4 py-3 text-[var(--ink)] outline-none transition placeholder:text-black/35 focus:border-[var(--accent-dark)] focus:bg-white";

  return (
    <main className="page-shell">
      <section className="mx-auto max-w-7xl px-4 pb-4 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <a href="/cart" className="inline-flex items-center gap-2 text-sm font-black text-[var(--muted)] hover:text-[var(--accent-dark)]"><ArrowLeft className="size-4" /> Back to cart</a>
        <div className="mt-6 flex flex-col gap-4 border-b border-black/10 pb-7 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="section-kicker">Checkout</p><h1 className="mt-2 text-4xl font-black tracking-[-.05em] sm:text-5xl">Complete your order</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">Enter your delivery details, confirm the total, then continue to Paystack.</p></div>
          <div className="flex items-center gap-2 text-sm font-bold text-[var(--muted)]"><LockKeyhole className="size-4 text-[var(--accent-dark)]" /> Secure payment</div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-16 pt-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_25rem] lg:px-8">
        <form onSubmit={submitCheckout} className="space-y-6">
          {error ? <div role="alert" className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800"><AlertTriangle className="mt-0.5 size-5 shrink-0" />{error}</div> : null}

          {createdOrder ? <section className="surface-card p-6 sm:p-8"><div className="flex items-start gap-4"><span className="grid size-11 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700"><BadgeCheck className="size-6" /></span><div><h2 className="text-xl font-black">Your order is ready for payment</h2><p className="mt-1 text-sm leading-6 text-[var(--muted)]">Order {createdOrder.orderNumber} has been reserved temporarily. Pay now to confirm it.</p></div></div><button className="cta-primary mt-6 w-full" disabled={isPending} type="button" onClick={startPaystackPayment}><CreditCard className="size-4" /> {isPending ? "Opening Paystack..." : `Pay ${formatNaira(finalTotalKobo)} securely`}</button>{paymentMessage ? <p className="mt-3 text-center text-sm font-bold text-[var(--accent-dark)]">{paymentMessage}</p> : null}</section> : null}

          {!createdOrder ? <>
            <fieldset className="surface-card p-6 sm:p-8">
              <legend className="sr-only">Contact information</legend>
              <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[#fff3e8] font-black text-[var(--accent-dark)]">1</span><div><h2 className="text-xl font-black">Contact information</h2><p className="mt-1 text-sm text-[var(--muted)]">We will send your receipt and delivery updates here.</p></div></div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold sm:col-span-2"><span className="inline-flex items-center gap-2"><UserRound className="size-4 text-[var(--accent-dark)]" /> Full name</span><input name="name" autoComplete="name" value={form.name} onChange={updateField} required placeholder="Your full name" className={fieldClass} /></label>
                <label className="grid gap-2 text-sm font-bold">Email address<input name="email" type="email" autoComplete="email" value={form.email} onChange={updateField} required placeholder="you@example.com" className={fieldClass} /></label>
                <label className="grid gap-2 text-sm font-bold">Phone number<input name="phone" type="tel" autoComplete="tel" value={form.phone} onChange={updateField} required placeholder="0801 234 5678" className={fieldClass} /></label>
              </div>
            </fieldset>

            <fieldset className="surface-card p-6 sm:p-8">
              <legend className="sr-only">Delivery address</legend>
              <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[#fff3e8] font-black text-[var(--accent-dark)]">2</span><div><h2 className="text-xl font-black">Delivery address</h2><p className="mt-1 text-sm text-[var(--muted)]">Use an address where someone can receive the item.</p></div></div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <label className="grid gap-2 text-sm font-bold sm:col-span-2"><span className="inline-flex items-center gap-2"><MapPin className="size-4 text-[var(--accent-dark)]" /> Street address</span><input name="addressLine1" autoComplete="address-line1" value={form.addressLine1} onChange={updateField} required placeholder="House number and street name" className={fieldClass} /></label>
                <label className="grid gap-2 text-sm font-bold">Apartment or landmark <span className="font-normal text-[var(--muted)]">Optional</span><input name="addressLine2" autoComplete="address-line2" value={form.addressLine2} onChange={updateField} placeholder="Flat, building, or nearby landmark" className={fieldClass} /></label>
                <label className="grid gap-2 text-sm font-bold">City or LGA<input name="city" autoComplete="address-level2" value={form.city} onChange={updateField} required className={fieldClass} /></label>
                <label className="grid gap-2 text-sm font-bold">State<input name="state" autoComplete="address-level1" value={form.state} onChange={updateField} required className={fieldClass} /></label>
                <label className="grid gap-2 text-sm font-bold">Delivery instructions <span className="font-normal text-[var(--muted)]">Optional</span><input name="deliveryInstructions" value={form.deliveryInstructions} onChange={updateField} placeholder="Gate colour, call on arrival..." className={fieldClass} /></label>
              </div>
            </fieldset>

            <fieldset className="surface-card p-6 sm:p-8">
              <legend className="sr-only">Discount and order notes</legend>
              <div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-full bg-[#fff3e8] font-black text-[var(--accent-dark)]">3</span><div><h2 className="text-xl font-black">Final details</h2><p className="mt-1 text-sm text-[var(--muted)]">Add a discount code or a note if you have one.</p></div></div>
              <div className="mt-6 grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Coupon code <span className="font-normal text-[var(--muted)]">Optional</span><input name="couponCode" value={form.couponCode} onChange={updateField} placeholder="Enter code" className={`${fieldClass} uppercase`} /></label><label className="grid gap-2 text-sm font-bold">Order note <span className="font-normal text-[var(--muted)]">Optional</span><input name="orderNotes" value={form.orderNotes} onChange={updateField} placeholder="Anything we should know?" className={fieldClass} /></label></div>
            </fieldset>

            <button disabled={isPending || !cart || cart.items.length === 0} className="cta-primary w-full disabled:opacity-50" type="submit"><PackageCheck className="size-4" /> {isPending ? "Checking your order..." : "Continue to secure payment"}</button>
          </> : null}
        </form>

        <aside className="surface-card h-fit p-6 lg:sticky lg:top-40">
          <div className="flex items-center justify-between gap-4"><h2 className="text-xl font-black">Order summary</h2><a href="/cart" className="text-sm font-black text-[var(--accent-dark)] hover:underline">Edit cart</a></div>
          {!cart && !createdOrder ? <p className="mt-6 text-sm font-bold text-[var(--muted)]">Loading your cart...</p> : null}
          {cart?.items.length === 0 && !createdOrder ? <div className="mt-6 rounded-xl bg-[#fbfaf6] p-4 text-sm leading-6 text-[var(--muted)]">Your cart is empty. <a href="/shop" className="font-black text-[var(--accent-dark)]">Browse products</a> to continue.</div> : null}
          <div className="mt-5 grid gap-3">{cart?.items.map((item) => <div key={item.productId} className="flex justify-between gap-4 border-b border-black/8 pb-3"><div><p className="text-sm font-black">{item.name}</p><p className="mt-1 text-xs text-[var(--muted)]">Quantity {item.quantity}</p></div><strong className="shrink-0 text-sm">{formatNaira(item.unitPriceKobo * item.quantity)}</strong></div>)}</div>
          <dl className="mt-5 grid gap-3 text-sm"><div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Subtotal</dt><dd className="font-black">{formatNaira(subtotalKobo)}</dd></div>{discountKobo > 0 ? <div className="flex justify-between gap-4 text-emerald-700"><dt>Discount</dt><dd className="font-black">-{formatNaira(discountKobo)}</dd></div> : null}{activeCoupon ? <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-emerald-800"><dt className="inline-flex items-center gap-2"><Tag className="size-4" /> Coupon</dt><dd className="font-black">{activeCoupon.code}</dd></div> : null}<div className="flex justify-between gap-4"><dt className="text-[var(--muted)]">Delivery</dt><dd className="font-black">{deliveryQuote || createdOrder ? formatNaira(deliveryFeeKobo) : "Calculating..."}</dd></div></dl>
          <div className="mt-5 flex items-baseline justify-between border-t border-black/10 pt-5"><span className="font-black">Total</span><strong className="text-2xl tracking-[-.04em]">{formatNaira(finalTotalKobo)}</strong></div>
          <div className="mt-5 flex items-start gap-3 rounded-xl bg-[#fbfaf6] p-4 text-xs leading-5 text-[var(--muted)]"><Truck className="mt-0.5 size-4 shrink-0 text-[var(--accent-dark)]" /><p>Delivery fee is calculated from your location. Paystack payment is verified securely before your order is marked as paid.</p></div>
        </aside>
      </section>
    </main>
  );
}
