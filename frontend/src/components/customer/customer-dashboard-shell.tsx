"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Heart, Headphones, LayoutDashboard, MapPin, ReceiptText, UserRound } from "lucide-react";
import { getAccount } from "@/lib/api.js";

const navigation = [
  { title: "Overview", href: "/account", icon: LayoutDashboard },
  { title: "My profile", href: "/profile", icon: UserRound },
  { title: "My orders", href: "/account/orders", icon: ReceiptText },
  { title: "Saved addresses", href: "/account/addresses", icon: MapPin },
  { title: "Wishlist", href: "/wishlist", icon: Heart },
];

type AccountSummary = { name?: string; email?: string };

export function CustomerDashboardShell({ activePath, children }: { activePath: string; children: ReactNode }) {
  const [account, setAccount] = useState<AccountSummary | null>(null);

  useEffect(() => {
    getAccount().then(setAccount).catch(() => setAccount(null));
  }, []);

  const initial = (account?.name || account?.email || "J").trim().charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-[#f6f3ec]">
      <nav className="flex gap-2 overflow-x-auto border-b border-black/8 bg-white p-2 lg:hidden" aria-label="Customer dashboard">
        {navigation.map(({ title, href, icon: Icon }) => <a key={href} href={href} aria-current={activePath === href ? "page" : undefined} className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-3 text-sm font-black ${activePath === href ? "bg-[#17201d] text-white" : "text-[var(--muted)]"}`}><Icon className="size-4" />{title}</a>)}
      </nav>

      <aside className="fixed bottom-0 left-0 top-[8.0625rem] z-40 hidden w-72 flex-col overflow-hidden border-r border-black/10 bg-white lg:flex">
        <div className="border-b border-black/8 p-5">
          <div className="grid size-12 place-items-center rounded-full bg-[#17201d] text-lg font-black text-white">{initial}</div>
          <p className="mt-4 truncate font-black text-[var(--ink)]">{account?.name || "Your account"}</p>
          <p className="mt-1 truncate text-xs text-[var(--muted)]">{account?.email || "Customer dashboard"}</p>
        </div>
        <nav className="grid flex-1 content-start gap-1 overflow-y-auto p-3" aria-label="Customer dashboard">
          {navigation.map(({ title, href, icon: Icon }) => <a key={href} href={href} aria-current={activePath === href ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold transition ${activePath === href ? "bg-[#f1eee8] text-[var(--ink)]" : "text-[var(--muted)] hover:bg-[#f8f6f1] hover:text-[var(--ink)]"}`}><Icon className={`size-4 ${activePath === href ? "text-[var(--accent-dark)]" : ""}`} />{title}</a>)}
        </nav>
        <div className="border-t border-black/8 p-3"><a href="/contact" className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-[var(--muted)] hover:bg-[#fff9f2] hover:text-[var(--ink)]"><Headphones className="size-4" />Customer support</a></div>
      </aside>

      <div className="min-w-0 lg:pl-72">{children}</div>
    </div>
  );
}
