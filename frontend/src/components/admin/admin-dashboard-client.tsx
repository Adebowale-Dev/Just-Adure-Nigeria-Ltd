import { useEffect, useState, useTransition } from "react";
import { Activity, AlertTriangle, BarChart3, Boxes, ChevronDown, ClipboardList, Image, Mail, MessageSquareText, PackageCheck, RotateCcw, Save, Settings, ShieldCheck, Star, Tags, TrendingUp, Truck } from "lucide-react";
import {
  createAdminCoupon,
  getAdminCoupons,
  getAdminDashboard,
  getAdminOrders,
  getAdminProducts,
  getAdminReports,
  getAdminOrdersReportCsvUrl,
  getAdminPaymentsReportCsvUrl,
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
import { DeliveryZonesAdmin } from "@/components/admin/delivery-zones-admin";
import { ProductImagesAdmin } from "@/components/admin/product-images-admin";
import { ProductManagementAdmin } from "@/components/admin/product-management-admin";
import { CatalogueLookupsAdmin } from "@/components/admin/catalogue-lookups-admin";
import { AdminRevenueChart, AdminStatusBarChart } from "@/components/admin/admin-charts";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatNaira } from "@/lib/utils.js";

const orderStatuses = ["paid", "processing", "ready_for_pickup", "ready_for_delivery", "shipped", "out_for_delivery", "delivered", "cancelled"];
const reviewStatuses = ["pending", "approved", "rejected", "hidden"];
const returnStatuses = ["requested", "under_review", "approved", "rejected", "refunded", "closed"];
const supportStatuses = ["open", "in_progress", "waiting_for_customer", "resolved", "closed"];
const staffRoles = ["admin", "inventory_manager", "order_manager", "customer_support", "content_manager"];
const staffPermissions = ["dashboard:view", "reports:view", "products:read", "products:manage", "inventory:manage", "orders:read", "orders:update", "coupons:manage", "reviews:moderate", "returns:manage", "support:manage"];
const emptyReport = {
  summary: { totalRevenueKobo: 0, currentMonthRevenueKobo: 0, totalOrders: 0, paidOrders: 0, pendingOrders: 0, cancelledOrders: 0, totalRefundedKobo: 0, productsInStock: 0, lowStockProducts: 0, outOfStockProducts: 0 },
  ordersByStatus: {},
  paymentsByStatus: {},
  revenueByDate: [],
  recentOrders: [],
  recentPayments: [],
  recentRefunds: [],
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
  return <div className="group overflow-hidden rounded-[1.65rem] border border-black/8 bg-white p-5 shadow-[0_18px_50px_rgba(28,34,31,.06)] transition hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(28,34,31,.1)]"><div className="flex items-center justify-between gap-4"><p className="text-xs font-black uppercase tracking-[.14em] text-[var(--muted)]">{label}</p><TrendingUp className="size-4 text-[var(--accent-dark)] opacity-70" /></div><p className="mt-4 text-3xl font-black tracking-[-.05em] text-[var(--ink)]">{value}</p><div className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#f1eadf]"><span className="block h-full w-2/3 rounded-full bg-[var(--accent)] transition group-hover:w-full" /></div></div>;
}

const adminSections = [
  { href: "/admin", key: "overview", label: "Overview", description: "See what needs attention today", icon: BarChart3 },
  { href: "/admin/orders", key: "orders", label: "Orders", description: "Process and update customer orders", icon: ClipboardList },
  { href: "/admin/products", key: "products", label: "Products", description: "Add and edit catalogue items", icon: PackageCheck },
  { href: "/admin/inventory", key: "inventory", label: "Stock", description: "Check quantities and low stock", icon: Boxes },
  { href: "/admin/delivery", key: "delivery", label: "Delivery", description: "Manage areas, fees, and timing", icon: Truck },
  { href: "/admin/returns", key: "returns", label: "Returns", description: "Review returns and refunds", icon: RotateCcw },
  { href: "/admin/support", key: "support", label: "Support", description: "Reply to customer requests", icon: MessageSquareText },
  { href: "/admin/reviews", key: "reviews", label: "Reviews", description: "Approve customer feedback", icon: Star },
  { href: "/admin/coupons", key: "coupons", label: "Discounts", description: "Create and manage coupon codes", icon: Tags },
  { href: "/admin/reports", key: "reports", label: "Reports", description: "Understand sales and payments", icon: BarChart3 },
  { href: "/admin/content", key: "content", label: "Store content", description: "Update homepage messages", icon: Image },
  { href: "/admin/settings", key: "settings", label: "Settings", description: "Update store-wide details", icon: Settings },
];

const dailyActions = [
  { href: "/admin/products", label: "Add a product", description: "Enter the price, condition, stock, details, and upload clear photos.", icon: PackageCheck },
  { href: "/admin/orders", label: "Process orders", description: "Confirm payment and move each customer order to its next stage.", icon: ClipboardList },
  { href: "/admin/delivery", label: "Manage delivery", description: "Check delivery areas, charges, pickup options, and timing.", icon: Boxes },
  { href: "/admin/inventory", label: "Check stock", description: "Update quantities and see products that need attention.", icon: Tags },
  { href: "/admin/support", label: "Help customers", description: "Read enquiries and reply to customer support requests.", icon: MessageSquareText },
];

const adminSectionGroups = [
  { label: "Daily work", keys: ["overview", "orders", "products", "inventory", "delivery"] },
  { label: "Customers", keys: ["returns", "support", "reviews"] },
  { label: "Business tools", keys: ["coupons", "reports", "content", "settings"] },
];

