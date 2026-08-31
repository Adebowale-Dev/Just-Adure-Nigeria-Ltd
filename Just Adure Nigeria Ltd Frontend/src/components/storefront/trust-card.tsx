export function TrustCard({ icon: Icon, title, description, tone = "dark" }) {
  const isLight = tone === "light";

  return (
    <article
      className={
        isLight
          ? "rounded-[1.35rem] border border-black/8 bg-[#fbfaf6]2 p-5 shadow-[0_18px_50px_rgba(28,34,31,.06)] backdrop-blur"
          : "rounded-[1.35rem] border border-black/10 bg-[#fbfaf6] p-5"
      }
    >
      <Icon className="size-6 text-[var(--accent)]" aria-hidden="true" />
      <h3 className={isLight ? "mt-5 font-black text-[var(--ink)]" : "mt-5 font-black text-white"}>{title}</h3>
      <p className={isLight ? "mt-2 text-sm leading-6 text-[var(--muted)]" : "mt-2 text-sm leading-6 text-[var(--muted)]"}>{description}</p>
    </article>
  );
}