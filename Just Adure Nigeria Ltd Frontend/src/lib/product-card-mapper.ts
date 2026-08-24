export const fallbackImage =
  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85";

export function productToCard(product) {
  return {
    name: product.name,
    slug: product.slug,
    priceKobo: product.priceKobo,
    previousPriceKobo: product.previousPriceKobo ?? undefined,
    condition: product.conditionGrade?.name ?? "UK-used",
    imageUrl: product.primaryImage?.secureUrl ?? product.images?.[0]?.secureUrl ?? fallbackImage,
    defectNote: product.visibleDefects || "Condition checked and listed honestly.",
    isSoldOut: product.isSoldOut,
  };
}