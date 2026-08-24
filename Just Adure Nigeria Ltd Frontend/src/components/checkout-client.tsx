import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, BadgeCheck, LockKeyhole, PackageCheck, Truck } from "lucide-react";
import { calculateDeliveryFee, createCheckoutOrder, getCart } from "@/lib/api.js";
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
  orderNotes: "",
};

export function CheckoutClient() {
  const [cart, setCart] = useState(null);
  const [form, setForm] = useState(initialForm);
  const [deliveryQuote, setDeliveryQuote] = useState(null);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [error, setError] = useState("");
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
          orderNotes: form.orderNotes || undefined,
        });
        setCreatedOrder(order);
        setCart({ items: [], itemCount: 0, subtotalKobo: 0, discountKobo: 0, totalKobo: 0 });
      } catch (checkoutError) {
        setError(checkoutError instanceof Error ? checkoutError.message : "Checkout failed. Please try again.");
      }
    });
  }

  const deliveryFeeKobo = deliveryQuote?.deliveryFeeKobo ?? 0;
  const finalTotalKobo = (cart?.subtotalKobo ?? 0) + deliveryFeeKobo - (cart?.discountKobo ?? 0);

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
        <form onSubmit={submitCheckout} className="rounded-[2rem] border border-black/8 bg-white/80 p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)] sm:p-8">
          <div className="flex items-center gap-3">
            <LockKeyhole className="size-5 text-[var(--accent-dark)]" />
            <h2 className="text-2xl font-black tracking-[-.03em]">Delivery details</h2>
          </div>

          {error ? <div className="mt-6 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold text-[var(--ink)]"><AlertTriangle className="mb-2 size-5 text-[var(--accent-dark)]" />{error}</div> : null}

          {createdOrder ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><BadgeCheck className="mb-3 size-6 text-emerald-700" /><p className="font-black">Pending order created: {createdOrder.orderNumber}</p><p className="mt-2 text-sm leading-6 text-emerald-900">Inventory has been temporarily reserved. Paystack payment initialization is the next milestone.</p></div> : null}

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">Full name<input name="name" value={form.name} onChange={updateField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold">Email address<input name="email" type="email" value={form.email} onChange={updateField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold">Phone number<input name="phone" value={form.phone} onChange={updateField} required placeholder="08012345678" className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold">State<input name="state" value={form.state} onChange={updateField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold sm:col-span-2">Delivery address<input name="addressLine1" value={form.addressLine1} onChange={updateField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold">Apartment or landmark<input name="addressLine2" value={form.addressLine2} onChange={updateField} className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold">City or LGA<input name="city" value={form.city} onChange={updateField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold sm:col-span-2">Delivery instructions<textarea name="deliveryInstructions" value={form.deliveryInstructions} onChange={updateField} rows={3} className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold sm:col-span-2">Order notes<textarea name="orderNotes" value={form.orderNotes} onChange={updateField} rows={3} className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
          </div>

          <button disabled={isPending || !cart || cart.items.length === 0 || Boolean(createdOrder)} className="cta-primary mt-8 w-full disabled:cursor-not-allowed disabled:opacity-50" type="submit">
            <PackageCheck className="size-4" /> {isPending ? "Creating order..." : "Create pending order"}
          </button>
        </form>

        <aside className="h-fit rounded-[2rem] border border-black/8 bg-[var(--ink)] p-6 text-white shadow-[0_24px_70px_rgba(28,34,31,.18)]">
          <p className="section-kicker text-[var(--accent)]">Backend totals</p>
          {!cart ? <p className="mt-6 font-bold text-white/70">Loading cart...</p> : null}
          {cart?.items.length === 0 && !createdOrder ? <p className="mt-6 font-bold text-white/70">Your cart is empty. Add a product before checkout.</p> : null}
          <div className="mt-6 grid gap-4">
            {cart?.items.map((item) => <div key={item.productId} className="rounded-2xl bg-white/8 p-4"><p className="font-black">{item.name}</p><p className="mt-1 text-sm text-white/60">Qty {item.quantity} x {formatNaira(item.unitPriceKobo)}</p></div>)}
          </div>
          <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 text-sm">
            <div className="flex justify-between"><span className="text-white/65">Subtotal</span><strong>{formatNaira(cart?.subtotalKobo ?? 0)}</strong></div>
            <div className="flex justify-between"><span className="text-white/65">Discount</span><strong>{formatNaira(cart?.discountKobo ?? 0)}</strong></div>
            <div className="flex justify-between"><span className="text-white/65">Delivery</span><strong>{deliveryQuote ? formatNaira(deliveryFeeKobo) : "Checking..."}</strong></div>
          </div>
          <div className="mt-6 flex items-baseline justify-between border-t border-white/10 pt-5"><span className="font-black">Total</span><strong className="text-2xl">{formatNaira(finalTotalKobo)}</strong></div>
          <div className="mt-6 rounded-2xl bg-white/8 p-4 text-sm leading-6 text-white/70"><Truck className="mb-2 size-5 text-[var(--accent)]" />Paystack redirect comes next. For now, this step proves stock reservation and trusted backend totals.</div>
        </aside>
      </section>
    </main>
  );
}
