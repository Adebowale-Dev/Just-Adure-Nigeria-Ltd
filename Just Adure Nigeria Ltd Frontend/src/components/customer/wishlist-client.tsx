"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, ArrowRight, Bell, Heart, PackageOpen, ShoppingBag, Trash2 } from "lucide-react";
import { getWishlist, moveWishlistItemToCart, removeWishlistItem, subscribeBackInStockAlert } from "@/lib/api.js";
import { formatNaira } from "@/lib/utils.js";

type WishlistItem = {
  productId: string;
  slug: string;
  name: string;
  condition?: string;
  visibleDefects?: string;
  priceKobo: number;
  previousPriceKobo?: number | null;
  isSoldOut?: boolean;
  image?: { secureUrl?: string } | null;
};

type Wishlist = {
  itemCount?: number;
  items: WishlistItem[];
};

function itemImage(item: WishlistItem) {
  return item.image?.secureUrl ?? "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85";
}

export function WishlistClient() {
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [message, setMessage] = useState("");
  const [isError, setIsError] = useState(false);
  const [isPending, startTransition] = useTransition();

  function loadWishlist() {
    getWishlist()
      .then((data) => {
        setWishlist(data);
        setMessage("");
        setIsError(false);
      })
      .catch((error) => {
        setWishlist({ itemCount: 0, items: [] });
        setMessage(error instanceof Error ? error.message : "Please log in to view your wishlist.");
        setIsError(true);
      });
  }

  useEffect(() => {
    loadWishlist();
  }, []);

  function removeItem(productId: string) {
    startTransition(async () => {
      try {
        const nextWishlist = await removeWishlistItem(productId);
        setWishlist(nextWishlist);
        setMessage("Removed from wishlist.");
        setIsError(false);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not remove this item.");
        setIsError(true);
      }
    });
  }

  function subscribeForStock(productId: string) {
    startTransition(async () => {
      try {
        await subscribeBackInStockAlert({ productId });
        setMessage("We will notify you when this product is back in stock.");
        setIsError(false);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not create this stock alert.");
        setIsError(true);
      }
    });
  }

  function moveToCart(productId: string) {
    startTransition(async () => {
      try {
        const nextWishlist = await moveWishlistItemToCart(productId);
        setWishlist(nextWishlist);
        setMessage("Moved to cart. You can complete checkout from your cart.");
        setIsError(false);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not move this item to cart.");
        setIsError(true);
      }
    });
  }

  const items = wishlist?.items ?? [];
  const availableCount = items.filter((item) => !item.isSoldOut).length;
  const soldOutCount = items.filter((item) => item.isSoldOut).length;

  return (
    <main className="min-h-screen bg-[#f6f3ec] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="mx-auto max-w-7xl">
        <div className="mb-8 overflow-hidden rounded-[2rem] border border-black/8 bg-white shadow-[0_18px_50px_rgba(28,34,31,.06)]">
          <div className="grid gap-6 p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="section-kicker">Saved products</p>
              <h1 className="mt-3 font-serif text-4xl font-bold leading-none tracking-[-.05em] text-[var(--ink)] sm:text-6xl">Your wishlist</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">Keep the UK-used items you like in one place, then move available products straight into your cart when you are ready.</p>
            </div>
            <div className="grid grid-cols-3 gap-3 sm:min-w-[28rem]">
              <div className="rounded-3xl bg-[#fbfaf6] p-4 text-center">
                <p className="text-2xl font-black text-[var(--ink)]">{wishlist ? items.length : "-"}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-[.12em] text-[var(--muted)]">Saved</p>
              </div>
              <div className="rounded-3xl bg-[#fff3e8] p-4 text-center">
                <p className="text-2xl font-black text-[var(--accent-dark)]">{wishlist ? availableCount : "-"}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-[.12em] text-[var(--muted)]">Available</p>
              </div>
              <div className="rounded-3xl bg-white p-4 text-center text-[var(--ink)]">
                <p className="text-2xl font-black">{wishlist ? soldOutCount : "-"}</p>
                <p className="mt-1 text-xs font-black uppercase tracking-[.12em] text-[var(--muted)]">Sold out</p>
              </div>
            </div>
          </div>
        </div>

        {message ? (
          <div className={`mb-6 rounded-2xl border p-4 text-sm font-bold ${isError ? "border-[var(--accent)]/30 bg-[#fff8ed] text-[var(--accent-dark)]" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>
            <div className="flex items-start gap-3">
              {isError ? <AlertTriangle className="mt-.5 size-5 shrink-0" /> : <Heart className="mt-.5 size-5 shrink-0" />}
              <span>{message}</span>
            </div>
          </div>
        ) : null}

        {!wishlist ? (
          <div className="rounded-[2rem] border border-black/8 bg-white p-8 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
            <div className="h-56 animate-pulse rounded-[1.5rem] bg-[#ede8de]" />
          </div>
        ) : null}

        {wishlist?.items?.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-black/15 bg-white p-10 text-center shadow-[0_18px_50px_rgba(28,34,31,.04)]">
            <div className="mx-auto grid size-16 place-items-center rounded-3xl bg-[#fff3e8] text-[var(--accent-dark)]">
              <PackageOpen className="size-8" />
            </div>
            <h2 className="mt-6 font-serif text-4xl font-bold tracking-[-.04em] text-[var(--ink)]">No saved products yet.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">Browse the store and tap the wishlist icon on any product you want to compare or buy later.</p>
            <a href="/shop" className="cta-primary mx-auto mt-7 w-fit">Browse products <ArrowRight className="size-4" /></a>
          </div>
        ) : null}

        {wishlist?.items?.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {wishlist.items.map((item) => (
              <article key={item.productId} className="group overflow-hidden rounded-[2rem] border border-black/8 bg-white shadow-[0_18px_50px_rgba(28,34,31,.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(28,34,31,.1)]">
                <a href={`/product/${item.slug}`} className="block overflow-hidden bg-[#e9e8e2]">
                  <div className="relative aspect-[4/3]">
                    <img src={itemImage(item)} alt={`${item.name} wishlist product`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                    <span className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-[var(--ink)] shadow-sm">{item.condition ?? "UK-used"}</span>
                    <span className={`absolute bottom-4 left-4 rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.08em] shadow-sm ${item.isSoldOut ? "bg-[#fff3e8] text-[var(--accent-dark)]" : "bg-[#fff3e8] text-[var(--accent-dark)]"}`}>{item.isSoldOut ? "Sold out" : "Available"}</span>
                  </div>
                </a>
                <div className="p-5">
                  <h2 className="text-xl font-black tracking-[-0.03em] text-[var(--ink)]"><a href={`/product/${item.slug}`}>{item.name}</a></h2>
                  <p className="mt-2 min-h-12 text-sm leading-6 text-[var(--muted)]">{item.visibleDefects || "Condition details are available on the product page."}</p>
                  <div className="mt-5 flex items-baseline gap-2"><span className="text-2xl font-black text-[var(--ink)]">{formatNaira(item.priceKobo)}</span>{item.previousPriceKobo ? <span className="text-sm text-[var(--muted)] line-through">{formatNaira(item.previousPriceKobo)}</span> : null}</div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {item.isSoldOut ? <button disabled={isPending} type="button" className="cta-primary justify-center disabled:cursor-not-allowed disabled:opacity-50" onClick={() => subscribeForStock(item.productId)}><Bell className="size-4" /> Notify me</button> : <button disabled={isPending} type="button" className="cta-primary justify-center disabled:cursor-not-allowed disabled:opacity-50" onClick={() => moveToCart(item.productId)}><ShoppingBag className="size-4" /> Move to cart</button>}
                    <button disabled={isPending} type="button" className="cta-outline justify-center disabled:cursor-not-allowed disabled:opacity-50" onClick={() => removeItem(item.productId)}><Trash2 className="size-4" /> Remove</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </section>
    </main>
  );
}