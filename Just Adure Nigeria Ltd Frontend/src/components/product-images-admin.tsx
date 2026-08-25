import { useState, useTransition } from "react";
import { ImagePlus, Save, Star, Trash2 } from "lucide-react";
import { attachAdminProductImage, removeAdminProductImage, setAdminProductPrimaryImage, uploadAdminProductImage } from "@/lib/api.js";

function readFileAsDataUri(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read selected image."));
    reader.readAsDataURL(file);
  });
}

export function ProductImagesAdmin({ products = [], onProductsChanged }) {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? "");
  const [altText, setAltText] = useState("");
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const selectedProduct = products.find((product) => product.id === selectedProductId) ?? products[0];

  function uploadAndAttach(event) {
    event.preventDefault();
    if (!selectedProduct || !file) return;
    startTransition(async () => {
      try {
        setMessage("");
        setError("");
        const dataUri = await readFileAsDataUri(file);
        const image = await uploadAdminProductImage({ dataUri, altText });
        await attachAdminProductImage(selectedProduct.id, { ...image, isPrimary: selectedProduct.images.length === 0 });
        setAltText("");
        setFile(null);
        setMessage(`Image added to ${selectedProduct.name}.`);
        onProductsChanged?.();
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : "Product image upload failed.");
      }
    });
  }

  function makePrimary(image) {
    if (!selectedProduct) return;
    startTransition(async () => {
      try {
        setMessage("");
        setError("");
        await setAdminProductPrimaryImage(selectedProduct.id, image.cloudinaryPublicId);
        setMessage("Primary image updated.");
        onProductsChanged?.();
      } catch (primaryError) {
        setError(primaryError instanceof Error ? primaryError.message : "Could not update primary image.");
      }
    });
  }

  function removeImage(image) {
    if (!selectedProduct) return;
    startTransition(async () => {
      try {
        setMessage("");
        setError("");
        await removeAdminProductImage(selectedProduct.id, image.cloudinaryPublicId);
        setMessage("Product image removed.");
        onProductsChanged?.();
      } catch (removeError) {
        setError(removeError instanceof Error ? removeError.message : "Could not remove product image.");
      }
    });
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-black/8 bg-white/80 p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
      <div className="flex items-center gap-3"><ImagePlus className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Product images</h2></div>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Upload actual UK-used item photos, attach them to products, and choose the main storefront image.</p>
      {error ? <p className="mt-4 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold text-[var(--accent-dark)]">{error}</p> : null}
      {message ? <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{message}</p> : null}

      {selectedProduct ? <form onSubmit={uploadAndAttach} className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr_auto]">
        <label className="grid gap-2 text-sm font-bold">Product<select value={selectedProduct.id} onChange={(event) => setSelectedProductId(event.target.value)} className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none">{products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}</select></label>
        <label className="grid gap-2 text-sm font-bold">Alt text<input value={altText} onChange={(event) => setAltText(event.target.value)} required placeholder="Actual photo of iPhone 13 Pro" className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
        <label className="grid gap-2 text-sm font-bold">Image file<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setFile(event.target.files?.[0] ?? null)} required className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none" /></label>
        <button type="submit" disabled={isPending} className="cta-primary md:col-span-3"><ImagePlus className="size-4" /> Upload and attach image</button>
      </form> : <p className="mt-5 rounded-2xl border border-dashed border-black/15 p-5 text-sm font-bold text-[var(--muted)]">Create a product before adding images.</p>}

      {selectedProduct ? <div className="mt-6 grid gap-4 md:grid-cols-3">
        {(selectedProduct.images ?? []).map((image) => <article key={image.cloudinaryPublicId} className="overflow-hidden rounded-2xl border border-black/8 bg-[#fbfaf6]"><div className="aspect-[4/3] bg-[#e9e8e2]"><img src={image.secureUrl} alt={image.altText} className="h-full w-full object-cover" /></div><div className="p-4"><p className="text-sm font-black">{image.altText}</p><p className="mt-1 text-xs font-bold text-[var(--muted)]">{image.isPrimary ? "Main image" : "Gallery image"}</p><div className="mt-4 flex gap-2"><button type="button" disabled={isPending || image.isPrimary} onClick={() => makePrimary(image)} className="cta-outline px-4 py-2"><Star className="size-4" /> Primary</button><button type="button" disabled={isPending} onClick={() => removeImage(image)} className="rounded-full border border-black/10 p-3 text-[var(--accent-dark)] disabled:opacity-50" aria-label="Remove image"><Trash2 className="size-4" /></button></div></div></article>)}
        {selectedProduct.images?.length === 0 ? <p className="text-sm font-bold text-[var(--muted)]">This product has no images yet.</p> : null}
      </div> : null}
    </section>
  );
}
