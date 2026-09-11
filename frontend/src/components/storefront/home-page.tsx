"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Bike, Home, Laptop, Monitor, PackageCheck, Refrigerator, Tv, WashingMachine } from "lucide-react";
import { ProductCard } from "@/components/storefront/product-card";
import { getHomepage } from "@/lib/api.js";
import { fallbackImage, productToCard } from "@/lib/product-card-mapper";

const fallbackProducts = [
  { name: "Apple Desktop Computer", slug: "apple-desktop-computer-uk-used", priceKobo: 52000000, previousPriceKobo: 56000000, condition: "Used", imageUrl: fallbackImage, defectNote: "Display, ports and power checked before listing.", isSoldOut: false },
  { name: "Big Standing Fridge and Freezer", slug: "big-standing-fridge-and-freezer-uk-used", priceKobo: 42000000, condition: "Used", imageUrl: fallbackImage, defectNote: "Cooling, thermostat, seals and compressor tested.", isSoldOut: false },
  { name: "2/3 Seater Leather Chair", slug: "two-three-seater-leather-chair-uk-used", priceKobo: 32000000, condition: "Used", imageUrl: fallbackImage, defectNote: "Leather surface, seat support and frame inspected.", isSoldOut: false },
];

const fallbackCategories = [
  { name: "Computers", slug: "computers", description: "Desktops and monitors for work, study, and business." },
  { name: "Home Appliances", slug: "home-appliances", description: "Fridges, freezers, washers, dryers, and kitchen appliances." },
  { name: "Televisions", slug: "televisions", description: "Televisions and entertainment equipment with clear condition notes." },
  { name: "Furniture", slug: "furniture", description: "Practical home and office furniture inspected before sale." },
];

const departments = [
  { name: "Computers", href: "/category/computers", icon: Laptop },
  { name: "TVs & DVD", href: "/category/televisions", icon: Tv },
  { name: "Appliances", href: "/category/home-appliances", icon: Refrigerator },
  { name: "Washers", href: "/shop?q=washing", icon: WashingMachine },
  { name: "Furniture", href: "/category/furniture", icon: Home },
  { name: "Bicycles", href: "/shop?q=bicycle", icon: Bike },
  { name: "Monitors", href: "/shop?q=monitor", icon: Monitor },
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
      .catch(() => setHomepage(null));
  }, []);

  const primaryBanner = homepage?.content?.banners?.find((banner) => banner.isActive) ?? null;
  const heroProduct = products.find((product) => product.imageUrl !== fallbackImage) ?? products[0];
  const heroImage = primaryBanner?.imageUrl || heroProduct?.imageUrl || fallbackImage;

  return (
    <main className="landing-page bg-[#f8f7f3] text-[var(--ink)]">
      <section className="min-h-[calc(100svh-7.0625rem)] border-b border-black/8 bg-white sm:min-h-[calc(100svh-8.0625rem)]">
        <div className="mx-auto grid min-h-[calc(100svh-7.0625rem)] max-w-7xl gap-10 px-4 py-10 sm:min-h-[calc(100svh-8.0625rem)] sm:px-6 lg:grid-cols-[1fr_.9fr] lg:items-center lg:px-8 lg:py-12">
          <div>
            <h1 className="landing-display max-w-2xl text-5xl font-bold leading-[.98] tracking-[-.055em] sm:text-6xl lg:text-7xl">{primaryBanner?.title || "Good products. Honest condition. Fair prices."}</h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--muted)]">{primaryBanner?.subtitle || "Shop computers, appliances, televisions, furniture, and bicycles with clear condition notes before you pay."}</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href={primaryBanner?.href || "/shop"} className="cta-primary px-7">Shop all products <ArrowRight className="size-4" /></a>
              <a href="#departments" className="cta-outline px-7">Browse categories</a>
            </div>
          </div>

          <a href={`/product/${heroProduct?.slug ?? ""}`} className="group relative block overflow-hidden rounded-2xl bg-[#ece9e1]">
            <div className="aspect-[4/3]"><img src={heroImage} alt={heroProduct ? `${heroProduct.name} featured product` : "Featured Just Adure product"} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]" onError={(event) => { event.currentTarget.src = fallbackImage; }} /></div>
            <div className="absolute inset-x-4 bottom-4 flex items-center justify-between gap-4 rounded-xl bg-white/95 p-4 shadow-sm backdrop-blur">
              <span><span className="block text-xs font-black uppercase tracking-[.12em] text-[var(--accent-dark)]">Featured today</span><strong className="mt-1 block">{heroProduct?.name ?? "Browse available stock"}</strong></span>
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[var(--accent)]"><ArrowRight className="size-4" /></span>
            </div>
          </a>
        </div>
      </section>

      <nav className="border-b border-black/8 bg-white" aria-label="Shop departments">
        <div className="department-ticker mx-auto max-w-7xl overflow-hidden py-4">
          <div className="department-ticker-track">
            {[false, true].map((duplicate) => (
              <div key={String(duplicate)} className="department-ticker-group" aria-hidden={duplicate || undefined}>
                {departments.map(({ name, href, icon: Icon }) => <a key={name} href={href} tabIndex={duplicate ? -1 : undefined} className="flex shrink-0 items-center gap-2 rounded-full border border-black/10 bg-white px-4 py-2.5 text-sm font-black hover:border-[var(--accent)] hover:bg-[#fff7ed]"><Icon className="size-4 text-[var(--accent-dark)]" />{name}</a>)}
              </div>
            ))}
          </div>
        </div>
      </nav>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><p className="section-kicker">Available now</p><h2 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">Featured products</h2><p className="mt-2 text-sm text-[var(--muted)]">One-off stock selected from the latest catalogue.</p></div>
          <a href="/shop" className="inline-flex items-center gap-2 text-sm font-black text-[var(--accent-dark)] hover:underline">View all products <ArrowRight className="size-4" /></a>
        </div>
        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{products.slice(0, 6).map((product) => <ProductCard key={product.slug} product={product} />)}</div>
      </section>

      <section id="departments" className="border-y border-black/8 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="section-kicker">Shop by department</p><h2 className="mt-2 text-3xl font-black tracking-[-.04em] sm:text-4xl">Find what you need</h2></div><a href="/shop" className="text-sm font-black text-[var(--accent-dark)] hover:underline">Browse the full catalogue</a></div>
          <div className="mt-8 grid gap-px overflow-hidden rounded-2xl border border-black/8 bg-black/8 sm:grid-cols-2 lg:grid-cols-4">
            {categories.slice(0, 4).map((category) => <a key={category.slug} href={`/category/${category.slug}`} className="group bg-white p-6 hover:bg-[#fffaf5]"><PackageCheck className="size-5 text-[var(--accent-dark)]" /><h3 className="mt-5 text-xl font-black">{category.name}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-[var(--muted)]">{category.description || "Browse inspected products in this department."}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[var(--accent-dark)]">Shop now <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span></a>)}
          </div>
        </div>
      </section>

    </main>
  );
}
