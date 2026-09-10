"use client";

import { useState, useTransition } from "react";
import { Instagram, Mail, MapPin } from "lucide-react";
import { subscribeNewsletter } from "@/lib/api.js";

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Just Adure Nigeria Ltd";
const footerLinkClass = "w-fit border-b border-transparent py-0.5 transition duration-200 hover:translate-x-1 hover:border-[var(--accent)] hover:text-[var(--accent-dark)]";

function TikTokLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path fill="#25f4ee" transform="translate(-.45 .35)" d="M14.5 3c.4 2.3 1.7 3.7 4 4.1v3.1a8.2 8.2 0 0 1-4-1.2v6.3a5.8 5.8 0 1 1-5-5.7v3.2a2.7 2.7 0 1 0 1.8 2.5V3h3.2Z" />
      <path fill="#fe2c55" transform="translate(.45 -.25)" d="M14.5 3c.4 2.3 1.7 3.7 4 4.1v3.1a8.2 8.2 0 0 1-4-1.2v6.3a5.8 5.8 0 1 1-5-5.7v3.2a2.7 2.7 0 1 0 1.8 2.5V3h3.2Z" />
      <path fill="white" d="M14.5 3c.4 2.3 1.7 3.7 4 4.1v3.1a8.2 8.2 0 0 1-4-1.2v6.3a5.8 5.8 0 1 1-5-5.7v3.2a2.7 2.7 0 1 0 1.8 2.5V3h3.2Z" />
    </svg>
  );
}

export function Footer() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function submitNewsletter(event) {
    event.preventDefault();
    startTransition(async () => {
      try {
        await subscribeNewsletter({ email, source: "footer" });
        setEmail("");
        setMessage("You are subscribed. We will send useful product updates, not noise.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not subscribe right now.");
      }
    });
  }

  return (
    <footer className="border-t border-black/8 bg-[#ece7dc]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.2fr_.8fr_.8fr_1.2fr] lg:px-8">
        <div>
          <p className="text-lg font-black">{storeName}</p>
          <p className="mt-3 max-w-xs text-sm leading-6 text-[var(--muted)]">Trusted UK-used electronics and appliances for customers across Nigeria.</p>
          <address className="mt-4 flex max-w-xs gap-2 text-sm not-italic leading-6 text-[var(--muted)]">
            <MapPin className="mt-1 size-4 shrink-0 text-[var(--accent-dark)]" />
            <span>Shop 8, Temitope Shopping Complex, Iyana Ilogbo Bus Stop.</span>
          </address>
          <div className="mt-6">
            <p className="text-xs font-black uppercase tracking-[.14em] text-[var(--muted)]">Follow us</p>
            <div className="mt-3 flex gap-2">
              <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[#f9ce34] via-[#ee2a7b] to-[#6228d7] text-white shadow-sm" aria-label="Instagram profile coming soon" title="Instagram profile coming soon"><Instagram className="size-5" strokeWidth={2.2} /></span>
              <span className="grid size-10 place-items-center rounded-full bg-black shadow-sm" aria-label="TikTok profile coming soon" title="TikTok profile coming soon"><TikTokLogo /></span>
            </div>
          </div>
        </div>
        <div>
          <p className="footer-heading">Customer care</p>
          <div className="mt-3 grid gap-2 text-sm"><a className={footerLinkClass} href="/faq">Frequently asked questions</a><a className={footerLinkClass} href="/delivery-returns">Delivery and returns</a><a className={footerLinkClass} href="/warranty-information">Warranty information</a><a className={footerLinkClass} href="/contact">Contact us</a></div>
        </div>
        <div>
          <p className="footer-heading">Policies</p>
          <div className="mt-3 grid gap-2 text-sm"><a className={footerLinkClass} href="/return-and-refund-policy">Return and refund policy</a><a className={footerLinkClass} href="/privacy">Privacy policy</a><a className={footerLinkClass} href="/terms">Terms and conditions</a><a className={footerLinkClass} href="/about">About us</a></div>
        </div>
        <div>
          <p className="footer-heading">Newsletter</p>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Get restock updates, UK-used product tips and verified deals.</p>
          <form className="mt-4 flex overflow-hidden rounded-full border border-black/10 bg-white" onSubmit={submitNewsletter}>
            <label className="sr-only" htmlFor="newsletter-email">Email address</label>
            <input id="newsletter-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none" />
            <button type="submit" disabled={isPending} className="grid size-12 place-items-center bg-[var(--accent)] text-[var(--ink)] transition hover:bg-[#ff9b5b] disabled:cursor-not-allowed disabled:opacity-60" aria-label={isPending ? "Subscribing" : "Subscribe to newsletter"}><Mail className="size-4" /></button>
          </form>
          {message ? <p className="mt-3 text-xs font-bold leading-5 text-[var(--accent-dark)]">{message}</p> : null}
        </div>
      </div>
      <div className="px-4 pb-7 text-center text-sm font-bold text-[var(--muted)]">
        <p className="mx-auto w-fit border-t border-black/15 px-2 pt-3">&copy; 2026 Just Adure Nigeria Ltd.com</p>
      </div>
    </footer>
  );
}
