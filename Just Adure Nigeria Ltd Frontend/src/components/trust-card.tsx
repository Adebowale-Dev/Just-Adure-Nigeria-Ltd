export function TrustCard({ icon: Icon, title, description }) {
  return (
    <article className="rounded-[1.35rem] border border-white/10 bg-white/6 p-5">
      <Icon className="size-6 text-[var(--accent)]" aria-hidden="true" />
      <h3 className="mt-5 font-black text-white">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-white/65">{description}</p>
    </article>
  );
}
