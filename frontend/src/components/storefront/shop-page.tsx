"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, Filter, PackageSearch, Search, SlidersHorizontal } from "lucide-react";
import { ProductCard } from "@/components/storefront/product-card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { getBrands, getCatalogueOptions, getCategories, getConditionGrades, getProducts } from "@/lib/api.js";
import { productToCard } from "@/lib/product-card-mapper";

const defaultFilters = { q: "", category: "", brand: "", condition: "", sort: "newest" };
const carsCategory = {
  id: "cars",
  name: "Cars",
  slug: "cars",
  description: "Inspected used cars with transparent vehicle details.",
};
const carBrands = [
  { name: "Toyota", slug: "toyota" },
  { name: "Nissan", slug: "nissan" },
  { name: "Honda", slug: "honda" },
  { name: "Lexus", slug: "lexus" },
  { name: "Mercedes-Benz", slug: "mercedes-benz" },
  { name: "BMW", slug: "bmw" },
  { name: "Hyundai", slug: "hyundai" },
  { name: "Kia", slug: "kia" },
  { name: "Ford", slug: "ford" },
  { name: "Volkswagen", slug: "volkswagen" },
];

function includeCarsCategory(categories) {
  return categories.some((category) => category.slug === "cars")
    ? categories
    : [...categories, carsCategory].sort((left, right) => left.name.localeCompare(right.name));
}

const sortOptions = [
  { label: "Newest", value: "newest" },
  { label: "Oldest", value: "oldest" },
  { label: "Price: low to high", value: "price_asc" },
  { label: "Price: high to low", value: "price_desc" },
];

