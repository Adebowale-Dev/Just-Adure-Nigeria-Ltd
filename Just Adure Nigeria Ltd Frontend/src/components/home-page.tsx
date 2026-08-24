"use client";

import { useEffect, useState } from "react";
import { ArrowRight, BadgeCheck, Camera, CreditCard, PackageCheck, ShieldCheck, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/product-card";
import { TrustCard } from "@/components/trust-card";
import { getHomepage } from "@/lib/api.js";
import { fallbackImage, productToCard } from "@/lib/product-card-mapper";

const fallbackProducts = [
  {
    name: "UK-used iPhone 13 Pro",
    slug: "iphone-13-pro-uk-used",
    priceKobo: 58500000,
    previousPriceKobo: 63500000,
    condition: "Excellent",
    imageUrl: fallbackImage,
    defectNote: "Minor frame marks, Face ID tested, battery health disclosed.",
    isSoldOut: false,
  },
  {
    name: "Dell Latitude 7420",
    slug: "dell-latitude-7420",
    priceKobo: 42000000,
    condition: "Very Good",
    imageUrl: fallbackImage,
    defectNote: "Keyboard, webcam and ports tested before listing.",
    isSoldOut: false,
  },
  {
    name: "Samsung Galaxy S22 Ultra",
    slug: "samsung-galaxy-s22-ultra",
    priceKobo: 51000000,
    condition: "Good",
    imageUrl: fallbackImage,
    defectNote: "Visible back-cover scratches clearly shown in product photos.",
    isSoldOut: false,
  },
];

const fallbackCategories = [
  { name: "Phones", slug: "phones", description: "UK-used smartphones with clear condition grades." },
  { name: "Laptops", slug: "laptops", description: "Business laptops tested for work, school and travel." },
  { name: "Tablets", slug: "tablets", description: "Portable devices with warranty and accessories listed." },
];

export function HomePage() {
  const [homepage, setHomepage] = useState(null);
  const [products, setProducts] = useState(fallbackProducts);
  const [categories, setCategories] = useState(fallbackCategories);

  useEffect(() => {
    getHomepage()
      .then((data) => {
        setHomepage(data);
        if (data?.featuredProducts?.length) setProducts(data.featuredProducts.map(productToCard));
        if (data?.categories?.length) setCategories(data.categories);
      })
      .catch(() => {
        setHomepage(null);
      });
  }, []);

  const primaryBanner = homepage?.content?.banners?.find((banner) => banner.isActive) ?? null;

  return (
    <main>
      <section className="hero-grid relative overflow-hidden border-b border-black/8">
        <div className="mx-auto grid min-h-[43rem] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_.85fr] lg:px-8">
          <div className="relative z-10 max-w-3xl animate-rise">
            <p className="section-kicker">UK-used products, honestly graded</p>
            <h1 className="mt-6 font-serif text-6xl font-bold leading-none tracking-[-.065em] text-[var(--ink)] sm:text-8xl">
              {primaryBanner?.title ?? "Buy trusted UK-used gadgets in Nigeria."}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">
              {primaryBanner?.subtitle ?? "Shop phones, laptops and accessories with real condition notes, verified stock, Paystack checkout and Nigerian naira pricing."}
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <a href={primaryBanner?.href || "/shop"} className="cta-primary">
                Start shopping <ArrowRight className="size-4" />
              </a>
              <a href="/order-tracking" className="cta-outline">Track an order</a>
            </div>
          </div>

          <div className="relative rounded-[2.5rem] border border-black/8 bg-white/72 p-4 shadow-[0_30px_90px_rgba(28,34,31,.12)]">
            <div className="overflow-hidden rounded-[2rem] bg-[#e9e8e2]">
              <img src={primaryBanner?.imageUrl || fallbackImage} alt="Featured UK-used products" className="h-[32rem] w-full object-cover" />
            </div>
            <div className="absolute -bottom-5 left-8 right-8 rounded-[1.5rem] bg-[var(--ink)] p-5 text-white shadow-xl">
              <p className="flex items-center gap-2 text-sm font-black uppercase tracking-[.12em]"><Sparkles className="size-4 text-[var(--accent)]" /> Launch-ready promise</p>
              <p className="mt-2 text-sm leading-6 text-white/70">Prices, stock and payment totals are verified by the backend before Paystack payment starts.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Featured products</p>
            <h2 className="mt-3 font-serif text-5xl font-bold tracking-[-.055em]">Inspected before display.</h2>
          </div>
          <a href="/shop" className="cta-outline w-fit">View all products</a>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => <ProductCard key={product.slug} product={product} />)}
        </div>
      </section>

      <section className="bg-[var(--ink)] py-16 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="section-kicker text-[var(--accent)]">Why customers trust us</p>
          <h2 className="mt-3 max-w-3xl font-serif text-5xl font-bold tracking-[-.055em]">Every UK-used item tells the truth before checkout.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            <TrustCard icon={BadgeCheck} title="Clear condition" description="Like New, Excellent, Very Good, Good or Fair is displayed before purchase." />
            <TrustCard icon={Camera} title="Actual images" description="Admins can upload real product photos, visible defects and accessories." />
            <TrustCard icon={CreditCard} title="Paystack protected" description="Payment is initialized and verified only by the backend." />
            <TrustCard icon={ShieldCheck} title="Warranty noted" description="Warranty and return eligibility are shown clearly per product." />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Popular categories</p>
            <h2 className="mt-3 font-serif text-5xl font-bold tracking-[-.055em]">Find your next device.</h2>
          </div>
        </div>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {categories.map((category) => (
            <a key={category.slug} href={`/category/${category.slug}`} className="group rounded-[1.5rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.05)] transition hover:-translate-y-1">
              <PackageCheck className="size-7 text-[var(--accent-dark)]" />
              <h3 className="mt-5 text-2xl font-black tracking-[-.04em]">{category.name}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{category.description || "Browse verified UK-used products in this category."}</p>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
}