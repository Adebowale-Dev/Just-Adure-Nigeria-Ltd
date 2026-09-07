import { ArrowRight, ChevronRight } from "lucide-react";

type PageSection = {
  title: string;
  body: string;
  items?: string[];
};

type InformationPage = {
  eyebrow: string;
  title: string;
  intro: string;
  updated?: string;
  sections: PageSection[];
};

const pageContent: Record<string, InformationPage> = {
  "frequently asked questions": {
    eyebrow: "Customer help",
    title: "Frequently asked questions",
    intro: "Straightforward answers about our UK-used products, orders, payments, delivery, and returns.",
    sections: [
      { title: "Are the products new?", body: "No. Unless a listing clearly says otherwise, our products are UK-used. Each listing includes a condition grade and notes about visible wear or known issues." },
      { title: "Can I inspect a product before buying?", body: "Check the product page for actual images and condition details. Contact our team before checkout if you need another detail confirmed." },
      { title: "How do I pay?", body: "Checkout is completed through Paystack. An order is marked as paid only after the payment reference has been verified." },
      { title: "How is delivery calculated?", body: "The delivery fee depends on the destination and available delivery method. You will see the fee and final total before payment." },
      { title: "Can I track my order?", body: "Yes. Use the order-tracking page with your order details, or sign in and open Orders from your account." },
      { title: "How do returns work?", body: "Start a return request from an eligible order or contact support. We review the item, reason, delivery record, and original listing before giving the next steps." },
    ],
  },
  "delivery information": {
    eyebrow: "Customer care",
    title: "Delivery information",
    intro: "What to expect from checkout until your order reaches you.",
    sections: [
      { title: "Delivery areas", body: "Available destinations and delivery methods are shown during checkout. Coverage and timing may vary by location and product size." },
      { title: "Delivery charges", body: "Charges are calculated before payment using your delivery location, selected method, and the items in your order." },
      { title: "Order processing", body: "After payment is verified, we confirm stock, prepare the item, and update the order as it moves through processing and dispatch." },
      { title: "Receiving your order", body: "Use an accurate phone number and address. Inspect the package promptly and report visible delivery damage or a material mismatch as soon as reasonably possible." },
    ],
  },
  "delivery and returns": {
    eyebrow: "Customer care",
    title: "Delivery and returns",
    intro: "A clear overview of delivery, inspection, return requests, and refunds.",
    sections: [
      { title: "Before delivery", body: "We verify payment and confirm the item is available before dispatch. Delivery estimates are estimates and can be affected by distance, item size, or circumstances outside our control." },
      { title: "When your order arrives", body: "Confirm that the delivered product matches your order. Keep packaging and supporting evidence if the item arrives damaged, materially different from its listing, or unsuitable for an agreed purpose." },
      { title: "Requesting a return", body: "Open the relevant order and submit a return request, or contact support with your order number. Do not send an item back until return instructions have been provided." },
      { title: "Review and refund", body: "We review the request against the listing, condition record, and applicable consumer rights. When a refund is approved, processing time can depend on the original payment provider." },
    ],
  },
  "return and refund policy": {
    eyebrow: "After-sales support",
    title: "Return and refund policy",
    intro: "How to raise a problem and how eligible return and refund requests are handled.",
    updated: "7 September 2026",
    sections: [
      { title: "When to contact us", body: "Contact us if an item is unsafe, damaged in delivery, materially different from its description or sample, or unsuitable for a particular purpose that was agreed before purchase." },
      { title: "Submitting a request", body: "Provide the order number, affected item, reason, and clear photos or video where relevant. Submit the request within a reasonable time after delivery so it can be assessed properly." },
      { title: "Item care during review", body: "Keep the item, included accessories, and packaging safe. Avoid further use once a fault or mismatch is identified, except where limited testing is reasonably necessary." },
      { title: "Assessment", body: "We compare the request with the product listing, disclosed UK-used condition, inspection notes, delivery information, and applicable consumer protections. Normal wear that was clearly disclosed is not treated as an undisclosed defect." },
      { title: "Approved outcomes", body: "Depending on the circumstances and applicable rights, an outcome may include repair, replacement, store resolution, or refund. Any lawful consumer right remains unaffected by this policy." },
      { title: "Refund timing", body: "Approved refunds are sent through the agreed payment route. Banks and payment providers may require additional processing time after we submit the refund." },
    ],
  },
  "privacy policy": {
    eyebrow: "Store policy",
    title: "Privacy policy",
    intro: "How Just Adure Nigeria Ltd collects, uses, protects, and manages personal information.",
    updated: "7 September 2026",
    sections: [
      { title: "Information we collect", body: "We may collect account details, contact information, delivery addresses, order records, support messages, wishlist activity, and technical information needed to operate and secure the store." },
      { title: "How we use information", body: "We use information to create accounts, process and deliver orders, verify payments, provide support, prevent misuse, maintain records, and send requested store communications." },
      { title: "Payments", body: "Payments are processed through Paystack. We do not display or store your complete card details in our customer or admin interfaces." },
      { title: "Google sign-in", body: "If you choose Google sign-in, we receive the verified account identifier, name, and email needed to create or access your Just Adure account. We do not receive your Google password." },
      { title: "Sharing and service providers", body: "Information may be shared with service providers that support payments, delivery, email, hosting, security, and store operations, or where disclosure is required by law." },
      { title: "Security and retention", body: "We apply reasonable technical and organisational safeguards and retain information only for operational, legal, security, and accounting needs." },
      { title: "Your choices and rights", body: "You may ask to access, correct, or address concerns about your personal information. Some records may need to be retained where required for legitimate or legal purposes." },
    ],
  },
  "terms and conditions": {
    eyebrow: "Store policy",
    title: "Terms and conditions",
    intro: "The practical rules that apply when you browse, create an account, or place an order with Just Adure Nigeria Ltd.",
    updated: "7 September 2026",
    sections: [
      { title: "Using the store", body: "You must provide accurate information and use the website lawfully. You are responsible for activity performed through your account and should protect access to your email and devices." },
      { title: "UK-used product condition", body: "Our catalogue includes used and second-hand products. Review the actual images, condition grade, known marks, included accessories, price, and warranty information shown on each product page before ordering." },
      { title: "Prices and availability", body: "Prices are shown in Nigerian naira unless stated otherwise. Products are subject to availability, and stock is checked again during checkout because many items are one-off units." },
      { title: "Orders and payment", body: "Submitting checkout does not guarantee acceptance. An order is confirmed after required details, stock, totals, and payment have been successfully validated. We may contact you if an order requires clarification." },
      { title: "Delivery", body: "You must provide an accessible and accurate delivery address and contact number. Delivery charges and available methods are presented before payment where supported." },
      { title: "Cancellations, returns, and refunds", body: "Requests are handled under our Return and Refund Policy and applicable Nigerian consumer protections. Nothing in these terms excludes a right that cannot lawfully be excluded." },
      { title: "Website content", body: "We aim to keep descriptions, prices, and availability accurate. If a material error is found before fulfilment, we will explain the issue and provide an appropriate next step." },
      { title: "Changes and contact", body: "We may update these terms when store operations or legal requirements change. The version published here applies from its stated update date. Contact support if any term is unclear before ordering." },
    ],
  },
  "warranty information": {
    eyebrow: "After-sales support",
    title: "Warranty information",
    intro: "Understand the warranty information attached to an individual UK-used product.",
    sections: [
      { title: "Check the product listing", body: "Warranty coverage can differ between products. The applicable duration and any product-specific terms should be shown on the product page or order record." },
      { title: "What condition means", body: "A condition grade describes visible wear and general state; it is not a replacement for the warranty information provided for that item." },
      { title: "Reporting a fault", body: "Contact support with your order number, a description of the problem, and supporting photos or video. Avoid unauthorised repairs while a warranty request is being assessed." },
      { title: "Your statutory rights", body: "Any product-specific warranty operates alongside consumer rights that apply under Nigerian law and does not remove rights that cannot lawfully be excluded." },
    ],
  },
  about: {
    eyebrow: "About the store",
    title: "Just Adure Nigeria Ltd",
    intro: "A straightforward way to shop inspected UK-used electronics, appliances, furniture, and bicycles in Nigeria.",
    sections: [
      { title: "What we sell", body: "Our catalogue brings together practical UK-used products across home, office, entertainment, and mobility categories." },
      { title: "How we list products", body: "We aim to show clear product images, condition grades, known marks, availability, and pricing so customers can make informed choices." },
      { title: "How we support customers", body: "Customers can save products, place and track orders, manage delivery details, request returns, and contact the support team from one store account." },
      { title: "Our approach", body: "We favour plain information over confusing sales language: what the product is, what condition it is in, what it costs, and what happens after purchase." },
    ],
  },
};