function FilterDropdown({ label, value, options, placeholder, onChange, compact = false }) {
  const selected = options.find((option) => option.value === value);

  return (
    <div className={compact ? "flex items-center gap-2 text-sm font-bold" : "grid gap-2 text-sm font-bold"}>
      <span className={compact ? "flex items-center gap-2" : ""}>{label}</span>
      <DropdownMenu>
        <DropdownMenuTrigger className={`flex items-center justify-between gap-3 border border-black/10 bg-[#fbfaf6] text-left font-black outline-none transition hover:border-[var(--accent-dark)] hover:bg-white ${compact ? "min-w-48 rounded-full px-4 py-2" : "w-full rounded-2xl px-4 py-3"}`}>
          <span className="truncate">{selected?.label ?? placeholder}</span>
          <ChevronDown className="size-4 shrink-0 text-[var(--muted)]" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className={compact ? "w-56" : "w-64"}>
          {options.map((option) => (
            <DropdownMenuItem key={option.value || "all"} onClick={() => onChange(option.value)} className={option.value === value ? "bg-[#fff3e7] font-black text-[var(--accent-dark)]" : ""}>
              {option.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

export function ShopPage({ defaultCategory = "", defaultQuery = "" }) {
  const [products, setProducts] = useState(null);
  const [filters, setFilters] = useState({ ...defaultFilters, q: defaultQuery, category: defaultCategory });
  const [lookups, setLookups] = useState({ categories: [], brands: [], grades: [] });
  const [errorMessage, setErrorMessage] = useState("");
  const availableBrands = filters.category === "cars"
    ? carBrands.map((carBrand) => lookups.brands.find((brand) => brand.slug === carBrand.slug) ?? carBrand)
    : lookups.brands;

  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    params.set("limit", "24");

    setProducts(null);
    Promise.all([
      getProducts(params),
      getCategories(),
      getBrands(),
      getConditionGrades(),
      filters.category ? getCatalogueOptions(filters.category) : null,
    ])
      .then(([productData, categoryData, brandData, gradeData, contextualOptions]) => {
        setProducts(productData);
        const contextualBrands = contextualOptions?.brands?.length ? contextualOptions.brands : (filters.category === "cars" ? brandData : []);
        const contextualGrades = contextualOptions?.conditionGrades?.length ? contextualOptions.conditionGrades : gradeData;
        setLookups({
          categories: includeCarsCategory(categoryData),
          brands: filters.category ? contextualBrands : brandData,
          grades: filters.category ? contextualGrades : gradeData,
        });
        setErrorMessage("");
      })
      .catch(() => setErrorMessage("The product catalogue is not available yet. Please confirm the backend is running on port 4000 and MongoDB is ready."));
  }, [filters]);


  const updateFilter = (event) => setFilters((current) => ({ ...current, [event.target.name]: event.target.value }));
  const setFilterValue = (name, value) => setFilters((current) => ({
    ...current,
    [name]: value,
    ...(name === "category" ? { brand: "" } : {}),
  }));
  const clearFilters = () => setFilters({ ...defaultFilters });

  return (
    <main className="page-shell">


      <section className="mx-auto grid max-w-7xl gap-7 px-4 pb-14 pt-8 sm:px-6 sm:pt-10 lg:grid-cols-[18rem_1fr] lg:px-8 lg:pt-12">
        <aside className="h-fit rounded-[1.5rem] border border-black/8 bg-white p-5 shadow-[0_18px_50px_rgba(28,34,31,.05)]">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 font-black"><Filter className="size-4" /> Filters</div>
            <button type="button" onClick={clearFilters} className="text-xs font-black uppercase tracking-[.12em] text-[var(--accent-dark)]">Clear</button>
          </div>

          <div className="mt-5 grid gap-4">
            <label className="grid gap-2 text-sm font-bold">Search
              <div className="flex rounded-2xl border border-black/10 bg-[#fbfaf6] px-3 py-2 transition focus-within:border-black/30 focus-within:bg-white">
                <Search className="mr-2 size-4 text-[var(--muted)]" />
                <input name="q" value={filters.q} onChange={updateFilter} className="shop-filter-search-input w-full border-0 bg-transparent outline-none focus:ring-0" placeholder="Dell, fridge, SKU..." />
              </div>
            </label>

            <FilterDropdown label="Category" value={filters.category} placeholder="All categories" options={[{ label: "All categories", value: "" }, ...lookups.categories.map((item) => ({ label: item.name, value: item.slug }))]} onChange={(value) => setFilterValue("category", value)} />

            <FilterDropdown label={filters.category === "cars" ? "Car brand" : "Brand"} value={filters.brand} placeholder={filters.category === "cars" ? "All car brands" : "All brands"} options={[{ label: filters.category === "cars" ? "All car brands" : "All brands", value: "" }, ...availableBrands.map((item) => ({ label: item.name, value: item.slug }))]} onChange={(value) => setFilterValue("brand", value)} />

            <FilterDropdown label="Condition" value={filters.condition} placeholder="All conditions" options={[{ label: "All conditions", value: "" }, ...lookups.grades.map((item) => ({ label: item.name, value: item.code }))]} onChange={(value) => setFilterValue("condition", value)} />
          </div>
        </aside>

        <div>
          <div className="mb-5 flex flex-col gap-3 rounded-[1.35rem] bg-white p-4 shadow-[0_14px_40px_rgba(28,34,31,.04)] sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[.14em] text-[var(--muted)]">Product catalogue</p>
              <p className="mt-1 font-black text-[var(--ink)]">{products ? `Showing ${products.items.length} of ${products.meta.totalItems} products` : "Loading available products"}</p>
            </div>
            <FilterDropdown compact label={<><SlidersHorizontal className="size-4 text-[var(--accent-dark)]" /> Sort</>} value={filters.sort} placeholder="Newest" options={sortOptions} onChange={(value) => setFilterValue("sort", value)} />
          </div>

          {errorMessage ? <div className="rounded-[1.5rem] border border-[var(--accent)]/30 bg-white p-6 text-[var(--ink)]"><AlertTriangle className="mb-3 size-6 text-[var(--accent-dark)]" /><p className="font-black">Catalogue unavailable</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{errorMessage}</p></div> : null}

          {!products && !errorMessage ? <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((item) => <div key={item} className="h-96 animate-pulse rounded-[1.5rem] bg-white" />)}</div> : null}

          {products ? (products.items.length > 0 ? <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{products.items.map((product) => <ProductCard key={product.id} product={productToCard(product)} />)}</div> : <div className="rounded-[1.5rem] border border-black/8 bg-white p-10 text-center shadow-[0_18px_50px_rgba(28,34,31,.05)]"><PackageSearch className="mx-auto mb-4 size-10 text-[var(--accent-dark)]" /><p className="font-black">No products found</p><p className="mt-2 text-sm text-[var(--muted)]">Try another search or remove one filter.</p><button type="button" onClick={clearFilters} className="cta-primary mt-5">Clear filters</button></div>) : null}
        </div>
      </section>
    </main>
  );
}
