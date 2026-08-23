import Link from "next/link";
import { Heart, Menu, Search, ShoppingBag, UserRound } from "lucide-react";

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Just Adure Nigeria Ltd";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/8 bg-[rgba(246,243,236,0.92)] backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button
          className="grid size-11 place-items-center rounded-full border border-black/10 lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>

        <Link href="/" className="mr-auto flex items-center gap-3" aria-label={`${storeName} home`}>
          <span className="grid size-10 place-items-center rounded-xl bg-[var(--ink)] text-sm font-black text-white">
            SN
          </span>
          <span className="hidden text-lg font-black tracking-[-0.03em] sm:block">{storeName}</span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-bold lg:flex" aria-label="Primary navigation">
          <Link href="/shop" className="hover:text-[var(--accent-dark)]">Shop</Link>
          <Link href="/category/phones" className="hover:text-[var(--accent-dark)]">Phones</Link>
          <Link href="/category/laptops" className="hover:text-[var(--accent-dark)]">Laptops</Link>
          <Link href="/about" className="hover:text-[var(--accent-dark)]">Why us</Link>
        </nav>

        <div className="ml-2 flex items-center gap-1 sm:ml-6">
          <Link href="/search" className="header-action" aria-label="Search"><Search className="size-5" /></Link>
          <Link href="/wishlist" className="header-action hidden sm:grid" aria-label="Wishlist"><Heart className="size-5" /></Link>
          <Link href="/account" className="header-action hidden sm:grid" aria-label="Account"><UserRound className="size-5" /></Link>
          <Link href="/cart" className="header-action relative" aria-label="Shopping cart">
            <ShoppingBag className="size-5" />
            <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-[var(--accent)] text-[10px] font-black">0</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
