export const cartUpdatedEventName = "just-adure-cart-updated";

export function getCartItemCount(cart: { itemCount?: number; items?: Array<{ quantity?: number }> } | null | undefined) {
  if (!cart) return 0;
  if (typeof cart.itemCount === "number") return cart.itemCount;
  return cart.items?.reduce((total, item) => total + Number(item.quantity ?? 0), 0) ?? 0;
}

export function notifyCartUpdated(cart: { itemCount?: number; items?: Array<{ quantity?: number }> } | null | undefined) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(cartUpdatedEventName, { detail: { itemCount: getCartItemCount(cart) } }));
}
