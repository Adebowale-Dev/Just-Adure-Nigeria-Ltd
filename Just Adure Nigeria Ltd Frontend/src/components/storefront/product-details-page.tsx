"use client";

import { useEffect, useState, useTransition } from "react";
import { ArrowLeft, BadgeCheck, Boxes, Heart, PackageCheck, ShieldCheck, Star } from "lucide-react";
import { AddToCartButton } from "@/components/commerce/add-to-cart-button";
import { NotFoundPage } from "@/components/storefront/not-found-page";
import { ProductEnquiryForm } from "@/components/storefront/product-enquiry-form";
import { ProductReviewForm } from "@/components/storefront/product-review-form";
import { addWishlistItem, getProduct } from "@/lib/api.js";
import { fallbackImage } from "@/lib/product-card-mapper";
import { formatNaira } from "@/lib/utils.js";

export function ProductDetailsPage({ slug }) {
  const [product, setProduct] = useState(null);
  const [missing, setMissing] = useState(false);
  const [wishlistMessage, setWishlistMessage] = useState("");
  const [isWishlistPending, startWishlistTransition] = useTransition();

  useEffect(() => {
    getProduct(slug).then(setProduct).catch(() => setMissing(true));
  }, [slug]);

  function handleReviewSubmitted() {
    getProduct(slug).then(setProduct).catch(() => undefined);
  }

  if (missing) return <NotFoundPage />;
  if (!product) return <main className="mx-auto max-w-7xl px-4 py-16 font-black sm:px-6 lg:px-8">Loading product...</main>;

  const image = product.primaryImage?.secureUrl ?? product.images?.[0]?.secureUrl ?? fallbackImage;

  return (
    <main className="min-h-screen">
      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_.9fr] lg:px-8 lg:py-16">
        <div>
          <a href="/shop" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[var(--accent-dark)]"><ArrowLeft className="size-4" /> Back to shop</a>
          <div className="overflow-hidden rounded-2xl border border-black/8 bg-[#e9e8e2]">
            <div className="relative aspect-[4/3]">
              <img src={image} alt={`${product.name} actual product`} className="h-full w-full object-cover" onError={(event) => { event.currentTarget.src = fallbackImage; }} />
              <span className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[.12em] text-[var(--ink)]">{product.productType === "brand_new" ? "Brand New" : "Used"}</span>
            </div>
          </div>
        </div>

        <div className="lg:pt-10">
          <p className="section-kicker">{product.brand?.name ?? "Verified product"}</p>
          <h1 className="mt-4 text-4xl font-black leading-tight tracking-[-.045em] sm:text-5xl">{product.name}</h1>
          <p className="mt-5 text-lg leading-8 text-[var(--muted)]">{product.shortDescription}</p>
          <div className="mt-7 flex flex-wrap items-baseline gap-3">
            <span className="text-3xl font-black text-[var(--ink)]">{formatNaira(product.priceKobo)}</span>
            {product.previousPriceKobo ? <span className="text-lg text-[var(--muted)] line-through">{formatNaira(product.previousPriceKobo)}</span> : null}
          </div>
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-black/8 bg-white/70 p-4"><Boxes className="mb-2 size-5 text-[var(--accent-dark)]" /><p className="text-xs font-black uppercase tracking-[.12em]">Availability</p><p className="mt-1 font-bold">{product.availableQuantity} available</p></div>
            <div className="rounded-2xl border border-black/8 bg-white/70 p-4"><ShieldCheck className="mb-2 size-5 text-[var(--accent-dark)]" /><p className="text-xs font-black uppercase tracking-[.12em]">Warranty</p><p className="mt-1 font-bold">{product.warrantyInformation ?? "Ask support"}</p></div>
            <div className="rounded-2xl border border-black/8 bg-white/70 p-4"><BadgeCheck className="mb-2 size-5 text-[var(--accent-dark)]" /><p className="text-xs font-black uppercase tracking-[.12em]">Known defects</p><p className="mt-1 font-bold">{product.visibleDefects ?? "No major defect listed"}</p></div>
            <div className="rounded-2xl border border-black/8 bg-white/70 p-4"><PackageCheck className="mb-2 size-5 text-[var(--accent-dark)]" /><p className="text-xs font-black uppercase tracking-[.12em]">Accessories</p><p className="mt-1 font-bold">{product.includedAccessories ?? "See product note"}</p></div>
          </div>
          <AddToCartButton productId={product.id} disabled={product.isSoldOut} />
          <button disabled={product.isSoldOut || isWishlistPending} className="cta-outline mt-3 w-full justify-center disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={() => startWishlistTransition(async () => { try { await addWishlistItem({ productId: product.id }); setWishlistMessage("Saved to wishlist. You can view it from the wishlist page."); } catch (error) { setWishlistMessage(error instanceof Error ? error.message : "Could not save this product to wishlist."); } })}><Heart className="size-4" /> {isWishlistPending ? "Saving..." : "Add to wishlist"}</button>
          {wishlistMessage ? <p className="mt-3 text-center text-sm font-bold text-[var(--accent-dark)]">{wishlistMessage}</p> : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <ProductEnquiryForm product={product} />
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="surface-card p-6 sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div><p className="section-kicker">Customer reviews</p><h2 className="mt-2 text-3xl font-black tracking-[-.04em]">What buyers are saying</h2></div>
            <div className="inline-flex w-fit items-center gap-2 rounded-full bg-[#fff8ed] px-4 py-2 text-sm font-black text-[var(--ink)]"><Star className="size-4 fill-[var(--accent)] text-[var(--accent)]" />{product.reviewSummary?.reviewCount ? `${product.reviewSummary.averageRating.toFixed(1)} from ${product.reviewSummary.reviewCount} review${product.reviewSummary.reviewCount === 1 ? "" : "s"}` : "No reviews yet"}</div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {product.reviews?.length ? product.reviews.map((review) => <article key={review.id} className="rounded-2xl border border-black/8 bg-[#fbfaf6] p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-black">{review.title}</p><p className="mt-1 text-sm font-bold text-[var(--accent-dark)]">{review.customerName}{review.isVerifiedPurchase ? " | Verified purchase" : ""}</p></div><div className="flex gap-1 text-[var(--accent-dark)]">{Array.from({ length: review.rating }).map((_, index) => <Star key={index} className="size-4 fill-[var(--accent)] text-[var(--accent)]" />)}</div></div><p className="mt-4 text-sm leading-6 text-[var(--muted)]">{review.comment}</p>{review.adminReply ? <p className="mt-4 rounded-xl bg-white p-3 text-sm font-bold text-[var(--ink)]">Store reply: {review.adminReply}</p> : null}</article>) : <p className="rounded-2xl border border-dashed border-black/15 p-5 text-sm font-bold text-[var(--muted)]">No approved reviews yet. Verified buyers will appear here after moderation.</p>}
          </div>
          <ProductReviewForm productId={product.id} onSubmitted={handleReviewSubmitted} />
        </div>
      </section>

    </main>
  );
}



