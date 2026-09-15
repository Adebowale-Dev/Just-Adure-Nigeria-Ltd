import { useEffect, useRef, useState, useTransition } from "react";
import { Archive, PackagePlus, Save } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { archiveAdminProduct, createAdminProduct, getBrands, getCategories, getConditionGrades, updateAdminProduct } from "@/lib/api.js";
import { formatNaira } from "@/lib/utils.js";

const initialForm = {
  name: "",
  slug: "",
  sku: "",
  brandId: "",
  categoryId: "",
  categorySlug: "",
  productType: "used",
  conditionGradeId: "",
  priceNaira: "",
  previousPriceNaira: "",
  stockQuantity: "1",
  lowStockThreshold: "1",
  shortDescription: "",
  description: "",
  visibleDefects: "",
  includedAccessories: "",
  warrantyInformation: "",
  colour: "",
  modelNumber: "",
  vehicleYear: "",
  vehicleMileageKm: "",
  vehicleTransmission: "automatic",
  vehicleFuelType: "petrol",
  vehicleBodyType: "",
  vehicleEngine: "",
  vehicleDrivetrain: "",
  vehicleLocation: "",
  isFeatured: false,
};

function AdminDropdown({ value, options, placeholder = "Select", onValueChange }) {
  const active = options.find((option) => option.value === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex min-h-12 w-full items-center justify-between rounded-2xl border border-black/10 bg-white px-4 py-3 text-left text-sm font-black text-[var(--ink)] outline-none transition hover:border-[var(--accent)]/40">
        <span className="truncate">{active?.label ?? placeholder}</span>
        <span className="ml-3 text-[var(--accent-dark)]">▾</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 w-full min-w-[16rem] overflow-y-auto">
        {options.map((option) => <DropdownMenuItem key={option.value || "empty"} onClick={() => onValueChange(option.value)} className={option.value === value ? "bg-[#fff3e8] text-[var(--accent-dark)]" : ""}>{option.label}</DropdownMenuItem>)}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
function slugify(value) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function nairaToKobo(value) {
  if (value === "") return undefined;
  return Math.max(0, Math.round(Number(value || 0) * 100));
}

function formToPayload(form) {
  const isVehicle = form.categorySlug === "cars";
  return {
    name: form.name,
    slug: form.slug || slugify(form.name),
    sku: form.sku || `JA-${Date.now().toString(36).toUpperCase()}`,
    brandId: form.brandId,
    categoryId: form.categoryId,
    productType: form.productType,
    conditionGradeId: form.productType === "used" ? form.conditionGradeId : undefined,
    priceKobo: nairaToKobo(form.priceNaira) ?? 0,
    previousPriceKobo: nairaToKobo(form.previousPriceNaira),
    stockQuantity: Number(form.stockQuantity || 0),
    lowStockThreshold: Number(form.lowStockThreshold || 1),
    shortDescription: form.shortDescription,
    description: form.description,
    visibleDefects: form.visibleDefects || undefined,
    includedAccessories: form.includedAccessories || undefined,
    warrantyInformation: form.warrantyInformation || undefined,
    colour: form.colour || undefined,
    modelNumber: form.modelNumber || undefined,
    vehicleDetails: isVehicle ? {
      year: Number(form.vehicleYear),
      mileageKm: Number(form.vehicleMileageKm),
      transmission: form.vehicleTransmission,
      fuelType: form.vehicleFuelType,
      bodyType: form.vehicleBodyType,
      engine: form.vehicleEngine || undefined,
      drivetrain: form.vehicleDrivetrain || undefined,
      location: form.vehicleLocation,
    } : null,
    isFeatured: form.isFeatured,
  };
}

function productToForm(product) {
  return {
    ...initialForm,
    name: product.name ?? "",
    slug: product.slug ?? "",
    sku: product.sku ?? "",
    brandId: product.brand?.id ?? "",
    categoryId: product.category?.id ?? "",
    categorySlug: product.category?.slug ?? "",
    productType: product.productType ?? "used",
    conditionGradeId: product.conditionGrade?.id ?? "",
    priceNaira: String(Math.round((product.priceKobo ?? 0) / 100)),
    previousPriceNaira: product.previousPriceKobo ? String(Math.round(product.previousPriceKobo / 100)) : "",
    stockQuantity: String(product.stockQuantity ?? 0),
    lowStockThreshold: String(product.lowStockThreshold ?? 1),
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    visibleDefects: product.visibleDefects ?? "",
    includedAccessories: product.includedAccessories ?? "",
    warrantyInformation: product.warrantyInformation ?? "",
    colour: product.colour ?? "",
    modelNumber: product.modelNumber ?? "",
    vehicleYear: product.vehicleDetails?.year ? String(product.vehicleDetails.year) : "",
    vehicleMileageKm: product.vehicleDetails?.mileageKm !== undefined ? String(product.vehicleDetails.mileageKm) : "",
    vehicleTransmission: product.vehicleDetails?.transmission ?? "automatic",
    vehicleFuelType: product.vehicleDetails?.fuelType ?? "petrol",
    vehicleBodyType: product.vehicleDetails?.bodyType ?? "",
    vehicleEngine: product.vehicleDetails?.engine ?? "",
    vehicleDrivetrain: product.vehicleDetails?.drivetrain ?? "",
    vehicleLocation: product.vehicleDetails?.location ?? "",
    isFeatured: Boolean(product.isFeatured),
  };
}

export function ProductManagementAdmin({ products = [], onProductsChanged }) {
  const formRef = useRef<HTMLFormElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const [lookups, setLookups] = useState({ categories: [], brands: [], grades: [] });
  const [selectedProductId, setSelectedProductId] = useState("");
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();
  const selectedProduct = products.find((product) => product.id === selectedProductId);
  const isVehicle = form.categorySlug === "cars";

  useEffect(() => {
    Promise.all([getCategories(), getBrands(), getConditionGrades()])
      .then(([categories, brands, grades]) => setLookups({ categories, brands, grades }))
      .catch(() => setError("Product lookups could not load. Please seed categories, brands and condition grades."));
  }, []);

  useEffect(() => {
    if (!form.brandId && lookups.brands[0]) setForm((current) => ({ ...current, brandId: lookups.brands[0].id }));
    if (!form.categoryId && lookups.categories[0]) setForm((current) => ({ ...current, categoryId: lookups.categories[0].id, categorySlug: lookups.categories[0].slug }));
    if (!form.conditionGradeId && lookups.grades[0]) setForm((current) => ({ ...current, conditionGradeId: lookups.grades[0].id }));
  }, [lookups]);

  function updateField(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => {
      const next = { ...current, [name]: type === "checkbox" ? checked : value };
      if (name === "name" && !selectedProductId) next.slug = slugify(value);
      return next;
    });
  }

  function selectProductId(productId) {
    setSelectedProductId(productId);
    const product = products.find((item) => item.id === productId);
    setForm(product ? productToForm(product) : initialForm);
  }

  function resetForm({ announce = false, focusForm = false } = {}) {
    setSelectedProductId("");
    setError("");
    setMessage(announce ? "Ready to create a new product." : "");
    setForm({
      ...initialForm,
      brandId: lookups.brands[0]?.id ?? "",
      categoryId: lookups.categories[0]?.id ?? "",
      categorySlug: lookups.categories[0]?.slug ?? "",
      conditionGradeId: lookups.grades[0]?.id ?? "",
    });
    if (focusForm) {
      requestAnimationFrame(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        nameInputRef.current?.focus({ preventScroll: true });
      });
    }
  }

  function saveProduct(event) {
    event.preventDefault();
    startTransition(async () => {
      try {
        setMessage("");
        setError("");
        if (form.productType === "used" && !form.conditionGradeId) {
          setError("Choose a condition grade for this used product.");
          return;
        }
        if (selectedProductId) {
          await updateAdminProduct(selectedProductId, formToPayload(form));
          setMessage(`${form.name} updated.`);
        } else {
          await createAdminProduct(formToPayload(form));
          setMessage(`${form.name} created.`);
          resetForm();
        }
        onProductsChanged?.();
      } catch (productError) {
        setError(productError instanceof Error ? productError.message : "Product could not be saved.");
      }
    });
  }

  function archiveProduct() {
    if (!selectedProduct) return;
    startTransition(async () => {
      try {
        setMessage("");
        setError("");
        await archiveAdminProduct(selectedProduct.id);
        setMessage(`${selectedProduct.name} archived.`);
        resetForm();
        onProductsChanged?.();
      } catch (archiveError) {
        setError(archiveError instanceof Error ? archiveError.message : "Product could not be archived.");
      }
    });
  }

  return (
    <section className="surface-card mt-8 p-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div><div className="flex items-center gap-3"><PackagePlus className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Add a product</h2></div><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Fill in the simple details below, save the product, then add its photos.</p></div>
        <button type="button" onClick={() => resetForm({ announce: true, focusForm: true })} className="cta-outline">New product</button>
      </div>
      {error ? <p className="mt-4 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold text-[var(--accent-dark)]">{error}</p> : null}
      {message ? <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{message}</p> : null}

      <details className="mt-6 rounded-2xl border border-black/8 bg-[#fbfaf6] p-4">
        <summary className="cursor-pointer text-sm font-black">Need to edit a product already on the website?</summary>
        <label className="mt-4 grid gap-2 text-sm font-bold">Choose product<AdminDropdown value={selectedProductId} placeholder="Choose a product" options={products.map((product) => ({ value: product.id, label: product.name }))} onValueChange={selectProductId} /></label>
      </details>

      <form ref={formRef} onSubmit={saveProduct} className="mt-6 grid scroll-mt-28 gap-4 md:grid-cols-3">
        <div className="md:col-span-3"><p className="section-kicker">1. What are you selling?</p><p className="mt-1 text-sm text-[var(--muted)]">Start with the information customers use to identify the product.</p></div>
        <label className="grid gap-2 text-sm font-bold md:col-span-3">Product name<input ref={nameInputRef} name="name" value={form.name} onChange={updateField} required placeholder="Example: Samsung 55-inch Smart TV" className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
        <label className="grid gap-2 text-sm font-bold">Category<AdminDropdown value={form.categoryId} placeholder="What kind of product?" options={lookups.categories.map((category) => ({ value: category.id, label: category.name }))} onValueChange={(value) => setForm((current) => ({ ...current, categoryId: value, categorySlug: lookups.categories.find((category) => category.id === value)?.slug ?? "" }))} /></label>
        <label className="grid gap-2 text-sm font-bold">Brand<AdminDropdown value={form.brandId} placeholder="Choose the brand" options={lookups.brands.map((brand) => ({ value: brand.id, label: brand.name }))} onValueChange={(value) => setForm((current) => ({ ...current, brandId: value }))} /></label>
        <label className="grid gap-2 text-sm font-bold">Is it new or used?<AdminDropdown value={form.productType} placeholder="Choose one" options={[{ value: "used", label: "UK used" }, { value: "brand_new", label: "Brand new" }]} onValueChange={(value) => setForm((current) => ({ ...current, productType: value }))} /></label>
        {form.productType === "used" ? <label className="grid gap-2 text-sm font-bold">Condition grade<AdminDropdown value={form.conditionGradeId} placeholder="Select condition grade" options={lookups.grades.map((grade) => ({ value: grade.id, label: grade.name }))} onValueChange={(value) => setForm((current) => ({ ...current, conditionGradeId: value }))} /></label> : null}
        <div className="mt-3 border-t border-black/8 pt-5 md:col-span-3"><p className="section-kicker">2. Price and customer details</p><p className="mt-1 text-sm text-[var(--muted)]">Enter the amount, quantity available, and a clear description.</p></div>
        <label className="grid gap-2 text-sm font-bold">Selling price (₦)<input name="priceNaira" type="number" min={0} value={form.priceNaira} onChange={updateField} required placeholder="Example: 250000" className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
        <label className="grid gap-2 text-sm font-bold">Old price (optional)<input name="previousPriceNaira" type="number" min={0} value={form.previousPriceNaira} onChange={updateField} placeholder="Leave empty if none" className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
        <label className="grid gap-2 text-sm font-bold">How many are available?<input name="stockQuantity" type="number" min={0} value={form.stockQuantity} onChange={updateField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
        <label className="grid gap-2 text-sm font-bold md:col-span-3">Short description<input name="shortDescription" value={form.shortDescription} onChange={updateField} required placeholder="One clear sentence customers will see on the product card" className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
        <label className="grid gap-2 text-sm font-bold md:col-span-3">More about the product<textarea name="description" value={form.description} onChange={updateField} required rows={4} placeholder="Describe its condition, important features, and anything the buyer should know" className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
        <details className="rounded-2xl border border-black/8 bg-[#fbfaf6] p-4 md:col-span-3">
          <summary className="cursor-pointer text-sm font-black">Optional product information</summary>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-bold">Colour<input name="colour" value={form.colour} onChange={updateField} className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Model number<input name="modelNumber" value={form.modelNumber} onChange={updateField} className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Low-stock warning<input name="lowStockThreshold" type="number" min={0} value={form.lowStockThreshold} onChange={updateField} className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none" /></label>
          </div>
        </details>
        {isVehicle ? <>
          <div className="md:col-span-3 mt-2 border-t border-black/8 pt-5"><p className="section-kicker">Vehicle details</p><p className="mt-1 text-sm text-[var(--muted)]">These details help buyers compare cars accurately.</p></div>
          <label className="grid gap-2 text-sm font-bold">Year<input name="vehicleYear" type="number" min={1950} max={2100} value={form.vehicleYear} onChange={updateField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
          <label className="grid gap-2 text-sm font-bold">Mileage (km)<input name="vehicleMileageKm" type="number" min={0} value={form.vehicleMileageKm} onChange={updateField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
          <label className="grid gap-2 text-sm font-bold">Body type<input name="vehicleBodyType" value={form.vehicleBodyType} onChange={updateField} required placeholder="SUV, Saloon, Hatchback" className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
          <label className="grid gap-2 text-sm font-bold">Transmission<AdminDropdown value={form.vehicleTransmission} options={["automatic", "manual", "cvt", "other"].map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }))} onValueChange={(value) => setForm((current) => ({ ...current, vehicleTransmission: value }))} /></label>
          <label className="grid gap-2 text-sm font-bold">Fuel type<AdminDropdown value={form.vehicleFuelType} options={["petrol", "diesel", "hybrid", "electric", "other"].map((value) => ({ value, label: value.charAt(0).toUpperCase() + value.slice(1) }))} onValueChange={(value) => setForm((current) => ({ ...current, vehicleFuelType: value }))} /></label>
          <label className="grid gap-2 text-sm font-bold">Vehicle location<input name="vehicleLocation" value={form.vehicleLocation} onChange={updateField} required placeholder="Ikeja, Lagos" className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
          <label className="grid gap-2 text-sm font-bold">Engine<input name="vehicleEngine" value={form.vehicleEngine} onChange={updateField} placeholder="2.0L" className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
          <label className="grid gap-2 text-sm font-bold">Drivetrain<input name="vehicleDrivetrain" value={form.vehicleDrivetrain} onChange={updateField} placeholder="FWD, RWD, AWD" className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
        </> : null}
        <details className="rounded-2xl border border-black/8 bg-[#fbfaf6] p-4 md:col-span-3">
          <summary className="cursor-pointer text-sm font-black">Optional condition, accessories and warranty</summary>
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <label className="grid gap-2 text-sm font-bold md:col-span-3">Known defects<textarea name="visibleDefects" value={form.visibleDefects} onChange={updateField} rows={2} className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold md:col-span-2">Accessories included<input name="includedAccessories" value={form.includedAccessories} onChange={updateField} className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Warranty<input name="warrantyInformation" value={form.warrantyInformation} onChange={updateField} className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none" /></label>
          </div>
        </details>
        <label className="flex items-center gap-3 text-sm font-bold"><input name="isFeatured" type="checkbox" checked={form.isFeatured} onChange={updateField} /> Featured product</label>
        <div className="flex flex-wrap gap-3 md:col-span-2"><button type="submit" disabled={isPending} className="cta-primary"><Save className="size-4" /> {selectedProductId ? "Save changes" : "Save product and add photos"}</button>{selectedProduct ? <button type="button" disabled={isPending} onClick={archiveProduct} className="cta-outline text-[var(--accent-dark)]"><Archive className="size-4" /> Remove from store</button> : null}</div>
      </form>

      <div className="mt-6 rounded-2xl bg-[#fbfaf6] p-4 text-sm font-bold text-[var(--muted)]">{products.length} product records loaded. Current form total: {formatNaira(nairaToKobo(form.priceNaira) ?? 0)}</div>
    </section>
  );
}
