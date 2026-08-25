import { useEffect, useState, useTransition } from "react";
import { Activity, AlertTriangle, BarChart3, Boxes, ClipboardList, Image, Mail, MessageSquareText, PackageCheck, RotateCcw, Save, Settings, ShieldCheck, Star, Tags } from "lucide-react";
import {
  createAdminCoupon,
  getAdminCoupons,
  getAdminDashboard,
  getAdminOrders,
  getAdminProducts,
  getAdminReports,
  getAdminOrdersReportCsvUrl,
  getAdminReviews,
  getAdminStaff,
  getAdminStoreSettings,
  getAdminActivityLogs,
  getAdminHomepageContent,
  getAdminNewsletterSubscribers,
  getAdminReturns,
  getAdminSupportTickets,
  updateAdminCoupon,
  updateAdminOrderStatus,
  updateAdminProductStock,
  updateAdminReview,
  updateAdminReturn,
  createAdminStaff,
  updateAdminStaff,
  updateAdminStoreSettings,
  updateAdminHomepageContent,
  updateAdminNewsletterSubscriber,
  updateAdminSupportTicket,
} from "@/lib/api.js";
import { DeliveryZonesAdmin } from "@/components/delivery-zones-admin";
import { ProductImagesAdmin } from "@/components/product-images-admin";
import { ProductManagementAdmin } from "@/components/product-management-admin";
import { CatalogueLookupsAdmin } from "@/components/catalogue-lookups-admin";
import { formatNaira } from "@/lib/utils.js";

const orderStatuses = ["paid", "processing", "ready_for_pickup", "ready_for_delivery", "shipped", "out_for_delivery", "delivered", "cancelled"];
const reviewStatuses = ["pending", "approved", "rejected", "hidden"];
const returnStatuses = ["requested", "under_review", "approved", "rejected", "refunded", "closed"];
const supportStatuses = ["open", "in_progress", "waiting_for_customer", "resolved", "closed"];
const staffRoles = ["admin", "inventory_manager", "order_manager", "customer_support", "content_manager"];
const staffPermissions = ["dashboard:view", "reports:view", "products:read", "products:manage", "inventory:manage", "orders:read", "orders:update", "coupons:manage", "reviews:moderate", "returns:manage", "support:manage"];
const emptyReport = {
  summary: { totalRevenueKobo: 0, currentMonthRevenueKobo: 0, totalOrders: 0, paidOrders: 0, pendingOrders: 0, cancelledOrders: 0, productsInStock: 0, lowStockProducts: 0, outOfStockProducts: 0 },
  ordersByStatus: {},
  paymentsByStatus: {},
  revenueByDate: [],
  recentOrders: [],
  recentPayments: [],
  bestSellingProducts: [],
};

const initialHomepageContentForm = {
  heroEyebrow: "",
  heroTitle: "",
  heroSubtitle: "",
  heroPrimaryCtaLabel: "",
  heroPrimaryCtaHref: "",
  heroSecondaryCtaLabel: "",
  heroSecondaryCtaHref: "",
  promoTitle: "",
  promoSubtitle: "",
  trustTitle: "",
  trustSubtitle: "",
  bannerTitle: "",
  bannerSubtitle: "",
  bannerCtaLabel: "Shop now",
  bannerCtaHref: "/shop",
  bannerImageUrl: "",
  bannerIsActive: true,
};

function homepageContentToForm(content) {
  if (!content) return initialHomepageContentForm;
  const firstBanner = content.banners?.[0] ?? {};
  return {
    heroEyebrow: content.heroEyebrow ?? "",
    heroTitle: content.heroTitle ?? "",
    heroSubtitle: content.heroSubtitle ?? "",
    heroPrimaryCtaLabel: content.heroPrimaryCtaLabel ?? "",
    heroPrimaryCtaHref: content.heroPrimaryCtaHref ?? "",
    heroSecondaryCtaLabel: content.heroSecondaryCtaLabel ?? "",
    heroSecondaryCtaHref: content.heroSecondaryCtaHref ?? "",
    promoTitle: content.promoTitle ?? "",
    promoSubtitle: content.promoSubtitle ?? "",
    trustTitle: content.trustTitle ?? "",
    trustSubtitle: content.trustSubtitle ?? "",
    bannerTitle: firstBanner.title ?? "",
    bannerSubtitle: firstBanner.subtitle ?? "",
    bannerCtaLabel: firstBanner.ctaLabel ?? "Shop now",
    bannerCtaHref: firstBanner.ctaHref ?? "/shop",
    bannerImageUrl: firstBanner.imageUrl ?? "",
    bannerIsActive: firstBanner.isActive ?? true,
  };
}

function homepageFormToPayload(form) {
  return {
    heroEyebrow: form.heroEyebrow,
    heroTitle: form.heroTitle,
    heroSubtitle: form.heroSubtitle,
    heroPrimaryCtaLabel: form.heroPrimaryCtaLabel,
    heroPrimaryCtaHref: form.heroPrimaryCtaHref,
    heroSecondaryCtaLabel: form.heroSecondaryCtaLabel,
    heroSecondaryCtaHref: form.heroSecondaryCtaHref,
    promoTitle: form.promoTitle,
    promoSubtitle: form.promoSubtitle,
    trustTitle: form.trustTitle,
    trustSubtitle: form.trustSubtitle,
    banners: form.bannerTitle ? [{ title: form.bannerTitle, subtitle: form.bannerSubtitle, imageUrl: form.bannerImageUrl, ctaLabel: form.bannerCtaLabel, ctaHref: form.bannerCtaHref, isActive: form.bannerIsActive, sortOrder: 0 }] : [],
  };
}
const initialStoreSettingsForm = {
  storeName: "",
  logoUrl: "",
  contactEmail: "",
  phoneNumber: "",
  whatsappNumber: "",
  storeAddress: "",
  facebook: "",
  instagram: "",
  x: "",
  tiktok: "",
  defaultCurrency: "NGN",
  taxRatePercent: "0",
  defaultDeliveryInformation: "",
  returnPeriodDays: "7",
  warrantyInformation: "",
  maintenanceMode: false,
  maintenanceMessage: "",
};