function normalizeTitle(title = "") {
  return title.toLowerCase().replaceAll("-", " ").trim();
}

function sectionId(title: string) {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export function BasicPage({ title }: { title: string }) {
  const requestedKey = normalizeTitle(title);
  const key = { faq: "frequently asked questions", privacy: "privacy policy", terms: "terms and conditions" }[requestedKey] ?? requestedKey;
  const content: InformationPage = pageContent[key] ?? {
    eyebrow: "Store information",
    title: key || "Information",
    intro: "Helpful information from Just Adure Nigeria Ltd.",
    sections: [{ title: "Contact us", body: "This information is being updated. Contact our support team if you need help." }],
  };

  return (
    <main className="bg-[#f7f5ef] text-[var(--ink)]">
      <header className="border-b border-black/8 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <p className="flex items-center gap-1 text-sm font-bold text-[var(--muted)]"><a href="/" className="hover:text-[var(--accent-dark)]">Home</a><ChevronRight className="size-4" />{content.eyebrow}</p>
          <p className="section-kicker mt-8">{content.eyebrow}</p>
          <h1 className="mt-4 max-w-4xl font-serif text-4xl font-bold leading-tight tracking-[-.045em] sm:text-6xl">{content.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--muted)]">{content.intro}</p>
          {content.updated ? <p className="mt-5 text-sm font-bold text-[var(--muted)]">Last updated: {content.updated}</p> : null}
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[15rem_1fr] lg:px-8 lg:py-16">
        <aside className="h-fit rounded-2xl border border-black/8 bg-white p-5 lg:sticky lg:top-28">
          <p className="text-xs font-black uppercase tracking-[.16em] text-[var(--accent-dark)]">On this page</p>
          <nav className="mt-4 grid gap-1" aria-label={`${content.title} sections`}>
            {content.sections.map((section) => <a key={section.title} href={`#${sectionId(section.title)}`} className="rounded-lg px-3 py-2 text-sm font-bold text-[var(--muted)] hover:bg-[#fff3e8] hover:text-[var(--ink)]">{section.title}</a>)}
          </nav>
        </aside>

        <article className="overflow-hidden rounded-2xl border border-black/8 bg-white px-6 sm:px-9">
          {content.sections.map((section, index) => (
            <section key={section.title} id={sectionId(section.title)} className="scroll-mt-32 border-b border-black/8 py-8 last:border-0 sm:py-10">
              <div className="grid gap-4 sm:grid-cols-[2.5rem_1fr]">
                <span className="grid size-9 place-items-center rounded-full bg-[#fff0e3] text-sm font-black text-[var(--accent-dark)]">{index + 1}</span>
                <div>
                  <h2 className="text-xl font-black tracking-[-.02em] sm:text-2xl">{section.title}</h2>
                  <p className="mt-3 max-w-3xl leading-7 text-[var(--muted)]">{section.body}</p>
                  {section.items ? <ul className="mt-4 grid gap-2 text-sm leading-6 text-[var(--muted)]">{section.items.map((item) => <li key={item} className="flex gap-3"><span className="mt-2 size-1.5 shrink-0 rounded-full bg-[var(--accent)]" />{item}</li>)}</ul> : null}
                </div>
              </div>
            </section>
          ))}
        </article>
      </div>

      <section className="border-t border-black/8 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <div><h2 className="text-xl font-black">Still need help?</h2><p className="mt-1 text-sm text-[var(--muted)]">Contact our team before placing an order if anything is unclear.</p></div>
          <a href="/contact" className="cta-primary shrink-0">Contact support <ArrowRight className="size-4" /></a>
        </div>
      </section>
    </main>
  );
}
