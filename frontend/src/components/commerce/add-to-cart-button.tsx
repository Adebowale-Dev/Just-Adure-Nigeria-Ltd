import { useState, useTransition } from "react";
import { CheckCircle2, ShoppingBag } from "lucide-react";
import { addCartItem } from "@/lib/api.js";
import { notifyCartUpdated } from "@/lib/cart-events";

export function AddToCartButton({ productId, disabled }) {
  const [message, setMessage] = useState("");
  const [isAdded, setIsAdded] = useState(false);
  const [isPending, startTransition] = useTransition();

  function addProductToCart() {
    startTransition(async () => {
      try {
        const cart = await addCartItem({ productId, quantity: 1 });
        notifyCartUpdated(cart);
        setIsAdded(true);
        setMessage("Added to cart. You can review it from the cart page.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not add this product to cart.");
      }
    });
  }

  return (
    <div className="mt-8 grid gap-3">
      <button
        disabled={disabled || isPending || isAdded}
        className={isAdded ? "inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-6 py-3 text-sm font-black text-emerald-800 disabled:cursor-default" : "cta-primary w-full disabled:cursor-not-allowed disabled:opacity-50"}
        type="button"
        onClick={addProductToCart}
      >
        {isAdded ? <CheckCircle2 className="size-4" /> : <ShoppingBag className="size-4" />}
        {disabled ? "Sold out" : isAdded ? "Added to cart" : isPending ? "Adding..." : "Add to cart"}
      </button>
      {isAdded ? <a href="/cart" className="inline-flex min-h-12 w-full items-center justify-center rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-black text-[var(--ink)] transition hover:border-[var(--accent)] hover:bg-[#fff7ed]">View cart</a> : null}
      {message ? <p className="text-center text-sm font-bold text-[var(--accent-dark)]">{message}</p> : null}
    </div>
  );
}
