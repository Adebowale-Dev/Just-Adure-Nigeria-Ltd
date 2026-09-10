import { useEffect, useState, useTransition } from "react";
import { MapPin, Save, Truck } from "lucide-react";
import { createAdminDeliveryZone, getAdminDeliveryZones, updateAdminDeliveryZone } from "@/lib/api.js";
import { formatNaira } from "@/lib/utils.js";

const initialForm = {
  code: "",
  name: "",
  state: "",
  cityPattern: "",
  feeNaira: "2500",
  minDeliveryDays: "1",
  maxDeliveryDays: "3",
  priority: "0",
  isActive: true,
};

function nairaToKobo(value) {
  return Math.max(0, Math.round(Number(value || 0) * 100));
}

function zonePayload(form) {
  return {
    code: form.code,
    name: form.name,
    state: form.state,
    cityPattern: form.cityPattern || undefined,
    feeKobo: nairaToKobo(form.feeNaira),
    minDeliveryDays: Number(form.minDeliveryDays || 1),
    maxDeliveryDays: Number(form.maxDeliveryDays || 1),
    priority: Number(form.priority || 0),
    isActive: form.isActive,
  };
}

export function DeliveryZonesAdmin() {
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [drafts, setDrafts] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function loadZones() {
    getAdminDeliveryZones()
      .then((items) => {
        setZones(items);
        setError("");
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Delivery zones could not load."));
  }

  useEffect(() => {
    loadZones();
  }, []);

  function updateForm(event) {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function createZone(event) {
    event.preventDefault();
    startTransition(async () => {
      try {
        setMessage("");
        setError("");
        await createAdminDeliveryZone(zonePayload(form));
        setForm(initialForm);
        setMessage("Delivery zone created.");
        loadZones();
      } catch (createError) {
        setError(createError instanceof Error ? createError.message : "Delivery zone creation failed.");
      }
    });
  }

  function updateDraft(zoneId, field, value) {
    setDrafts((current) => ({ ...current, [zoneId]: { ...current[zoneId], [field]: value } }));
  }

  function saveZone(zone) {
    startTransition(async () => {
      try {
        setMessage("");
        setError("");
        const draft = drafts[zone.id] ?? {};
        await updateAdminDeliveryZone(zone.id, {
          feeKobo: draft.feeNaira === undefined ? zone.feeKobo : nairaToKobo(draft.feeNaira),
          minDeliveryDays: Number(draft.minDeliveryDays ?? zone.minDeliveryDays),
          maxDeliveryDays: Number(draft.maxDeliveryDays ?? zone.maxDeliveryDays),
          isActive: draft.isActive ?? zone.isActive,
        });
        setMessage(`${zone.name} updated.`);
        loadZones();
      } catch (updateError) {
        setError(updateError instanceof Error ? updateError.message : "Delivery zone update failed.");
      }
    });
  }

  return (
    <section className="surface-card mt-8 p-6">
      <div className="flex items-center gap-3"><Truck className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Delivery zones</h2></div>
      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Manage Nigerian delivery coverage, fees and estimated delivery timelines used by checkout.</p>
      {error ? <p className="mt-4 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold text-[var(--accent-dark)]">{error}</p> : null}
      {message ? <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{message}</p> : null}

      <form onSubmit={createZone} className="mt-6 grid gap-4 md:grid-cols-4">
        <label className="grid gap-2 text-sm font-bold">Code<input name="code" value={form.code} onChange={updateForm} required placeholder="LAG-MAIN" className="rounded-2xl border border-black/10 px-4 py-3 uppercase outline-none" /></label>
        <label className="grid gap-2 text-sm font-bold">Zone name<input name="name" value={form.name} onChange={updateForm} required placeholder="Lagos Mainland" className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
        <label className="grid gap-2 text-sm font-bold">State<input name="state" value={form.state} onChange={updateForm} required placeholder="Lagos" className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
        <label className="grid gap-2 text-sm font-bold">City pattern<input name="cityPattern" value={form.cityPattern} onChange={updateForm} placeholder="Ikeja|Yaba" className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
        <label className="grid gap-2 text-sm font-bold">Fee (NGN)<input name="feeNaira" type="number" min={0} value={form.feeNaira} onChange={updateForm} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
        <label className="grid gap-2 text-sm font-bold">Min days<input name="minDeliveryDays" type="number" min={1} value={form.minDeliveryDays} onChange={updateForm} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
        <label className="grid gap-2 text-sm font-bold">Max days<input name="maxDeliveryDays" type="number" min={1} value={form.maxDeliveryDays} onChange={updateForm} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
        <label className="grid gap-2 text-sm font-bold">Priority<input name="priority" type="number" min={0} value={form.priority} onChange={updateForm} className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
        <label className="flex items-center gap-3 text-sm font-bold md:col-span-2"><input name="isActive" type="checkbox" checked={form.isActive} onChange={updateForm} /> Active delivery location</label>
        <button type="submit" disabled={isPending} className="cta-primary md:col-span-2"><MapPin className="size-4" /> Create delivery zone</button>
      </form>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {zones.map((zone) => {
          const draft = drafts[zone.id] ?? {};
          return (
            <article key={zone.id} className="rounded-2xl border border-black/8 bg-[#fbfaf6] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div><p className="font-black">{zone.name}</p><p className="mt-1 text-sm text-[var(--muted)]">{zone.code} | {zone.state}{zone.cityPattern ? ` | ${zone.cityPattern}` : ""}</p><p className="mt-2 text-xs font-black uppercase tracking-[.12em] text-[var(--accent-dark)]">{zone.isActive ? "Active" : "Inactive"} | {zone.minDeliveryDays}-{zone.maxDeliveryDays} days</p></div>
                <strong>{formatNaira(zone.feeKobo)}</strong>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-4">
                <input type="number" min={0} value={draft.feeNaira ?? Math.round(zone.feeKobo / 100)} onChange={(event) => updateDraft(zone.id, "feeNaira", event.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2 font-black outline-none" aria-label={`Fee for ${zone.name}`} />
                <input type="number" min={1} value={draft.minDeliveryDays ?? zone.minDeliveryDays} onChange={(event) => updateDraft(zone.id, "minDeliveryDays", event.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2 font-black outline-none" aria-label={`Minimum days for ${zone.name}`} />
                <input type="number" min={1} value={draft.maxDeliveryDays ?? zone.maxDeliveryDays} onChange={(event) => updateDraft(zone.id, "maxDeliveryDays", event.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2 font-black outline-none" aria-label={`Maximum days for ${zone.name}`} />
                <button type="button" disabled={isPending} onClick={() => updateDraft(zone.id, "isActive", !(draft.isActive ?? zone.isActive))} className="cta-outline py-2">{(draft.isActive ?? zone.isActive) ? "Disable" : "Enable"}</button>
              </div>
              <button type="button" disabled={isPending} onClick={() => saveZone(zone)} className="cta-primary mt-4"><Save className="size-4" /> Save zone</button>
            </article>
          );
        })}
        {zones.length === 0 ? <p className="text-sm font-bold text-[var(--muted)]">No delivery zones created yet.</p> : null}
      </div>
    </section>
  );
}
