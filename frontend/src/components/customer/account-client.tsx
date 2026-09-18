"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Heart, Headphones, LayoutDashboard, MapPin, ReceiptText, ShoppingBag, UserRound } from "lucide-react";
import { getAccount, getMyOrders, getWishlist } from "@/lib/api.js";
import { formatNaira } from "@/lib/utils.js";

type Account = {
  name?: string;
  email?: string;
  phone?: string;
  addresses?: Array<{ isDefault?: boolean; city?: string; state?: string }>;
};

type CustomerOrder = { id: string; orderNumber: string; orderStatus: string; totalKobo: number };

const accountNavigation = [
  { title: "Overview", href: "/account", icon: LayoutDashboard },
  { title: "My profile", href: "/profile", icon: UserRound },
  { title: "My orders", href: "/account/orders", icon: ReceiptText },
  { title: "Saved addresses", href: "/account/addresses", icon: MapPin },
  { title: "Wishlist", href: "/wishlist", icon: Heart },
];

export function AccountClient() {
  const [account, setAccount] = useState<Account | null>(null);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    getAccount()
      .then((data) => {
        setAccount(data);
        setError("");
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Please log in to view your account."));
    getMyOrders().then(setOrders).catch(() => setOrders([]));
    getWishlist().then((wishlist) => setWishlistCount(wishlist.itemCount ?? wishlist.items?.length ?? 0)).catch(() => setWishlistCount(0));
  }, []);

  if (error && !account) {
    return (
      <main className="page-shell px-4 py-16 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-xl rounded-[1.5rem] border border-[var(--accent)]/25 bg-white p-8 text-center shadow-[0_18px_55px_rgba(22,29,27,.08)]">
          <AlertTriangle className="mx-auto size-9 text-[var(--accent-dark)]" />
          <h1 className="mt-5 text-3xl font-black tracking-[-.035em]">Sign in to view your account</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{error}</p>
          <a href="/login" className="cta-primary mx-auto mt-7 w-fit">Go to sign in <ArrowRight className="size-4" /></a>
        </section>
      </main>
    );
  }

  const firstName = account?.name?.trim().split(/\s+/)[0] || "there";
  const initial = (account?.name || account?.email || "J").trim().charAt(0).toUpperCase();
  const defaultAddress = account?.addresses?.find((address) => address.isDefault);
  const recentOrders = orders.slice(0, 3);
  const completedAccountItems = [Boolean(account?.name), Boolean(account?.phone), Boolean(defaultAddress)].filter(Boolean).length;
  const readableStatus = (value: string) => value.replaceAll("_", " ");

  return (
    <main className="landing-page min-h-screen bg-[#f6f3ec]">
      <div className="w-full px-4 py-6 sm:px-6 lg:px-0 lg:py-0">
        <nav className="mb-5 flex gap-2 overflow-x-auto rounded-2xl border border-black/8 bg-white p-2 lg:hidden" aria-label="Customer dashboard">
          {accountNavigation.map(({ title, href, icon: Icon }) => <a key={href} href={href} aria-current={href === "/account" ? "page" : undefined} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${href === "/account" ? "bg-[#17201d] text-white" : "text-[var(--muted)]"}`}><Icon className="size-4" />{title}</a>)}
        </nav>

        <div className="grid min-w-0 gap-6 lg:min-h-[calc(100dvh-8.0625rem)] lg:grid-cols-[18rem_minmax(0,1fr)] lg:gap-0">
          <aside className="hidden lg:block">
            <div className="fixed bottom-0 left-0 top-[8.0625rem] z-40 flex w-72 flex-col overflow-hidden border-r border-black/10 bg-white">
              <div className="border-b border-black/8 p-5">
                <div className="grid size-12 place-items-center rounded-full bg-[#17201d] text-lg font-black text-white">{initial}</div>
                <p className="mt-4 truncate font-black text-[var(--ink)]">{account?.name || "Your account"}</p>
                <p className="mt-1 truncate text-xs text-[var(--muted)]">{account?.email}</p>
              </div>
              <nav className="grid flex-1 content-start gap-1 overflow-y-auto p-3" aria-label="Customer dashboard">
                {accountNavigation.map(({ title, href, icon: Icon }) => <a key={href} href={href} aria-current={href === "/account" ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${href === "/account" ? "bg-[#f1eee8] text-[var(--ink)]" : "text-[var(--muted)] hover:bg-[#f8f6f1] hover:text-[var(--ink)]"}`}><Icon className={`size-4 ${href === "/account" ? "text-[var(--accent-dark)]" : ""}`} />{title}</a>)}
              </nav>
              <div className="border-t border-black/8 p-3"><a href="/contact" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-[var(--muted)] hover:bg-[#fff9f2] hover:text-[var(--ink)]"><Headphones className="size-4" />Customer support</a></div>
            </div>
          </aside>

          <section className="min-w-0 lg:p-8 xl:p-10">
            <header className="border-b border-black/10 pb-7">
              <p className="text-xs font-black uppercase tracking-[.16em] text-[var(--accent-dark)]">Account dashboard</p>
              <h1 className="landing-display mt-2 text-4xl leading-tight tracking-[-.035em] sm:text-5xl">Welcome back, {firstName}.</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">Manage your profile, delivery details, purchases and saved products from one place.</p>
            </header>

            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-2xl border border-black/8 bg-white p-5"><p className="text-xs font-black uppercase tracking-[.12em] text-[var(--muted)]">Contact</p><p className="mt-3 truncate font-black">{account?.email}</p><p className="mt-1 text-sm text-[var(--muted)]">{account?.phone || "Phone number not added"}</p></div>
              <div className="rounded-2xl border border-black/8 bg-white p-5 md:col-span-2"><p className="text-xs font-black uppercase tracking-[.12em] text-[var(--muted)]">Default delivery address</p><p className="mt-3 flex items-center gap-2 font-black"><MapPin className="size-4 text-[var(--accent-dark)]" />{defaultAddress ? `${defaultAddress.city}, ${defaultAddress.state}` : "No default address yet"}</p><a href="/account/addresses" className="mt-2 inline-flex text-sm font-bold text-[var(--accent-dark)] hover:underline">Manage addresses</a></div>
            </div>

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-black/8 bg-white p-5"><ReceiptText className="size-5 text-[var(--accent-dark)]" /><p className="mt-4 text-3xl font-black tracking-[-.04em]">{orders.length}</p><p className="mt-1 text-sm font-bold text-[var(--muted)]">Total orders</p></div>
              <div className="rounded-2xl border border-black/8 bg-white p-5"><Heart className="size-5 text-[var(--accent-dark)]" /><p className="mt-4 text-3xl font-black tracking-[-.04em]">{wishlistCount}</p><p className="mt-1 text-sm font-bold text-[var(--muted)]">Saved products</p></div>
              <div className="rounded-2xl border border-black/8 bg-white p-5"><MapPin className="size-5 text-[var(--accent-dark)]" /><p className="mt-4 text-3xl font-black tracking-[-.04em]">{account?.addresses?.length ?? 0}</p><p className="mt-1 text-sm font-bold text-[var(--muted)]">Saved addresses</p></div>
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(17rem,.65fr)]">
              <section className="rounded-[1.5rem] border border-black/8 bg-white p-5 sm:p-6">
                <div className="flex items-end justify-between gap-4 border-b border-black/8 pb-4"><div><p className="text-xs font-black uppercase tracking-[.14em] text-[var(--muted)]">Recent activity</p><h2 className="landing-display mt-1 text-2xl">Latest orders</h2></div>{orders.length ? <a href="/account/orders" className="text-sm font-black text-[var(--accent-dark)] hover:underline">View all</a> : null}</div>
                <div className="divide-y divide-black/8">
                  {recentOrders.map((order) => <div key={order.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-black">{order.orderNumber}</p><p className="mt-1 text-sm capitalize text-[var(--muted)]">{readableStatus(order.orderStatus)}</p></div><p className="font-black">{formatNaira(order.totalKobo)}</p></div>)}
                  {!recentOrders.length ? <div className="py-8 text-center"><ShoppingBag className="mx-auto size-7 text-[var(--muted)]" /><p className="mt-3 font-black">No orders yet</p><p className="mt-1 text-sm text-[var(--muted)]">Your latest purchases will appear here.</p><a href="/shop" className="cta-primary mx-auto mt-5 w-fit">Start shopping <ArrowRight className="size-4" /></a></div> : null}
                </div>
              </section>

              <aside className="rounded-[1.5rem] border border-black/8 bg-[#fff9f2] p-5 sm:p-6">
                <p className="text-xs font-black uppercase tracking-[.14em] text-[var(--accent-dark)]">Account readiness</p>
                <h2 className="landing-display mt-2 text-2xl">{completedAccountItems} of 3 complete</h2>
                <div className="mt-5 grid gap-3 text-sm font-bold">
                  <p className="flex items-center gap-3"><CheckCircle2 className={`size-5 ${account?.name ? "text-emerald-700" : "text-black/20"}`} />Name added</p>
                  <p className="flex items-center gap-3"><CheckCircle2 className={`size-5 ${account?.phone ? "text-emerald-700" : "text-black/20"}`} />Phone number added</p>
                  <p className="flex items-center gap-3"><CheckCircle2 className={`size-5 ${defaultAddress ? "text-emerald-700" : "text-black/20"}`} />Default address added</p>
                </div>
                <div className="mt-6 h-2 overflow-hidden rounded-full bg-black/8"><div className="h-full rounded-full bg-[var(--accent)] transition-all" style={{ width: `${(completedAccountItems / 3) * 100}%` }} /></div>
              </aside>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
