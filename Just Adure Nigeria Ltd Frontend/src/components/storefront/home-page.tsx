"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Bike,
  Camera,
  CreditCard,
  Headphones,
  Home,
  Laptop,
  MapPin,
  Monitor,
  PackageCheck,
  Refrigerator,
  ShieldCheck,
  Sparkles,
  Truck,
  Tv,
  Warehouse,
  WashingMachine,
} from "lucide-react";
import { ProductCard } from "@/components/storefront/product-card";
import { TrustCard } from "@/components/storefront/trust-card";
import { getHomepage } from "@/lib/api.js";
import { fallbackImage, productToCard } from "@/lib/product-card-mapper";

const fallbackProducts = [
  {
    name: "Apple Desktop Computer",
    slug: "apple-desktop-computer-uk-used",
    priceKobo: 52000000,
    previousPriceKobo: 56000000,
    condition: "Excellent",
    imageUrl: fallbackImage,
    defectNote: "Display, ports and power checked before listing.",
    isSoldOut: false,
  },
  {
    name: "Big Standing Fridge and Freezer",
    slug: "big-standing-fridge-and-freezer-uk-used",
    priceKobo: 42000000,
    condition: "Good",
    imageUrl: fallbackImage,
    defectNote: "Cooling, thermostat, seals and compressor tested.",
    isSoldOut: false,
  },
  {
    name: "2/3 Seater Leather Chair",
    slug: "two-three-seater-leather-chair-uk-used",
    priceKobo: 32000000,
    condition: "Excellent",
    imageUrl: fallbackImage,
    defectNote: "Leather surface, seat support and frame inspected.",
    isSoldOut: false,
  },
];

const fallbackCategories = [
  { name: "Computers", slug: "computers", description: "Desktop computers and monitors tested for work, study and office use." },
  { name: "Home Appliances", slug: "home-appliances", description: "Fridges, freezers, washers, dryers and kitchen appliances checked before sale." },
  { name: "Televisions", slug: "televisions", description: "UK-used plasma TVs and entertainment items with clear condition notes." },
  { name: "Furniture", slug: "furniture", description: "Leather chairs and home pieces inspected for strength, comfort and finish." },
];

const quickDepartments = [
  { name: "Computers", href: "/category/computers", icon: Laptop },
  { name: "TVs & DVD", href: "/category/televisions", icon: Tv },
  { name: "Appliances", href: "/category/home-appliances", icon: Refrigerator },
  { name: "Washers", href: "/shop?q=washing", icon: WashingMachine },
  { name: "Furniture", href: "/category/furniture", icon: Home },
  { name: "Bicycles", href: "/shop?q=bicycle", icon: Bike },
  { name: "Monitors", href: "/shop?q=monitor", icon: Monitor },
];

