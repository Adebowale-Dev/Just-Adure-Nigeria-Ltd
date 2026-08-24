import { useState, useTransition } from "react";
import { AlertTriangle, MessageSquareText, Search } from "lucide-react";
import { createSupportTicket, lookupSupportTicket } from "@/lib/api.js";

const initialForm = { type: "contact", name: "", email: "", phone: "", subject: "", orderNumber: "", productSlug: "", message: "" };

export function ContactClient() {
  const [form, setForm] = useState(initialForm);
  const [lookup, setLookup] = useState({ ticketNumber: "", email: "" });
  const [ticket, setTicket] = useState(null);
  const [lookupTicket, setLookupTicket] = useState(null);
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
        setLookupTicket(await lookupSupportTicket(lookup));
      } catch (lookupError) {
        setLookupTicket(null);
        setError(lookupError instanceof Error ? lookupError.message : "Could not find that support ticket.");
      }
    });
  }

  return (
    <main className="min-h-screen">
      <section className="hero-grid border-b border-black/8">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="section-kicker">Customer support</p>
          <h1 className="mt-4 font-serif text-5xl font-bold leading-none tracking-[-.06em] sm:text-7xl">Talk to the store.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">Send a contact message, product enquiry or order-support request. Every request gets a ticket number.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_24rem] lg:px-8">
        <form onSubmit={submitTicket} className="rounded-[2rem] border border-black/8 bg-white/80 p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)] sm:p-8">
          <div className="flex items-center gap-3"><MessageSquareText className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Create support ticket</h2></div>
          {error ? <div className="mt-6 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold text-[var(--ink)]"><AlertTriangle className="mb-2 size-5 text-[var(--accent-dark)]" />{error}</div> : null}
          {ticket ? <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">Ticket created: {ticket.ticketNumber}. Keep this number for follow-up.</div> : null}
          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">Request type<select name="type" value={form.type} onChange={updateField} className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"><option value="contact">Contact</option><option value="product_enquiry">Product enquiry</option><option value="order_support">Order support</option></select></label>
            <label className="grid gap-2 text-sm font-bold">Full name<input name="name" value={form.name} onChange={updateField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Email<input name="email" type="email" value={form.email} onChange={updateField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Phone<input name="phone" value={form.phone} onChange={updateField} className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold sm:col-span-2">Subject<input name="subject" value={form.subject} onChange={updateField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Order number<input name="orderNumber" value={form.orderNumber} onChange={updateField} placeholder="Optional" className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Product slug<input name="productSlug" value={form.productSlug} onChange={updateField} placeholder="Optional" className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold sm:col-span-2">Message<textarea name="message" value={form.message} onChange={updateField} required minLength={10} rows={5} className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
          </div>
          <button type="submit" disabled={isPending} className="cta-primary mt-8 w-full"><MessageSquareText className="size-4" /> {isPending ? "Submitting..." : "Submit ticket"}</button>
        </form>

        <aside className="h-fit rounded-[2rem] border border-black/8 bg-[var(--ink)] p-6 text-white shadow-[0_24px_70px_rgba(28,34,31,.18)]">
          <div className="flex items-center gap-3"><Search className="size-5 text-[var(--accent)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Track ticket</h2></div>
          <form onSubmit={submitLookup} className="mt-6 grid gap-4">
            <label className="grid gap-2 text-sm font-bold">Ticket number<input name="ticketNumber" value={lookup.ticketNumber} onChange={updateLookup} required className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-[var(--ink)] outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Email<input name="email" type="email" value={lookup.email} onChange={updateLookup} required className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-[var(--ink)] outline-none" /></label>
            <button type="submit" disabled={isPending} className="cta-primary bg-[var(--accent)] text-[var(--ink)]">Track ticket</button>
          </form>
          {lookupTicket ? <div className="mt-6 rounded-2xl bg-white/8 p-4"><p className="font-black">{lookupTicket.subject}</p><p className="mt-1 text-sm text-white/65">Status: {lookupTicket.status.replaceAll("_", " ")}</p><div className="mt-4 grid gap-3">{lookupTicket.replies.map((reply) => <p key={reply._id ?? reply.createdAt} className="rounded-xl bg-white/8 p-3 text-sm text-white/75">{reply.message}</p>)}</div></div> : null}
        </aside>
      </section>
    </main>
  );
}