function settingsToForm(settings) {
  if (!settings) return initialStoreSettingsForm;
  return {
    storeName: settings.storeName ?? "",
    logoUrl: settings.logoUrl ?? "",
    contactEmail: settings.contactEmail ?? "",
    phoneNumber: settings.phoneNumber ?? "",
    whatsappNumber: settings.whatsappNumber ?? "",
    storeAddress: settings.storeAddress ?? "",
    facebook: settings.socialLinks?.facebook ?? "",
    instagram: settings.socialLinks?.instagram ?? "",
    x: settings.socialLinks?.x ?? "",
    tiktok: settings.socialLinks?.tiktok ?? "",
    defaultCurrency: settings.defaultCurrency ?? "NGN",
    taxRatePercent: String(settings.taxRatePercent ?? 0),
    defaultDeliveryInformation: settings.defaultDeliveryInformation ?? "",
    returnPeriodDays: String(settings.returnPeriodDays ?? 7),
    warrantyInformation: settings.warrantyInformation ?? "",
    maintenanceMode: Boolean(settings.maintenanceMode),
    maintenanceMessage: settings.maintenanceMessage ?? "",
  };
}

function formToSettingsPayload(form) {
  return {
    storeName: form.storeName,
    logoUrl: form.logoUrl,
    contactEmail: form.contactEmail,
    phoneNumber: form.phoneNumber,
    whatsappNumber: form.whatsappNumber,
    storeAddress: form.storeAddress,
    socialLinks: { facebook: form.facebook, instagram: form.instagram, x: form.x, tiktok: form.tiktok },
    defaultCurrency: form.defaultCurrency,
    taxRatePercent: Number(form.taxRatePercent || 0),
    defaultDeliveryInformation: form.defaultDeliveryInformation,
    returnPeriodDays: Number(form.returnPeriodDays || 0),
    warrantyInformation: form.warrantyInformation,
    maintenanceMode: form.maintenanceMode,
    maintenanceMessage: form.maintenanceMessage,
  };
}
const initialStaffForm = {
  name: "",
  email: "",
  phone: "",
  password: "",
  roles: ["inventory_manager"],
  permissions: ["dashboard:view", "products:read", "inventory:manage"],
};

const initialCouponForm = {
  code: "",
  name: "",
  type: "percentage",
  percentage: "10",
  valueNaira: "",
  minOrderNaira: "0",
  maxDiscountNaira: "",
  usageLimit: "",
  isActive: true,
};

function StatCard({ label, value }) {
  return <div className="rounded-2xl border border-black/8 bg-white p-5 shadow-[0_18px_50px_rgba(28,34,31,.05)]"><p className="text-xs font-black uppercase tracking-[.12em] text-[var(--muted)]">{label}</p><p className="mt-2 text-2xl font-black tracking-[-.04em]">{value}</p></div>;
}

function nairaToKobo(value) {
  const amount = Number(value || 0);
  return Math.max(0, Math.round(amount * 100));
}

function optionalNairaToKobo(value) {
  return value === "" ? undefined : nairaToKobo(value);
}

function optionalNumber(value) {
  return value === "" ? undefined : Number(value);
}

function statusLabel(status) {
  return status.replaceAll("_", " ");
}

function safeAdminLoad(promise, fallback) {
  return promise.catch(() => fallback);
}

function buildReportParams(filters) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (typeof value === "string" && value) params.set(key, value);
  }
  return params;
}