const conditionNotes = ["Like New", "Excellent", "Very Good", "Good", "Fair"];

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
  const heroImage = primaryBanner?.imageUrl || products[0]?.imageUrl || fallbackImage;

  return (
    <main className="overflow-hidden bg-[#ededed]">
      <section className="py-5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[1.35rem] bg-[linear-gradient(135deg,#ff8b2d_0%,#f46d1f_42%,#1d241f_100%)] shadow-[0_22px_70px_rgba(28,34,31,.18)]">
            <div className="absolute right-[4%] top-[-8rem] h-[32rem] w-[32rem] rounded-full bg-white/18" aria-hidden="true" />
            <div className="absolute bottom-[-9rem] right-[18%] h-[24rem] w-[24rem] rounded-full bg-black/18" aria-hidden="true" />
            <div className="relative grid min-h-[25rem] items-center gap-8 p-7 text-white sm:p-10 lg:grid-cols-[.9fr_1.1fr] lg:p-12">
              <div className="relative z-10 animate-rise">
                <p className="text-sm font-black uppercase tracking-[.16em] text-white/85"><Sparkles className="mr-2 inline size-4" /> Just Adure stock festival</p>
                <h1 className="mt-4 max-w-xl font-serif text-5xl font-bold leading-[.92] tracking-[-.06em] sm:text-7xl">
                  {primaryBanner?.title ?? "UK-used deals for homes, offices and shops."}
                </h1>
                <p className="mt-5 max-w-lg text-lg leading-8 text-white/82">
                  {primaryBanner?.subtitle ?? "Computers, appliances, TVs, furniture and bicycles with honest condition notes and secure naira checkout."}
                </p>
                <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                  <a href={primaryBanner?.href || "/shop"} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 font-black text-[var(--ink)] hover:bg-[#fff3e7]">Discover deals <ArrowRight className="size-4" /></a>
                  <a href="/order-tracking" className="inline-flex min-h-12 items-center justify-center rounded-full border border-white/35 px-6 font-black text-white hover:bg-white hover:text-[var(--ink)]">Track order</a>
                </div>
              </div>

              <div className="relative z-10 hidden min-h-[22rem] items-end justify-end lg:flex">
                <div className="absolute right-0 top-1/2 h-56 w-[34rem] -translate-y-1/2 rotate-[-8deg] rounded-[3rem] bg-white/18" aria-hidden="true" />
                <img src={heroImage} alt="Featured UK-used product" className="relative h-[21rem] w-[34rem] rounded-[1.15rem] object-cover shadow-[0_30px_80px_rgba(0,0,0,.22)]" />
                <div className="absolute bottom-8 left-8 rounded-full bg-white px-5 py-3 text-sm font-black text-[var(--ink)] shadow-xl">Quality checked</div>
                <div className="absolute right-8 top-7 rounded-full bg-[var(--ink)] px-5 py-3 text-sm font-black text-white shadow-xl">Paystack ready</div>
              </div>
            </div>
            <div className="relative flex justify-center gap-2 pb-4">
              {[0, 1, 2, 3, 4, 5].map((item) => <span key={item} className={`size-2 rounded-full ${item === 0 ? "w-8 bg-white" : "bg-white/55"}`} />)}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="grid gap-3 rounded-[1.25rem] bg-white p-4 shadow-[0_14px_40px_rgba(28,34,31,.04)] sm:grid-cols-2 lg:grid-cols-7">
          {quickDepartments.map(({ name, href, icon: Icon }) => (
            <a key={name} href={href} className="flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-black hover:bg-[#f6f3ec]"><Icon className="size-5 text-[var(--accent-dark)]" /> {name}</a>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <a href="/delivery-information" className="flex items-center gap-4 rounded-[1.25rem] border border-black/8 bg-white p-5 shadow-[0_14px_40px_rgba(28,34,31,.04)]"><Truck className="size-7 text-[var(--accent-dark)]" /><span><strong className="block">Delivery across Nigeria</strong><small className="text-[var(--muted)]">Fees calculated by location.</small></span></a>
          <a href="/order-tracking" className="flex items-center gap-4 rounded-[1.25rem] border border-black/8 bg-white p-5 shadow-[0_14px_40px_rgba(28,34,31,.04)]"><PackageCheck className="size-7 text-[var(--accent-dark)]" /><span><strong className="block">Track your order</strong><small className="text-[var(--muted)]">Follow payment and delivery status.</small></span></a>
          <a href="/contact" className="flex items-center gap-4 rounded-[1.25rem] border border-black/8 bg-white p-5 shadow-[0_14px_40px_rgba(28,34,31,.04)]"><Headphones className="size-7 text-[var(--accent-dark)]" /><span><strong className="block">Ask before buying</strong><small className="text-[var(--muted)]">Support for product enquiries.</small></span></a>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-[1.75rem] border border-black/8 bg-white p-5 shadow-[0_18px_60px_rgba(28,34,31,.06)] sm:p-7">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-kicker">Featured stock</p>
              <h2 className="section-title">Deals worth checking today.</h2>
            </div>
            <a href="/shop" className="cta-outline w-fit">See all products <ArrowRight className="size-4" /></a>
          </div>
          <div className="mt-7 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.slice(0, 3).map((product) => <ProductCard key={product.slug} product={product} />)}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Popular categories</p>
            <h2 className="section-title">Shop by what you need.</h2>
          </div>
          <a href="/shop" className="cta-outline w-fit">Browse catalogue</a>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.slice(0, 4).map((category) => (
            <a key={category.slug} href={`/category/${category.slug}`} className="group rounded-[1.5rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.05)] transition hover:-translate-y-1">
              <PackageCheck className="size-7 text-[var(--accent-dark)]" />
              <h3 className="mt-5 text-2xl font-black tracking-[-.04em]">{category.name}</h3>
              <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{category.description || "Browse verified UK-used products in this category."}</p>
            </a>
          ))}
        </div>
      </section>

      <section className="bg-[var(--ink)] py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
          <div>
            <p className="section-kicker text-[var(--accent)]">Condition-first shopping</p>
            <h2 className="mt-3 font-serif text-5xl font-bold leading-[.95] tracking-[-.055em]">No hidden story after delivery.</h2>
            <p className="mt-5 max-w-xl leading-8 text-white/68">UK-used products need honesty. The store is structured to show the exact grade, visible faults, included accessories, testing status and warranty before the customer pays.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-5 lg:items-end">
            {conditionNotes.map((condition, index) => (
              <div key={condition} className="rounded-[1.25rem] border border-white/10 bg-white/8 p-4" style={{ minHeight: `${8 + index * 1.2}rem` }}>
                <p className="text-xs font-black uppercase tracking-[.14em] text-[var(--accent)]">Grade {index + 1}</p>
                <p className="mt-3 text-xl font-black tracking-[-.04em]">{condition}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <TrustCard tone="light" icon={BadgeCheck} title="Honest grading" description="Every item carries a condition grade and plain-language inspection note." />
          <TrustCard tone="light" icon={Camera} title="Real images ready" description="Admins can upload actual product photos and mark the primary image." />
          <TrustCard tone="light" icon={CreditCard} title="Secure payments" description="Paystack secret keys stay on the backend and payment totals are verified server-side." />
          <TrustCard tone="light" icon={ShieldCheck} title="Stock protected" description="Inventory reservation helps stop one-off products from being sold twice." />
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[2.25rem] bg-[#ebe1cf] p-8 shadow-[0_28px_90px_rgba(28,34,31,.12)] lg:p-12">
          <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <p className="section-kicker"><Warehouse className="size-4" /> Built for real ecommerce operations</p>
              <h2 className="mt-3 max-w-3xl font-serif text-5xl font-bold leading-[.95] tracking-[-.055em]">Products, payment, delivery and support working together.</h2>
              <p className="mt-4 max-w-2xl leading-7 text-[var(--muted)]">Customers can browse products, ask questions, pay securely, track orders and receive updates. Admins can manage catalogue, stock, delivery zones and reports from the dashboard.</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <a href="/contact" className="cta-primary">Contact support</a>
              <a href="/delivery-information" className="cta-outline"><MapPin className="size-4" /> Delivery info</a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
