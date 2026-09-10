import { useState, useTransition } from "react";
import { AlertTriangle, Send, Star } from "lucide-react";
import { submitProductReview } from "@/lib/api.js";

export function ProductReviewForm({ productId, onSubmitted }) {
  const [form, setForm] = useState({ rating: "5", title: "", comment: "", imageUrl: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function submitReview(event) {
    event.preventDefault();
    startTransition(async () => {
      try {
        setError("");
        setMessage("");
        const payload = {
          rating: Number(form.rating),
          title: form.title,
          comment: form.comment,
          ...(form.imageUrl ? { imageUrl: form.imageUrl } : {}),
        };
        const review = await submitProductReview(productId, payload);
        setForm({ rating: "5", title: "", comment: "", imageUrl: "" });
        setMessage(review.isVerifiedPurchase ? "Review submitted for moderation as a verified purchase." : "Review submitted for moderation. Verified purchase badge appears after matching a paid order.");
        onSubmitted?.(review);
      } catch (reviewError) {
        setError(reviewError instanceof Error ? reviewError.message : "Could not submit your review.");
      }
    });
  }

  return (
    <form onSubmit={submitReview} className="mt-8 rounded-[1.5rem] border border-black/8 bg-[#fbfaf6] p-5">
      <div className="flex items-center gap-3"><Star className="size-5 fill-[var(--accent)] text-[var(--accent)]" /><h3 className="text-xl font-black tracking-[-.03em]">Write a review</h3></div>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Only logged-in customers can submit. Verified purchase status is checked by the backend from paid orders.</p>
      {message ? <p className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{message}</p> : null}
      {error ? <div className="mt-5 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold"><AlertTriangle className="mb-2 size-5 text-[var(--accent-dark)]" />{error}</div> : null}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-bold">Rating<select name="rating" value={form.rating} onChange={updateField} className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[var(--accent-dark)]">{[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating} star{rating === 1 ? "" : "s"}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-bold">Optional image URL<input name="imageUrl" type="url" value={form.imageUrl} onChange={updateField} placeholder="https://..." className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
        <label className="grid gap-2 text-sm font-bold sm:col-span-2">Review title<input name="title" value={form.title} onChange={updateField} required minLength={2} maxLength={120} className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
        <label className="grid gap-2 text-sm font-bold sm:col-span-2">Comment<textarea name="comment" value={form.comment} onChange={updateField} required minLength={5} maxLength={1000} rows={4} className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none focus:border-[var(--accent-dark)]" placeholder="Tell future buyers if the item matched its listed condition." /></label>
      </div>
      <button disabled={isPending} className="cta-primary mt-6 disabled:opacity-50" type="submit"><Send className="size-4" /> {isPending ? "Submitting..." : "Submit review"}</button>
    </form>
  );
}
