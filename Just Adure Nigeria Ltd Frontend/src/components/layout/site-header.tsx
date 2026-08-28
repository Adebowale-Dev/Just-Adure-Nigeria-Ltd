"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Bell,
  Bike,
  ChevronDown,
  CircleHelp,
  Heart,
  Home,
  Laptop,
  Menu,
  Monitor,
  Refrigerator,
  Search,
  ShoppingCart,
  Star,
  Store,
  Tv,
  UserRound,
  WashingMachine,
} from "lucide-react";
import { getCurrentUser, getNotifications, markNotificationRead } from "@/lib/api.js";

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Just Adure Nigeria Ltd";

const navCategories = [
  { label: "Official Store", href: "/shop", icon: Store },
  { label: "Appliances", href: "/category/home-appliances", icon: Refrigerator },
  { label: "Computers", href: "/category/computers", icon: Laptop },
  { label: "TVs & DVD", href: "/category/televisions", icon: Tv },
  { label: "Furniture", href: "/category/furniture", icon: Home },
  { label: "Washers", href: "/shop?q=washing", icon: WashingMachine },
  { label: "Bicycles", href: "/shop?q=bicycle", icon: Bike },
  { label: "Monitors", href: "/shop?q=monitor", icon: Monitor },
];

function timeAgo(value) {
  const date = new Date(value);
  const minutes = Math.max(1, Math.round((Date.now() - date.getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export function SiteHeader() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function loadNotifications(nextUser = user) {
    if (!nextUser) return;
    const isStaff = nextUser.roles?.some((role) => role !== "customer");
    getNotifications(isStaff ? "admin" : "customer")
      .then((data) => {
        setNotifications(data.items ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      })
      .catch(() => {
        setNotifications([]);
        setUnreadCount(0);
      });
  }

  useEffect(() => {
    let mounted = true;
    getCurrentUser()
      .then((nextUser) => {
        if (!mounted) return;
        setUser(nextUser);
        loadNotifications(nextUser);
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
      });
    return () => {
      mounted = false;
    };
  }, []);

  function markRead(notification) {
    startTransition(async () => {
      await markNotificationRead(notification.id).catch(() => null);
      loadNotifications();
    });
  }

  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_2px_16px_rgba(28,34,31,.08)]">
      <div className="border-b border-black/5 bg-[#f2f2f2]">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs font-black sm:px-6 lg:px-8">
          <a href="/contact" className="flex items-center gap-1.5 text-[var(--accent-dark)]"><Star className="size-4 fill-[var(--accent)] text-[var(--accent)]" /> Sell to Just Adure</a>
          <div className="hidden items-center gap-5 text-[var(--muted)] sm:flex">
            <span>JUST ADURE</span>
            <span>PAYSTACK PAY</span>
            <span>NIGERIA DELIVERY</span>
          </div>
        </div>
      </div>

      <div className="mx-auto flex min-h-20 max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:px-8">
        <button className="grid size-11 place-items-center rounded-md border border-black/10 lg:hidden" aria-label="Open navigation"><Menu className="size-5" /></button>
        <a href="/" className="flex shrink-0 items-center gap-2" aria-label={`${storeName} home`}>
          <span className="text-3xl font-black tracking-[-.08em] text-[var(--ink)] sm:text-4xl">JUST ADURE</span>
          <Star className="size-6 fill-[var(--accent)] text-[var(--accent)]" />
        </a>

        <form action="/shop" className="mx-auto hidden h-12 max-w-2xl flex-1 items-center overflow-hidden rounded-full bg-[#f1f1f3] pl-5 lg:flex">
          <Search className="size-6 text-[#34373c]" />
          <input name="q" placeholder="Search products, brands and categories" className="h-full flex-1 bg-transparent px-3 text-sm font-semibold text-[var(--ink)] outline-none placeholder:text-[#69707c]" />
          <button className="mr-1 rounded-full bg-[var(--accent)] px-7 py-3 text-sm font-black text-white hover:bg-[var(--accent-dark)]" type="submit">Search</button>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          <a href="/account" className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-black hover:bg-[#f6f3ec] sm:flex"><UserRound className="size-6" /> Account <ChevronDown className="size-4" /></a>
          <a href="/contact" className="hidden items-center gap-2 rounded-md px-3 py-2 text-sm font-black hover:bg-[#f6f3ec] md:flex"><CircleHelp className="size-6" /> Help <ChevronDown className="size-4" /></a>
          <a href="/wishlist" className="header-action hidden sm:grid" aria-label="Wishlist"><Heart className="size-5" /></a>
          {user ? <div className="relative"><button type="button" className="header-action relative" aria-label="Notifications" onClick={() => setOpen((current) => !current)}><Bell className="size-5" />{unreadCount > 0 ? <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-[var(--accent)] text-[10px] font-black text-white">{Math.min(unreadCount, 9)}</span> : null}</button>{open ? <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-black/8 bg-white p-3 shadow-[0_24px_70px_rgba(28,34,31,.18)]"><p className="px-2 pb-2 text-xs font-black uppercase tracking-[.14em] text-[var(--muted)]">Notifications</p>{notifications.length === 0 ? <p className="rounded-xl bg-[#fbfaf6] p-3 text-sm font-bold text-[var(--muted)]">No notifications yet.</p> : null}{notifications.slice(0, 5).map((notification) => <button key={notification.id} type="button" disabled={isPending} onClick={() => markRead(notification)} className="block w-full rounded-xl p-3 text-left hover:bg-[#fbfaf6]"><span className="flex items-center justify-between gap-3"><strong className="text-sm">{notification.title}</strong>{notification.readAt ? null : <span className="size-2 rounded-full bg-[var(--accent-dark)]" />}</span><span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{notification.message}</span><span className="mt-1 block text-[11px] font-black uppercase tracking-[.1em] text-[var(--accent-dark)]">{timeAgo(notification.createdAt)}</span></button>)}</div> : null}</div> : null}
          <a href="/cart" className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-black hover:bg-[#f6f3ec] sm:px-3"><span className="relative"><ShoppingCart className="size-7" /><span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-[var(--accent)] text-[10px] font-black text-white">0</span></span><span className="hidden sm:inline">Cart</span></a>
        </div>
      </div>

      <nav className="border-t border-black/5 bg-white" aria-label="Product categories">
        <div className="mx-auto flex max-w-7xl gap-7 overflow-x-auto px-4 py-3 text-sm font-black sm:px-6 lg:px-8">
          {navCategories.map(({ label, href, icon: Icon }) => (
            <a key={label} href={href} className="flex shrink-0 items-center gap-2 text-[var(--ink)] hover:text-[var(--accent-dark)]"><Icon className="size-5 text-[var(--muted)]" /> {label}</a>
          ))}
        </div>
      </nav>
    </header>
  );
}
