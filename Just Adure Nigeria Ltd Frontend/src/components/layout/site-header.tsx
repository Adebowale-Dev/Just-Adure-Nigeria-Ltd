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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getCart, getCurrentUser, getNotifications, logoutUser, markNotificationRead } from "@/lib/api.js";
import { cartUpdatedEventName, getCartItemCount } from "@/lib/cart-events";

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

function MenuLink({ href, children }) {
  return <a href={href} role="menuitem" className="block rounded-xl px-3 py-2 text-sm font-bold hover:bg-[#fbfaf6]">{children}</a>;
}

export function SiteHeader() {
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
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
    getCart()
      .then((cart) => {
        if (mounted) setCartCount(getCartItemCount(cart));
      })
      .catch(() => {
        if (mounted) setCartCount(0);
      });

    function handleCartUpdated(event) {
      setCartCount(Number(event.detail?.itemCount ?? 0));
    }

    window.addEventListener(cartUpdatedEventName, handleCartUpdated);
    return () => {
      mounted = false;
      window.removeEventListener(cartUpdatedEventName, handleCartUpdated);
    };
  }, []);

  function markRead(notification) {
    startTransition(async () => {
      await markNotificationRead(notification.id).catch(() => null);
      loadNotifications();
    });
  }

  function handleLogout() {
    startTransition(async () => {
      await logoutUser().catch(() => null);
      setUser(null);
      setNotifications([]);
      setUnreadCount(0);
      window.location.href = "/login";
    });
  }

  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_2px_16px_rgba(28,34,31,.08)]">
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
          <div className="hidden sm:block">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-black hover:bg-[#f6f3ec] data-[state=open]:bg-[#f6f3ec]">
                <UserRound className="size-6" /> Account <ChevronDown className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72">
                {user ? <div className="rounded-xl bg-[#fbfaf6] p-4"><p className="text-xs font-black uppercase tracking-[.14em] text-[var(--muted)]">Signed in as</p><p className="mt-1 font-black text-[var(--ink)]">{user.name}</p><p className="text-sm text-[var(--muted)]">{user.email}</p></div> : <a href="/login" className="flex min-h-11 items-center justify-center rounded-xl bg-[var(--accent)] px-4 text-sm font-black text-white hover:bg-[var(--accent-dark)]">Login or create account</a>}
                <DropdownMenuSeparator />
                <MenuLink href="/account">My profile</MenuLink>
                <MenuLink href="/account/orders">Orders</MenuLink>
                <MenuLink href="/wishlist">Wishlist</MenuLink>
                <MenuLink href="/account/addresses">Saved addresses</MenuLink>
                {user ? <DropdownMenuItem disabled={isPending} onClick={handleLogout} className="mt-2 border border-red-100 bg-red-50 font-black text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60">Logout</DropdownMenuItem> : null}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="hidden md:block">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-black hover:bg-[#f6f3ec] data-[state=open]:bg-[#f6f3ec]">
                <CircleHelp className="size-6" /> Help <ChevronDown className="size-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-72">
                <DropdownMenuLabel>Customer help</DropdownMenuLabel>
                <MenuLink href="/contact">Contact support</MenuLink>
                <MenuLink href="/order-tracking">Track an order</MenuLink>
                <MenuLink href="/delivery-information">Delivery information</MenuLink>
                <MenuLink href="/frequently-asked-questions">FAQs</MenuLink>
                <MenuLink href="/return-and-refund-policy">Returns and refunds</MenuLink>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <a href="/wishlist" className="header-action hidden sm:grid" aria-label="Wishlist"><Heart className="size-5" /></a>
          {user ? <DropdownMenu><DropdownMenuTrigger className="header-action relative" aria-label="Notifications"><Bell className="size-5" />{unreadCount > 0 ? <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-[var(--accent)] text-[10px] font-black text-white">{Math.min(unreadCount, 9)}</span> : null}</DropdownMenuTrigger><DropdownMenuContent className="w-80"><DropdownMenuLabel>Notifications</DropdownMenuLabel>{notifications.length === 0 ? <p className="rounded-xl bg-[#fbfaf6] p-3 text-sm font-bold text-[var(--muted)]">No notifications yet.</p> : null}{notifications.slice(0, 5).map((notification) => <DropdownMenuItem key={notification.id} disabled={isPending} onClick={() => markRead(notification)} className="p-3"><span className="flex items-center justify-between gap-3"><strong className="text-sm">{notification.title}</strong>{notification.readAt ? null : <span className="size-2 rounded-full bg-[var(--accent-dark)]" />}</span><span className="mt-1 block text-xs leading-5 text-[var(--muted)]">{notification.message}</span><span className="mt-1 block text-[11px] font-black uppercase tracking-[.1em] text-[var(--accent-dark)]">{timeAgo(notification.createdAt)}</span></DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu> : null}
          <a href="/cart" className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-black hover:bg-[#f6f3ec] sm:px-3"><span className="relative"><ShoppingCart className="size-7" /><span className="absolute -right-2 -top-2 grid size-5 place-items-center rounded-full bg-[var(--accent)] text-[10px] font-black text-white">{Math.min(cartCount, 99)}</span></span><span className="hidden sm:inline">Cart</span></a>
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
