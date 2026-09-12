"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, Heart, Headphones, MapPin, ReceiptText, UserRound } from "lucide-react";
import { getAccount } from "@/lib/api.js";

type Account = {
  name?: string;
  email?: string;
  phone?: string;
  addresses?: Array<{ isDefault?: boolean; city?: string; state?: string }>;
};

const accountActions = [
  { title: "My profile", text: "Update your name and contact number", href: "/profile", icon: UserRound, tone: "bg-[#fff0e5] text-[var(--accent-dark)]" },
  { title: "Saved addresses", text: "Manage your delivery locations", href: "/account/addresses", icon: MapPin, tone: "bg-[#edf5f0] text-[#27704c]" },
  { title: "My orders", text: "View purchases, updates and invoices", href: "/account/orders", icon: ReceiptText, tone: "bg-[#eef1f7] text-[#455a7d]" },
  { title: "Wishlist", text: "Return to products saved for later", href: "/wishlist", icon: Heart, tone: "bg-[#faedf0] text-[#a84962]" },
];

export function AccountClient() {
  const [account, setAccount] = useState<Account | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    getAccount()
      .then((data) => {
        setAccount(data);
        setError("");
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Please log in to view your account."));
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

  return (
    <main className="landing-page min-h-screen bg-[#f6f3ec] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="mx-auto max-w-6xl">
        <div className="overflow-hidden rounded-[2rem] border border-black/8 bg-white shadow-[0_20px_60px_rgba(22,29,27,.07)]">
          <div className="grid lg:grid-cols-[.82fr_1.18fr]">
            <header className="relative overflow-hidden border-b border-black/8 bg-[#fff9f2] p-6 sm:p-9 lg:border-b-0 lg:border-r lg:p-10">
              <div className="absolute -right-20 -top-24 size-64 rounded-full border border-[var(--accent)]/20" aria-hidden="true" />
              <div className="relative">
                <div className="grid size-14 place-items-center rounded-full bg-[#17201d] text-xl font-black text-white">{initial}</div>
                <p className="mt-8 text-xs font-black uppercase tracking-[.16em] text-[var(--accent-dark)]">Account overview</p>
                <h1 className="landing-display mt-3 text-4xl leading-[1.05] tracking-[-.035em] sm:text-5xl">Welcome, {firstName}.</h1>
                <p className="mt-4 max-w-sm leading-7 text-[var(--muted)]">Everything you need to manage your Just Adure account, kept in one simple place.</p>

                <div className="mt-8 border-t border-black/8 pt-6">
                  <p className="truncate text-sm font-bold text-[var(--ink)]">{account?.email || "Loading your account..."}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">{account?.phone || "No phone number added"}</p>
                  <p className="mt-4 flex items-center gap-2 text-sm font-bold text-[var(--muted)]"><MapPin className="size-4 text-[var(--accent-dark)]" />{defaultAddress ? `${defaultAddress.city}, ${defaultAddress.state}` : "No default delivery address"}</p>
                </div>
              </div>
            </header>

            <div className="p-5 sm:p-8 lg:p-10">
              <div className="flex items-end justify-between gap-4">
                <div><p className="text-xs font-black uppercase tracking-[.15em] text-[var(--muted)]">Your account</p><h2 className="landing-display mt-2 text-3xl tracking-[-.025em]">What would you like to do?</h2></div>
              </div>

              <nav className="mt-7 grid gap-3 sm:grid-cols-2" aria-label="Customer account">
                {accountActions.map(({ title, text, href, icon: Icon, tone }) => (
                  <a key={href} href={href} className="group flex min-h-32 flex-col justify-between rounded-[1.25rem] border border-black/8 bg-[#fbfaf7] p-5 transition hover:-translate-y-0.5 hover:border-black/15 hover:bg-white hover:shadow-[0_14px_35px_rgba(22,29,27,.07)]">
                    <div className="flex items-start justify-between gap-4">
                      <span className={`grid size-10 place-items-center rounded-xl ${tone}`}><Icon className="size-5" /></span>
                      <ArrowRight className="size-4 text-black/30 transition group-hover:translate-x-1 group-hover:text-[var(--accent-dark)]" />
                    </div>
                    <div className="mt-5"><h3 className="font-black text-[var(--ink)]">{title}</h3><p className="mt-1 text-sm leading-5 text-[var(--muted)]">{text}</p></div>
                  </a>
                ))}
              </nav>

              <a href="/contact" className="group mt-5 flex items-center gap-4 rounded-[1.25rem] border border-dashed border-black/15 px-5 py-4 hover:border-[var(--accent)]/45 hover:bg-[#fffaf4]">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#fff0e5] text-[var(--accent-dark)]"><Headphones className="size-5" /></span>
                <span className="min-w-0 flex-1"><strong className="block text-sm">Need help?</strong><span className="block text-sm text-[var(--muted)]">Call or chat with customer support</span></span>
                <ArrowRight className="size-4 shrink-0 text-[var(--muted)] transition group-hover:translate-x-1" />
              </a>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
