"use client";

import { useEffect, useState, useTransition } from "react";
import { Bell, Heart, Menu, Search, ShoppingBag, UserRound } from "lucide-react";
import { getCurrentUser, getNotifications, markNotificationRead } from "@/lib/api.js";

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Just Adure Nigeria Ltd";

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
    <header className="sticky top-0 z-50 border-b border-black/8 bg-[rgba(246,243,236,0.92)] backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
        <button className="grid size-11 place-items-center rounded-full border border-black/10 lg:hidden" aria-label="Open navigation"><Menu className="size-5" /></button>
        <a href="/" className="mr-auto flex items-center gap-3" aria-label={`${storeName} home`}><span className="grid size-10 place-items-center rounded-xl bg-[var(--ink)] text-sm font-black text-white">JA</span><span className="hidden text-lg font-black tracking-[-0.03em] sm:block">{storeName}</span></a>
        <nav className="hidden items-center gap-7 text-sm font-bold lg:flex" aria-label="Primary navigation"><a href="/shop" className="hover:text-[var(--accent-dark)]">Shop</a><a href="/category/computers" className="hover:text-[var(--accent-dark)]">Computers</a><a href="/category/home-appliances" className="hover:text-[var(--accent-dark)]">Appliances</a><a href="/category/furniture" className="hover:text-[var(--accent-dark)]">Furniture</a><a href="/about" className="hover:text-[var(--accent-dark)]">Why us</a></nav>
        <div className="ml-2 flex items-center gap-1 sm:ml-6">
          <a href="/search" className="header-action" aria-label="Search"><Search className="size-5" /></a>
          <a href="/wishlist" className="header-action hidden sm:grid" aria-label="Wishlist"><Heart className="size-5" /></a>
          {user ? <div className="relative"><button type="button" className="header-action relative" aria-label="Notifications" onClick={() => setOpen((current) => !current)}><Bell className="size-5" />{unreadCount > 0 ? <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-[var(--accent)] text-[10px] font-black">{Math.min(unreadCount, 9)}</span> : null}</button>{open ? <div className="absolute right-0 mt-3 w-80 rounded-2xl border border-black/8 bg-white p-3 shadow-[0_24px_70px_rgba(28,34,31,.18)]"><p className="px-2 pb-2 text-xs font-black uppercase tracking-[.14em] text-[var(--muted)]">Notifications</p>{notifications.length === 0 ? <p className="rounded-xl bg-[#fbfaf6] p-3 text-sm font-bold text-[var(--muted)]">No notifications yet.</p> : null}{notifications.slice(0, 5).map((notification) => <button key={notification.id} type="button" disabled={isPending} onClick={() => markRead(notification)} className="block w-full rounded-xl p-3 text-left hover:bg-[#fbfaf6]"><span className="flex items-center justify-between gap-3"><strong className="text-sm">{notification.title}</strong>{notification.readAt ? null : <span className="size-2 rounded-full bg-[var(--accent-dark)]" />}</span><span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{notification.message}</span><span className="mt-1 block text-[11px] font-black uppercase tracking-[.1em] text-[var(--accent-dark)]">{timeAgo(notification.createdAt)}</span></button>)}</div> : null}</div> : null}
          <a href="/account" className="header-action hidden sm:grid" aria-label="Account"><UserRound className="size-5" /></a>
          <a href="/cart" className="header-action relative" aria-label="Shopping cart"><ShoppingBag className="size-5" /><span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-[var(--accent)] text-[10px] font-black">0</span></a>
        </div>
      </div>
    </header>
  );
}


