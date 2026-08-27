"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Heart, MapPin, PackageCheck, UserRound } from "lucide-react";
import { CustomerOrderHistory } from "@/components/customer/customer-order-history";
import { getAccount } from "@/lib/api.js";

export function AccountClient() {
  const [account, setAccount] = useState(null);
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
      <main className="min-h-screen">
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-[var(--accent)]/30 bg-white p-8 text-center shadow-[0_18px_50px_rgba(28,34,31,.06)]">
            <AlertTriangle className="mx-auto size-9 text-[var(--accent-dark)]" />
            <h1 className="mt-5 font-serif text-5xl font-bold tracking-[-.05em]">Login required.</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">{error}</p>
            <a href="/login" className="cta-primary mx-auto mt-6 w-fit">Go to login</a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <section className="hero-grid border-b border-black/8">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="section-kicker">Customer dashboard</p>
          <h1 className="mt-5 font-serif text-5xl font-bold leading-none tracking-[-.06em] sm:text-7xl">Your orders, wishlist and account tools.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">Track orders, manage your profile, update delivery details and return to your saved products.</p>
          {account ? <p className="mt-5 rounded-2xl bg-white/70 p-4 text-sm font-bold text-[var(--ink)]">Signed in as {account.email}</p> : <p className="mt-6 font-bold">Loading account...</p>}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          <a href="/profile" className="rounded-[1.5rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(28,34,31,.1)]">
            <UserRound className="size-6 text-[var(--accent-dark)]" />
            <h2 className="mt-4 text-xl font-black tracking-[-.03em]">Profile page</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Edit your name, phone number and saved delivery addresses.</p>
          </a>
          <a href="/wishlist" className="rounded-[1.5rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(28,34,31,.1)]">
            <Heart className="size-6 text-[var(--accent-dark)]" />
            <h2 className="mt-4 text-xl font-black tracking-[-.03em]">Wishlist</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">View saved products and move available items into your cart.</p>
          </a>
          <a href="/order-tracking" className="rounded-[1.5rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(28,34,31,.1)]">
            <MapPin className="size-6 text-[var(--accent-dark)]" />
            <h2 className="mt-4 text-xl font-black tracking-[-.03em]">Track order</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Check a current order using its order number and email address.</p>
          </a>
        </div>

        <section className="mt-8 rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)] sm:p-8">
          <div className="flex items-center gap-3"><PackageCheck className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Order history</h2></div>
          <CustomerOrderHistory />
        </section>
      </section>
    </main>
  );
}


