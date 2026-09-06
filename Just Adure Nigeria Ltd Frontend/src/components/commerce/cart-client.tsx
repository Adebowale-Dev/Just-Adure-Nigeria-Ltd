"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, ArrowRight, CreditCard, PackageCheck, ShieldCheck, ShoppingBag, Trash2, Truck } from "lucide-react";
import { clearCart, getCart, removeCartItem, updateCartItem } from "@/lib/api.js";
import { notifyCartUpdated } from "@/lib/cart-events";
import { formatNaira } from "@/lib/utils.js";

type CartItem = {
  productId: string;
  slug: string;
  name: string;
  sku: string;
  condition?: string;
  quantity: number;
  availableQuantity: number;
  unitPriceKobo: number;
  lineSubtotalKobo?: number;
  image?: { secureUrl?: string; altText?: string } | null;
};

type Cart = {
  itemCount: number;
  subtotalKobo: number;
  discountKobo: number;
  totalKobo: number;
  items: CartItem[];
};

function itemImage(item: CartItem) {
  return item.image?.secureUrl ?? "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=900&q=85";
}

export function CartClient() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let mounted = true;
    getCart()
      .then((nextCart) => {
        if (mounted) { setCart(nextCart); notifyCartUpdated(nextCart); }
      })
      .catch(() => {
        if (mounted) setError("Cart is not available. Please confirm the backend is running on port 4000.");
      });
    return () => {
      mounted = false;
    };
  }, []);

  function runCartAction(action: () => Promise<Cart>) {
    startTransition(async () => {
      try {
        setError("");
        const nextCart = await action();
        setCart(nextCart);
        notifyCartUpdated(nextCart);
      } catch (actionError) {
        setError(actionError instanceof Error ? actionError.message : "Cart update failed.");
      }
    });
  }

  const hasItems = Boolean(cart?.items.length);

  return (
    <main className="min-h-screen bg-[#f6f3ec] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="mx-auto max-w-7xl">
        <div className="surface-card mb-8 grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
          <div>
            <p className="section-kicker">Shopping cart</p>
            <h1 className="mt-3 font-serif text-4xl font-bold leading-none tracking-[-.05em] text-[var(--ink)] sm:text-6xl">Review your cart</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">Confirm quantities before checkout. Product prices and stock are recalculated securely by the backend.</p>
          </div>
          <a href="/shop" className="cta-outline w-fit">Continue shopping</a>
        </div>

        {error ? (
          <div className="mb-6 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold text-[var(--accent-dark)]">
            <div className="flex items-start gap-3"><AlertTriangle className="mt-.5 size-5 shrink-0" /><span>{error}</span></div>
          </div>
        ) : null}

        {!cart ? (
          <div className="surface-card p-8">
            <div className="h-60 animate-pulse rounded-[1.5rem] bg-[#ede8de]" />
          </div>
        ) : null}

        {cart && cart.items.length === 0 ? (
          <div className="surface-card border-dashed p-10 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-[#fff3e8] text-[var(--accent-dark)]"><ShoppingBag className="size-8" /></div>
            <h2 className="mt-6 font-serif text-4xl font-bold tracking-[-.04em] text-[var(--ink)]">Your cart is empty.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">Browse inspected UK-used computers, appliances, TVs, furniture and home essentials, then add available products here.</p>
            <a href="/shop" className="cta-primary mx-auto mt-7 w-fit">Go to shop <ArrowRight className="size-4" /></a>
          </div>
        ) : null}

        {hasItems ? (
          <div className="grid gap-8 lg:grid-cols-[1fr_25rem]">
            <section className="grid gap-4">
              {cart?.items.map((item) => (
                <article key={item.productId} className="surface-card grid gap-4 p-4 transition hover:border-[var(--accent)]/40 sm:grid-cols-[9rem_1fr] xl:grid-cols-[10rem_1fr_auto]">
                  <a href={`/product/${item.slug}`} className="relative aspect-square overflow-hidden rounded-[1.5rem] bg-[#e9e8e2]">
                    <img src={itemImage(item)} alt={item.image?.altText ?? item.name} className="h-full w-full object-cover transition duration-500 hover:scale-105" />
                    <span className="absolute left-3 top-3 rounded-full bg-white/95 px-3 py-1 text-[.65rem] font-black uppercase tracking-[.08em] text-[var(--ink)] shadow-sm">{item.condition ?? "UK-used"}</span>
                  </a>

                  <div className="min-w-0 py-1">
                    <p className="text-xs font-black uppercase tracking-[.12em] text-[var(--accent-dark)]">SKU {item.sku}</p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-.035em] text-[var(--ink)]"><a href={`/product/${item.slug}`}>{item.name}</a></h2>
                    <div className="mt-4 grid gap-2 text-sm text-[var(--muted)] sm:grid-cols-2">
                      <p><strong className="text-[var(--ink)]">Unit price:</strong> {formatNaira(item.unitPriceKobo)}</p>
                      <p><strong className="text-[var(--ink)]">Available:</strong> {item.availableQuantity}</p>
                    </div>
                    <p className="mt-4 text-lg font-black text-[var(--ink)]">Line total: {formatNaira(item.lineSubtotalKobo ?? item.unitPriceKobo * item.quantity)}</p>
                  </div>

                  <div className="flex items-center justify-between gap-3 rounded-[1.5rem] bg-[#fbfaf6] p-4 xl:min-w-40 xl:flex-col xl:items-stretch xl:justify-center">
                    <label className="grid gap-2 text-xs font-black uppercase tracking-[.12em] text-[var(--muted)]">
                      Quantity
                      <input type="number" min={1} max={item.availableQuantity} value={item.quantity} disabled={isPending} onChange={(event) => runCartAction(() => updateCartItem(item.productId, Number(event.target.value)))} className="w-24 rounded-2xl border border-black/10 bg-white px-4 py-3 text-base font-black text-[var(--ink)] outline-none focus:border-[var(--accent-dark)] xl:w-full" />
                    </label>
                    <button className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 bg-white px-4 py-3 text-sm font-black text-[var(--accent-dark)] disabled:opacity-50" disabled={isPending} type="button" onClick={() => runCartAction(() => removeCartItem(item.productId))} aria-label={`Remove ${item.name}`}><Trash2 className="size-4" /> Remove</button>
                  </div>
                </article>
              ))}
            </section>

            <aside className="surface-card h-fit p-6 text-[var(--ink)] lg:sticky lg:top-28 sm:p-8">
              <p className="section-kicker text-[var(--accent)]">Order summary</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-.04em]">Ready for checkout</h2>
              <div className="mt-7 grid gap-4 text-sm">
                <div className="flex justify-between gap-4"><span className="text-[var(--muted)]">Items</span><strong>{cart?.itemCount ?? 0}</strong></div>
                <div className="flex justify-between gap-4"><span className="text-[var(--muted)]">Subtotal</span><strong>{formatNaira(cart?.subtotalKobo ?? 0)}</strong></div>
                <div className="flex justify-between gap-4"><span className="text-[var(--muted)]">Discount</span><strong>{formatNaira(cart?.discountKobo ?? 0)}</strong></div>
                <div className="flex justify-between gap-4"><span className="text-[var(--muted)]">Delivery</span><strong>Calculated at checkout</strong></div>
              </div>
              <div className="mt-7 border-t border-black/10 pt-6">
                <div className="flex items-baseline justify-between gap-4"><span className="font-black">Total</span><strong className="text-3xl tracking-[-.04em]">{formatNaira(cart?.totalKobo ?? 0)}</strong></div>
              </div>
              <a href="/checkout" className="cta-primary mt-7 w-full">Proceed to checkout <ArrowRight className="size-4" /></a>
              <button className="mt-4 w-full rounded-full border border-black/10 px-5 py-3 text-sm font-black text-[var(--muted)] transition hover:bg-[#fff3e8] disabled:opacity-50" disabled={isPending} type="button" onClick={() => runCartAction(clearCart)}>Clear cart</button>
              <div className="mt-7 grid gap-3 border-t border-black/10 pt-6 text-sm text-[var(--muted)]">
                <p className="flex items-center gap-3"><ShieldCheck className="size-5 text-[var(--accent)]" /> Backend validates prices</p>
                <p className="flex items-center gap-3"><PackageCheck className="size-5 text-[var(--accent)]" /> Stock checked before payment</p>
                <p className="flex items-center gap-3"><CreditCard className="size-5 text-[var(--accent)]" /> Paystack secure checkout</p>
                <p className="flex items-center gap-3"><Truck className="size-5 text-[var(--accent)]" /> Delivery fee added next</p>
              </div>
            </aside>
          </div>
        ) : null}
      </section>
    </main>
  );
}
