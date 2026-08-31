const pageContent = {
  "frequently asked questions": {
    eyebrow: "Customer help",
    title: "Frequently asked questions",
    intro: "Quick answers about UK-used products, delivery, payment and after-sales support.",
    points: ["All listed products should show their condition grade before checkout.", "Prices are displayed in Nigerian naira.", "Paystack payments are verified by the backend before an order is marked as paid.", "You can contact support if you need clarification before buying."],
  },
  "delivery information": {
    eyebrow: "Delivery guide",
    title: "Delivery information",
    intro: "Delivery fees are calculated based on the selected delivery location and method.",
    points: ["Customers provide state, city or local government area during checkout.", "The backend calculates delivery fees before payment starts.", "Admins can update order delivery status from the dashboard.", "Customers can track order progress after checkout."],
  },
  "return and refund policy": {
    eyebrow: "After-sales support",
    title: "Return and refund policy",
    intro: "Returns are reviewed carefully because UK-used products must be handled with clear condition records.",
    points: ["Customers can request a return from their order page where permitted.", "Admins review the request, reason, product items and customer explanation.", "Refund references are recorded safely after confirmation.", "Approved refunds do not expose payment secret keys to customers or staff screens."],
  },
  "delivery and returns": {
    eyebrow: "Customer care",
    title: "Delivery and returns",
    intro: "Everything customers need to understand delivery, pickup and return handling.",
    points: ["Delivery fees are calculated before payment.", "Order status can be tracked after checkout.", "Return requests are reviewed by the admin team.", "Refund information is handled securely."],
  },
  "privacy policy": {
    eyebrow: "Store policy",
    title: "Privacy policy",
    intro: "Customer information is used only for account, checkout, delivery, payment verification and support workflows.",
    points: ["Authentication uses secure HTTP-only cookies.", "Secret payment and email keys are not exposed in the frontend.", "Customer delivery details are used to process orders.", "Administrative activity is logged for accountability."],
  },
  "terms and conditions": {
    eyebrow: "Store policy",
    title: "Terms and conditions",
    intro: "These terms describe how customers use the store and how orders are processed.",
    points: ["Product condition should be reviewed before checkout.", "Orders are confirmed after trusted payment verification.", "Stock is validated by the backend before payment.", "The store may contact customers for delivery or support updates."],
  },
};

function normalizeTitle(title = "") {
  return title.toLowerCase().replaceAll("-", " ").trim();
}

export function BasicPage({ title }) {
  const key = normalizeTitle(title);
  const content = pageContent[key] ?? {
    eyebrow: "Store information",
    title: key || "Information",
    intro: "This page is prepared for a future milestone.",
    points: ["More details will be added as this section is completed."],
  };

  return (
    <main className="bg-[#f6f3ec] px-4 py-12 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-5xl overflow-hidden rounded-[2.2rem] border border-black/8 bg-white shadow-[0_22px_70px_rgba(28,34,31,.07)]">
        <div className="bg-[linear-gradient(135deg,#fff,#fff4ea)] p-8 sm:p-10">
          <p className="section-kicker">{content.eyebrow}</p>
          <h1 className="mt-4 font-serif text-5xl font-bold capitalize leading-none tracking-[-.05em] text-[var(--ink)] sm:text-6xl">{content.title}</h1>
          <p className="mt-5 max-w-3xl text-lg font-bold leading-8 text-[var(--muted)]">{content.intro}</p>
        </div>
        <div className="grid gap-4 p-6 sm:p-8 md:grid-cols-2">
          {content.points.map((point) => <div key={point} className="rounded-2xl border border-black/8 bg-[#fbfaf6] p-5 text-sm font-bold leading-6 text-[var(--muted)]"><span className="mb-3 block size-2 rounded-full bg-[var(--accent)]" />{point}</div>)}
        </div>
      </section>
    </main>
  );
}
