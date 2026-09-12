import { ArrowRight, CheckCircle2, Clock3, MessageCircle, Phone } from "lucide-react";

const supportNumber = "+234 814 272 5863";
const callHref = "tel:+2348142725863";
const whatsappHref = "https://wa.me/2348142725863?text=Hello%20Just%20Adure%2C%20I%20need%20help%20with%20a%20product%20or%20order.";

const contactChecklist = [
  "The product name or link",
  "Your order number, if you have ordered",
  "A short description of what you need",
];

export function ContactClient() {
  return (
    <main className="landing-page min-h-screen bg-[var(--paper)] text-[var(--ink)]">
      <section className="border-b border-black/8 bg-[#fffaf4]">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center sm:px-6 sm:py-10 lg:px-8">
          <div>
            <h1 className="landing-display text-3xl leading-tight tracking-[-.025em] sm:text-4xl">Customer support</h1>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid gap-5 md:grid-cols-2">
          <a href={callHref} className="group rounded-[1.75rem] border border-black/8 bg-white p-6 shadow-[0_14px_45px_rgba(28,34,31,.05)] transition hover:-translate-y-1 hover:border-[var(--accent)]/45 sm:p-8">
            <span className="grid size-12 place-items-center rounded-full bg-[#fff3e8] text-[var(--accent-dark)]"><Phone className="size-6" /></span>
            <h2 className="landing-display mt-7 text-2xl tracking-[-.02em]">Call support</h2>
            <p className="mt-3 max-w-lg leading-7 text-[var(--muted)]">Best for urgent questions about availability, delivery, payment, or an order already in progress.</p>
            <span className="mt-7 inline-flex items-center gap-2 font-black text-[var(--accent-dark)]">{supportNumber}<ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
          </a>

          <a href={whatsappHref} target="_blank" rel="noreferrer" className="group rounded-[1.75rem] border border-black/8 bg-white p-6 shadow-[0_14px_45px_rgba(28,34,31,.05)] transition hover:-translate-y-1 hover:border-[#2f9e63]/45 sm:p-8">
            <span className="grid size-12 place-items-center rounded-full bg-[#eaf8ef] text-[#18794e]"><MessageCircle className="size-6" /></span>
            <h2 className="landing-display mt-7 text-2xl tracking-[-.02em]">WhatsApp support</h2>
            <p className="mt-3 max-w-lg leading-7 text-[var(--muted)]">Send product links, photos, order details, or questions and continue the conversation at your convenience.</p>
            <span className="mt-7 inline-flex items-center gap-2 font-black text-[#18794e]">Start a conversation<ArrowRight className="size-4 transition group-hover:translate-x-1" /></span>
          </a>
        </div>

        <div className="mt-8 grid gap-5 rounded-[1.75rem] border border-black/8 bg-[#f0ede5] p-6 sm:p-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center">
          <div>
            <Clock3 className="size-6 text-[var(--accent-dark)]" />
            <h2 className="landing-display mt-4 text-2xl tracking-[-.02em]">Before contacting us</h2>
            <p className="mt-2 leading-7 text-[var(--muted)]">Having these details ready helps us answer you faster.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {contactChecklist.map((item) => <div key={item} className="rounded-2xl bg-white p-4"><CheckCircle2 className="size-5 text-[var(--accent-dark)]" /><p className="mt-3 text-sm font-bold leading-6">{item}</p></div>)}
          </div>
        </div>
      </section>
    </main>
  );
}