export function AdminDashboardClient() {
  const [stats, setStats] = useState(null);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [returns, setReturns] = useState([]);
  const [supportTickets, setSupportTickets] = useState([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState([]);
  const [newsletterSummary, setNewsletterSummary] = useState({ total: 0, subscribed: 0, unsubscribed: 0 });
  const [staff, setStaff] = useState([]);
  const [storeSettings, setStoreSettings] = useState(null);
  const [homepageContent, setHomepageContent] = useState(null);
  const [activityLogs, setActivityLogs] = useState([]);
  const [reports, setReports] = useState(emptyReport);
  const [reportFilters, setReportFilters] = useState({ range: "month", dateFrom: "", dateTo: "", orderStatus: "", paymentStatus: "" });
  const [couponForm, setCouponForm] = useState(initialCouponForm);
  const [staffForm, setStaffForm] = useState(initialStaffForm);
  const [storeSettingsForm, setStoreSettingsForm] = useState(initialStoreSettingsForm);
  const [homepageContentForm, setHomepageContentForm] = useState(initialHomepageContentForm);
  const [stockDrafts, setStockDrafts] = useState({});
  const [orderDrafts, setOrderDrafts] = useState({});
  const [reviewDrafts, setReviewDrafts] = useState({});
  const [returnDrafts, setReturnDrafts] = useState({});
  const [supportDrafts, setSupportDrafts] = useState({});
  const [staffDrafts, setStaffDrafts] = useState({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function loadAdminData() {
    const reportParams = buildReportParams(reportFilters);
    Promise.all([
      safeAdminLoad(getAdminDashboard(), null),
      safeAdminLoad(getAdminProducts(), []),
      safeAdminLoad(getAdminOrders(), []),
      safeAdminLoad(getAdminCoupons(), []),
      safeAdminLoad(getAdminReviews(), []),
      safeAdminLoad(getAdminReturns(), []),
      safeAdminLoad(getAdminSupportTickets(), []),
      safeAdminLoad(getAdminReports(reportParams), emptyReport),
    ])
      .then(([nextStats, nextProducts, nextOrders, nextCoupons, nextReviews, nextReturns, nextSupportTickets, nextReports]) => {
        setStats(nextStats);
        setProducts(nextProducts);
        setOrders(nextOrders);
        setCoupons(nextCoupons);
        setReviews(nextReviews);
        setReturns(nextReturns);
        setSupportTickets(nextSupportTickets);
        setReports(nextReports);
        safeAdminLoad(getAdminStaff(), []).then(setStaff);
        safeAdminLoad(getAdminStoreSettings(), null).then((settings) => { setStoreSettings(settings); setStoreSettingsForm(settingsToForm(settings)); });
        safeAdminLoad(getAdminActivityLogs(), []).then(setActivityLogs);
        safeAdminLoad(getAdminHomepageContent(), null).then((content) => { setHomepageContent(content); setHomepageContentForm(homepageContentToForm(content)); });
        safeAdminLoad(getAdminNewsletterSubscribers(), { items: [], summary: { total: 0, subscribed: 0, unsubscribed: 0 } }).then((data) => { setNewsletterSubscribers(data.items ?? []); setNewsletterSummary(data.summary ?? { total: 0, subscribed: 0, unsubscribed: 0 }); });
        setError("");
      })
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Admin dashboard could not load."));
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  function updateReportFilter(event) {
    const { name, value } = event.target;
    setReportFilters((current) => ({ ...current, [name]: value }));
  }

  function refreshReports(event) {
    event.preventDefault();
    loadAdminData();
  }

  function saveStock(product) {
    startTransition(async () => {
      try {
        setMessage("");
        setError("");
        const stockQuantity = Number(stockDrafts[product.id] ?? product.stockQuantity);
        await updateAdminProductStock(product.id, { stockQuantity });
        setMessage(`Stock updated for ${product.name}.`);
        loadAdminData();
      } catch (stockError) {
        setError(stockError instanceof Error ? stockError.message : "Stock update failed.");
      }
    });
  }

  function saveOrderStatus(order) {
    startTransition(async () => {
      try {
        setMessage("");
        setError("");
        const status = orderDrafts[order.id] ?? order.orderStatus;
        await updateAdminOrderStatus(order.id, { status, note: "Updated from admin dashboard." });
        setMessage(`Order ${order.orderNumber} moved to ${statusLabel(status)}.`);
        loadAdminData();
      } catch (orderError) {
        setError(orderError instanceof Error ? orderError.message : "Order status update failed.");
      }
    });
  }


  function toggleArrayValue(values, value) {
    return values.includes(value) ? values.filter((item) => item !== value) : [...values, value];
  }



  function updateHomepageContentField(event) {
    const { name, value, type, checked } = event.target;
    setHomepageContentForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function saveHomepageContent(event) {
    event.preventDefault();
    startTransition(async () => {
      try {
        setMessage("");
        setError("");
        const nextContent = await updateAdminHomepageContent(homepageFormToPayload(homepageContentForm));
        setHomepageContent(nextContent);
        setHomepageContentForm(homepageContentToForm(nextContent));
        setMessage("Homepage content updated.");
      } catch (homepageError) {
        setError(homepageError instanceof Error ? homepageError.message : "Homepage content update failed.");
      }
    });
  }
  function updateStoreSettingsField(event) {
    const { name, value, type, checked } = event.target;
    setStoreSettingsForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function saveStoreSettings(event) {
    event.preventDefault();
    startTransition(async () => {
      try {
        setMessage("");
        setError("");
        const nextSettings = await updateAdminStoreSettings(formToSettingsPayload(storeSettingsForm));
        setStoreSettings(nextSettings);
        setStoreSettingsForm(settingsToForm(nextSettings));
        setMessage("Store settings updated.");
      } catch (settingsError) {
        setError(settingsError instanceof Error ? settingsError.message : "Store settings update failed.");
      }
    });
  }
  function updateStaffFormField(event) {
    const { name, value } = event.target;
    setStaffForm((current) => ({ ...current, [name]: value }));
  }

  function toggleStaffFormRole(role) {
    setStaffForm((current) => ({ ...current, roles: toggleArrayValue(current.roles, role) }));
  }

  function toggleStaffFormPermission(permission) {
    setStaffForm((current) => ({ ...current, permissions: toggleArrayValue(current.permissions, permission) }));
  }

  function createStaff(event) {
    event.preventDefault();
    startTransition(async () => {
      try {
        setMessage("");
        setError("");
        await createAdminStaff(staffForm);
        setStaffForm(initialStaffForm);
        setMessage(`Staff account created for ${staffForm.email}.`);
        loadAdminData();
      } catch (staffError) {
        setError(staffError instanceof Error ? staffError.message : "Staff account creation failed.");
      }
    });
  }

  function updateStaffDraft(staffId, field, value) {
    setStaffDrafts((current) => ({ ...current, [staffId]: { ...current[staffId], [field]: value } }));
  }

  function toggleStaffDraftArray(staffMember, field, value) {
    const draft = staffDrafts[staffMember.id] ?? {};
    const currentValues = draft[field] ?? staffMember[field] ?? [];
    updateStaffDraft(staffMember.id, field, toggleArrayValue(currentValues, value));
  }

  function saveStaff(staffMember) {
    startTransition(async () => {
      try {
        setMessage("");
        setError("");
        const draft = staffDrafts[staffMember.id] ?? {};
        await updateAdminStaff(staffMember.id, {
          roles: draft.roles ?? staffMember.roles,
          permissions: draft.permissions ?? staffMember.permissions,
          isActive: draft.isActive ?? staffMember.isActive,
        });
        setMessage(`Staff permissions updated for ${staffMember.email}.`);
        loadAdminData();
      } catch (staffError) {
        setError(staffError instanceof Error ? staffError.message : "Staff update failed.");
      }
    });
  }

  function toggleNewsletterSubscriber(subscriber) {
    startTransition(async () => {
      try {
        setMessage("");
        setError("");
        const nextStatus = subscriber.status === "subscribed" ? "unsubscribed" : "subscribed";
        await updateAdminNewsletterSubscriber(subscriber.id, { status: nextStatus });
        setMessage(`${subscriber.email} marked as ${nextStatus}.`);
        loadAdminData();
      } catch (subscriberError) {
        setError(subscriberError instanceof Error ? subscriberError.message : "Newsletter subscriber update failed.");
      }
    });
  }
  function updateCouponField(event) {
    const { name, value, type, checked } = event.target;
    setCouponForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
  }

  function createCoupon(event) {
    event.preventDefault();
    startTransition(async () => {
      try {
        setMessage("");
        setError("");
        await createAdminCoupon({
          code: couponForm.code,
          name: couponForm.name,
          type: couponForm.type,
          percentage: couponForm.type === "percentage" ? Number(couponForm.percentage) : undefined,
          valueKobo: couponForm.type === "fixed" ? nairaToKobo(couponForm.valueNaira) : undefined,
          minOrderAmountKobo: nairaToKobo(couponForm.minOrderNaira),
          maxDiscountKobo: optionalNairaToKobo(couponForm.maxDiscountNaira),
          usageLimit: optionalNumber(couponForm.usageLimit),
          isActive: couponForm.isActive,
        });
        setCouponForm(initialCouponForm);
        setMessage(`Coupon ${couponForm.code.toUpperCase()} created.`);
        loadAdminData();
      } catch (couponError) {
        setError(couponError instanceof Error ? couponError.message : "Coupon creation failed.");
      }
    });
  }

  function toggleCoupon(coupon) {
    startTransition(async () => {
      try {
        setMessage("");
        setError("");
        await updateAdminCoupon(coupon.id, { isActive: !coupon.isActive });
        setMessage(`Coupon ${coupon.code} ${coupon.isActive ? "disabled" : "enabled"}.`);
        loadAdminData();
      } catch (couponError) {
        setError(couponError instanceof Error ? couponError.message : "Coupon update failed.");
      }
    });
  }

  function updateReviewDraft(reviewId, field, value) {
    setReviewDrafts((current) => ({
      ...current,
      [reviewId]: { ...current[reviewId], [field]: value },
    }));
  }

  function saveReview(review) {
    startTransition(async () => {
      try {
        setMessage("");
        setError("");
        const draft = reviewDrafts[review.id] ?? {};
        const status = draft.status ?? review.status;
        const adminReply = draft.adminReply ?? review.adminReply ?? undefined;
        await updateAdminReview(review.id, { status, adminReply });
        setMessage(`Review for ${review.productName ?? "product"} moved to ${statusLabel(status)}.`);
        loadAdminData();
      } catch (reviewError) {
        setError(reviewError instanceof Error ? reviewError.message : "Review moderation failed.");
      }
    });
  }

  function updateReturnDraft(returnId, field, value) {
    setReturnDrafts((current) => ({
      ...current,
      [returnId]: { ...current[returnId], [field]: value },
    }));
  }

  function saveReturn(returnRequest) {
    startTransition(async () => {
      try {
        setMessage("");
        setError("");
        const draft = returnDrafts[returnRequest.id] ?? {};
        const status = draft.status ?? returnRequest.status;
        const adminNote = draft.adminNote ?? returnRequest.adminNote ?? undefined;
        await updateAdminReturn(returnRequest.id, { status, adminNote });
        setMessage(`Return ${returnRequest.requestNumber} moved to ${statusLabel(status)}.`);
        loadAdminData();
      } catch (returnError) {
        setError(returnError instanceof Error ? returnError.message : "Return update failed.");
      }
    });
  }

  function updateSupportDraft(ticketId, field, value) {
    setSupportDrafts((current) => ({
      ...current,
      [ticketId]: { ...current[ticketId], [field]: value },
    }));
  }

  function saveSupportTicket(ticket) {
    startTransition(async () => {
      try {
        setMessage("");
        setError("");
        const draft = supportDrafts[ticket.id] ?? {};
        const status = draft.status ?? ticket.status;
        await updateAdminSupportTicket(ticket.id, {
          status,
          reply: draft.reply || undefined,
          internalNote: draft.internalNote ?? ticket.internalNote ?? undefined,
        });
        setMessage(`Ticket ${ticket.ticketNumber} moved to ${statusLabel(status)}.`);
        loadAdminData();
      } catch (supportError) {
        setError(supportError instanceof Error ? supportError.message : "Support ticket update failed.");
      }
    });
  }
  return (
    <main className="min-h-screen">
      <section className="hero-grid border-b border-black/8">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <p className="section-kicker">Admin dashboard</p>
          <h1 className="mt-4 font-serif text-5xl font-bold leading-none tracking-[-.06em] sm:text-7xl">Control the store.</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[var(--muted)]">Manage stock, coupons, reviews, orders and UK-used product availability from one protected place.</p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {error ? <div className="mb-6 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold"><AlertTriangle className="mb-2 size-5 text-[var(--accent-dark)]" />{error}</div> : null}
        {message ? <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{message}</div> : null}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Revenue" value={formatNaira(stats?.totalRevenueKobo ?? 0)} />
          <StatCard label="Orders" value={stats?.totalOrders ?? "..."} />
          <StatCard label="Products" value={stats?.totalProducts ?? "..."} />
          <StatCard label="Low stock" value={stats?.lowStockProducts ?? "..."} />
        </div>


        <section className="mt-8 rounded-[2rem] border border-black/8 bg-[#fbfaf6] p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div><div className="flex items-center gap-3"><BarChart3 className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Reports and statistics</h2></div><p className="mt-2 text-sm leading-6 text-[var(--muted)]">Filter sales, orders and payment activity without loading the full database.</p></div>
            <a href={getAdminOrdersReportCsvUrl(buildReportParams(reportFilters))} className="cta-outline" target="_blank" rel="noreferrer">Export orders CSV</a>
          </div>
          <form onSubmit={refreshReports} className="mt-6 grid gap-4 md:grid-cols-5">
            <label className="grid gap-2 text-sm font-bold">Range<select name="range" value={reportFilters.range} onChange={updateReportFilter} className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"><option value="today">Today</option><option value="week">This week</option><option value="month">This month</option><option value="custom">Custom</option></select></label>
            <label className="grid gap-2 text-sm font-bold">From<input name="dateFrom" type="date" value={reportFilters.dateFrom} onChange={updateReportFilter} className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">To<input name="dateTo" type="date" value={reportFilters.dateTo} onChange={updateReportFilter} className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Order status<select name="orderStatus" value={reportFilters.orderStatus} onChange={updateReportFilter} className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"><option value="">All</option>{orderStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select></label>
            <label className="grid gap-2 text-sm font-bold">Payment<select name="paymentStatus" value={reportFilters.paymentStatus} onChange={updateReportFilter} className="rounded-2xl border border-black/10 bg-white px-4 py-3 outline-none"><option value="">All</option><option value="pending">Pending</option><option value="successful">Successful</option><option value="failed">Failed</option><option value="abandoned">Abandoned</option><option value="refunded">Refunded</option></select></label>
            <button type="submit" disabled={isPending} className="cta-primary md:col-span-5">Refresh report</button>
          </form>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Filtered revenue" value={formatNaira(reports?.summary?.totalRevenueKobo ?? 0)} />
            <StatCard label="Month revenue" value={formatNaira(reports?.summary?.currentMonthRevenueKobo ?? 0)} />
            <StatCard label="Filtered orders" value={reports?.summary?.totalOrders ?? "..."} />
            <StatCard label="Cancelled" value={reports?.summary?.cancelledOrders ?? "..."} />
          </div>
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <div className="rounded-2xl border border-black/8 bg-white p-5"><p className="font-black">Orders by status</p><div className="mt-4 grid gap-2 text-sm text-[var(--muted)]">{Object.entries(reports?.ordersByStatus ?? {}).filter(([, count]) => Number(count) > 0).map(([status, count]) => <p key={status} className="flex justify-between gap-4"><span>{statusLabel(status)}</span><strong>{Number(count)}</strong></p>)}</div></div>
            <div className="rounded-2xl border border-black/8 bg-white p-5"><p className="font-black">Daily revenue</p><div className="mt-4 grid gap-2 text-sm text-[var(--muted)]">{(reports?.revenueByDate ?? []).slice(0, 7).map((item) => <p key={item.date} className="flex justify-between gap-4"><span>{item.date}</span><strong>{formatNaira(item.revenueKobo)}</strong></p>)}</div></div>
            <div className="rounded-2xl border border-black/8 bg-white p-5"><p className="font-black">Best sellers</p><div className="mt-4 grid gap-2 text-sm text-[var(--muted)]">{(reports?.bestSellingProducts ?? []).map((item) => <p key={item.sku} className="flex justify-between gap-4"><span>{item.name}</span><strong>{item.quantitySold}</strong></p>)}</div></div>
          </div>
        </section>
        <CatalogueLookupsAdmin onLookupsChanged={loadAdminData} />

        <ProductManagementAdmin products={products} onProductsChanged={loadAdminData} />

        <div className="mt-10 grid gap-8 xl:grid-cols-[1fr_1fr]">
          <section className="rounded-[2rem] border border-black/8 bg-white/80 p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
            <div className="flex items-center gap-3"><Boxes className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Inventory</h2></div>
            <div className="mt-6 grid gap-4">
              {products.slice(0, 8).map((product) => <article key={product.id} className="rounded-2xl border border-black/8 p-4"><p className="font-black">{product.name}</p><p className="mt-1 text-sm text-[var(--muted)]">{product.sku} | {statusLabel(product.availability)} | {product.availableQuantity} available</p><div className="mt-4 flex gap-3"><input type="number" min={0} value={stockDrafts[product.id] ?? product.stockQuantity} onChange={(event) => setStockDrafts((current) => ({ ...current, [product.id]: event.target.value }))} className="w-28 rounded-xl border border-black/10 px-3 py-2 font-black outline-none" /><button type="button" disabled={isPending} onClick={() => saveStock(product)} className="cta-outline py-2"><Save className="size-4" /> Save</button></div></article>)}
              {products.length === 0 ? <p className="text-sm font-bold text-[var(--muted)]">No products yet.</p> : null}
            </div>
          </section>

          <section className="rounded-[2rem] border border-black/8 bg-[var(--ink)] p-6 text-white shadow-[0_24px_70px_rgba(28,34,31,.18)]">
            <div className="flex items-center gap-3"><ClipboardList className="size-5 text-[var(--accent)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Orders</h2></div>
            <div className="mt-6 grid gap-4">
              {orders.slice(0, 8).map((order) => <article key={order.id} className="rounded-2xl bg-white/8 p-4"><p className="font-black">{order.orderNumber}</p><p className="mt-1 text-sm text-white/60">{order.customer.email} | {formatNaira(order.totalKobo)} | {order.paymentStatus}</p><div className="mt-4 flex flex-col gap-3 sm:flex-row"><select value={orderDrafts[order.id] ?? order.orderStatus} onChange={(event) => setOrderDrafts((current) => ({ ...current, [order.id]: event.target.value }))} className="rounded-xl border border-white/10 bg-white px-3 py-2 font-black text-[var(--ink)] outline-none">{orderStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select><button type="button" disabled={isPending} onClick={() => saveOrderStatus(order)} className="cta-primary bg-[var(--accent)] py-2 text-[var(--ink)]"><PackageCheck className="size-4" /> Update</button></div></article>)}
              {orders.length === 0 ? <p className="text-sm font-bold text-white/60">No orders yet.</p> : null}
            </div>
          </section>
        </div>



        <ProductImagesAdmin products={products} onProductsChanged={loadAdminData} />

        <DeliveryZonesAdmin />

        <section className="mt-8 rounded-[2rem] border border-black/8 bg-white/80 p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
          <div className="flex items-center gap-3"><MessageSquareText className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Support tickets</h2></div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {supportTickets.slice(0, 8).map((ticket) => <article key={ticket.id} className="rounded-2xl border border-black/8 bg-[#fbfaf6] p-5"><p className="font-black">{ticket.ticketNumber}</p><p className="mt-1 text-sm text-[var(--muted)]">{ticket.email} | {statusLabel(ticket.type)} | {statusLabel(ticket.status)}</p><p className="mt-3 font-bold">{ticket.subject}</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{ticket.message}</p><div className="mt-4 grid gap-3"><select value={supportDrafts[ticket.id]?.status ?? ticket.status} onChange={(event) => updateSupportDraft(ticket.id, "status", event.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2 font-black outline-none">{supportStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select><textarea value={supportDrafts[ticket.id]?.reply ?? ""} onChange={(event) => updateSupportDraft(ticket.id, "reply", event.target.value)} rows={3} placeholder="Reply to customer" className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" /><textarea value={supportDrafts[ticket.id]?.internalNote ?? ticket.internalNote ?? ""} onChange={(event) => updateSupportDraft(ticket.id, "internalNote", event.target.value)} rows={2} placeholder="Internal note" className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" /><button type="button" disabled={isPending} onClick={() => saveSupportTicket(ticket)} className="cta-primary"><MessageSquareText className="size-4" /> Update ticket</button></div></article>)}
            {supportTickets.length === 0 ? <p className="text-sm font-bold text-[var(--muted)]">No support tickets yet.</p> : null}
          </div>
        </section>
        <section className="mt-8 rounded-[2rem] border border-black/8 bg-[var(--ink)] p-6 text-white shadow-[0_24px_70px_rgba(28,34,31,.18)]">
          <div className="flex items-center gap-3"><RotateCcw className="size-5 text-[var(--accent)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Returns and refunds</h2></div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {returns.slice(0, 8).map((returnRequest) => <article key={returnRequest.id} className="rounded-2xl bg-white/8 p-5"><p className="font-black">{returnRequest.requestNumber}</p><p className="mt-1 text-sm text-white/60">{returnRequest.orderNumber} | {returnRequest.customerEmail} | {statusLabel(returnRequest.reason)}</p><div className="mt-3 grid gap-2 text-sm text-white/70">{returnRequest.items.map((item) => <p key={`${returnRequest.id}-${item.sku}`}>{item.name} | Qty {item.quantity}</p>)}</div><p className="mt-4 text-sm leading-6 text-white/75">{returnRequest.details}</p><div className="mt-4 grid gap-3"><select value={returnDrafts[returnRequest.id]?.status ?? returnRequest.status} onChange={(event) => updateReturnDraft(returnRequest.id, "status", event.target.value)} className="rounded-xl border border-white/10 bg-white px-3 py-2 font-black text-[var(--ink)] outline-none">{returnStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select><textarea value={returnDrafts[returnRequest.id]?.adminNote ?? returnRequest.adminNote ?? ""} onChange={(event) => updateReturnDraft(returnRequest.id, "adminNote", event.target.value)} rows={3} placeholder="Admin note for this return" className="rounded-xl border border-white/10 bg-white px-3 py-2 text-sm text-[var(--ink)] outline-none" /><button type="button" disabled={isPending} onClick={() => saveReturn(returnRequest)} className="cta-primary bg-[var(--accent)] text-[var(--ink)]"><RotateCcw className="size-4" /> Update return</button></div></article>)}
            {returns.length === 0 ? <p className="text-sm font-bold text-white/60">No return requests yet.</p> : null}
          </div>
        </section>
        <section className="mt-8 rounded-[2rem] border border-black/8 bg-white/80 p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
          <div className="flex items-center gap-3"><MessageSquareText className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Review moderation</h2></div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {reviews.slice(0, 8).map((review) => <article key={review.id} className="rounded-2xl border border-black/8 bg-[#fbfaf6] p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-black">{review.title}</p><p className="mt-1 text-sm text-[var(--muted)]">{review.productName ?? "Product"} | {review.customerName}</p>{review.isVerifiedPurchase ? <p className="mt-2 text-xs font-black uppercase tracking-[.12em] text-emerald-700">Verified purchase</p> : null}</div><div className="flex gap-1 text-[var(--accent-dark)]">{Array.from({ length: review.rating }).map((_, index) => <Star key={index} className="size-4 fill-[var(--accent)] text-[var(--accent)]" />)}</div></div><p className="mt-4 text-sm leading-6 text-[var(--muted)]">{review.comment}</p><div className="mt-4 grid gap-3"><select value={reviewDrafts[review.id]?.status ?? review.status} onChange={(event) => updateReviewDraft(review.id, "status", event.target.value)} className="rounded-xl border border-black/10 bg-white px-3 py-2 font-black outline-none">{reviewStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}</select><textarea value={reviewDrafts[review.id]?.adminReply ?? review.adminReply ?? ""} onChange={(event) => updateReviewDraft(review.id, "adminReply", event.target.value)} rows={3} placeholder="Optional store reply" className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" /><button type="button" disabled={isPending} onClick={() => saveReview(review)} className="cta-primary"><MessageSquareText className="size-4" /> Save moderation</button></div></article>)}
            {reviews.length === 0 ? <p className="text-sm font-bold text-[var(--muted)]">No reviews submitted yet.</p> : null}
          </div>
        </section>

        <section className="mt-8 rounded-[2rem] border border-black/8 bg-white/80 p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
          <div className="flex items-center gap-3"><Tags className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Coupon management</h2></div>
          <form onSubmit={createCoupon} className="mt-6 grid gap-4 md:grid-cols-4">
            <label className="grid gap-2 text-sm font-bold">Code<input name="code" value={couponForm.code} onChange={updateCouponField} required placeholder="LAUNCH10" className="rounded-2xl border border-black/10 px-4 py-3 uppercase outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold">Name<input name="name" value={couponForm.name} onChange={updateCouponField} required placeholder="Launch discount" className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold">Type<select name="type" value={couponForm.type} onChange={updateCouponField} className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]"><option value="percentage">Percentage</option><option value="fixed">Fixed amount</option></select></label>
            {couponForm.type === "percentage" ? <label className="grid gap-2 text-sm font-bold">Percentage<input name="percentage" type="number" min={1} max={100} value={couponForm.percentage} onChange={updateCouponField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label> : <label className="grid gap-2 text-sm font-bold">Fixed discount (NGN)<input name="valueNaira" type="number" min={1} value={couponForm.valueNaira} onChange={updateCouponField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>}
            <label className="grid gap-2 text-sm font-bold">Minimum order (NGN)<input name="minOrderNaira" type="number" min={0} value={couponForm.minOrderNaira} onChange={updateCouponField} className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold">Max discount (NGN)<input name="maxDiscountNaira" type="number" min={0} value={couponForm.maxDiscountNaira} onChange={updateCouponField} placeholder="Optional" className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold">Usage limit<input name="usageLimit" type="number" min={1} value={couponForm.usageLimit} onChange={updateCouponField} placeholder="Optional" className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="flex items-center gap-3 rounded-2xl border border-black/10 px-4 py-3 text-sm font-bold"><input name="isActive" type="checkbox" checked={couponForm.isActive} onChange={updateCouponField} /> Active</label>
            <button type="submit" disabled={isPending} className="cta-primary md:col-span-4"><Tags className="size-4" /> Create coupon</button>
          </form>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {coupons.map((coupon) => <article key={coupon.id} className="rounded-2xl border border-black/8 p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-black">{coupon.code}</p><p className="mt-1 text-sm text-[var(--muted)]">{coupon.name} | {coupon.type === "percentage" ? `${coupon.percentage}% off` : `${formatNaira(coupon.valueKobo)} off`}</p><p className="mt-1 text-xs font-bold uppercase tracking-[.12em] text-[var(--muted)]">Used {coupon.usedCount}{coupon.usageLimit ? ` of ${coupon.usageLimit}` : ""}</p></div><button type="button" disabled={isPending} onClick={() => toggleCoupon(coupon)} className="cta-outline py-2">{coupon.isActive ? "Disable" : "Enable"}</button></div></article>)}
            {coupons.length === 0 ? <p className="text-sm font-bold text-[var(--muted)]">No coupons created yet.</p> : null}
          </div>
        </section>






        <section className="mt-8 rounded-[2rem] border border-black/8 bg-white/80 p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex items-center gap-3"><Mail className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Newsletter subscribers</h2></div>
              <p className="mt-2 text-sm leading-6 text-[var(--muted)]">View opt-ins from the storefront footer and manage whether customers stay subscribed.</p>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs font-black uppercase tracking-[.1em]">
              <span className="rounded-2xl bg-[#fbfaf6] px-3 py-2">Total {newsletterSummary.total}</span>
              <span className="rounded-2xl bg-emerald-50 px-3 py-2 text-emerald-900">Active {newsletterSummary.subscribed}</span>
              <span className="rounded-2xl bg-[#fff8ed] px-3 py-2 text-[var(--accent-dark)]">Off {newsletterSummary.unsubscribed}</span>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {newsletterSubscribers.map((subscriber) => <article key={subscriber.id} className="rounded-2xl border border-black/8 bg-[#fbfaf6] p-4"><div className="flex items-start justify-between gap-4"><div><p className="font-black">{subscriber.email}</p><p className="mt-1 text-sm text-[var(--muted)]">{subscriber.name || "Guest subscriber"} | {subscriber.source}</p><p className="mt-1 text-xs font-black uppercase tracking-[.12em] text-[var(--muted)]">{subscriber.status} | {subscriber.subscribedAt ? new Date(subscriber.subscribedAt).toLocaleDateString() : "No date"}</p></div><button type="button" disabled={isPending} onClick={() => toggleNewsletterSubscriber(subscriber)} className="cta-outline py-2">{subscriber.status === "subscribed" ? "Unsubscribe" : "Resubscribe"}</button></div></article>)}
            {newsletterSubscribers.length === 0 ? <p className="text-sm font-bold text-[var(--muted)]">No newsletter subscribers yet.</p> : null}
          </div>
        </section>        <section className="mt-8 rounded-[2rem] border border-black/8 bg-white/80 p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
          <div className="flex items-center gap-3"><Image className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Homepage content</h2></div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Manage hero copy and the first promotional banner on the storefront.</p>
          {homepageContent ? <form onSubmit={saveHomepageContent} className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">Hero eyebrow<input name="heroEyebrow" value={homepageContentForm.heroEyebrow} onChange={updateHomepageContentField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Hero title<input name="heroTitle" value={homepageContentForm.heroTitle} onChange={updateHomepageContentField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold md:col-span-2">Hero subtitle<textarea name="heroSubtitle" value={homepageContentForm.heroSubtitle} onChange={updateHomepageContentField} rows={3} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Primary CTA label<input name="heroPrimaryCtaLabel" value={homepageContentForm.heroPrimaryCtaLabel} onChange={updateHomepageContentField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Primary CTA link<input name="heroPrimaryCtaHref" value={homepageContentForm.heroPrimaryCtaHref} onChange={updateHomepageContentField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Featured heading<input name="promoSubtitle" value={homepageContentForm.promoSubtitle} onChange={updateHomepageContentField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Trust title<input name="trustTitle" value={homepageContentForm.trustTitle} onChange={updateHomepageContentField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <div className="md:col-span-2 rounded-2xl border border-black/8 bg-[#fbfaf6] p-4"><p className="text-sm font-black uppercase tracking-[.12em] text-[var(--muted)]">Promotional banner</p><div className="mt-4 grid gap-4 md:grid-cols-2"><label className="grid gap-2 text-sm font-bold">Banner title<input name="bannerTitle" value={homepageContentForm.bannerTitle} onChange={updateHomepageContentField} className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label><label className="grid gap-2 text-sm font-bold">Banner link<input name="bannerCtaHref" value={homepageContentForm.bannerCtaHref} onChange={updateHomepageContentField} className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label><label className="grid gap-2 text-sm font-bold md:col-span-2">Banner subtitle<textarea name="bannerSubtitle" value={homepageContentForm.bannerSubtitle} onChange={updateHomepageContentField} rows={2} className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label><label className="flex items-center gap-3 text-sm font-bold"><input name="bannerIsActive" type="checkbox" checked={homepageContentForm.bannerIsActive} onChange={updateHomepageContentField} /> Active banner</label></div></div>
            <button type="submit" disabled={isPending} className="cta-primary md:col-span-2"><Image className="size-4" /> Save homepage content</button>
          </form> : <p className="mt-6 text-sm font-bold text-[var(--muted)]">Homepage content is visible to content managers and super administrators.</p>}
        </section>        <section className="mt-8 rounded-[2rem] border border-black/8 bg-[#fbfaf6] p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
          <div className="flex items-center gap-3"><Activity className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Admin activity logs</h2></div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Recent protected administrator actions, visible to super administrators.</p>
          <div className="mt-6 grid gap-3">
            {activityLogs.slice(0, 10).map((log) => <article key={log.id} className="rounded-2xl border border-black/8 bg-white p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-black">{statusLabel(log.action)} <span className="text-[var(--muted)]">on</span> {statusLabel(log.resourceType)}</p><p className="mt-1 text-sm text-[var(--muted)]">{log.administratorName} | {log.administratorEmail}</p></div><p className="text-xs font-black uppercase tracking-[.12em] text-[var(--muted)]">{log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}</p></div><p className="mt-3 text-xs font-bold text-[var(--muted)]">Resource: {log.resourceId || "n/a"} | Request: {log.requestId || "n/a"}</p></article>)}
            {activityLogs.length === 0 ? <p className="text-sm font-bold text-[var(--muted)]">Activity logs are visible after logging in as a super administrator.</p> : null}
          </div>
        </section>        <section className="mt-8 rounded-[2rem] border border-black/8 bg-white/80 p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
          <div className="flex items-center gap-3"><Settings className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Store settings</h2></div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Super administrators can update public store details and maintenance settings here.</p>
          {storeSettings ? <form onSubmit={saveStoreSettings} className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">Store name<input name="storeName" value={storeSettingsForm.storeName} onChange={updateStoreSettingsField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Logo URL<input name="logoUrl" value={storeSettingsForm.logoUrl} onChange={updateStoreSettingsField} placeholder="https://..." className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Contact email<input name="contactEmail" type="email" value={storeSettingsForm.contactEmail} onChange={updateStoreSettingsField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Phone number<input name="phoneNumber" value={storeSettingsForm.phoneNumber} onChange={updateStoreSettingsField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">WhatsApp number<input name="whatsappNumber" value={storeSettingsForm.whatsappNumber} onChange={updateStoreSettingsField} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Currency<input name="defaultCurrency" value={storeSettingsForm.defaultCurrency} onChange={updateStoreSettingsField} required maxLength={3} className="rounded-2xl border border-black/10 px-4 py-3 uppercase outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold md:col-span-2">Store address<textarea name="storeAddress" value={storeSettingsForm.storeAddress} onChange={updateStoreSettingsField} rows={2} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Facebook<input name="facebook" value={storeSettingsForm.facebook} onChange={updateStoreSettingsField} placeholder="Optional URL" className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Instagram<input name="instagram" value={storeSettingsForm.instagram} onChange={updateStoreSettingsField} placeholder="Optional URL" className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">X / Twitter<input name="x" value={storeSettingsForm.x} onChange={updateStoreSettingsField} placeholder="Optional URL" className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">TikTok<input name="tiktok" value={storeSettingsForm.tiktok} onChange={updateStoreSettingsField} placeholder="Optional URL" className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Tax rate (%)<input name="taxRatePercent" type="number" min={0} max={100} value={storeSettingsForm.taxRatePercent} onChange={updateStoreSettingsField} className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Return period (days)<input name="returnPeriodDays" type="number" min={0} value={storeSettingsForm.returnPeriodDays} onChange={updateStoreSettingsField} className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold md:col-span-2">Default delivery information<textarea name="defaultDeliveryInformation" value={storeSettingsForm.defaultDeliveryInformation} onChange={updateStoreSettingsField} rows={3} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold md:col-span-2">Warranty information<textarea name="warrantyInformation" value={storeSettingsForm.warrantyInformation} onChange={updateStoreSettingsField} rows={3} required className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <label className="flex items-center gap-3 rounded-2xl border border-black/10 px-4 py-3 text-sm font-bold"><input name="maintenanceMode" type="checkbox" checked={storeSettingsForm.maintenanceMode} onChange={updateStoreSettingsField} /> Maintenance mode</label>
            <label className="grid gap-2 text-sm font-bold">Maintenance message<input name="maintenanceMessage" value={storeSettingsForm.maintenanceMessage} onChange={updateStoreSettingsField} className="rounded-2xl border border-black/10 px-4 py-3 outline-none" /></label>
            <button type="submit" disabled={isPending} className="cta-primary md:col-span-2"><Settings className="size-4" /> Save store settings</button>
          </form> : <p className="mt-6 text-sm font-bold text-[var(--muted)]">Store settings are visible after logging in as a super administrator.</p>}
        </section>        <section className="mt-8 rounded-[2rem] border border-black/8 bg-[var(--ink)] p-6 text-white shadow-[0_24px_70px_rgba(28,34,31,.18)]">
          <div className="flex items-center gap-3"><ShieldCheck className="size-5 text-[var(--accent)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Staff roles and permissions</h2></div>
          <p className="mt-2 text-sm leading-6 text-white/65">Super administrators can create staff accounts and assign only the permissions each role needs.</p>
          <form onSubmit={createStaff} className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">Name<input name="name" value={staffForm.name} onChange={updateStaffFormField} required className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-[var(--ink)] outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Email<input name="email" type="email" value={staffForm.email} onChange={updateStaffFormField} required className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-[var(--ink)] outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Phone<input name="phone" value={staffForm.phone} onChange={updateStaffFormField} required className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-[var(--ink)] outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Temporary password<input name="password" type="password" value={staffForm.password} onChange={updateStaffFormField} required minLength={8} className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-[var(--ink)] outline-none" /></label>
            <div className="md:col-span-2"><p className="text-sm font-black uppercase tracking-[.12em] text-white/60">Roles</p><div className="mt-3 flex flex-wrap gap-2">{staffRoles.map((role) => <button key={role} type="button" onClick={() => toggleStaffFormRole(role)} className={`rounded-full px-4 py-2 text-sm font-black ${staffForm.roles.includes(role) ? "bg-[var(--accent)] text-[var(--ink)]" : "bg-white/10 text-white"}`}>{statusLabel(role)}</button>)}</div></div>
            <div className="md:col-span-2"><p className="text-sm font-black uppercase tracking-[.12em] text-white/60">Permissions</p><div className="mt-3 flex flex-wrap gap-2">{staffPermissions.map((permission) => <button key={permission} type="button" onClick={() => toggleStaffFormPermission(permission)} className={`rounded-full px-4 py-2 text-xs font-black ${staffForm.permissions.includes(permission) ? "bg-white text-[var(--ink)]" : "bg-white/10 text-white"}`}>{permission}</button>)}</div></div>
            <button type="submit" disabled={isPending} className="cta-primary bg-[var(--accent)] text-[var(--ink)] md:col-span-2"><ShieldCheck className="size-4" /> Create staff account</button>
          </form>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {staff.map((staffMember) => <article key={staffMember.id} className="rounded-2xl bg-white/8 p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-black">{staffMember.name}</p><p className="mt-1 text-sm text-white/60">{staffMember.email} | {staffMember.isActive ? "Active" : "Suspended"}</p></div><button type="button" disabled={isPending} onClick={() => updateStaffDraft(staffMember.id, "isActive", !(staffDrafts[staffMember.id]?.isActive ?? staffMember.isActive))} className="cta-outline border-white/20 py-2 text-white">{(staffDrafts[staffMember.id]?.isActive ?? staffMember.isActive) ? "Suspend" : "Reactivate"}</button></div><div className="mt-4"><p className="text-xs font-black uppercase tracking-[.12em] text-white/50">Roles</p><div className="mt-2 flex flex-wrap gap-2">{staffRoles.map((role) => <button key={role} type="button" onClick={() => toggleStaffDraftArray(staffMember, "roles", role)} className={`rounded-full px-3 py-2 text-xs font-black ${(staffDrafts[staffMember.id]?.roles ?? staffMember.roles).includes(role) ? "bg-[var(--accent)] text-[var(--ink)]" : "bg-white/10 text-white"}`}>{statusLabel(role)}</button>)}</div></div><div className="mt-4"><p className="text-xs font-black uppercase tracking-[.12em] text-white/50">Permissions</p><div className="mt-2 flex flex-wrap gap-2">{staffPermissions.map((permission) => <button key={permission} type="button" onClick={() => toggleStaffDraftArray(staffMember, "permissions", permission)} className={`rounded-full px-3 py-2 text-[11px] font-black ${(staffDrafts[staffMember.id]?.permissions ?? staffMember.permissions).includes(permission) ? "bg-white text-[var(--ink)]" : "bg-white/10 text-white"}`}>{permission}</button>)}</div></div><button type="button" disabled={isPending} onClick={() => saveStaff(staffMember)} className="cta-primary mt-4 bg-[var(--accent)] text-[var(--ink)]"><Save className="size-4" /> Save staff permissions</button></article>)}
            {staff.length === 0 ? <p className="text-sm font-bold text-white/60">Staff management is visible after logging in as a super administrator.</p> : null}
          </div>
        </section>
        <div className="mt-8 rounded-2xl bg-white/70 p-5 text-sm text-[var(--muted)]"><BarChart3 className="mb-2 size-5 text-[var(--accent-dark)]" />Reports are now connected. Product image uploads and deeper staff permission screens can build on this protected admin foundation.</div>
      </section>
    </main>
  );
}


