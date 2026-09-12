"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Heart, Mail, MapPin, Pencil, Phone, ReceiptText, ShieldCheck, UserRound } from "lucide-react";
import { getAccount, updateAccountProfile } from "@/lib/api.js";

type Account = {
  name?: string;
  email?: string;
  phone?: string;
  addresses?: Array<{ isDefault?: boolean; city?: string; state?: string }>;
};

const accountLinks = [
  { href: "/account/addresses", label: "Saved addresses", description: "Manage delivery locations", icon: MapPin },
  { href: "/account/orders", label: "My orders", description: "View purchases and invoices", icon: ReceiptText },
  { href: "/wishlist", label: "Wishlist", description: "See your saved products", icon: Heart },
];

export function CustomerProfileClient() {
  const [account, setAccount] = useState<Account | null>(null);
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getAccount()
      .then((data) => {
        setAccount(data);
        setProfile({ name: data.name ?? "", phone: data.phone ?? "" });
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Please log in to view your profile."));
  }, []);

  function updateField(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  }

  function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const nextAccount = await updateAccountProfile(profile);
        setAccount(nextAccount);
        setMessage("Your profile has been updated.");
        setError("");
      } catch (profileError) {
        setMessage("");
        setError(profileError instanceof Error ? profileError.message : "Could not update your profile.");
      }
    });
  }

  if (error && !account) {
    return (
      <main className="page-shell px-4 py-16 sm:px-6 lg:px-8">
        <section className="mx-auto max-w-xl rounded-[1.5rem] border border-[var(--accent)]/25 bg-white p-8 text-center shadow-[0_18px_55px_rgba(22,29,27,.08)]">
          <AlertTriangle className="mx-auto size-9 text-[var(--accent-dark)]" />
          <h1 className="mt-5 text-3xl font-black tracking-[-.035em]">Sign in to view your profile</h1>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{error}</p>
          <a href="/login" className="cta-primary mx-auto mt-7 w-fit">Go to sign in <ArrowRight className="size-4" /></a>
        </section>
      </main>
    );
  }

  const initial = (account?.name || account?.email || "J").trim().charAt(0).toUpperCase();
  const defaultAddress = account?.addresses?.find((address) => address.isDefault);

  return (
    <main className="landing-page min-h-screen bg-[#f6f3ec] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="mx-auto max-w-6xl">
        <header className="rounded-[1.5rem] border border-black/10 bg-white">
          <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
            <div className="flex min-w-0 items-center gap-4 sm:gap-5">
              <div className="grid size-16 shrink-0 place-items-center rounded-full border border-black/15 bg-[#f6f3ec] text-2xl font-semibold text-[var(--ink)] sm:size-20 sm:text-3xl">{initial}</div>
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-[.15em] text-[var(--muted)]">My profile</p>
                <h1 className="landing-display mt-1 truncate text-2xl tracking-[-.025em] sm:text-4xl">{account?.name || "Your account"}</h1>
                <p className="mt-1 truncate text-sm text-[var(--muted)]">{account?.email || "Loading account..."}</p>
              </div>
            </div>
            <a href="/account" className="cta-outline w-fit">Account overview</a>
          </div>
        </header>

        {(message || error) ? <div className={`mt-6 flex items-start gap-3 rounded-2xl border p-4 text-sm font-bold ${error ? "border-red-200 bg-red-50 text-red-800" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>{error ? <AlertTriangle className="mt-0.5 size-5 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-5 shrink-0" />}<span>{error || message}</span></div> : null}

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <form onSubmit={saveProfile} className="rounded-[1.5rem] border border-black/10 bg-white p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 border-b border-black/8 pb-6">
              <div>
                <h2 className="landing-display text-2xl tracking-[-.02em]">Personal information</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Keep your name and phone number current for delivery updates.</p>
              </div>
              <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-black/10 bg-[#f6f3ec] text-[var(--muted)]"><UserRound className="size-5" /></span>
            </div>

            <div className="mt-7 grid gap-5 sm:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold">Full name<input name="name" value={profile.name} onChange={updateField} required placeholder="Your full name" className="min-h-12 rounded-xl border border-black/10 bg-[#fbfaf6] px-4 py-3 outline-none transition focus:border-[var(--accent-dark)] focus:bg-white" /></label>
              <label className="grid gap-2 text-sm font-bold">Phone number<input name="phone" value={profile.phone} onChange={updateField} required placeholder="080 1234 5678" className="min-h-12 rounded-xl border border-black/10 bg-[#fbfaf6] px-4 py-3 outline-none transition focus:border-[var(--accent-dark)] focus:bg-white" /></label>
              <label className="grid gap-2 text-sm font-bold sm:col-span-2">Email address<span className="flex min-h-12 items-center gap-3 rounded-xl border border-black/8 bg-[#f1efe9] px-4 py-3 text-[var(--muted)]"><Mail className="size-4 shrink-0" />{account?.email || "Loading..."}</span></label>
            </div>

            <div className="mt-7 flex flex-col gap-3 border-t border-black/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs leading-5 text-[var(--muted)]">Your email is connected to your sign-in account.</p>
              <button disabled={isPending || !account} className="cta-primary shrink-0 disabled:opacity-50" type="submit"><Pencil className="size-4" />{isPending ? "Saving..." : "Save changes"}</button>
            </div>
          </form>

          <aside className="grid content-start gap-6">
            <div className="rounded-[1.5rem] border border-black/10 bg-white p-5">
              <h2 className="text-sm font-bold uppercase tracking-[.13em] text-[var(--muted)]">Account shortcuts</h2>
              <nav className="mt-4 grid gap-2" aria-label="Account shortcuts">
                {accountLinks.map(({ href, label, description, icon: Icon }) => <a key={href} href={href} className="group flex items-center gap-3 rounded-xl border border-transparent p-3 hover:border-black/10 hover:bg-[#f8f7f3]"><span className="grid size-10 shrink-0 place-items-center rounded-xl border border-black/10 bg-white text-[var(--muted)]"><Icon className="size-4" /></span><span className="min-w-0 flex-1"><strong className="block text-sm">{label}</strong><span className="block truncate text-xs text-[var(--muted)]">{description}</span></span><ArrowRight className="size-4 text-black/30 transition group-hover:translate-x-1 group-hover:text-[var(--ink)]" /></a>)}
              </nav>
            </div>

            <div className="rounded-[1.5rem] border border-black/10 bg-white p-5">
              <ShieldCheck className="size-5 text-[var(--muted)]" />
              <h2 className="landing-display mt-4 text-lg">Account details</h2>
              <div className="mt-4 grid gap-3 border-t border-black/8 pt-4 text-sm text-[var(--muted)]">
                <p className="flex items-center gap-2"><Phone className="size-4" />{account?.phone || "Add a phone number"}</p>
                <p className="flex items-center gap-2"><MapPin className="size-4" />{defaultAddress ? `${defaultAddress.city}, ${defaultAddress.state}` : "Add a default address"}</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
