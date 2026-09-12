  "use client";

import { useMemo } from "react";
import { AccountClient } from "@/components/customer/account-client";
import { CustomerAddressesPage } from "@/components/customer/customer-addresses-page";
import { CustomerOrdersPage } from "@/components/customer/customer-order-history";
import { AdminDashboardClient } from "@/components/admin/admin-dashboard-client";
import { BasicPage } from "@/components/storefront/basic-page";
import { CartClient } from "@/components/commerce/cart-client";
import { CheckoutClient } from "@/components/commerce/checkout-client";
import { ContactClient } from "@/components/support/contact-client";
import { CustomerProfileClient } from "@/components/customer/customer-profile-client";
import { EmailVerificationClient } from "@/components/login/email-verification-client";
import { Footer } from "@/components/layout/footer";
import { ForgotPasswordClient } from "@/components/login/forgot-password-client";
import { HomePage } from "@/components/storefront/home-page";
import { LoginClient } from "@/components/login/login-client";
import { NotFoundPage } from "@/components/storefront/not-found-page";
import { OrderTrackingClient } from "@/components/commerce/order-tracking-client";
import { PaymentResultClient } from "@/components/commerce/payment-result-client";
import { ProductDetailsPage } from "@/components/storefront/product-details-page";
import { RegisterClient } from "@/components/login/register-client";
import { ResetPasswordClient } from "@/components/login/reset-password-client";
import { ShopPage } from "@/components/storefront/shop-page";
import { SiteHeader } from "@/components/layout/site-header";
import { WishlistClient } from "@/components/customer/wishlist-client";

export default function App({ initialPath = "/" }) {
  const url = useMemo(
    () => new URL(initialPath, typeof window === "undefined" ? "http://localhost:3000" : window.location.origin),
    [initialPath],
  );
  const pathname = url.pathname;
  const hideSiteChrome = ["/login", "/register", "/forgot-password"].includes(pathname);
  const hideFooter = hideSiteChrome
    || pathname.startsWith("/admin")
    || pathname.startsWith("/account")
    || ["/profile", "/wishlist", "/cart", "/checkout", "/payment-result", "/order-tracking", "/reset-password", "/verify-email"].includes(pathname);

  let page;

  if (pathname === "/") {
    page = <HomePage />;
  } else if (pathname === "/account") {
    page = <AccountClient />;
  } else if (pathname === "/account/orders") {
    page = <CustomerOrdersPage />;
  } else if (pathname === "/account/addresses") {
    page = <CustomerAddressesPage />;
  } else if (pathname === "/profile") {
    page = <CustomerProfileClient />;
  } else if (pathname === "/admin") {
    page = <AdminDashboardClient section="overview" />;
  } else if (["/returns", "/refunds", "/return-refund", "/returns-refunds", "/admin/return", "/admin/refund", "/admin/return-refund", "/admin/returns-refunds"].includes(pathname)) {
    page = <AdminDashboardClient section="returns" />;
  } else if (pathname.startsWith("/admin/")) {
    page = <AdminDashboardClient section={pathname.replace("/admin/", "")} />;
  } else if (pathname === "/shop") {
    page = <ShopPage defaultQuery={url.searchParams.get("q") ?? ""} defaultCategory={url.searchParams.get("category") ?? ""} />;
  } else if (pathname === "/wishlist") {
    page = <WishlistClient />;
  } else if (pathname === "/cart") {
    page = <CartClient />;
  } else if (pathname === "/checkout") {
    page = <CheckoutClient />;
  } else if (pathname === "/contact") {
    page = <ContactClient />;
  } else if (pathname === "/login") {
    page = <LoginClient />;
  } else if (pathname === "/register") {
    page = <RegisterClient />;
  } else if (pathname === "/forgot-password") {
    page = <ForgotPasswordClient />;
  } else if (pathname === "/reset-password") {
    page = <ResetPasswordClient token={url.searchParams.get("token") ?? ""} />;
  } else if (pathname === "/verify-email") {
    page = <EmailVerificationClient token={url.searchParams.get("token") ?? ""} />;
  } else if (pathname === "/payment-result") {
    page = <PaymentResultClient reference={url.searchParams.get("reference") ?? ""} />;
  } else if (pathname === "/order-tracking") {
    page = <OrderTrackingClient initialOrderNumber={url.searchParams.get("orderNumber") ?? ""} />;
  } else if (pathname === "/search") {
    page = <ShopPage defaultQuery={url.searchParams.get("q") ?? ""} />;
  } else if (pathname.startsWith("/category/")) {
    page = <ShopPage defaultCategory={decodeURIComponent(pathname.replace("/category/", ""))} />;
  } else if (pathname.startsWith("/product/")) {
    page = <ProductDetailsPage slug={decodeURIComponent(pathname.replace("/product/", ""))} />;
  } else if (["/about", "/faq", "/frequently-asked-questions", "/delivery-information", "/delivery-returns", "/return-and-refund-policy", "/privacy", "/privacy-policy", "/terms", "/terms-and-conditions", "/warranty-information"].includes(pathname)) {
    const pageTitle = pathname.replace("/", "").replaceAll("-", " ");
    page = <BasicPage title={pageTitle === "faq" ? "frequently asked questions" : pageTitle} />;
  } else {
    page = <NotFoundPage />;
  }

  return (
    <div className={pathname === "/" ? "landing-site" : undefined}>
      {hideSiteChrome ? null : <SiteHeader />}
      {page}
      {hideFooter ? null : <Footer />}
    </div>
  );
}
