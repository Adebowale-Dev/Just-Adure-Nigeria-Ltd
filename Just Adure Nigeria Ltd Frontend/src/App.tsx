"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowLeft, ArrowRight, BadgeCheck, Boxes, Camera, CreditCard, Filter, PackageCheck, Search, ShieldCheck, Sparkles, Truck } from "lucide-react";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { CartClient } from "@/components/cart-client";
import { CheckoutClient } from "@/components/checkout-client";
import { ProductCard } from "@/components/product-card";
import { SiteHeader } from "@/components/site-header";
import { TrustCard } from "@/components/trust-card";
import { getBrands, getCategories, getConditionGrades, getProduct, getProducts } from "@/lib/api.js";
import { formatNaira } from "@/lib/utils.js";

const fallbackImage = "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85";
const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Just Adure Nigeria Ltd";

function getCurrentPath() { return typeof window === "undefined" ? "/" : `${window.location.pathname}${window.location.search}`; }

function usePath() {
  const [path, setPath] = useState(getCurrentPath);
  useEffect(() => {
    const update = () => setPath(getCurrentPath());
    window.addEventListener("popstate", update);
    return () => window.removeEventListener("popstate", update);
  }, []);
  return path;
}

function productToCard(product) {
  return {
    name: product.name,
    slug: product.slug,
    priceKobo: product.priceKobo,
    previousPriceKobo: product.previousPriceKobo ?? undefined,
    condition: product.conditionGrade?.name ?? "UK-used",
    imageUrl: product.primaryImage?.secureUrl ?? product.images?.[0]?.secureUrl ?? fallbackImage,
    defectNote: product.visibleDefects || "Condition checked and listed honestly.",
    isSoldOut: product.isSoldOut,
  };
}

