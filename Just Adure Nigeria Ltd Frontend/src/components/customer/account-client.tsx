"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ArrowRight, ClipboardList, Heart, MapPin, UserRound } from "lucide-react";
import { CustomerOrderHistory } from "@/components/customer/customer-order-history";
import { getAccount } from "@/lib/api.js";

type Account = {
  name?: string;
  email?: string;
  phone?: string;
  addresses?: unknown[];
};

const dashboardActions = [
  {
    title: "Edit profile",
    text: "Update your name, phone number and account details.",
    href: "/profile",
    icon: UserRound,
  },
  {
    title: "Saved addresses",
    text: "Keep delivery locations ready for faster checkout.",
    href: "/profile",
    icon: MapPin,
  },
  {
    title: "Wishlist",
    text: "Return to products you saved for later.",
    href: "/wishlist",
    icon: Heart,
  },
  {
    title: "Track order",
    text: "Check delivery progress with your order number.",
    href: "/order-tracking",
    icon: ClipboardList,
  },
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
      .catch((loadError) => {
        setAccount(null);
        setError(loadError instanceof Error ? loadError.message : "Please log in to view your account.");
      });
  }, []);


  if (error && !account) {
    return (
      <main className="auth-shell min-h-screen px-4 py-16 sm:px-6 lg:px-8">
        <section className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-3xl items-center justify-center">
          <div className="w-full rounded-[2rem] border border-[var(--accent)]/30 bg-white p-8 text-center shadow-[0_24px_70px_rgba(18,27,23,.1)] sm:p-10">
            <AlertTriangle className="mx-auto size-10 text-[var(--accent-dark)]" />
            <h1 className="mt-5 font-serif text-5xl font-bold tracking-[-.05em] text-[var(--ink)]">Login required.</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">{error}</p>
            <a href="/login" className="cta-primary mx-auto mt-7 w-fit">Go to login <ArrowRight className="size-4" /></a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f6f3ec]">
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-8 sm:px-6 lg:px-8 lg:pt-12">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {dashboardActions.map((action) => {
            const Icon = action.icon;
            return (
              <a key={action.title} href={action.href} className="group rounded-[1.65rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(28,34,31,.1)]">
                <div className="flex size-12 items-center justify-center rounded-2xl bg-[#fff3e8] text-[var(--accent-dark)] transition group-hover:bg-[var(--accent)] group-hover:text-white">
                  <Icon className="size-5" />
                </div>
                <h2 className="mt-5 text-xl font-black tracking-[-.03em] text-[var(--ink)]">{action.title}</h2>
                <p className="mt-2 min-h-12 text-sm leading-6 text-[var(--muted)]">{action.text}</p>
                <span className="mt-5 inline-flex items-center gap-2 text-sm font-black text-[var(--accent-dark)]">Open <ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
              </a>
            );
          })}
        </div>

        <div className="mt-8">
          <CustomerOrderHistory />
        </div>
      </section>
    </main>
  );
}