"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Home, MapPin, Plus, Trash2 } from "lucide-react";
import { addAccountAddress, deleteAccountAddress, getAccount, updateAccountAddress } from "@/lib/api.js";

type Address = {
  id?: string;
  label: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  state: string;
  city: string;
  deliveryInstructions: string;
  isDefault: boolean;
};

type Account = {
  email?: string;
  addresses?: Address[];
};

const emptyAddress: Address = {
  label: "Home",
  recipientName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  state: "",
  city: "",
  deliveryInstructions: "",
  isDefault: false,
};

function TextInput({ label, name, value, onChange, placeholder, required = false }: {
  label: string;
  name: string;
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="grid gap-2 text-sm font-black text-[var(--ink)]">
      {label}
      <input name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} className="rounded-2xl border border-black/10 bg-[#fbfaf6] px-4 py-3.5 text-[var(--ink)] outline-none transition placeholder:text-black/35 focus:border-[var(--accent-dark)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,123,37,.12)]" />
    </label>
  );
}

export function CustomerAddressesPage() {
  const [account, setAccount] = useState<Account | null>(null);
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function loadAccount() {
    getAccount()
      .then((data) => {
        setAccount(data);
        setError("");
      })
      .catch((loadError) => {
        setAccount(null);
        setError(loadError instanceof Error ? loadError.message : "Please log in to manage your addresses.");
      });
  }

  useEffect(() => {
    loadAccount();
  }, []);

  function updateAddressField(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    const checked = event.target instanceof HTMLInputElement ? event.target.checked : false;
    const type = event.target instanceof HTMLInputElement ? event.target.type : "text";
    setAddress((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function saveAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const nextAccount = editingAddressId ? await updateAccountAddress(editingAddressId, address) : await addAccountAddress(address);
        setAccount(nextAccount);
        setAddress(emptyAddress);
        setEditingAddressId("");
        setMessage(editingAddressId ? "Address updated successfully." : "Address added successfully.");
        setError("");
      } catch (addressError) {
        setError(addressError instanceof Error ? addressError.message : "Could not save address.");
      }
    });
  }

  function editAddress(nextAddress: Address) {
    if (!nextAddress.id) return;
    setEditingAddressId(nextAddress.id);
    setAddress({
      label: nextAddress.label ?? "Home",
      recipientName: nextAddress.recipientName ?? "",
      phone: nextAddress.phone ?? "",
      addressLine1: nextAddress.addressLine1 ?? "",
      addressLine2: nextAddress.addressLine2 ?? "",
      state: nextAddress.state ?? "",
      city: nextAddress.city ?? "",
      deliveryInstructions: nextAddress.deliveryInstructions ?? "",
      isDefault: Boolean(nextAddress.isDefault),
    });
  }

  function removeAddress(addressId?: string) {
    if (!addressId) return;
    startTransition(async () => {
      try {
        const nextAccount = await deleteAccountAddress(addressId);
        setAccount(nextAccount);
        setMessage("Address deleted successfully.");
        setError("");
      } catch (deleteError) {
        setError(deleteError instanceof Error ? deleteError.message : "Could not delete address.");
      }
    });
  }

  if (error && !account) {
    return (
      <main className="auth-shell min-h-screen px-4 py-16 sm:px-6 lg:px-8">
        <section className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-3xl items-center justify-center">
          <div className="w-full rounded-[2rem] border border-[var(--accent)]/30 bg-white p-8 text-center shadow-[0_24px_70px_rgba(18,27,23,.1)] sm:p-10">
            <AlertTriangle className="mx-auto size-10 text-[var(--accent-dark)]" />
            <h1 className="mt-5 font-serif text-5xl font-bold tracking-[-.05em] text-[var(--ink)]">Login required.</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">{error}</p>
            <a href="/login" className="cta-primary mx-auto mt-7 w-fit">Go to login <ArrowRight className="size-4" /></a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="page-shell px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
      <section className="mx-auto max-w-7xl">
        <div className="surface-card mb-8 grid gap-5 p-6 lg:grid-cols-[1fr_auto] lg:items-center lg:p-8">
          <div>
            <p className="section-kicker">Address book</p>
            <h1 className="mt-3 font-serif text-4xl font-bold leading-none tracking-[-.05em] text-[var(--ink)] sm:text-6xl">Saved addresses</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--muted)]">Manage delivery locations for checkout, delivery fees and customer-support follow-up.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <a href="/account" className="cta-outline">Dashboard</a>
            <a href="/checkout" className="cta-primary">Go to checkout <ArrowRight className="size-4" /></a>
          </div>
        </div>

        {(message || error) ? (
          <div className={`mb-6 rounded-2xl border p-4 text-sm font-bold ${error ? "border-[var(--accent)]/30 bg-[#fff8ed] text-[var(--accent-dark)]" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>
            <div className="flex items-start gap-3">
              {error ? <AlertTriangle className="mt-.5 size-5 shrink-0" /> : <CheckCircle2 className="mt-.5 size-5 shrink-0" />}
              <span>{error || message}</span>
            </div>
          </div>
        ) : null}

        <div className="grid gap-8 lg:grid-cols-[.95fr_1.05fr]">
          <form onSubmit={saveAddress} className="surface-card h-fit p-6 sm:p-8 lg:sticky lg:top-28">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="section-kicker">Delivery details</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-.03em] text-[var(--ink)]">{editingAddressId ? "Edit address" : "Add address"}</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Use the exact phone, city and location details for smooth delivery.</p>
              </div>
              {editingAddressId ? <button type="button" className="cta-outline px-5 py-2.5" onClick={() => { setEditingAddressId(""); setAddress(emptyAddress); }}>Cancel edit</button> : null}
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2">
              <TextInput label="Address label" name="label" value={address.label} onChange={updateAddressField} required placeholder="Home, Office, Shop" />
              <TextInput label="Recipient name" name="recipientName" value={address.recipientName} onChange={updateAddressField} required placeholder="Receiver name" />
              <TextInput label="Phone" name="phone" value={address.phone} onChange={updateAddressField} required placeholder="08012345678" />
              <TextInput label="State" name="state" value={address.state} onChange={updateAddressField} required placeholder="Lagos" />
              <TextInput label="City / LGA" name="city" value={address.city} onChange={updateAddressField} required placeholder="Ikeja" />
              <div className="md:col-span-2"><TextInput label="Address line 1" name="addressLine1" value={address.addressLine1} onChange={updateAddressField} required placeholder="Street address" /></div>
              <div className="md:col-span-2"><TextInput label="Address line 2" name="addressLine2" value={address.addressLine2} onChange={updateAddressField} placeholder="Apartment, landmark or extra detail" /></div>
              <label className="grid gap-2 text-sm font-black text-[var(--ink)] md:col-span-2">
                Delivery instructions
                <textarea name="deliveryInstructions" value={address.deliveryInstructions} onChange={updateAddressField} rows={3} placeholder="Optional delivery note" className="resize-none rounded-2xl border border-black/10 bg-[#fbfaf6] px-4 py-3.5 text-[var(--ink)] outline-none transition placeholder:text-black/35 focus:border-[var(--accent-dark)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,123,37,.12)]" />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-4 rounded-3xl bg-[#fbfaf6] p-4 sm:flex-row sm:items-center sm:justify-between">
              <label className="flex items-center gap-3 text-sm font-bold text-[var(--ink)]"><input type="checkbox" name="isDefault" checked={address.isDefault} onChange={updateAddressField} /> Make default address</label>
              <button disabled={isPending || !account} className="cta-primary disabled:opacity-50" type="submit"><Plus className="size-4" /> {editingAddressId ? "Update" : "Save address"}</button>
            </div>
          </form>

          <section className="surface-card p-6 sm:p-8">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-kicker">Delivery locations</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-.03em] text-[var(--ink)]">Your saved addresses</h2>
              </div>
              <p className="rounded-full bg-[#fbfaf6] px-4 py-2 text-sm font-black text-[var(--muted)]">{account?.addresses?.length ?? 0} saved</p>
            </div>

            {account?.addresses?.length ? (
              <div className="mt-6 grid gap-4">
                {account.addresses.map((savedAddress) => (
                  <article key={savedAddress.id} className="rounded-3xl border border-black/8 bg-[#fbfaf6] p-5 transition hover:border-[var(--accent)]/40 hover:bg-white">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-4">
                        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-white text-[var(--accent-dark)] shadow-sm"><Home className="size-5" /></div>
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-black text-[var(--ink)]">{savedAddress.label}</h3>
                            {savedAddress.isDefault ? <span className="rounded-full bg-[#fff3e8] px-3 py-1 text-xs font-black text-[var(--accent-dark)]">Default</span> : null}
                          </div>
                          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{savedAddress.recipientName}, {savedAddress.phone}<br />{savedAddress.addressLine1}{savedAddress.addressLine2 ? `, ${savedAddress.addressLine2}` : ""}<br />{savedAddress.city}, {savedAddress.state}</p>
                          {savedAddress.deliveryInstructions ? <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs font-bold leading-5 text-[var(--accent-dark)]">Note: {savedAddress.deliveryInstructions}</p> : null}
                        </div>
                      </div>
                      <div className="flex gap-2 sm:justify-end">
                        <button type="button" className="cta-outline px-4 py-2" onClick={() => editAddress(savedAddress)}>Edit</button>
                        <button type="button" disabled={isPending} className="rounded-full border border-black/10 bg-white p-3 text-[var(--accent-dark)] disabled:opacity-50" onClick={() => removeAddress(savedAddress.id)} aria-label="Delete address"><Trash2 className="size-4" /></button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-dashed border-black/15 bg-[#fbfaf6] p-8 text-center">
                <MapPin className="mx-auto size-8 text-[var(--accent-dark)]" />
                <h3 className="mt-4 text-2xl font-black tracking-[-.03em] text-[var(--ink)]">No address saved yet.</h3>
                <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--muted)]">Add a delivery address so checkout can calculate location-based delivery fees faster.</p>
              </div>
            )}
          </section>
        </div>
      </section>
    </main>
  );
}
