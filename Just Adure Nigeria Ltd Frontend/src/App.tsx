"use client";

import { useMemo } from "react";
import { AdminDashboardClient } from "@/components/admin-dashboard-client";
import { BasicPage } from "@/components/basic-page";
import { CartClient } from "@/components/cart-client";
import { CheckoutClient } from "@/components/checkout-client";
import { ContactClient } from "@/components/contact-client";
import { Footer } from "@/components/footer";
import { HomePage } from "@/components/home-page";
import { LoginClient } from "@/components/login-client";
import { NotFoundPage } from "@/components/not-found-page";
import { OrderTrackingClient } from "@/components/order-tracking-client";
import { PaymentResultClient } from "@/components/payment-result-client";
import { ProductDetailsPage } from "@/components/product-details-page";
import { ShopPage } from "@/components/shop-page";
import { SiteHeader } from "@/components/site-header";
import { WishlistClient } from "@/components/wishlist-client";
import { usePath } from "@/lib/navigation";

export default function App({ initialPath = "/" }) {
  const path = usePath(initialPath);
  const url = useMemo(
    () => new URL(path, typeof window === "undefined" ? "http://localhost:3000" : window.location.origin),
    [path],
  );
  const pathname = url.pathname;

  let page;

  if (pathname === "/") {
    page = <HomePage />;
  } else if (pathname === "/admin") {
    page = <AdminDashboardClient />;
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
  } else if (["/about", "/faq", "/delivery-returns", "/privacy", "/terms", "/account"].includes(pathname)) {
    page = <BasicPage title={pathname.replace("/", "").replaceAll("-", " ")} />;
  } else {
    page = <NotFoundPage />;
  }

  return (
    <>
      <SiteHeader />
      {page}
      <Footer />
    </>
  );
}