function AdminSectionNav({ activeSection }) {
  return (
    <>
      <nav className="mb-6 rounded-[1.4rem] border border-black/8 bg-white p-3 shadow-[0_14px_45px_rgba(28,34,31,.05)] md:hidden" aria-label="Admin sections">
        <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Choose an admin workspace">
          {adminSections.map((item) => (
            <a key={item.key} href={item.href} className={`flex shrink-0 items-center gap-2 rounded-full px-4 py-2.5 text-sm font-black transition ${activeSection === item.key ? "bg-[var(--accent)] text-[var(--ink)]" : "text-[var(--muted)] hover:bg-[#fff3e8]"}`}><item.icon className="size-4" />{item.label}</a>
          ))}
        </div>
      </nav>
      <nav className="sticky top-[8.0625rem] hidden h-[calc(100dvh-8.0625rem)] flex-col border-r border-black/10 bg-white md:flex" aria-label="Admin sidebar">
        <div className="border-b border-black/8 px-3 py-4">
          <a href="/admin" className="flex items-center gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-black/10 bg-[#fbfaf6] text-[var(--accent-dark)]"><PackageCheck className="size-[1.1rem]" /></span>
            <span className="min-w-0"><strong className="block truncate text-sm font-black">Just Adure</strong><span className="block truncate text-xs text-[var(--muted)]">Store administration</span></span>
          </a>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-3">
        {adminSectionGroups.map((group) => <div key={group.label} className="py-3 first:pt-0">
          <p className="px-3 pb-2 text-[10px] font-black uppercase tracking-[.16em] text-[var(--muted)]">{group.label}</p>
          <div className="grid gap-1">
            {group.keys.map((key) => adminSections.find((item) => item.key === key)).filter(Boolean).map((item) => (
              <a key={item.key} href={item.href} aria-current={activeSection === item.key ? "page" : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-bold transition ${activeSection === item.key ? "bg-[#f1eee8] text-[var(--ink)]" : "text-[var(--muted)] hover:bg-[#f7f5f0] hover:text-[var(--ink)]"}`}><item.icon className={`size-[1.05rem] shrink-0 ${activeSection === item.key ? "text-[var(--accent-dark)]" : ""}`} />{item.label}</a>
            ))}
          </div>
        </div>)}
        </div>
        <div className="border-t border-black/8 p-3"><a href="/" className="flex items-center justify-between rounded-xl px-3 py-3 text-sm font-black text-[var(--ink)] hover:bg-[#fff3e8]"><span>View storefront</span><span aria-hidden="true">↗</span></a></div>
      </nav>
    </>
  );
}

function AdminDropdown({ value, options, placeholder = "Select", onValueChange, dark = false }) {
  const active = options.find((option) => option.value === value);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={`flex min-h-12 w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-black outline-none transition ${dark ? "border-black/10 bg-[#fff3e8] text-[var(--ink)]" : "border-black/10 bg-[#fff3e8] text-[var(--ink)] hover:border-[var(--accent)]/40"}`}>
        <span className="truncate">{active?.label ?? placeholder}</span>
        <ChevronDown className="ml-3 size-4 shrink-0 text-[var(--accent-dark)]" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-72 w-full min-w-[14rem] overflow-y-auto">
        {options.map((option) => (
          <DropdownMenuItem key={option.value || "all"} onClick={() => onValueChange(option.value)} className={option.value === value ? "bg-[#fff3e8] text-[var(--accent-dark)]" : ""}>{option.label}</DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
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

export function AdminDashboardClient({ section = "overview" }: { section?: string } = {}) {
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
  const requestedSection = section || "overview";
  const activeSection = adminSections.some((item) => item.key === requestedSection) ? requestedSection : "overview";
  const showSection = (name) => activeSection === name;
  const returnSummary = {
    total: returns.length,
    pending: returns.filter((item) => ["requested", "under_review"].includes(item.status)).length,
    approved: returns.filter((item) => item.status === "approved").length,
    refunded: returns.filter((item) => item.status === "refunded").length,
  };

  function loadAdminData() {
    const reportParams = buildReportParams(reportFilters);
    const loadOverview = activeSection === "overview";
    const loadProducts = loadOverview || ["products", "inventory"].includes(activeSection);
    const loadOrders = loadOverview || ["orders", "reports"].includes(activeSection);
    const loadReports = loadOverview || activeSection === "reports";
    const loadCoupons = loadOverview || activeSection === "coupons";
    const loadReviews = loadOverview || activeSection === "reviews";
    const loadReturns = loadOverview || activeSection === "returns";
    const loadSupport = loadOverview || activeSection === "support";
    const loadContent = loadOverview || activeSection === "content";
    const loadSettings = loadOverview || activeSection === "settings";
    const loadStaff = loadOverview || activeSection === "staff";

    Promise.all([
      loadOverview ? safeAdminLoad(getAdminDashboard(), null) : Promise.resolve(stats),
      loadProducts ? safeAdminLoad(getAdminProducts(), []) : Promise.resolve(products),
      loadOrders ? safeAdminLoad(getAdminOrders(), []) : Promise.resolve(orders),
      loadCoupons ? safeAdminLoad(getAdminCoupons(), []) : Promise.resolve(coupons),
      loadReviews ? safeAdminLoad(getAdminReviews(), []) : Promise.resolve(reviews),
      loadReturns ? safeAdminLoad(getAdminReturns(), []) : Promise.resolve(returns),
      loadSupport ? safeAdminLoad(getAdminSupportTickets(), []) : Promise.resolve(supportTickets),
      loadReports ? safeAdminLoad(getAdminReports(reportParams), emptyReport) : Promise.resolve(reports),
      loadStaff ? safeAdminLoad(getAdminStaff(), []) : Promise.resolve(staff),
      loadSettings ? safeAdminLoad(getAdminStoreSettings(), null) : Promise.resolve(storeSettings),
      loadOverview ? safeAdminLoad(getAdminActivityLogs(), []) : Promise.resolve(activityLogs),
      loadContent ? safeAdminLoad(getAdminHomepageContent(), null) : Promise.resolve(homepageContent),
      loadContent ? safeAdminLoad(getAdminNewsletterSubscribers(), { items: [], summary: { total: 0, subscribed: 0, unsubscribed: 0 } }) : Promise.resolve({ items: newsletterSubscribers, summary: newsletterSummary }),
    ])
      .then(([nextStats, nextProducts, nextOrders, nextCoupons, nextReviews, nextReturns, nextSupportTickets, nextReports, nextStaff, nextStoreSettings, nextActivityLogs, nextHomepageContent, nextNewsletter]) => {
        setStats(nextStats);
        setProducts(nextProducts);
        setOrders(nextOrders);
        setCoupons(nextCoupons);
        setReviews(nextReviews);
        setReturns(nextReturns);
        setSupportTickets(nextSupportTickets);
        setReports(nextReports);
        setStaff(nextStaff);
        setStoreSettings(nextStoreSettings);
        setStoreSettingsForm(settingsToForm(nextStoreSettings));
        setActivityLogs(nextActivityLogs);
        setHomepageContent(nextHomepageContent);
        setHomepageContentForm(homepageContentToForm(nextHomepageContent));
        setNewsletterSubscribers(nextNewsletter.items ?? []);
        setNewsletterSummary(nextNewsletter.summary ?? { total: 0, subscribed: 0, unsubscribed: 0 });
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
        const refundAmountNaira = draft.refundAmountNaira ?? (returnRequest.refundAmountKobo ? String(returnRequest.refundAmountKobo / 100) : "");
        const refundReference = draft.refundReference ?? returnRequest.refundReference ?? undefined;
        await updateAdminReturn(returnRequest.id, {
          status,
          adminNote,
          ...(status === "refunded"
            ? { refundAmountKobo: Math.round(Number(refundAmountNaira) * 100), refundReference }
            : {}),
        });
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
    <main className="min-h-screen bg-[#f6f3ec] px-4 py-8 sm:px-6 md:px-0 md:py-0">
      <section className="w-full">
        {error ? <div className="mb-6 rounded-2xl border border-[var(--accent)]/30 bg-[#fff8ed] p-4 text-sm font-bold"><AlertTriangle className="mb-2 size-5 text-[var(--accent-dark)]" />{error}</div> : null}
        {message ? <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-900">{message}</div> : null}
        <div className="md:grid md:min-h-[calc(100dvh-8.0625rem)] md:grid-cols-[14rem_minmax(0,1fr)] md:items-start lg:grid-cols-[16rem_minmax(0,1fr)]">
          <AdminSectionNav activeSection={activeSection} />
          <div className="min-w-0 md:p-6 lg:p-8 xl:p-10">

        {showSection("overview") ? <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total revenue" value={formatNaira(stats?.totalRevenueKobo ?? 0)} />
          <StatCard label="Total orders" value={stats?.totalOrders ?? "..."} />
          <StatCard label="Catalogue items" value={stats?.totalProducts ?? "..."} />
          <StatCard label="Low stock alerts" value={stats?.lowStockProducts ?? "..."} />
        </div> : null}

        {showSection("overview") ? <div className="mt-6"><AdminRevenueChart data={reports?.revenueByDate ?? []} /></div> : null}

        {showSection("overview") ? <section className="mt-8">
          <div><p className="section-kicker">Daily work</p><h2 className="mt-2 text-2xl font-black tracking-[-.03em]">Choose a task</h2></div>
          <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {dailyActions.map(({ href, label, description, icon: Icon }, index) => <a key={href} href={href} className="group rounded-[1.5rem] border border-black/8 bg-white p-5 shadow-[0_14px_40px_rgba(28,34,31,.04)] transition hover:-translate-y-1 hover:border-[var(--accent)]/40"><span className="grid size-10 place-items-center rounded-xl bg-[#fff3e8] text-[var(--accent-dark)]"><Icon className="size-5" /></span><p className="mt-5 text-xs font-black uppercase tracking-[.12em] text-[var(--muted)]">Step {index + 1}</p><h3 className="mt-1 text-lg font-black">{label}</h3><p className="mt-2 text-sm font-bold leading-6 text-[var(--muted)]">{description}</p></a>)}
          </div>
          <details className="mt-6 rounded-2xl border border-black/8 bg-white p-5"><summary className="cursor-pointer font-black text-[var(--ink)]">More business tools</summary><div className="mt-4 flex flex-wrap gap-2">{adminSections.filter((item) => !["overview", "products", "orders", "delivery", "inventory", "support"].includes(item.key)).map((item) => <a key={item.key} href={item.href} className="rounded-full bg-[#f6f3ec] px-4 py-2 text-sm font-black hover:bg-[#fff3e8]">{item.label}</a>)}</div></details>
        </section> : null}


        {showSection("reports") ? <section className="mt-8 overflow-hidden rounded-[2.2rem] border border-black/8 bg-[#f7f2e9] shadow-[0_24px_80px_rgba(28,34,31,.08)]">
          <div className="border-b border-black/8 bg-white px-6 py-7 text-[var(--ink)] sm:px-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="max-w-2xl">
                <div className="flex items-center gap-3">
                  <span className="grid size-11 place-items-center rounded-2xl bg-[#fff3e8]"><BarChart3 className="size-5 text-[var(--accent)]" /></span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[.16em] text-[var(--accent)]">Admin analytics</p>
                    <h2 className="mt-1 text-3xl font-black tracking-[-.05em]">Reports and statistics</h2>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-[var(--muted)]">Monitor revenue, order movement, payment health and store performance from one clean reporting workspace.</p>
              </div>
              <div className="flex flex-wrap gap-3">
                <a href={getAdminOrdersReportCsvUrl(buildReportParams(reportFilters))} className="rounded-2xl border border-black/10 bg-white px-5 py-3 text-sm font-black text-[var(--ink)] transition hover:bg-[var(--accent)]" target="_blank" rel="noreferrer">Export orders CSV</a>
                <a href={getAdminPaymentsReportCsvUrl(buildReportParams(reportFilters))} className="rounded-2xl border border-black/10 bg-[#fff3e8] px-5 py-3 text-sm font-black text-[var(--ink)] transition hover:bg-[#fff3e8]" target="_blank" rel="noreferrer">Export payments CSV</a>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-8">
            <form onSubmit={refreshReports} className="rounded-[1.8rem] border border-black/8 bg-white p-4 shadow-[0_18px_50px_rgba(28,34,31,.05)] sm:p-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                <label className="grid gap-2 text-sm font-bold">Range<AdminDropdown value={reportFilters.range} options={[{ value: "today", label: "Today" }, { value: "week", label: "This week" }, { value: "month", label: "This month" }, { value: "custom", label: "Custom" }]} onValueChange={(value) => setReportFilters((current) => ({ ...current, range: value }))} /></label>
                <label className="grid gap-2 text-sm font-bold">From<input name="dateFrom" type="date" value={reportFilters.dateFrom} onChange={updateReportFilter} className="min-h-12 rounded-2xl border border-black/10 bg-white px-4 py-3 font-bold outline-none" /></label>
                <label className="grid gap-2 text-sm font-bold">To<input name="dateTo" type="date" value={reportFilters.dateTo} onChange={updateReportFilter} className="min-h-12 rounded-2xl border border-black/10 bg-white px-4 py-3 font-bold outline-none" /></label>
                <label className="grid gap-2 text-sm font-bold">Order status<AdminDropdown value={reportFilters.orderStatus} options={[{ value: "", label: "All orders" }, ...orderStatuses.map((status) => ({ value: status, label: statusLabel(status) }))]} onValueChange={(value) => setReportFilters((current) => ({ ...current, orderStatus: value }))} /></label>
                <label className="grid gap-2 text-sm font-bold">Payment<AdminDropdown value={reportFilters.paymentStatus} options={[{ value: "", label: "All payments" }, { value: "pending", label: "Pending" }, { value: "successful", label: "Successful" }, { value: "failed", label: "Failed" }, { value: "abandoned", label: "Abandoned" }, { value: "refunded", label: "Refunded" }, { value: "partially_refunded", label: "Partially refunded" }]} onValueChange={(value) => setReportFilters((current) => ({ ...current, paymentStatus: value }))} /></label>
              </div>
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs font-bold uppercase tracking-[.12em] text-[var(--muted)]">Use filters, then refresh to update charts and CSV exports.</p>
                <button type="submit" disabled={isPending} className="cta-primary justify-center">Refresh report</button>
              </div>
            </form>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard label="Filtered revenue" value={formatNaira(reports?.summary?.totalRevenueKobo ?? 0)} />
              <StatCard label="Month revenue" value={formatNaira(reports?.summary?.currentMonthRevenueKobo ?? 0)} />
              <StatCard label="Filtered orders" value={reports?.summary?.totalOrders ?? "..."} />
              <StatCard label="Cancelled orders" value={reports?.summary?.cancelledOrders ?? "..."} />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(22rem,.7fr)]">
              <AdminRevenueChart data={reports?.revenueByDate ?? []} />
              <div className="grid gap-6 content-start">
                <AdminStatusBarChart eyebrow="Order pipeline" title="Orders by status" data={Object.entries(reports?.ordersByStatus ?? {}).map(([status, count]) => ({ label: statusLabel(status), value: Number(count) }))} />
                <AdminStatusBarChart eyebrow="Payment health" title="Payments by status" data={Object.entries(reports?.paymentsByStatus ?? {}).map(([status, count]) => ({ label: statusLabel(status), value: Number(count) }))} />
              </div>
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-[1.8rem] border border-black/8 bg-white p-5 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
                <div className="flex items-center justify-between gap-4"><p className="font-black">Best sellers</p><span className="rounded-full bg-[#fff3e8] px-3 py-1 text-xs font-black uppercase tracking-[.1em] text-[var(--accent-dark)]">Top products</span></div>
                <div className="mt-4 grid gap-3 text-sm text-[var(--muted)]">{(reports?.bestSellingProducts ?? []).map((item) => <p key={item.sku} className="flex items-center justify-between gap-4 rounded-2xl bg-[#fbfaf6] px-4 py-3"><span className="font-bold text-[var(--ink)]">{item.name}</span><strong>{item.quantitySold}</strong></p>)}</div>
                {(reports?.bestSellingProducts ?? []).length === 0 ? <p className="mt-4 text-sm font-bold text-[var(--muted)]">Best-selling products will appear after completed orders.</p> : null}
              </div>
              <div className="rounded-[1.8rem] border border-black/8 bg-white p-5 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
                <div className="flex items-center justify-between gap-4"><p className="font-black">Recent refunds</p><span className="rounded-full bg-[#f1eadf] px-3 py-1 text-xs font-black uppercase tracking-[.1em] text-[var(--muted)]">Finance</span></div>
                <div className="mt-4 grid gap-3 text-sm text-[var(--muted)]">{(reports?.recentRefunds ?? []).slice(0, 5).map((refund) => <p key={refund.id} className="flex items-center justify-between gap-4 rounded-2xl bg-[#fbfaf6] px-4 py-3"><span className="font-bold text-[var(--ink)]">{refund.orderNumber}</span><strong>{formatNaira(refund.refundAmountKobo)}</strong></p>)}</div>
                {(reports?.recentRefunds ?? []).length === 0 ? <p className="mt-4 text-sm font-bold text-[var(--muted)]">Refund records will show here when available.</p> : null}
              </div>
            </div>
          </div>
        </section> : null}
        {showSection("products") ? <div id="admin-products" className="scroll-mt-32"><div><p className="section-kicker">Step 1</p><h2 className="mt-1 text-2xl font-black">Enter product details</h2></div><ProductManagementAdmin products={products} onProductsChanged={loadAdminData} /></div> : null}

        {showSection("inventory") || showSection("orders") ? <div className="mt-10 grid gap-8 xl:grid-cols-[1fr_1fr]">
          {showSection("inventory") ? <section className="rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
            <div className="flex items-center gap-3"><Boxes className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Inventory</h2></div>
            <div className="mt-6 grid gap-4">
              {products.slice(0, 8).map((product) => <article key={product.id} className="rounded-2xl border border-black/8 p-4"><p className="font-black">{product.name}</p><p className="mt-1 text-sm text-[var(--muted)]">{product.sku} | {statusLabel(product.availability)} | {product.availableQuantity} available</p><div className="mt-4 flex gap-3"><input type="number" min={0} value={stockDrafts[product.id] ?? product.stockQuantity} onChange={(event) => setStockDrafts((current) => ({ ...current, [product.id]: event.target.value }))} className="w-28 rounded-xl border border-black/10 px-3 py-2 font-black outline-none" /><button type="button" disabled={isPending} onClick={() => saveStock(product)} className="cta-outline py-2"><Save className="size-4" /> Save</button></div></article>)}
              {products.length === 0 ? <p className="text-sm font-bold text-[var(--muted)]">No products yet.</p> : null}
            </div>
          </section> : null}

          {showSection("orders") ? <section id="admin-orders" className="scroll-mt-32 rounded-[2rem] border border-black/8 bg-white p-6 text-[var(--ink)] shadow-[0_18px_50px_rgba(28,34,31,.06)]">
            <div className="flex items-center gap-3"><ClipboardList className="size-5 text-[var(--accent)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Orders</h2></div>
            <div className="mt-6 grid gap-4">
              {orders.slice(0, 8).map((order) => <article key={order.id} className="rounded-2xl bg-[#fbfaf6] p-4"><p className="font-black">{order.orderNumber}</p><p className="mt-1 text-sm text-[var(--muted)]">{order.customer.email} | {formatNaira(order.totalKobo)} | {order.paymentStatus}</p><div className="mt-4 flex flex-col gap-3 sm:flex-row"><AdminDropdown dark value={orderDrafts[order.id] ?? order.orderStatus} options={orderStatuses.map((status) => ({ value: status, label: statusLabel(status) }))} onValueChange={(value) => setOrderDrafts((current) => ({ ...current, [order.id]: value }))} /><button type="button" disabled={isPending} onClick={() => saveOrderStatus(order)} className="cta-primary bg-[var(--accent)] py-2 text-[var(--ink)]"><PackageCheck className="size-4" /> Update</button></div></article>)}
              {orders.length === 0 ? <p className="text-sm font-bold text-[var(--muted)]">No orders yet.</p> : null}
            </div>
          </section> : null}
        </div> : null}



        {showSection("products") ? <div><div className="mt-10"><p className="section-kicker">Step 2</p><h2 className="mt-1 text-2xl font-black">Upload actual product photos</h2><p className="mt-2 text-sm font-bold text-[var(--muted)]">Select the product you saved in Step 1, then upload clear images and choose the main photo.</p></div><ProductImagesAdmin products={products} onProductsChanged={loadAdminData} /></div> : null}

        {showSection("products") ? <details className="mt-10 rounded-[1.5rem] border border-black/8 bg-white p-5"><summary className="cursor-pointer text-lg font-black">Step 3: Add a missing category or brand</summary><p className="mt-2 text-sm font-bold text-[var(--muted)]">Most admins can skip this step. Open it only when the correct category, car manufacturer, or condition is not already available.</p><CatalogueLookupsAdmin onLookupsChanged={loadAdminData} /></details> : null}

        {showSection("delivery") ? <DeliveryZonesAdmin /> : null}

        {showSection("support") ? <section className="mt-8 rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
          <div className="flex items-center gap-3"><MessageSquareText className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Support tickets</h2></div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {supportTickets.slice(0, 8).map((ticket) => <article key={ticket.id} className="rounded-2xl border border-black/8 bg-[#fbfaf6] p-5"><p className="font-black">{ticket.ticketNumber}</p><p className="mt-1 text-sm text-[var(--muted)]">{ticket.email} | {statusLabel(ticket.type)} | {statusLabel(ticket.status)}</p><p className="mt-3 font-bold">{ticket.subject}</p><p className="mt-2 text-sm leading-6 text-[var(--muted)]">{ticket.message}</p><div className="mt-4 grid gap-3"><AdminDropdown value={supportDrafts[ticket.id]?.status ?? ticket.status} options={supportStatuses.map((status) => ({ value: status, label: statusLabel(status) }))} onValueChange={(value) => updateSupportDraft(ticket.id, "status", value)} /><textarea value={supportDrafts[ticket.id]?.reply ?? ""} onChange={(event) => updateSupportDraft(ticket.id, "reply", event.target.value)} rows={3} placeholder="Reply to customer" className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" /><textarea value={supportDrafts[ticket.id]?.internalNote ?? ticket.internalNote ?? ""} onChange={(event) => updateSupportDraft(ticket.id, "internalNote", event.target.value)} rows={2} placeholder="Internal note" className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" /><button type="button" disabled={isPending} onClick={() => saveSupportTicket(ticket)} className="cta-primary"><MessageSquareText className="size-4" /> Update ticket</button></div></article>)}
            {supportTickets.length === 0 ? <p className="text-sm font-bold text-[var(--muted)]">No support tickets yet.</p> : null}
          </div>
        </section> : null}
        {showSection("returns") ? <section className="mt-8 space-y-6">
          <div className="overflow-hidden rounded-[2.2rem] border border-black/8 bg-white shadow-[0_20px_70px_rgba(28,34,31,.07)]">
            <div className="grid gap-6 bg-white p-6 sm:p-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="flex items-center gap-3">
                  <span className="grid size-12 place-items-center rounded-2xl bg-[#fff3e8] text-[var(--accent-dark)]"><RotateCcw className="size-5" /></span>
                  <div>
                    <p className="text-xs font-black uppercase tracking-[.16em] text-[var(--accent-dark)]">After-sales desk</p>
                    <h2 className="mt-1 text-3xl font-black tracking-[-.05em] text-[var(--ink)]">Returns and refunds</h2>
                  </div>
                </div>
                <p className="mt-4 max-w-2xl text-sm font-bold leading-6 text-[var(--muted)]">Review customer return requests, record internal notes, and safely track refund references without mixing them into the main orders page.</p>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:min-w-[30rem]">
                <div className="rounded-2xl border border-black/8 bg-white p-4"><p className="text-xs font-black uppercase tracking-[.12em] text-[var(--muted)]">Total</p><p className="mt-2 text-2xl font-black text-[var(--ink)]">{returnSummary.total}</p></div>
                <div className="rounded-2xl border border-black/8 bg-white p-4"><p className="text-xs font-black uppercase tracking-[.12em] text-[var(--muted)]">Pending</p><p className="mt-2 text-2xl font-black text-[var(--accent-dark)]">{returnSummary.pending}</p></div>
                <div className="rounded-2xl border border-black/8 bg-white p-4"><p className="text-xs font-black uppercase tracking-[.12em] text-[var(--muted)]">Approved</p><p className="mt-2 text-2xl font-black text-[var(--ink)]">{returnSummary.approved}</p></div>
                <div className="rounded-2xl border border-black/8 bg-white p-4"><p className="text-xs font-black uppercase tracking-[.12em] text-[var(--muted)]">Refunded</p><p className="mt-2 text-2xl font-black text-emerald-700">{returnSummary.refunded}</p></div>
              </div>
            </div>
          </div>

          {returns.length === 0 ? <div className="rounded-[2rem] border border-dashed border-black/15 bg-white p-10 text-center shadow-[0_18px_50px_rgba(28,34,31,.04)]"><RotateCcw className="mx-auto size-10 text-[var(--accent-dark)]" /><h3 className="mt-4 text-2xl font-black tracking-[-.03em] text-[var(--ink)]">No return requests yet.</h3><p className="mx-auto mt-2 max-w-md text-sm font-bold leading-6 text-[var(--muted)]">When customers request a return or refund, each case will appear here for review and follow-up.</p></div> : null}

          <div className="grid gap-5">
            {returns.slice(0, 12).map((returnRequest) => (
              <article key={returnRequest.id} className="overflow-hidden rounded-[2rem] border border-black/8 bg-white shadow-[0_18px_55px_rgba(28,34,31,.06)]">
                <div className="grid gap-5 border-b border-black/8 bg-[#fbfaf6] p-5 lg:grid-cols-[1fr_auto] lg:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#fff3e8] px-3 py-1 text-xs font-black uppercase tracking-[.1em] text-[var(--accent-dark)]">{statusLabel(returnRequest.status)}</span>
                      <span className="rounded-full border border-black/10 bg-white px-3 py-1 text-xs font-black uppercase tracking-[.1em] text-[var(--muted)]">{statusLabel(returnRequest.reason)}</span>
                    </div>
                    <h3 className="mt-3 text-xl font-black tracking-[-.03em] text-[var(--ink)]">{returnRequest.requestNumber}</h3>
                    <p className="mt-1 text-sm font-bold text-[var(--muted)]">Order {returnRequest.orderNumber} | {returnRequest.customerEmail}</p>
                  </div>
                  <div className="rounded-2xl border border-black/8 bg-white px-4 py-3 text-sm font-black text-[var(--ink)]">
                    Requested items: {returnRequest.items.length}
                  </div>
                </div>

                <div className="grid gap-6 p-5 lg:grid-cols-[1fr_.75fr]">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[.14em] text-[var(--muted)]">Customer explanation</p>
                    <p className="mt-3 rounded-2xl bg-[#fbfaf6] p-4 text-sm font-bold leading-6 text-[var(--muted)]">{returnRequest.details}</p>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {returnRequest.items.map((item) => <div key={String(returnRequest.id) + "-" + item.sku} className="rounded-2xl border border-black/8 bg-white p-4"><p className="font-black text-[var(--ink)]">{item.name}</p><p className="mt-1 text-sm font-bold text-[var(--muted)]">SKU {item.sku} | Qty {item.quantity}</p></div>)}
                    </div>
                  </div>

                  <div className="rounded-[1.4rem] border border-black/8 bg-[#fbfaf6] p-4">
                    <p className="text-xs font-black uppercase tracking-[.14em] text-[var(--muted)]">Admin action</p>
                    <div className="mt-4 grid gap-3">
                      <AdminDropdown value={returnDrafts[returnRequest.id]?.status ?? returnRequest.status} options={returnStatuses.map((status) => ({ value: status, label: statusLabel(status) }))} onValueChange={(value) => updateReturnDraft(returnRequest.id, "status", value)} />
                      <textarea value={returnDrafts[returnRequest.id]?.adminNote ?? returnRequest.adminNote ?? ""} onChange={(event) => updateReturnDraft(returnRequest.id, "adminNote", event.target.value)} rows={4} placeholder="Admin note for this return" className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]" />
                      {returnRequest.refundAmountKobo ? <p className="rounded-2xl bg-white px-4 py-3 text-xs font-black text-emerald-700">Refund recorded: {formatNaira(returnRequest.refundAmountKobo)} | {returnRequest.refundReference ?? "No reference"}</p> : null}
                      <input value={returnDrafts[returnRequest.id]?.refundAmountNaira ?? (returnRequest.refundAmountKobo ? String(returnRequest.refundAmountKobo / 100) : "")} onChange={(event) => updateReturnDraft(returnRequest.id, "refundAmountNaira", event.target.value)} type="number" min="1" step="1" placeholder="Refund amount in naira" className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]" />
                      <input value={returnDrafts[returnRequest.id]?.refundReference ?? returnRequest.refundReference ?? ""} onChange={(event) => updateReturnDraft(returnRequest.id, "refundReference", event.target.value)} placeholder="Refund reference or Paystack note" className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm text-[var(--ink)] outline-none focus:border-[var(--accent-dark)]" />
                      <button type="button" disabled={isPending} onClick={() => saveReturn(returnRequest)} className="cta-primary justify-center"><RotateCcw className="size-4" /> Update return</button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section> : null}
        {showSection("reviews") ? <section className="mt-8 rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
          <div className="flex items-center gap-3"><MessageSquareText className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Review moderation</h2></div>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {reviews.slice(0, 8).map((review) => <article key={review.id} className="rounded-2xl border border-black/8 bg-[#fbfaf6] p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-black">{review.title}</p><p className="mt-1 text-sm text-[var(--muted)]">{review.productName ?? "Product"} | {review.customerName}</p>{review.isVerifiedPurchase ? <p className="mt-2 text-xs font-black uppercase tracking-[.12em] text-emerald-700">Verified purchase</p> : null}</div><div className="flex gap-1 text-[var(--accent-dark)]">{Array.from({ length: review.rating }).map((_, index) => <Star key={index} className="size-4 fill-[var(--accent)] text-[var(--accent)]" />)}</div></div><p className="mt-4 text-sm leading-6 text-[var(--muted)]">{review.comment}</p><div className="mt-4 grid gap-3"><AdminDropdown value={reviewDrafts[review.id]?.status ?? review.status} options={reviewStatuses.map((status) => ({ value: status, label: statusLabel(status) }))} onValueChange={(value) => updateReviewDraft(review.id, "status", value)} /><textarea value={reviewDrafts[review.id]?.adminReply ?? review.adminReply ?? ""} onChange={(event) => updateReviewDraft(review.id, "adminReply", event.target.value)} rows={3} placeholder="Optional store reply" className="rounded-xl border border-black/10 bg-white px-3 py-2 text-sm outline-none" /><button type="button" disabled={isPending} onClick={() => saveReview(review)} className="cta-primary"><MessageSquareText className="size-4" /> Save moderation</button></div></article>)}
            {reviews.length === 0 ? <p className="text-sm font-bold text-[var(--muted)]">No reviews submitted yet.</p> : null}
          </div>
        </section> : null}

        {showSection("coupons") ? <section className="mt-8 rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
          <div className="flex items-center gap-3"><Tags className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Coupon management</h2></div>
          <form onSubmit={createCoupon} className="mt-6 grid gap-4 md:grid-cols-4">
            <label className="grid gap-2 text-sm font-bold">Code<input name="code" value={couponForm.code} onChange={updateCouponField} required placeholder="LAUNCH10" className="rounded-2xl border border-black/10 px-4 py-3 uppercase outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold">Name<input name="name" value={couponForm.name} onChange={updateCouponField} required placeholder="Launch discount" className="rounded-2xl border border-black/10 px-4 py-3 outline-none focus:border-[var(--accent-dark)]" /></label>
            <label className="grid gap-2 text-sm font-bold">Type<AdminDropdown value={couponForm.type} options={[{ value: "percentage", label: "Percentage" }, { value: "fixed", label: "Fixed amount" }]} onValueChange={(value) => setCouponForm((current) => ({ ...current, type: value }))} /></label>
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
        </section> : null}






        {showSection("content") ? <section className="mt-8 rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
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
        </section> : null}        {showSection("content") ? <section className="mt-8 rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
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
        </section> : null}        {showSection("settings") ? <section className="mt-8 rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)] sm:p-8">
          <div className="flex items-center gap-3"><Activity className="size-5 text-[var(--accent-dark)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Admin activity logs</h2></div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Recent protected administrator actions, visible to super administrators.</p>
          <div className="mt-6 grid gap-3">
            {activityLogs.slice(0, 10).map((log) => <article key={log.id} className="rounded-2xl border border-black/8 bg-white p-4"><div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-black">{statusLabel(log.action)} <span className="text-[var(--muted)]">on</span> {statusLabel(log.resourceType)}</p><p className="mt-1 text-sm text-[var(--muted)]">{log.administratorName} | {log.administratorEmail}</p></div><p className="text-xs font-black uppercase tracking-[.12em] text-[var(--muted)]">{log.createdAt ? new Date(log.createdAt).toLocaleString() : ""}</p></div><p className="mt-3 text-xs font-bold text-[var(--muted)]">Resource: {log.resourceId || "n/a"} | Request: {log.requestId || "n/a"}</p></article>)}
            {activityLogs.length === 0 ? <p className="text-sm font-bold text-[var(--muted)]">Activity logs are visible after logging in as a super administrator.</p> : null}
          </div>
        </section> : null}        {showSection("settings") ? <section className="mt-8 rounded-[2rem] border border-black/8 bg-white p-6 shadow-[0_18px_50px_rgba(28,34,31,.06)]">
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
        </section> : null}        {showSection("staff") ? <section className="mt-8 rounded-[2rem] border border-black/8 bg-white p-6 text-[var(--ink)] shadow-[0_18px_50px_rgba(28,34,31,.06)]">
          <div className="flex items-center gap-3"><ShieldCheck className="size-5 text-[var(--accent)]" /><h2 className="text-2xl font-black tracking-[-.03em]">Staff roles and permissions</h2></div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted)]">Super administrators can create staff accounts and assign only the permissions each role needs.</p>
          <form onSubmit={createStaff} className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-bold">Name<input name="name" value={staffForm.name} onChange={updateStaffFormField} required className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-[var(--ink)] outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Email<input name="email" type="email" value={staffForm.email} onChange={updateStaffFormField} required className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-[var(--ink)] outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Phone<input name="phone" value={staffForm.phone} onChange={updateStaffFormField} required className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-[var(--ink)] outline-none" /></label>
            <label className="grid gap-2 text-sm font-bold">Temporary password<input name="password" type="password" value={staffForm.password} onChange={updateStaffFormField} required minLength={8} className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-[var(--ink)] outline-none" /></label>
            <div className="md:col-span-2"><p className="text-sm font-black uppercase tracking-[.12em] text-[var(--muted)]">Roles</p><div className="mt-3 flex flex-wrap gap-2">{staffRoles.map((role) => <button key={role} type="button" onClick={() => toggleStaffFormRole(role)} className={`rounded-full px-4 py-2 text-sm font-black ${staffForm.roles.includes(role) ? "bg-[var(--accent)] text-[var(--ink)]" : "bg-[#fff3e8] text-white"}`}>{statusLabel(role)}</button>)}</div></div>
            <div className="md:col-span-2"><p className="text-sm font-black uppercase tracking-[.12em] text-[var(--muted)]">Permissions</p><div className="mt-3 flex flex-wrap gap-2">{staffPermissions.map((permission) => <button key={permission} type="button" onClick={() => toggleStaffFormPermission(permission)} className={`rounded-full px-4 py-2 text-xs font-black ${staffForm.permissions.includes(permission) ? "bg-[#fff3e8] text-[var(--ink)]" : "bg-[#fff3e8] text-white"}`}>{permission}</button>)}</div></div>
            <button type="submit" disabled={isPending} className="cta-primary bg-[var(--accent)] text-[var(--ink)] md:col-span-2"><ShieldCheck className="size-4" /> Create staff account</button>
          </form>
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {staff.map((staffMember) => <article key={staffMember.id} className="rounded-2xl bg-[#fbfaf6] p-5"><div className="flex items-start justify-between gap-4"><div><p className="font-black">{staffMember.name}</p><p className="mt-1 text-sm text-[var(--muted)]">{staffMember.email} | {staffMember.isActive ? "Active" : "Suspended"}</p></div><button type="button" disabled={isPending} onClick={() => updateStaffDraft(staffMember.id, "isActive", !(staffDrafts[staffMember.id]?.isActive ?? staffMember.isActive))} className="cta-outline border-black/10 py-2 text-[var(--ink)]">{(staffDrafts[staffMember.id]?.isActive ?? staffMember.isActive) ? "Suspend" : "Reactivate"}</button></div><div className="mt-4"><p className="text-xs font-black uppercase tracking-[.12em] text-[var(--muted)]">Roles</p><div className="mt-2 flex flex-wrap gap-2">{staffRoles.map((role) => <button key={role} type="button" onClick={() => toggleStaffDraftArray(staffMember, "roles", role)} className={`rounded-full px-3 py-2 text-xs font-black ${(staffDrafts[staffMember.id]?.roles ?? staffMember.roles).includes(role) ? "bg-[var(--accent)] text-[var(--ink)]" : "bg-[#fff3e8] text-white"}`}>{statusLabel(role)}</button>)}</div></div><div className="mt-4"><p className="text-xs font-black uppercase tracking-[.12em] text-[var(--muted)]">Permissions</p><div className="mt-2 flex flex-wrap gap-2">{staffPermissions.map((permission) => <button key={permission} type="button" onClick={() => toggleStaffDraftArray(staffMember, "permissions", permission)} className={`rounded-full px-3 py-2 text-[11px] font-black ${(staffDrafts[staffMember.id]?.permissions ?? staffMember.permissions).includes(permission) ? "bg-[#fff3e8] text-[var(--ink)]" : "bg-[#fff3e8] text-white"}`}>{permission}</button>)}</div></div><button type="button" disabled={isPending} onClick={() => saveStaff(staffMember)} className="cta-primary mt-4 bg-[var(--accent)] text-[var(--ink)]"><Save className="size-4" /> Save staff permissions</button></article>)}
            {staff.length === 0 ? <p className="text-sm font-bold text-[var(--muted)]">Staff management is visible after logging in as a super administrator.</p> : null}
          </div>
        </section> : null}
        {showSection("overview") ? <div className="mt-8 rounded-2xl bg-white/70 p-5 text-sm text-[var(--muted)]"><BarChart3 className="mb-2 size-5 text-[var(--accent-dark)]" />Reports are connected and update from real store activity.</div> : null}
          </div>
        </div>
      </section>
    </main>
  );
}











