import { useEffect, useState, useTransition } from "react";
import { BadgeCheck, Layers3, Plus, Tags } from "lucide-react";
import { createAdminBrand, createAdminCategory, createAdminConditionGrade, getAdminCatalogueLookups, updateAdminBrand, updateAdminCategory, updateAdminConditionGrade } from "@/lib/api.js";

const initialCategory = { name: "", slug: "", description: "", imageUrl: "", seoTitle: "", seoDescription: "", isActive: true };
const initialBrand = { name: "", slug: "", description: "", logoUrl: "", isActive: true };
const initialGrade = { code: "", name: "", description: "", sortOrder: "0", isActive: true };

function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function statusText(record) {
  return record.isActive ? "Active" : "Hidden";
}

export function CatalogueLookupsAdmin({ onLookupsChanged }) {
  const [lookups, setLookups] = useState({ categories: [], brands: [], conditionGrades: [] });
  const [category, setCategory] = useState(initialCategory);
  const [brand, setBrand] = useState(initialBrand);
  const [grade, setGrade] = useState(initialGrade);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function loadLookups() {
    getAdminCatalogueLookups()
      .then((data) => {
        setLookups(data);
        setError("");
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Catalogue setup could not load."));
  }

  useEffect(() => {
    loadLookups();
  }, []);

  function updateObject(setter, event, autoSlug = false) {
    const { name, value, type, checked } = event.target;
    setter((current) => {
      const next = { ...current, [name]: type === "checkbox" ? checked : value };
      if (autoSlug && name === "name" && !current.slug) next.slug = slugify(value);
      return next;
    });
  }

  function afterChange(nextMessage) {
    setMessage(nextMessage);
    loadLookups();
    onLookupsChanged?.();
  }

  function saveCategory(event) {
    event.preventDefault();
    startTransition(async () => {
      try {
        setMessage("");
        setError("");
        await createAdminCategory({ ...category, slug: category.slug || slugify(category.name) });
        setCategory(initialCategory);
        afterChange("Category created.");
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Category could not be saved.");
      }
    });
  }

  function saveBrand(event) {
    event.preventDefault();
    startTransition(async () => {
      try {
        setMessage("");
        setError("");
        await createAdminBrand({ ...brand, slug: brand.slug || slugify(brand.name) });
        setBrand(initialBrand);
        afterChange("Brand created.");
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Brand could not be saved.");
      }
    });
  }

  function saveGrade(event) {
    event.preventDefault();
    startTransition(async () => {
      try {
        setMessage("");
        setError("");
        await createAdminConditionGrade({ ...grade, sortOrder: Number(grade.sortOrder || 0) });
        setGrade(initialGrade);
        afterChange("Condition grade created.");
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Condition grade could not be saved.");
      }
    });
  }

  function toggle(type, item) {
    startTransition(async () => {
      try {
        setMessage("");
        setError("");
        const nextStatus = !item.isActive;
        if (type === "category") await updateAdminCategory(item.id, { isActive: nextStatus });
        if (type === "brand") await updateAdminBrand(item.id, { isActive: nextStatus });
        if (type === "grade") await updateAdminConditionGrade(item.id, { isActive: nextStatus });
        afterChange(`${item.name} ${nextStatus ? "enabled" : "hidden"}.`);
      } catch (toggleError) {
        setError(toggleError instanceof Error ? toggleError.message : "Catalogue item could not be updated.");
      }
    });
  }

  return (
    <section className="mt-8 rounded-[2rem] border border-black/8 bg-[#fbfaf6] p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
      <div className="flex items-center gap-3"><Layers3 className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Catalogue setup</h2></div>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Manage the categories, brands and condition grades used when creating products.</p>
      {error ? <p className="mt-4 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold text-[var(--accent-dark)]">{error}</p> : null}
      {message ? <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{message}</p> : null}

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <form onSubmit={saveCategory} className="rounded-2xl border border-black/8 bg-white p-5"><div className="flex items-center gap-2"><Layers3 className="size-4 text-[var(--accent-dark)]" /><h3 className="font-black">Category</h3></div><div className="mt-4 grid gap-3"><input name="name" value={category.name} onChange={(event) => updateObject(setCategory, event, true)} required placeholder="Phones" className="rounded-xl border border-black/10 px-3 py-2 outline-none" /><input name="slug" value={category.slug} onChange={(event) => updateObject(setCategory, event)} required placeholder="phones" className="rounded-xl border border-black/10 px-3 py-2 outline-none" /><textarea name="description" value={category.description} onChange={(event) => updateObject(setCategory, event)} placeholder="Short category note" className="rounded-xl border border-black/10 px-3 py-2 outline-none" /><label className="flex items-center gap-2 text-sm font-bold"><input name="isActive" type="checkbox" checked={category.isActive} onChange={(event) => updateObject(setCategory, event)} /> Active</label><button disabled={isPending} className="cta-primary" type="submit"><Plus className="size-4" /> Add category</button></div></form>
        <form onSubmit={saveBrand} className="rounded-2xl border border-black/8 bg-white p-5"><div className="flex items-center gap-2"><Tags className="size-4 text-[var(--accent-dark)]" /><h3 className="font-black">Brand</h3></div><div className="mt-4 grid gap-3"><input name="name" value={brand.name} onChange={(event) => updateObject(setBrand, event, true)} required placeholder="Apple" className="rounded-xl border border-black/10 px-3 py-2 outline-none" /><input name="slug" value={brand.slug} onChange={(event) => updateObject(setBrand, event)} required placeholder="apple" className="rounded-xl border border-black/10 px-3 py-2 outline-none" /><textarea name="description" value={brand.description} onChange={(event) => updateObject(setBrand, event)} placeholder="Optional brand note" className="rounded-xl border border-black/10 px-3 py-2 outline-none" /><label className="flex items-center gap-2 text-sm font-bold"><input name="isActive" type="checkbox" checked={brand.isActive} onChange={(event) => updateObject(setBrand, event)} /> Active</label><button disabled={isPending} className="cta-primary" type="submit"><Plus className="size-4" /> Add brand</button></div></form>
        <form onSubmit={saveGrade} className="rounded-2xl border border-black/8 bg-white p-5"><div className="flex items-center gap-2"><BadgeCheck className="size-4 text-[var(--accent-dark)]" /><h3 className="font-black">Condition grade</h3></div><div className="mt-4 grid gap-3"><input name="name" value={grade.name} onChange={(event) => updateObject(setGrade, event)} required placeholder="Excellent" className="rounded-xl border border-black/10 px-3 py-2 outline-none" /><input name="code" value={grade.code} onChange={(event) => updateObject(setGrade, event)} required placeholder="excellent" className="rounded-xl border border-black/10 px-3 py-2 outline-none" /><textarea name="description" value={grade.description} onChange={(event) => updateObject(setGrade, event)} required placeholder="Clean UK-used condition" className="rounded-xl border border-black/10 px-3 py-2 outline-none" /><input name="sortOrder" type="number" min={0} value={grade.sortOrder} onChange={(event) => updateObject(setGrade, event)} className="rounded-xl border border-black/10 px-3 py-2 outline-none" /><label className="flex items-center gap-2 text-sm font-bold"><input name="isActive" type="checkbox" checked={grade.isActive} onChange={(event) => updateObject(setGrade, event)} /> Active</label><button disabled={isPending} className="cta-primary" type="submit"><Plus className="size-4" /> Add grade</button></div></form>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <LookupList title="Categories" items={lookups.categories} onToggle={(item) => toggle("category", item)} />
        <LookupList title="Brands" items={lookups.brands} onToggle={(item) => toggle("brand", item)} />
        <LookupList title="Condition grades" items={lookups.conditionGrades} onToggle={(item) => toggle("grade", item)} />
      </div>
    </section>
  );
}

function LookupList({ title, items, onToggle }) {
  return (
    <div className="rounded-2xl border border-black/8 bg-white p-5">
      <h3 className="font-black">{title}</h3>
      <div className="mt-4 grid gap-3">
        {items.map((item) => (
          <article key={item.id} className="rounded-xl bg-[#fbfaf6] p-3">
            <div className="flex items-start justify-between gap-3">
              <div><p className="font-black">{item.name}</p><p className="text-xs font-bold text-[var(--muted)]">{item.slug || item.code} | {statusText(item)}</p></div>
              <button type="button" onClick={() => onToggle(item)} className="cta-outline px-3 py-2 text-xs">{item.isActive ? "Hide" : "Enable"}</button>
            </div>
          </article>
        ))}
        {items.length === 0 ? <p className="text-sm font-bold text-[var(--muted)]">No records yet.</p> : null}
      </div>
    </div>
  );
}

