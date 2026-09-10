  "use client";

import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, ArrowRight, CheckCircle2, Home, Mail, MapPin, Pencil, Phone, Plus, ShieldCheck, Trash2, UserRound } from "lucide-react";
import { addAccountAddress, deleteAccountAddress, getAccount, updateAccountAddress, updateAccountProfile } from "@/lib/api.js";

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
  name?: string;
  email?: string;
  phone?: string;
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
      <input name={name} value={value} onChange={onChange} required={required} placeholder={placeholder} className="min-h-12 rounded-2xl border border-black/10 bg-[#fbfaf6] px-4 py-3 text-[var(--ink)] outline-none transition placeholder:text-black/35 focus:border-[var(--accent-dark)] focus:bg-white focus:shadow-[0_0_0_4px_rgba(255,123,37,.12)]" />
    </label>
  );
}

function ProfileFact({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-black/8 bg-[#fbfaf6] p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white text-[var(--accent-dark)] shadow-sm"><Icon className="size-5" /></span>
      <span className="min-w-0">
        <span className="block text-[.68rem] font-black uppercase tracking-[.14em] text-[var(--muted)]">{label}</span>
        <span className="mt-1 block truncate text-sm font-black text-[var(--ink)]">{value || "Not added"}</span>
      </span>
    </div>
  );
}

export function CustomerProfileClient() {
  const [account, setAccount] = useState<Account | null>(null);
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [address, setAddress] = useState<Address>(emptyAddress);
  const [editingAddressId, setEditingAddressId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function loadAccount() {
    getAccount()
      .then((data) => {
        setAccount(data);
        setProfile({ name: data.name ?? "", phone: data.phone ?? "" });
        setError("");
      })
      .catch((loadError) => {
        setAccount(null);
        setError(loadError instanceof Error ? loadError.message : "Please log in to view your profile.");
      });
  }

  useEffect(() => {
    loadAccount();
  }, []);

  function updateProfileField(event: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  }

  function updateAddressField(event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = event.target;
    const checked = event.target instanceof HTMLInputElement ? event.target.checked : false;
    const type = event.target instanceof HTMLInputElement ? event.target.type : "text";
    setAddress((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startTransition(async () => {
      try {
        const nextAccount = await updateAccountProfile(profile);
        setAccount(nextAccount);
        setMessage("Profile updated successfully.");
        setError("");
      } catch (profileError) {
        setError(profileError instanceof Error ? profileError.message : "Could not update profile.");
      }
    });
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

  const addresses = account?.addresses ?? [];
  const defaultAddress = addresses.find((item) => item.isDefault);

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
        <div className="surface-card p-5 sm:p-6">
          <div className="flex flex-col gap-4 border-b border-black/8 pb-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="section-kicker text-[var(--accent-dark)]">Account settings</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-.04em] text-[var(--ink)] sm:text-4xl">Profile and delivery details</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">Manage the contact and delivery information used for checkout, order tracking and support.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href="/account" className="cta-outline">Dashboard</a>
              <a href="/account/orders" className="cta-primary">My orders <ArrowRight className="size-4" /></a>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <ProfileFact icon={UserRound} label="Customer" value={account?.name ?? "Loading..."} />
            <ProfileFact icon={Mail} label="Email" value={account?.email ?? "Loading..."} />
            <ProfileFact icon={Phone} label="Phone" value={account?.phone ?? "Loading..."} />
            <ProfileFact icon={MapPin} label="Default city" value={defaultAddress ? `${defaultAddress.city}, ${defaultAddress.state}` : "No default address"} />
          </div>
        </div>

        {(message || error) ? (
          <div className={`mt-6 rounded-2xl border p-4 text-sm font-bold ${error ? "border-[var(--accent)]/30 bg-[#fff8ed] text-[var(--accent-dark)]" : "border-emerald-200 bg-emerald-50 text-emerald-900"}`}>
            <div className="flex items-start gap-3">
              {error ? <AlertTriangle className="mt-.5 size-5 shrink-0" /> : <CheckCircle2 className="mt-.5 size-5 shrink-0" />}
              <span>{error || message}</span>
            </div>
          </div>
        ) : null}

        <div className="mt-8 grid gap-8 xl:grid-cols-[24rem_1fr]">
          <aside className="grid h-fit gap-5 xl:sticky xl:top-32">
            <form onSubmit={saveProfile} className="surface-card p-6">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="section-kicker text-[var(--accent-dark)]">Personal details</p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-.03em] text-[var(--ink)]">Customer profile</h2>
                </div>
                <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#fff3e8] text-[var(--accent-dark)]"><UserRound className="size-5" /></div>
              </div>
              {!account ? <p className="mt-6 rounded-2xl bg-[#fbfaf6] p-4 text-sm font-bold text-[var(--muted)]">Loading profile...</p> : null}
              <div className="mt-6 grid gap-5">
                <TextInput label="Full name" name="name" value={profile.name} onChange={updateProfileField} required placeholder="Your full name" />
                <TextInput label="Phone number" name="phone" value={profile.phone} onChange={updateProfileField} required placeholder="08012345678" />
              </div>
              {account?.email ? <div className="mt-5 rounded-2xl border border-dashed border-black/15 bg-[#fbfaf6] p-4 text-sm leading-6 text-[var(--muted)]"><strong className="text-[var(--ink)]">Login email:</strong><br />{account.email}</div> : null}
              <button disabled={isPending || !account} className="cta-primary mt-6 w-full disabled:opacity-50" type="submit"><Pencil className="size-4" /> Save profile</button>
            </form>

            <div className="surface-card p-6">
              <ShieldCheck className="size-6 text-[var(--accent-dark)]" />
              <h3 className="mt-4 text-lg font-black text-[var(--ink)]">Checkout ready</h3>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">A complete profile helps the store confirm delivery fees, contact you about orders and resolve support requests faster.</p>
            </div>
          </aside>

          <div className="grid gap-8">
            <form onSubmit={saveAddress} className="surface-card p-6 sm:p-8">
              <div className="flex flex-col gap-4 border-b border-black/8 pb-6 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="section-kicker text-[var(--accent-dark)]">Delivery address</p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-.03em] text-[var(--ink)]">{editingAddressId ? "Edit saved address" : "Add a new address"}</h2>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">Use accurate state, city, phone and landmark details so delivery can be calculated and completed smoothly.</p>
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

              <div className="mt-6 flex flex-col gap-4 rounded-3xl border border-black/8 bg-[#fbfaf6] p-4 sm:flex-row sm:items-center sm:justify-between">
                <label className="flex items-center gap-3 text-sm font-bold text-[var(--ink)]"><input type="checkbox" name="isDefault" checked={address.isDefault} onChange={updateAddressField} /> Use as default delivery address</label>
                <button disabled={isPending || !account} className="cta-primary disabled:opacity-50" type="submit"><Plus className="size-4" /> {editingAddressId ? "Update address" : "Add address"}</button>
              </div>
            </form>

            <section className="surface-card p-6 sm:p-8">
              <div className="flex flex-col gap-2 border-b border-black/8 pb-6 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="section-kicker text-[var(--accent-dark)]">Address book</p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-.03em] text-[var(--ink)]">Saved delivery addresses</h2>
                </div>
                <p className="rounded-full bg-[#fbfaf6] px-4 py-2 text-sm font-black text-[var(--muted)]">{addresses.length} saved</p>
              </div>

              {addresses.length ? (
                <div className="mt-6 grid gap-4 md:grid-cols-2">
                  {addresses.map((savedAddress) => (
                    <article key={savedAddress.id} className="rounded-3xl border border-black/8 bg-[#fbfaf6] p-5 transition hover:border-[var(--accent)]/40 hover:bg-white hover:shadow-[0_16px_45px_rgba(28,34,31,.06)]">
                      <div className="flex items-start justify-between gap-4">
                        <div className="grid size-11 place-items-center rounded-2xl bg-white text-[var(--accent-dark)] shadow-sm"><Home className="size-5" /></div>
                        {savedAddress.isDefault ? <span className="rounded-full bg-[#fff3e8] px-3 py-1 text-xs font-black text-[var(--accent-dark)]">Default</span> : null}
                      </div>
                      <h3 className="mt-5 text-lg font-black text-[var(--ink)]">{savedAddress.label}</h3>
                      <p className="mt-2 text-sm leading-6 text-[var(--muted)]">{savedAddress.recipientName}, {savedAddress.phone}<br />{savedAddress.addressLine1}{savedAddress.addressLine2 ? `, ${savedAddress.addressLine2}` : ""}<br />{savedAddress.city}, {savedAddress.state}</p>
                      {savedAddress.deliveryInstructions ? <p className="mt-3 rounded-2xl bg-white px-4 py-3 text-xs font-bold leading-5 text-[var(--accent-dark)]">Note: {savedAddress.deliveryInstructions}</p> : null}
                      <div className="mt-5 flex gap-2">
                        <button type="button" className="cta-outline flex-1 px-4 py-2" onClick={() => editAddress(savedAddress)}>Edit</button>
                        <button type="button" disabled={isPending} className="rounded-full border border-black/10 bg-white p-3 text-[var(--accent-dark)] disabled:opacity-50" onClick={() => removeAddress(savedAddress.id)} aria-label="Delete address"><Trash2 className="size-4" /></button>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="mt-6 rounded-3xl border border-dashed border-black/15 bg-[#fbfaf6] p-8 text-center">
                  <MapPin className="mx-auto size-8 text-[var(--accent-dark)]" />
                  <h3 className="mt-4 text-xl font-black tracking-[-.03em] text-[var(--ink)]">No saved address yet.</h3>
                  <p className="mx-auto mt-2 max-w-md text-sm font-bold leading-6 text-[var(--muted)]">Add your first delivery address above so checkout can be faster and more accurate.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}
