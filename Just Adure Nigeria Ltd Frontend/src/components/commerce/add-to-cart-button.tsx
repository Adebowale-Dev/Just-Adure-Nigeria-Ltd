import { useState, useTransition } from "react";
import { ShoppingBag } from "lucide-react";
import { addCartItem } from "@/lib/api.js";
export function AddToCartButton({ productId, disabled }) {
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  return <div className="mt-8"><button disabled={disabled || isPending} className="cta-primary w-full disabled:cursor-not-allowed disabled:opacity-50" type="button" onClick={() => startTransition(async () => { try { await addCartItem({ productId, quantity: 1 }); setMessage("Added to cart. You can review it from the cart page."); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not add this product to cart."); } })}><ShoppingBag className="size-4" /> {disabled ? "Sold out" : isPending ? "Adding..." : "Add to cart"}</button>{message ? <p className="mt-3 text-center text-sm font-bold text-[var(--accent-dark)]">{message}</p> : null}</div>;
}
