import { ArrowUpRight } from "lucide-react";
import { fallbackImage } from "@/lib/product-card-mapper";
import { formatNaira } from "@/lib/utils.js";

export function ProductCard({ product }) {
  return (
    <article className="group overflow-hidden rounded-[1.5rem] border border-[var(--accent)] bg-white shadow-[0_10px_28px_rgba(28,34,31,0.10)]">
      <a href={`/product/${product.slug}`} className="block overflow-hidden bg-[#e9e8e2]">
        <div className="relative aspect-[4/3]">
          <img src={product.imageUrl || fallbackImage} alt={`${product.name} actual product view`} className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.035]" onError={(event) => { event.currentTarget.src = fallbackImage; }} />
          <span className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-[var(--ink)] backdrop-blur">{product.condition}</span>
          {product.isSoldOut ? <span className="absolute bottom-4 left-4 rounded-full bg-[#fff3e8] px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-[var(--accent-dark)]">Sold out</span> : null}
        </div>
      </a>
      <div className="flex min-h-40 flex-col p-5">
        <div className="flex items-start justify-between gap-4">
          <div><h3 className="text-lg font-black tracking-[-0.025em] text-[var(--ink)]"><a href={`/product/${product.slug}`}>{product.name}</a></h3><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{product.defectNote}</p></div>
          <ArrowUpRight className="mt-1 size-5 shrink-0 text-[var(--accent-dark)]" aria-hidden="true" />
        </div>
        <div className="mt-auto flex items-end justify-between gap-4 pt-3"><div className="flex flex-wrap items-baseline gap-2"><span className="text-xl font-black text-[var(--ink)]">{formatNaira(product.priceKobo)}</span>{product.previousPriceKobo ? <span className="text-sm text-[var(--muted)] line-through">{formatNaira(product.previousPriceKobo)}</span> : null}</div><a href={`/product/${product.slug}`} className="shrink-0 text-sm font-black text-[var(--accent-dark)] hover:underline">View product</a></div>
      </div>
    </article>
  );
}
