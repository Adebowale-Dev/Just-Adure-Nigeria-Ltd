"use client";

import { useEffect, useState, useTransition } from "react";
import { AlertTriangle, Home, MapPin, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import { addAccountAddress, deleteAccountAddress, getAccount, updateAccountAddress, updateAccountProfile } from "@/lib/api.js";

const emptyAddress = {
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

export function CustomerProfileClient() {
  const [account, setAccount] = useState(null);
  const [profile, setProfile] = useState({ name: "", phone: "" });
  const [address, setAddress] = useState(emptyAddress);
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

  function updateProfileField(event) {
    const { name, value } = event.target;
    setProfile((current) => ({ ...current, [name]: value }));
  }

  function updateAddressField(event) {
    const { name, value, type, checked } = event.target;
    setAddress((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function saveProfile(event) {
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

  function saveAddress(event) {
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

  function editAddress(nextAddress) {
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

  function removeAddress(addressId) {
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
      <main className="min-h-screen">
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-[var(--accent)]/30 bg-white p-8 text-center shadow-[0_18px_50px_rgba(28,34,31,.06)]">
            <AlertTriangle className="mx-auto size-9 text-[var(--accent-dark)]" />
            <h1 className="mt-5 font-serif text-5xl font-bold tracking-[-.05em]">Login required.</h1>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">{error}</p>
            <a href="/login" className="cta-primary mx-auto mt-6 w-fit">Go to login</a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <section className="hero-grid border-b border-black/8">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="section-kicker">Customer profile</p>
          <h1 className="mt-5 font-serif text-5xl font-bold leading-none tracking-[-.06em] sm:text-7xl">Your profile and delivery details.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">Update your personal details and saved Nigerian delivery addresses before checkout.</p>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[.9fr_1.1fr] lg:px-8">
        <form onSubmit={saveProfile} className="h-fit rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)] sm:p-8">
          <div className="flex items-center gap-3"><UserRound className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Profile information</h2></div>
          {message ? <p className="mt-5 rounded-2xl bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{message}</p> : null}
          {error ? <p className="mt-5 rounded-2xl bg-[#fff8ed] p-4 text-sm font-bold text-[var(--accent-dark)]">{error}</p> : null}
          {!account ? <p className="mt-6 font-bold">Loading profile...</p> : null}
          {account ? <p className="mt-5 rounded-2xl bg-[#f6f3ec] p-4 text-sm font-bold">Signed in as {account.email}</p> : null}
          <div className="mt-6 grid gap-5">
            <label className="grid gap-2 text-sm font-bold">Full name<input name="name" value={profile.name} onChange={updateProfileField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold">Phone number<input name="phone" value={profile.phone} onChange={updateProfileField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
          </div>
          <button disabled={isPending || !account} className="cta-primary mt-8 w-full disabled:opacity-50" type="submit"><Pencil className="size-4" /> Save profile</button>
        </form>

        <div className="grid gap-8">
          <form onSubmit={saveAddress} className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)] sm:p-8">
            <div className="flex items-center gap-3"><MapPin className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">{editingAddressId ? "Edit address" : "Add delivery address"}</h2></div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="grid gap-2 text-sm font-bold">Label<input name="label" value={address.label} onChange={updateAddressField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
              <label className="grid gap-2 text-sm font-bold">Recipient name<input name="recipientName" value={address.recipientName} onChange={updateAddressField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
              <label className="grid gap-2 text-sm font-bold">Phone<input name="phone" value={address.phone} onChange={updateAddressField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
              <label className="grid gap-2 text-sm font-bold">State<input name="state" value={address.state} onChange={updateAddressField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
              <label className="grid gap-2 text-sm font-bold">City / LGA<input name="city" value={address.city} onChange={updateAddressField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
              <label className="grid gap-2 text-sm font-bold md:col-span-2">Address line 1<input name="addressLine1" value={address.addressLine1} onChange={updateAddressField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
              <label className="grid gap-2 text-sm font-bold md:col-span-2">Address line 2<input name="addressLine2" value={address.addressLine2} onChange={updateAddressField} className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
              <label className="grid gap-2 text-sm font-bold md:col-span-2">Delivery instructions<textarea name="deliveryInstructions" value={address.deliveryInstructions} onChange={updateAddressField} rows={3} className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            </div>
            <label className="mt-5 flex items-center gap-3 text-sm font-bold"><input type="checkbox" name="isDefault" checked={address.isDefault} onChange={updateAddressField} /> Use as default delivery address</label>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <button disabled={isPending || !account} className="cta-primary disabled:opacity-50" type="submit"><Plus className="size-4" /> {editingAddressId ? "Update address" : "Add address"}</button>
              {editingAddressId ? <button type="button" className="cta-outline" onClick={() => { setEditingAddressId(""); setAddress(emptyAddress); }}>Cancel edit</button> : null}
            </div>
          </form>

          <section className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)] sm:p-8">
            <div className="flex items-center gap-3"><Home className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Saved addresses</h2></div>
            {account?.addresses?.length ? <div className="mt-6 grid gap-4">{account.addresses.map((savedAddress) => <article key={savedAddress.id} className="rounded-2xl border border-black/8 bg-[#fbfaf6] p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-black">{savedAddress.label}{savedAddress.isDefault ? " | Default" : ""}</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{savedAddress.recipientName}, {savedAddress.phone}<br />{savedAddress.addressLine1}{savedAddress.addressLine2 ? `, ${savedAddress.addressLine2}` : ""}<br />{savedAddress.city}, {savedAddress.state}</p>{savedAddress.deliveryInstructions ? <p className="mt-2 text-xs font-bold text-[var(--accent-dark)]">Note: {savedAddress.deliveryInstructions}</p> : null}</div><div className="flex gap-2"><button type="button" className="cta-outline px-4 py-2" onClick={() => editAddress(savedAddress)}>Edit</button><button type="button" disabled={isPending} className="rounded-full border border-black/10 p-3 text-[var(--accent-dark)] disabled:opacity-50" onClick={() => removeAddress(savedAddress.id)} aria-label="Delete address"><Trash2 className="size-4" /></button></div></div></article>)}</div> : <p className="mt-5 rounded-2xl border border-dashed border-black/15 p-5 text-sm font-bold text-[var(--muted)]">No saved delivery addresses yet.</p>}
          </section>
        </div>
      </section>
    </main>
  );
}