function HomePage() {
  const featuredProducts = [
    { name: "iPhone 13 Pro 256GB", slug: "iphone-13-pro-256gb", priceKobo: 675_000_00, previousPriceKobo: 715_000_00, condition: "Excellent", imageUrl: "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&w=1200&q=85", defectNote: "Two faint frame marks. Screen is clean." },
    { name: "Dell Latitude 7420", slug: "dell-latitude-7420", priceKobo: 585_000_00, condition: "Good", imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=85", defectNote: "Light lid scratches from normal use." },
    { name: "Samsung 50-inch 4K TV", slug: "samsung-50-inch-crystal-uhd-4k-smart-tv", priceKobo: 445_000_00, previousPriceKobo: 475_000_00, condition: "Excellent", imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1200&q=85", defectNote: "Small rear-casing mark; clean front panel." },
  ];
  const categories = ["Phones", "Laptops", "Televisions", "Game consoles", "Appliances", "Accessories"];

  return <main><section className="hero-grid relative overflow-hidden border-b border-black/8"><div className="mx-auto grid min-h-[43rem] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.04fr_.96fr] lg:px-8 lg:py-24"><div className="relative z-10 max-w-3xl animate-rise"><div className="eyebrow"><Sparkles className="size-4" /> Tested in Nigeria. Sourced from the UK.</div><h1 className="mt-7 max-w-4xl font-serif text-[clamp(3.4rem,8vw,7.4rem)] leading-[0.86] tracking-[-0.065em] text-[var(--ink)]">Pre-owned tech, <span className="text-[var(--accent-dark)]">properly</span> checked.</h1><p className="mt-8 max-w-2xl text-lg leading-8 text-[var(--muted)] sm:text-xl">Actual photos, honest condition notes, and devices tested before they reach your door. No stock-image surprises.</p><div className="mt-9 flex flex-col gap-3 sm:flex-row"><a href="/shop" className="cta-primary">Shop latest arrivals <ArrowRight className="size-4" /></a><a href="/about" className="cta-outline">How we test products</a></div><div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm font-bold text-[var(--ink)]"><span className="inline-flex items-center gap-2"><BadgeCheck className="size-4 text-[var(--accent-dark)]" /> Condition graded</span><span className="inline-flex items-center gap-2"><CreditCard className="size-4 text-[var(--accent-dark)]" /> Paystack secured</span><span className="inline-flex items-center gap-2"><PackageCheck className="size-4 text-[var(--accent-dark)]" /> Delivery tracked</span></div></div><div className="relative mx-auto w-full max-w-xl animate-rise-delayed"><div className="relative rotate-[1.5deg] rounded-[2rem] border border-black/10 bg-[var(--ink)] p-5 shadow-[0_35px_80px_rgba(20,27,25,.25)] sm:p-7"><div className="rounded-[1.4rem] bg-[#dfe3df] p-4 sm:p-6"><div className="flex aspect-[4/3] items-center justify-center rounded-[1rem] bg-[radial-gradient(circle_at_50%_35%,#fff_0,#dfe3df_58%,#bdc5c0_100%)]"><div className="relative h-[78%] w-[43%] rounded-[2.2rem] border-[7px] border-[#232826] bg-[linear-gradient(145deg,#8ac2d5,#30526d_58%,#dcb170)] shadow-[0_24px_35px_rgba(20,27,25,.25)]"><span className="absolute left-1/2 top-2 h-4 w-16 -translate-x-1/2 rounded-full bg-[#232826]" /></div></div></div><div className="mt-5 flex items-end justify-between gap-5 text-white"><div><p className="text-xs font-black uppercase tracking-[.16em] text-[var(--accent)]">Actual unit 001</p><p className="mt-2 text-xl font-black">Excellent condition</p><p className="mt-1 text-sm text-white/55">Every mark disclosed before checkout.</p></div><Camera className="size-7 shrink-0 text-white/45" /></div></div></div></div></section><section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28"><div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="section-kicker">Fresh from the test bench</p><h2 className="section-title">Featured finds</h2></div><a href="/shop" className="inline-flex items-center gap-2 text-sm font-black">View every product <ArrowRight className="size-4" /></a></div><div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">{featuredProducts.map((product) => <ProductCard key={product.slug} product={product} />)}</div></section><section className="border-y border-black/8 bg-white/60"><div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"><p className="section-kicker">Browse your way</p><div className="mt-6 flex flex-wrap gap-3">{categories.map((category, index) => <a key={category} href={`/category/${category.toLowerCase().replace(" ", "-")}`} className="category-pill"><span className="text-xs font-black text-[var(--accent-dark)]">0{index + 1}</span>{category}<ArrowRight className="size-4" /></a>)}</div></div></section><section className="bg-[var(--ink)] text-white"><div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24"><p className="section-kicker text-[var(--accent)]">Buy the exact item you inspected</p><h2 className="mt-4 font-serif text-4xl leading-tight tracking-[-.045em] sm:text-6xl">Trust is in the details.</h2><div className="mt-12 grid gap-4 md:grid-cols-3"><TrustCard icon={Camera} title="Actual-unit photography" description="The photos belong to the listed unit, including the angles that show its real condition." /><TrustCard icon={ShieldCheck} title="Functionally tested" description="Core functions are checked and any limitations are written clearly before you pay." /><TrustCard icon={PackageCheck} title="Protected handover" description="Stock is checked again at checkout and delivery progress remains visible after payment." /></div></div></section></main>;
}

function ShopPage({ defaultCategory = "", defaultQuery = "" }) {
  const [products, setProducts] = useState(null);
  const [filters, setFilters] = useState({ q: defaultQuery, category: defaultCategory, brand: "", condition: "", sort: "newest" });
  const [lookups, setLookups] = useState({ categories: [], brands: [], grades: [] });
  const [errorMessage, setErrorMessage] = useState("");
  useEffect(() => { const params = new URLSearchParams(); Object.entries(filters).forEach(([key, value]) => { if (value) params.set(key, value); }); Promise.all([getProducts(params), getCategories(), getBrands(), getConditionGrades()]).then(([productData, categoryData, brandData, gradeData]) => { setProducts(productData); setLookups({ categories: categoryData, brands: brandData, grades: gradeData }); setErrorMessage(""); }).catch(() => setErrorMessage("The product catalogue is not available yet. Please confirm the backend is running on port 4000.")); }, [filters]);
  const updateFilter = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  return <main className="min-h-screen"><section className="hero-grid border-b border-black/8"><div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><p className="section-kicker">Shop verified UK-used products</p><h1 className="mt-5 font-serif text-5xl font-bold leading-none tracking-[-.06em] sm:text-7xl">Browse the test bench.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">Search by product, brand, SKU, category or model. Every listing shows condition, defects, warranty and real availability.</p></div></section><section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[18rem_1fr] lg:px-8"><aside className="h-fit rounded-[1.5rem] border border-black/8 bg-white/70 p-5 shadow-[0_18px_50px_rgba(28,34,31,.05)]"><div className="flex items-center gap-2 font-black"><Filter className="size-4" /> Filters</div><div className="mt-5 grid gap-4"><label className="grid gap-2 text-sm font-bold">Search<div className="flex rounded-2xl border border-black/10 bg-white px-3 py-2"><Search className="mr-2 size-4 text-[var(--muted)]" /><input name="q" value={filters.q} onChange={updateFilter} className="w-full bg-transparent outline-none" placeholder="iPhone, Dell, SKU..." /></div></label><label className="grid gap-2 text-sm font-bold">Category<select name="category" value={filters.category} onChange={updateFilter} className="rounded-2xl border border-black/10 bg-white px-3 py-3 outline-none"><option value="">All categories</option>{lookups.categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label><label className="grid gap-2 text-sm font-bold">Brand<select name="brand" value={filters.brand} onChange={updateFilter} className="rounded-2xl border border-black/10 bg-white px-3 py-3 outline-none"><option value="">All brands</option>{lookups.brands.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}</select></label><label className="grid gap-2 text-sm font-bold">Condition<select name="condition" value={filters.condition} onChange={updateFilter} className="rounded-2xl border border-black/10 bg-white px-3 py-3 outline-none"><option value="">All conditions</option>{lookups.grades.map((item) => <option key={item.id} value={item.code}>{item.name}</option>)}</select></label><button className="cta-outline" type="button" onClick={() => setFilters({ q: "", category: "", brand: "", condition: "", sort: "newest" })}>Clear filters</button></div></aside><div>{errorMessage ? <div className="rounded-[1.5rem] border border-[var(--accent)]/30 bg-white p-6 text-[var(--ink)]"><AlertTriangle className="mb-3 size-6 text-[var(--accent-dark)]" /><p className="font-black">Catalogue unavailable</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{errorMessage}</p></div> : null}{!products && !errorMessage ? <p className="rounded-[1.5rem] bg-white p-6 font-bold">Loading products...</p> : null}{products ? <><p className="mb-5 text-sm font-bold text-[var(--muted)]">Showing {products.items.length} of {products.meta.totalItems} products</p>{products.items.length > 0 ? <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{products.items.map((product) => <ProductCard key={product.id} product={productToCard(product)} />)}</div> : <div className="rounded-[1.5rem] border border-black/8 bg-white p-8 text-center"><p className="font-black">No products found</p><p className="mt-2 text-sm text-[var(--muted)]">Try another search or remove one filter.</p></div>}</> : null}</div></section></main>;
}

function ProductDetailsPage({ slug }) {
  const [product, setProduct] = useState(null); const [missing, setMissing] = useState(false);
  useEffect(() => { getProduct(slug).then(setProduct).catch(() => setMissing(true)); }, [slug]);
  if (missing) return <NotFoundPage />; if (!product) return <main className="mx-auto max-w-7xl px-4 py-16 font-black sm:px-6 lg:px-8">Loading product...</main>;
  const image = product.primaryImage?.secureUrl ?? product.images?.[0]?.secureUrl ?? fallbackImage;
  return <main className="min-h-screen"><section className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_.9fr] lg:px-8 lg:py-16"><div><a href="/shop" className="mb-5 inline-flex items-center gap-2 text-sm font-black text-[var(--accent-dark)]"><ArrowLeft className="size-4" /> Back to shop</a><div className="overflow-hidden rounded-[2rem] border border-black/8 bg-[#e9e8e2]"><div className="relative aspect-[4/3]"><img src={image} alt={`${product.name} actual product`} className="h-full w-full object-cover" /><span className="absolute left-5 top-5 rounded-full bg-white/90 px-4 py-2 text-xs font-black uppercase tracking-[.12em] text-[var(--ink)]">{product.conditionGrade?.name ?? "UK-used"}</span></div></div></div><div className="lg:pt-10"><p className="section-kicker">{product.brand?.name ?? "Verified product"}</p><h1 className="mt-4 font-serif text-5xl font-bold leading-none tracking-[-.055em] sm:text-6xl">{product.name}</h1><p className="mt-5 text-lg leading-8 text-[var(--muted)]">{product.shortDescription}</p><div className="mt-7 flex flex-wrap items-baseline gap-3"><span className="text-3xl font-black text-[var(--ink)]">{formatNaira(product.priceKobo)}</span>{product.previousPriceKobo ? <span className="text-lg text-[var(--muted)] line-through">{formatNaira(product.previousPriceKobo)}</span> : null}</div><div className="mt-8 grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-black/8 bg-white/70 p-4"><Boxes className="mb-2 size-5 text-[var(--accent-dark)]" /><p className="text-xs font-black uppercase tracking-[.12em]">Availability</p><p className="mt-1 font-bold">{product.availableQuantity} available</p></div><div className="rounded-2xl border border-black/8 bg-white/70 p-4"><ShieldCheck className="mb-2 size-5 text-[var(--accent-dark)]" /><p className="text-xs font-black uppercase tracking-[.12em]">Warranty</p><p className="mt-1 font-bold">{product.warrantyInformation ?? "Ask support"}</p></div><div className="rounded-2xl border border-black/8 bg-white/70 p-4"><BadgeCheck className="mb-2 size-5 text-[var(--accent-dark)]" /><p className="text-xs font-black uppercase tracking-[.12em]">Known defects</p><p className="mt-1 font-bold">{product.visibleDefects ?? "No major defect listed"}</p></div><div className="rounded-2xl border border-black/8 bg-white/70 p-4"><PackageCheck className="mb-2 size-5 text-[var(--accent-dark)]" /><p className="text-xs font-black uppercase tracking-[.12em]">Accessories</p><p className="mt-1 font-bold">{product.includedAccessories ?? "See product note"}</p></div></div><AddToCartButton productId={product.id} disabled={product.isSoldOut} /></div></section><section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8"><div className="rounded-[2rem] bg-[var(--ink)] p-8 text-white"><Truck className="size-7 text-[var(--accent)]" /><h2 className="mt-4 font-serif text-4xl font-bold tracking-[-.04em]">Delivery and payment stay protected.</h2><p className="mt-3 max-w-2xl leading-7 text-white/70">Before checkout, the backend will recalculate price, stock, coupon, delivery fee and final Paystack amount.</p></div></section></main>;
}

function BasicPage({ title }) { return <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><p className="section-kicker">Coming soon</p><h1 className="mt-4 font-serif text-5xl font-bold capitalize tracking-[-.05em]">{title}</h1><p className="mt-4 max-w-2xl text-[var(--muted)]">This page is prepared for a future milestone.</p></main>; }
function NotFoundPage() { return <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"><p className="section-kicker">404</p><h1 className="mt-4 font-serif text-5xl font-bold tracking-[-.05em]">Page not found</h1><a href="/shop" className="cta-primary mt-8">Back to shop</a></main>; }
function Footer() { return <footer className="border-t border-black/8 bg-[#ece7dc]"><div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8"><div><p className="text-lg font-black">{storeName}</p><p className="mt-3 max-w-xs text-sm leading-6 text-[var(--muted)]">Trusted UK-used electronics and appliances for customers across Nigeria.</p></div><div><p className="footer-heading">Customer care</p><div className="mt-3 grid gap-2 text-sm"><a href="/faq">Frequently asked questions</a><a href="/delivery-returns">Delivery and returns</a><a href="/contact">Contact us</a></div></div><div><p className="footer-heading">Policies</p><div className="mt-3 grid gap-2 text-sm"><a href="/privacy">Privacy policy</a><a href="/terms">Terms and conditions</a></div></div></div></footer>; }

export default function App() {
  const path = usePath(); const url = useMemo(() => new URL(path, typeof window === "undefined" ? "http://localhost:3000" : window.location.origin), [path]); const pathname = url.pathname;
  let page;
  if (pathname === "/") page = <HomePage />;
  else if (pathname === "/shop") page = <ShopPage defaultQuery={url.searchParams.get("q") ?? ""} defaultCategory={url.searchParams.get("category") ?? ""} />;
  else if (pathname === "/cart") page = <CartClient />;
  else if (pathname === "/checkout") page = <CheckoutClient />;
  else if (pathname === "/search") page = <ShopPage defaultQuery={url.searchParams.get("q") ?? ""} />;
  else if (pathname.startsWith("/category/")) page = <ShopPage defaultCategory={decodeURIComponent(pathname.replace("/category/", ""))} />;
  else if (pathname.startsWith("/product/")) page = <ProductDetailsPage slug={decodeURIComponent(pathname.replace("/product/", ""))} />;
  else if (["/about", "/faq", "/delivery-returns", "/contact", "/privacy", "/terms", "/wishlist", "/account"].includes(pathname)) page = <BasicPage title={pathname.replace("/", "").replaceAll("-", " ")} />;
  else page = <NotFoundPage />;
  return <><SiteHeader />{page}<Footer /></>;
}





