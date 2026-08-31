import { useState, useTransition } from "react";
import { AlertTriangle, ArrowRight, Clock3, Headphones, Mail, MapPin, MessageSquareText, PackageSearch, Phone, Search, Send, ShieldCheck } from "lucide-react";
import { createSupportTicket, lookupSupportTicket, replySupportTicket } from "@/lib/api.js";

const initialForm = { type: "contact", name: "", email: "", phone: "", subject: "", orderNumber: "", productSlug: "", message: "" };

function statusLabel(value) {
  return String(value ?? "").replaceAll("_", " ");
}

export function ContactClient() {
  const [form, setForm] = useState(initialForm);
  const [lookup, setLookup] = useState({ ticketNumber: "", email: "" });
  const [replyMessage, setReplyMessage] = useState("");
  const [ticket, setTicket] = useState(null);
  const [lookupTicket, setLookupTicket] = useState(null);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function updateLookup(event) {
    const { name, value } = event.target;
    setLookup((current) => ({ ...current, [name]: value }));
  }

  function submitTicket(event) {
    event.preventDefault();
    startTransition(async () => {
      try {
        setError("");
        setStatusMessage("");
        const created = await createSupportTicket({ ...form, phone: form.phone || undefined, orderNumber: form.orderNumber || undefined, productSlug: form.productSlug || undefined });
        setTicket(created);
        setForm(initialForm);
      } catch (supportError) {
        setError(supportError instanceof Error ? supportError.message : "Could not submit your support request.");
      }
    });
  }

  function submitLookup(event) {
    event.preventDefault();
    startTransition(async () => {
      try {
        setError("");
        setStatusMessage("");
        setLookupTicket(await lookupSupportTicket(lookup));
      } catch (lookupError) {
        setLookupTicket(null);
        setError(lookupError instanceof Error ? lookupError.message : "Could not find that support ticket.");
      }
    });
  }

  function submitReply(event) {
    event.preventDefault();
    startTransition(async () => {
      try {
        setError("");
        setStatusMessage("");
        const updated = await replySupportTicket({ ...lookup, name: lookupTicket?.name, message: replyMessage });
        setLookupTicket(updated);
        setReplyMessage("");
        setStatusMessage("Reply added to your support ticket.");
      } catch (replyError) {
        setError(replyError instanceof Error ? replyError.message : "Could not add your reply.");
      }
    });
  }

  return (
    <main className="min-h-screen bg-[#f6f1e8]">
      <section className="relative overflow-hidden border-b border-black/8 bg-[radial-gradient(circle_at_top_left,#fff7ed_0,#f6f1e8_42%,#efe6d8_100%)]">
        <div className="absolute right-[-8rem] top-[-10rem] size-[28rem] rounded-full bg-[var(--accent)]/15 blur-3xl" />
        <div className="absolute bottom-[-12rem] left-[10%] size-[24rem] rounded-full bg-white/60 blur-3xl" />
        <div className="relative mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:py-20">
          <div className="flex flex-col justify-center">
            <p className="section-kicker text-[var(--accent-dark)]">Customer care desk</p>
            <h1 className="mt-4 max-w-3xl font-serif text-5xl font-bold leading-none tracking-[-.06em] text-[var(--ink)] sm:text-7xl">Support that helps you buy with confidence.</h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--muted)]">Ask about a product condition, follow up on an order, or send a general enquiry. We keep every conversation organized with a ticket number.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#support-form" className="cta-primary">Open a ticket <ArrowRight className="size-4" /></a>
              <a href="https://wa.me/2340000000000" className="rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-black text-[var(--ink)] shadow-[0_12px_30px_rgba(28,34,31,.06)] hover:border-[var(--accent)]">WhatsApp support</a>
            </div>
          </div>

          <div className="rounded-[2.25rem] border border-black/8 bg-white/85 p-5 shadow-[0_24px_70px_rgba(28,34,31,.09)] backdrop-blur">
            <div className="rounded-[1.75rem] border border-black/8 bg-[#fbfaf6] p-6 text-[var(--ink)]">
              <Headphones className="size-9 text-[var(--accent)]" />
              <h2 className="mt-6 text-3xl font-black tracking-[-.04em]">How we handle requests</h2>
              <div className="mt-6 grid gap-3">
                {[{ icon: MessageSquareText, title: "Create ticket", text: "Tell us what you need and include order or product details if available." }, { icon: PackageSearch, title: "We review", text: "The support/admin team checks your enquiry against real stock and order data." }, { icon: ShieldCheck, title: "Clear follow-up", text: "Track replies using your ticket number and email address." }].map((item) => {
                  const Icon = item.icon;
                  return <div key={item.title} className="rounded-2xl border border-black/8 bg-white p-4"><Icon className="size-5 text-[var(--accent)]" /><p className="mt-3 font-black">{item.title}</p><p className="mt-1 text-sm leading-6 text-[var(--muted)]">{item.text}</p></div>;
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 md:grid-cols-3 lg:px-8">
        <article className="rounded-[1.5rem] border border-black/8 bg-white p-5 shadow-[0_16px_45px_rgba(28,34,31,.05)]"><Phone className="size-6 text-[var(--accent-dark)]" /><h3 className="mt-4 font-black">Call support</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Use your official store phone number for urgent order questions.</p></article>
        <article className="rounded-[1.5rem] border border-black/8 bg-white p-5 shadow-[0_16px_45px_rgba(28,34,31,.05)]"><Mail className="size-6 text-[var(--accent-dark)]" /><h3 className="mt-4 font-black">Email trail</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Every ticket keeps the subject, message, customer email and replies together.</p></article>
        <article className="rounded-[1.5rem] border border-black/8 bg-white p-5 shadow-[0_16px_45px_rgba(28,34,31,.05)]"><Clock3 className="size-6 text-[var(--accent-dark)]" /><h3 className="mt-4 font-black">Response focus</h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Product enquiries, delivery updates and order issues can be followed from one place.</p></article>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-16 sm:px-6 lg:grid-cols-[1fr_25rem] lg:px-8">
        <form id="support-form" onSubmit={submitTicket} className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_24px_70px_rgba(28,34,31,.08)] sm:p-8">
          <div className="flex flex-col gap-3 border-b border-black/8 pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="section-kicker text-[var(--accent-dark)]">New request</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-.04em] text-[var(--ink)]">Create support ticket</h2>
            </div>
            <p className="max-w-sm text-sm font-bold leading-6 text-[var(--muted)]">Add clear details so the team can respond faster.</p>
          </div>
          {error ? <div className="mt-6 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold text-[var(--ink)]"><AlertTriangle className="mb-2 size-5 text-[var(--accent-dark)]" />{error}</div> : null}
          {ticket ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">Ticket created: {ticket.ticketNumber}. Keep this number for follow-up.</div> : null}
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">Request type<select name="type" value={form.type} onChange={updateField} className="rounded-2xl border border-black/10 bg-[#fbfaf6] px-4 py-3 outline-none focus:border-[var(--accent-dark)]"><option value="contact">General contact</option><option value="product_enquiry">Product enquiry</option><option value="order_support">Order support</option></select></label>
            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">Full name<input name="name" value={form.name} onChange={updateField} required placeholder="Your full name" className="rounded-2xl border border-black/10 bg-[#fbfaf6] px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">Email<input name="email" type="email" value={form.email} onChange={updateField} required placeholder="you@example.com" className="rounded-2xl border border-black/10 bg-[#fbfaf6] px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">Phone<input name="phone" value={form.phone} onChange={updateField} placeholder="080..." className="rounded-2xl border border-black/10 bg-[#fbfaf6] px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold text-[var(--ink)] sm:col-span-2">Subject<input name="subject" value={form.subject} onChange={updateField} required placeholder="Example: I need details about a washing machine" className="rounded-2xl border border-black/10 bg-[#fbfaf6] px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">Order number<input name="orderNumber" value={form.orderNumber} onChange={updateField} placeholder="Optional" className="rounded-2xl border border-black/10 bg-[#fbfaf6] px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold text-[var(--ink)]">Product slug<input name="productSlug" value={form.productSlug} onChange={updateField} placeholder="Optional" className="rounded-2xl border border-black/10 bg-[#fbfaf6] px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold text-[var(--ink)] sm:col-span-2">Message<textarea name="message" value={form.message} onChange={updateField} required minLength={10} rows={6} placeholder="Write the full details here..." className="rounded-2xl border border-black/10 bg-[#fbfaf6] px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
          </div>
          <button type="submit" disabled={isPending} className="cta-primary mt-8 w-full"><MessageSquareText className="size-4" /> {isPending ? "Submitting..." : "Submit ticket"}</button>
        </form>

        <aside className="h-fit rounded-[2rem] border border-black/8 bg-white p-6 text-[var(--ink)] shadow-[0_24px_70px_rgba(28,34,31,.08)]">
          <div className="rounded-[1.5rem] bg-[#fff3e7] p-5">
            <Search className="size-6 text-[var(--accent-dark)]" />
            <h2 className="mt-4 text-2xl font-black tracking-[-.03em]">Track ticket</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Enter your ticket number and email to view replies or send more information.</p>
          </div>
          <form onSubmit={submitLookup} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-bold">Ticket number<input name="ticketNumber" value={lookup.ticketNumber} onChange={updateLookup} required placeholder="SUP-..." className="rounded-2xl border border-black/10 bg-[#fbfaf6] px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold">Email<input name="email" type="email" value={lookup.email} onChange={updateLookup} required placeholder="you@example.com" className="rounded-2xl border border-black/10 bg-[#fbfaf6] px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]" /></label>
            <button type="submit" disabled={isPending} className="cta-primary bg-[var(--accent)] text-[var(--ink)]">Track ticket</button>
          </form>
          {statusMessage ? <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{statusMessage}</p> : null}
          {lookupTicket ? <div className="mt-6 rounded-2xl border border-black/8 bg-[#fbfaf6] p-4"><p className="font-black">{lookupTicket.subject}</p><p className="mt-1 text-sm capitalize text-[var(--muted)]">Status: {statusLabel(lookupTicket.status)}</p><div className="mt-4 grid gap-3">{lookupTicket.replies.map((reply) => <p key={reply._id ?? reply.createdAt} className="rounded-xl bg-white p-3 text-sm text-[var(--muted)]"><span className="block font-black text-[var(--ink)]">{reply.authorName ?? reply.authorType}</span>{reply.message}</p>)}</div><form onSubmit={submitReply} className="mt-5 grid gap-3"><label className="grid gap-2 text-sm font-bold">Add reply<textarea value={replyMessage} onChange={(event) => setReplyMessage(event.target.value)} required minLength={2} rows={4} className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]" /></label><button type="submit" disabled={isPending} className="cta-primary bg-[var(--accent)] text-[var(--ink)]"><Send className="size-4" /> {isPending ? "Sending..." : "Send reply"}</button></form></div> : null}
          <div className="mt-6 rounded-[1.5rem] border border-dashed border-black/15 p-5">
            <MapPin className="size-5 text-[var(--accent-dark)]" />
            <p className="mt-3 text-sm font-black">Store assistance</p>
            <p className="mt-1 text-sm leading-6 text-[var(--muted)]">Use the admin store settings later to display the real address, phone and WhatsApp number here.</p>
          </div>
        </aside>
      </section>
    </main>
  );
}

