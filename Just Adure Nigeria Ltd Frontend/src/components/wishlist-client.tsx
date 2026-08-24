"use client";

import { useEffect, useState, useTransition } from "react";
import { Heart, ShoppingBag, Trash2 } from "lucide-react";
import { getWishlist, moveWishlistItemToCart, removeWishlistItem, subscribeBackInStockAlert } from "@/lib/api.js";
import { formatNaira } from "@/lib/utils.js";

function itemImage(item) {
  return item.image?.secureUrl ?? "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85";
}

export function WishlistClient() {
  const [wishlist, setWishlist] = useState(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function loadWishlist() {
    getWishlist()
      .then((data) => {
        setWishlist(data);
        setMessage("");
      })
      .catch((error) => {
        setWishlist({ itemCount: 0, items: [] });
        setMessage(error instanceof Error ? error.message : "Please log in to view your wishlist.");
      });
  }

  useEffect(() => {
    loadWishlist();
  }, []);

  function removeItem(productId) {
    startTransition(async () => {
      try {
        const nextWishlist = await removeWishlistItem(productId);
        setWishlist(nextWishlist);
        setMessage("Removed from wishlist.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not remove this item.");
      }
    });
  }

  function subscribeForStock(productId) {
    startTransition(async () => {
      try {
        await subscribeBackInStockAlert({ productId });
        setMessage("We will notify you when this product is back in stock.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not create this stock alert.");
      }
    });
  }
  function moveToCart(productId) {
    startTransition(async () => {
      try {
        const nextWishlist = await moveWishlistItemToCart(productId);
        setWishlist(nextWishlist);
        setMessage("Moved to cart. You can complete checkout from your cart.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not move this item to cart.");
      }
    });
  }

  return (
    <main className="min-h-screen">
      <section className="hero-grid border-b border-black/8">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="section-kicker">Customer wishlist</p>
          <h1 className="mt-5 font-serif text-5xl font-bold leading-none tracking-[-.06em] sm:text-7xl">Saved products, ready when you are.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">Keep an eye on UK-used products you like, then move available items into your cart when you are ready to pay.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {message ? <p className="mb-6 rounded-2xl border border-black/8 bg-white p-4 text-sm font-bold text-[var(--accent-dark)]">{message}</p> : null}
        {!wishlist ? <p className="rounded-[1.5rem] bg-white p-6 font-bold">Loading wishlist...</p> : null}
        {wishlist?.items?.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-black/15 bg-white p-10 text-center">
            <Heart className="mx-auto size-10 text-[var(--accent-dark)]" />
            <h2 className="mt-5 font-serif text-4xl font-bold tracking-[-.04em]">Your wishlist is empty.</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">Browse products and save the items you may want to buy later.</p>
            <a href="/shop" className="cta-primary mx-auto mt-6 w-fit">Browse products</a>
          </div>
        ) : null}
        {wishlist?.items?.length ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {wishlist.items.map((item) => (
              <article key={item.productId} className="overflow-hidden rounded-[1.5rem] border border-black/8 bg-white shadow-[0_18px_50px_rgba(28,34,31,.06)]">
                <a href={`/product/${item.slug}`} className="block overflow-hidden bg-[#e9e8e2]">
                  <div className="relative aspect-[4/3]">
                    <img src={itemImage(item)} alt={`${item.name} wishlist product`} className="h-full w-full object-cover" />
                    <span className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-[var(--ink)]">{item.condition}</span>
                    {item.isSoldOut ? <span className="absolute bottom-4 left-4 rounded-full bg-[var(--ink)] px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-white">Sold out</span> : null}
                  </div>
                </a>
                <div className="p-5">
                  <h2 className="text-lg font-black tracking-[-0.025em]"><a href={`/product/${item.slug}`}>{item.name}</a></h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{item.visibleDefects}</p>
                  <div className="mt-5 flex items-baseline gap-2"><span className="text-xl font-black">{formatNaira(item.priceKobo)}</span>{item.previousPriceKobo ? <span className="text-sm text-[var(--muted)] line-through">{formatNaira(item.previousPriceKobo)}</span> : null}</div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    {item.isSoldOut ? <button disabled={isPending} type="button" className="cta-primary justify-center" onClick={() => subscribeForStock(item.productId)}><Heart className="size-4" /> Notify me</button> : <button disabled={isPending} type="button" className="cta-primary justify-center disabled:cursor-not-allowed disabled:opacity-50" onClick={() => moveToCart(item.productId)}><ShoppingBag className="size-4" /> Move to cart</button>}
                    <button disabled={isPending} type="button" className="cta-outline justify-center" onClick={() => removeItem(item.productId)}><Trash2 className="size-4" /> Remove</button>
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