import { useState, useTransition } from "react";
import { AlertTriangle, MessageSquareText, Send } from "lucide-react";
import { createSupportTicket } from "@/lib/api.js";

export function ProductEnquiryForm({ product }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [ticket, setTicket] = useState(null);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function submitEnquiry(event) {
    event.preventDefault();
    startTransition(async () => {
      try {
        setError("");
        const created = await createSupportTicket({
          type: "product_enquiry",
          name: form.name,
          email: form.email,
          phone: form.phone || undefined,
          subject: `Product enquiry: ${product.name}`,
          productSlug: product.slug,
          message: form.message,
        });
        setTicket(created);
        setForm({ name: "", email: "", phone: "", message: "" });
      } catch (enquiryError) {
        setError(enquiryError instanceof Error ? enquiryError.message : "Could not send your product enquiry.");
      }
    });
  }

  return (
    <form onSubmit={submitEnquiry} className="surface-card p-6 sm:p-8">
      <div className="flex items-center gap-3"><MessageSquareText className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Ask about this item</h2></div>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">Use this for condition, accessories, warranty, delivery or availability questions. We attach the product slug automatically.</p>
      {ticket ? <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">Enquiry sent. Ticket number: {ticket.ticketNumber}</p> : null}
      {error ? <div className="mt-5 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold"><AlertTriangle className="mb-2 size-5 text-[var(--accent-dark)]" />{error}</div> : null}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold">Full name<input name="name" value={form.name} onChange={updateField} required className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
        <label className="grid gap-2 text-sm font-bold">Email<input name="email" type="email" value={form.email} onChange={updateField} required className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
        <label className="grid gap-2 text-sm font-bold sm:col-span-2">Phone<input name="phone" value={form.phone} onChange={updateField} placeholder="Optional" className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
        <label className="grid gap-2 text-sm font-bold sm:col-span-2">Question<textarea name="message" value={form.message} onChange={updateField} required minLength={10} rows={4} className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[var(--accent-dark)]" placeholder="Example: Does this exact unit come with charger and box?" /></label>
      </div>
      <button disabled={isPending} className="cta-primary mt-6 disabled:opacity-50" type="submit"><Send className="size-4" /> {isPending ? "Sending..." : "Send enquiry"}</button>
    </form>
  );
}
