import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatNaira } from "@/lib/utils";

export interface ProductCardProduct {
  name: string;
  slug: string;
  priceKobo: number;
  previousPriceKobo?: number;
  condition: string;
  imageUrl: string;
  defectNote: string;
}

export function ProductCard({ product }: { product: ProductCardProduct }) {
  return (
    <article className="group overflow-hidden rounded-[1.5rem] border border-black/8 bg-white shadow-[0_18px_50px_rgba(28,34,31,0.06)]">
      <Link href={`/product/${product.slug}`} className="block overflow-hidden bg-[#e9e8e2]">
        <div className="relative aspect-[4/3]">
          <Image
            src={product.imageUrl}
            alt={`${product.name} actual product view`}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className="object-cover transition duration-500 group-hover:scale-[1.035]"
          />
          <span className="absolute left-4 top-4 rounded-full bg-white/92 px-3 py-1 text-xs font-black uppercase tracking-[0.08em] text-[var(--ink)] backdrop-blur">
            {product.condition}
          </span>
        </div>
      </Link>
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-black tracking-[-0.025em] text-[var(--ink)]">
              <Link href={`/product/${product.slug}`}>{product.name}</Link>
            </h3>
            <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{product.defectNote}</p>
          </div>
          <ArrowUpRight className="mt-1 size-5 shrink-0 text-[var(--accent-dark)]" aria-hidden="true" />
        </div>
        <div className="mt-5 flex items-baseline gap-2">
          <span className="text-xl font-black text-[var(--ink)]">{formatNaira(product.priceKobo)}</span>
          {product.previousPriceKobo ? (
            <span className="text-sm text-[var(--muted)] line-through">{formatNaira(product.previousPriceKobo)}</span>
          ) : null}
        </div>
      </div>
    </article>
  );
}
