"use client";

import { useState, useTransition } from "react";
import { Mail } from "lucide-react";
import { subscribeNewsletter } from "@/lib/api.js";

const storeName = process.env.NEXT_PUBLIC_STORE_NAME || "Just Adure Nigeria Ltd";

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
        </div>
        <div>
          <p className="footer-heading">Customer care</p>
          <div className="mt-3 grid gap-2 text-sm"><a href="/faq">Frequently asked questions</a><a href="/delivery-returns">Delivery and returns</a><a href="/contact">Contact us</a></div>
        </div>
        <div>
          <p className="footer-heading">Policies</p>
          <div className="mt-3 grid gap-2 text-sm"><a href="/privacy">Privacy policy</a><a href="/terms">Terms and conditions</a></div>
        </div>
        <div>
          <p className="footer-heading">Newsletter</p>
          <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Get restock updates, UK-used product tips and verified deals.</p>
          <form className="mt-4 flex overflow-hidden rounded-full border border-black/10 bg-white" onSubmit={submitNewsletter}>
            <label className="sr-only" htmlFor="newsletter-email">Email address</label>
            <input id="newsletter-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm outline-none" />
            <button type="submit" disabled={isPending} className="grid size-12 place-items-center bg-[var(--ink)] text-white disabled:opacity-60" aria-label="Subscribe to newsletter"><Mail className="size-4" /></button>
          </form>
          {message ? <p className="mt-3 text-xs font-bold leading-5 text-[var(--accent-dark)]">{message}</p> : null}
        </div>
      </div>
    </footer>
  );
}