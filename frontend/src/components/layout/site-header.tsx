"use client";

import { useEffect, useState, useTransition } from "react";
import {
  Bell,
  Bike,
  Check,
  ChevronDown,
  CircleHelp,
  Globe2,
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
  WashingMachine,
  X,
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

const languages = [
  { code: "EN", name: "English", lang: "en" },
  { code: "FR", name: "French", lang: "fr" },
  { code: "YO", name: "Yoruba", lang: "yo" },
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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [language, setLanguage] = useState("EN");
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
    const savedLanguage = window.localStorage.getItem("store-language");
    const selectedLanguage = languages.find(({ code }) => code === savedLanguage) ?? languages[0];
    setLanguage(selectedLanguage.code);
    document.documentElement.lang = selectedLanguage.lang;
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

  useEffect(() => {
    if (!isMobileMenuOpen) return;

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setIsMobileMenuOpen(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMobileMenuOpen]);

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

  function selectLanguage(nextLanguage) {
    setLanguage(nextLanguage.code);
    window.localStorage.setItem("store-language", nextLanguage.code);
    document.documentElement.lang = nextLanguage.lang;
  }

  return (
    <header className="sticky top-0 z-50 bg-white shadow-[0_2px_16px_rgba(28,34,31,.08)]">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-2 px-3 py-2 sm:min-h-20 sm:gap-4 sm:px-6 sm:py-3 lg:px-8">
        <button
          type="button"
          className="grid size-10 shrink-0 place-items-center rounded-md border border-black/10 sm:size-11 lg:hidden"
          aria-label={isMobileMenuOpen ? "Close navigation" : "Open navigation"}
          aria-expanded={isMobileMenuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setIsMobileMenuOpen((open) => !open)}
        >
          {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
        <a href="/" className="flex min-w-0 shrink items-center gap-1.5 sm:shrink-0 sm:gap-2" aria-label={`${storeName} home`}>
          <span className="whitespace-nowrap text-xl font-black tracking-[-.06em] text-[var(--ink)] min-[360px]:text-2xl sm:text-4xl sm:tracking-[-.08em]">JUST ADURE</span>
          <Star className="size-5 shrink-0 fill-[var(--accent)] text-[var(--accent)] sm:size-6" />
        </a>

        <form action="/shop" className="mx-auto hidden h-12 max-w-2xl flex-1 items-center overflow-hidden rounded-full bg-[#f1f1f3] pl-5 lg:flex">
          <Search className="size-6 text-[#34373c]" />
          <input name="q" placeholder="Search products, brands and categories" className="header-search-input h-full flex-1 bg-transparent px-3 text-sm font-semibold text-[var(--ink)] outline-none placeholder:text-[#69707c]" />
          <button className="mr-1 rounded-full bg-[var(--accent)] px-7 py-3 text-sm font-black text-white hover:bg-[var(--accent-dark)]" type="submit">Search</button>
        </form>

        <div className="ml-auto flex items-center gap-1 sm:gap-2">
          {user ? (
            <div className="hidden sm:block">
              <DropdownMenu>
                <DropdownMenuTrigger className="grid size-11 place-items-center rounded-full bg-[#fff3e8] text-sm font-black uppercase text-[var(--accent-dark)] hover:bg-[var(--accent)] hover:text-[var(--ink)]" aria-label="Open profile menu">
                  {(user.name || user.email || "U").trim().charAt(0)}
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-72">
                  <div className="rounded-xl bg-[#fbfaf6] p-4"><p className="text-xs font-black uppercase tracking-[.14em] text-[var(--muted)]">Signed in as</p><p className="mt-1 font-black text-[var(--ink)]">{user.name}</p><p className="text-sm text-[var(--muted)]">{user.email}</p></div>
                  <DropdownMenuSeparator />
                  <MenuLink href="/account">My profile</MenuLink>
                  <MenuLink href="/account/orders">Orders</MenuLink>
                  <MenuLink href="/wishlist">Wishlist</MenuLink>
                  <MenuLink href="/account/addresses">Saved addresses</MenuLink>
                  <DropdownMenuItem disabled={isPending} onClick={handleLogout} className="mt-2 border border-red-100 bg-red-50 font-black text-red-700 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60">Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="hidden items-center gap-2 text-sm font-bold sm:flex">
              <DropdownMenu>
                <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-md px-2 py-2 text-[var(--muted)] hover:bg-[#f6f3ec] hover:text-[var(--ink)] data-[state=open]:bg-[#f6f3ec]" aria-label="Choose language">
                  <Globe2 className="size-4" /> {language} <ChevronDown className="size-3.5" />
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-48">
                  <DropdownMenuLabel>Choose language</DropdownMenuLabel>
                  {languages.map((option) => (
                    <DropdownMenuItem key={option.code} onClick={() => selectLanguage(option)} className="flex items-center justify-between">
                      <span>{option.name}</span>
                      <span className="flex items-center gap-2 text-xs font-black text-[var(--muted)]">{option.code}{language === option.code ? <Check className="size-4 text-[var(--accent-dark)]" /> : null}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <a href="/login" className="px-1 py-2 hover:text-[var(--accent-dark)]">Sign in</a>
              <span className="text-black/25" aria-hidden="true">|</span>
              <a href="/register" className="px-1 py-2 hover:text-[var(--accent-dark)]">Registration</a>
            </div>
          )}

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

      {isMobileMenuOpen ? (
        <div id="mobile-navigation" className="absolute inset-x-0 top-full max-h-[calc(100dvh-7rem)] overflow-y-auto overscroll-contain border-t border-black/8 bg-white px-3 py-4 shadow-[0_16px_30px_rgba(28,34,31,.14)] sm:px-6 lg:hidden">
          <nav className="mx-auto grid max-w-7xl gap-2" aria-label="Mobile navigation">
            <a href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="rounded-xl px-3 py-3 font-bold hover:bg-[#fff3e8]">Contact support</a>
            <a href="/order-tracking" onClick={() => setIsMobileMenuOpen(false)} className="rounded-xl px-3 py-3 font-bold hover:bg-[#fff3e8]">Track an order</a>
            <div className="mt-1 grid grid-cols-2 gap-2">
              <a href="/login" onClick={() => setIsMobileMenuOpen(false)} className="rounded-xl border border-[var(--accent)] px-3 py-3 text-center font-black text-[var(--accent-dark)]">Sign in</a>
              <a href="/register" onClick={() => setIsMobileMenuOpen(false)} className="rounded-xl bg-[var(--accent)] px-3 py-3 text-center font-black text-white">Register</a>
            </div>
          </nav>
        </div>
      ) : null}

      <nav className="border-t border-black/5 bg-white" aria-label="Product categories">
        <div className="mx-auto flex max-w-7xl gap-7 overflow-x-auto px-4 py-3 text-sm font-black sm:px-6 lg:justify-center lg:px-8">
          {navCategories.map(({ label, href, icon: Icon }) => (
            <a key={label} href={href} className="flex shrink-0 items-center gap-2 text-[var(--ink)] hover:text-[var(--accent-dark)]"><Icon className="size-5 text-[var(--muted)]" /> {label}</a>
          ))}
        </div>
      </nav>
    </header>
  );
}
