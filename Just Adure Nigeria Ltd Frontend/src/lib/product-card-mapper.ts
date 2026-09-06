export const fallbackImage = "/product-images/product-placeholder.svg";

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