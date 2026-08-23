import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Camera,
  CreditCard,
  PackageCheck,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ProductCard, type ProductCardProduct } from "@/components/product-card";
import { TrustCard } from "@/components/trust-card";

const featuredProducts: ProductCardProduct[] = [
  {
    name: "iPhone 13 Pro 256GB",
    slug: "apple-iphone-13-pro-256gb-sierra-blue",
    priceKobo: 675_000_00,
    previousPriceKobo: 715_000_00,
    condition: "Excellent",
    imageUrl: "https://images.unsplash.com/photo-1632661674596-df8be070a5c5?auto=format&fit=crop&w=1200&q=85",
    defectNote: "Two faint frame marks. Screen is clean.",
  },
  {
    name: "Dell Latitude 7420",
    slug: "dell-latitude-7420-core-i7-16gb-512gb",
    priceKobo: 585_000_00,
    condition: "Good",
    imageUrl: "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=1200&q=85",
    defectNote: "Light lid scratches from normal use.",
  },
  {
    name: "Samsung 50-inch 4K TV",
    slug: "samsung-50-inch-crystal-uhd-4k-smart-tv",
    priceKobo: 445_000_00,
    previousPriceKobo: 475_000_00,
    condition: "Excellent",
    imageUrl: "https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?auto=format&fit=crop&w=1200&q=85",
    defectNote: "Small rear-casing mark; clean front panel.",
  },
];

const categories = ["Phones", "Laptops", "Televisions", "Game consoles", "Appliances", "Accessories"];

export default function HomePage() {
  return (
    <main>
      <section className="hero-grid relative overflow-hidden border-b border-black/8">
        <div className="mx-auto grid min-h-[43rem] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.04fr_.96fr] lg:px-8 lg:py-24">
          <div className="relative z-10 max-w-3xl animate-rise">
            <div className="eyebrow"><Sparkles className="size-4" /> Tested in Nigeria. Sourced from the UK.</div>
            <h1 className="mt-7 max-w-4xl font-serif text-[clamp(3.4rem,8vw,7.4rem)] leading-[0.86] tracking-[-0.065em] text-[var(--ink)]">
              Pre-owned tech, <span className="text-[var(--accent-dark)]">properly</span> checked.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-[var(--muted)] sm:text-xl">
              Actual photos, honest condition notes, and devices tested before they reach your door. No stock-image surprises.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/shop" className="cta-primary">Shop latest arrivals <ArrowRight className="size-4" /></Link>
              <Link href="/about" className="cta-outline">How we test products</Link>
            </div>
            <div className="mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm font-bold text-[var(--ink)]">
              <span className="inline-flex items-center gap-2"><BadgeCheck className="size-4 text-[var(--accent-dark)]" /> Condition graded</span>
              <span className="inline-flex items-center gap-2"><CreditCard className="size-4 text-[var(--accent-dark)]" /> Paystack secured</span>
              <span className="inline-flex items-center gap-2"><PackageCheck className="size-4 text-[var(--accent-dark)]" /> Delivery tracked</span>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl animate-rise-delayed" aria-label="Featured product condition card">
            <div className="absolute -left-10 top-12 size-40 rounded-full bg-[var(--accent)]/30 blur-3xl" />
            <div className="relative rotate-[1.5deg] rounded-[2rem] border border-black/10 bg-[var(--ink)] p-5 shadow-[0_35px_80px_rgba(20,27,25,.25)] sm:p-7">
              <div className="rounded-[1.4rem] bg-[#dfe3df] p-4 sm:p-6">
                <div className="flex aspect-[4/3] items-center justify-center rounded-[1rem] bg-[radial-gradient(circle_at_50%_35%,#fff_0,#dfe3df_58%,#bdc5c0_100%)]">
                  <div className="relative h-[78%] w-[43%] rounded-[2.2rem] border-[7px] border-[#232826] bg-[linear-gradient(145deg,#8ac2d5,#30526d_58%,#dcb170)] shadow-[0_24px_35px_rgba(20,27,25,.25)]">
                    <span className="absolute left-1/2 top-2 h-4 w-16 -translate-x-1/2 rounded-full bg-[#232826]" />
                  </div>
                </div>
              </div>
              <div className="mt-5 flex items-end justify-between gap-5 text-white">
                <div>
                  <p className="text-xs font-black uppercase tracking-[.16em] text-[var(--accent)]">Actual unit 001</p>
                  <p className="mt-2 text-xl font-black">Excellent condition</p>
                  <p className="mt-1 text-sm text-white/55">Every mark disclosed before checkout.</p>
                </div>
                <Camera className="size-7 shrink-0 text-white/45" />
              </div>
            </div>
            <div className="absolute -bottom-5 -left-3 -rotate-3 rounded-2xl bg-[var(--accent)] px-5 py-4 shadow-xl">
              <p className="text-xs font-black uppercase tracking-[.14em]">30-point check</p>
              <p className="mt-1 font-serif text-2xl font-bold">Passed.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-kicker">Fresh from the test bench</p>
            <h2 className="section-title">Featured finds</h2>
          </div>
          <Link href="/shop" className="inline-flex items-center gap-2 text-sm font-black">View every product <ArrowRight className="size-4" /></Link>
        </div>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {featuredProducts.map((product) => <ProductCard key={product.slug} product={product} />)}
        </div>
      </section>

      <section className="border-y border-black/8 bg-white/60">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <p className="section-kicker">Browse your way</p>
          <div className="mt-6 flex flex-wrap gap-3">
            {categories.map((category, index) => (
              <Link
                key={category}
                href={`/category/${category.toLowerCase().replace(" ", "-")}`}
                className="category-pill"
              >
                <span className="text-xs font-black text-[var(--accent-dark)]">0{index + 1}</span>
                {category}
                <ArrowRight className="size-4" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[var(--ink)] text-white">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-3xl">
            <p className="section-kicker text-[var(--accent)]">Buy the exact item you inspected</p>
            <h2 className="mt-4 font-serif text-4xl leading-tight tracking-[-.045em] sm:text-6xl">Trust is in the details.</h2>
          </div>
          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <TrustCard icon={Camera} title="Actual-unit photography" description="The photos belong to the listed unit, including the angles that show its real condition." />
            <TrustCard icon={ShieldCheck} title="Functionally tested" description="Core functions are checked and any limitations are written clearly before you pay." />
            <TrustCard icon={PackageCheck} title="Protected handover" description="Stock is checked again at checkout and delivery progress remains visible after payment." />
          </div>
        </div>
      </section>

      <footer className="border-t border-black/8 bg-[#ece7dc]">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3 lg:px-8">
          <div><p className="text-lg font-black">Just Adure Nigeria Ltd</p><p className="mt-3 max-w-xs text-sm leading-6 text-[var(--muted)]">Trusted UK-used electronics and appliances for customers across Nigeria.</p></div>
          <div><p className="footer-heading">Customer care</p><div className="mt-3 grid gap-2 text-sm"><Link href="/faq">Frequently asked questions</Link><Link href="/delivery-returns">Delivery and returns</Link><Link href="/contact">Contact us</Link></div></div>
          <div><p className="footer-heading">Policies</p><div className="mt-3 grid gap-2 text-sm"><Link href="/privacy">Privacy policy</Link><Link href="/terms">Terms and conditions</Link></div></div>
        </div>
      </footer>
    </main>
  );
}
