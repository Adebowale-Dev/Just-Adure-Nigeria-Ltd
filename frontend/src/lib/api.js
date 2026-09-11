export const apiUrl = process.env.NEXT_PUBLIC_API_URL || "/api/v1";

async function apiGet(path) {
  const response = await fetch(`${apiUrl}${path}`, { headers: { Accept: "application/json" }, credentials: "include" });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload.error?.message ?? `API request failed with status ${response.status}`);
  return payload.data;
}

async function cartRequest(path, init = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    credentials: "include",
    headers: { Accept: "application/json", "Content-Type": "application/json", ...init.headers },
  });
  const payload = await response.json();
  if (!response.ok || !payload.data) throw new Error(payload.error?.message ?? `Cart request failed with status ${response.status}`);
  return payload.data;
}

export async function getProducts(params = new URLSearchParams()) {
  const query = params.toString();
  return apiGet(`/products${query ? `?${query}` : ""}`);
}
export async function getProduct(slug) {
  const data = await apiGet(`/products/${encodeURIComponent(slug)}`);
  return data.product;
}
export async function getCategories() { return (await apiGet("/categories")).items; }
export async function getBrands() { return (await apiGet("/brands")).items; }
export async function getConditionGrades() { return (await apiGet("/condition-grades")).items; }
export async function getCatalogueOptions(category) { return apiGet(`/catalogue-options?category=${encodeURIComponent(category)}`); }
export async function getCart() { return (await cartRequest("/cart", { method: "GET" })).cart; }
export async function addCartItem(input) { return (await cartRequest("/cart/items", { method: "POST", body: JSON.stringify(input) })).cart; }
export async function updateCartItem(productId, quantity) { return (await cartRequest(`/cart/items/${productId}`, { method: "PATCH", body: JSON.stringify({ quantity }) })).cart; }
export async function removeCartItem(productId) { return (await cartRequest(`/cart/items/${productId}`, { method: "DELETE" })).cart; }
export async function clearCart() { return (await cartRequest("/cart", { method: "DELETE" })).cart; }
export async function calculateDeliveryFee(input) { return cartRequest("/checkout/delivery-fee", { method: "POST", body: JSON.stringify(input) }); }
export async function createCheckoutOrder(input) { return (await cartRequest("/checkout", { method: "POST", body: JSON.stringify(input) })).order; }
export async function initializePaystackPayment(input) { return (await cartRequest("/payments/paystack/initialize", { method: "POST", body: JSON.stringify(input) })).payment; }
export async function verifyPaystackPayment(reference) { return cartRequest(`/payments/paystack/verify/${encodeURIComponent(reference)}`, { method: "GET" }); }
export async function trackOrder(input) { const params = new URLSearchParams({ orderNumber: input.orderNumber, email: input.email }); return (await cartRequest(`/orders/track?${params.toString()}`, { method: "GET" })).order; }
export async function getMyOrders() { return (await cartRequest("/orders/my", { method: "GET" })).items; }
export async function getAdminDashboard() { return (await cartRequest("/admin/dashboard", { method: "GET" })).stats; }
export async function getAdminProducts() { return (await cartRequest("/admin/products", { method: "GET" })).items; }
export async function createAdminProduct(input) { return (await cartRequest("/admin/products", { method: "POST", body: JSON.stringify(input) })).product; }
export async function updateAdminProduct(productId, input) { return (await cartRequest(`/admin/products/${productId}`, { method: "PATCH", body: JSON.stringify(input) })).product; }
export async function archiveAdminProduct(productId) { await cartRequest(`/admin/products/${productId}`, { method: "DELETE" }); }
export async function updateAdminProductStock(productId, input) { return (await cartRequest(`/admin/products/${productId}/stock`, { method: "PATCH", body: JSON.stringify(input) })).product; }
export async function getAdminOrders() { return (await cartRequest("/admin/orders", { method: "GET" })).items; }
export async function updateAdminOrderStatus(orderId, input) { return (await cartRequest(`/admin/orders/${orderId}/status`, { method: "PATCH", body: JSON.stringify(input) })).order; }
export async function loginUser(input) { return (await cartRequest("/auth/login", { method: "POST", body: JSON.stringify(input) })).user; }
export async function continueWithGoogle(credential) { return (await cartRequest("/auth/google", { method: "POST", headers: { "X-Auth-Intent": "google-sign-in" }, body: JSON.stringify({ credential }) })).user; }
export async function getCurrentUser() { return (await cartRequest("/auth/me", { method: "GET" })).user; }
export async function logoutUser() { await fetch(`${apiUrl}/auth/logout`, { method: "POST", credentials: "include" }); }
export async function getAdminCoupons() { return (await cartRequest("/admin/coupons", { method: "GET" })).items; }
export async function createAdminCoupon(input) { return (await cartRequest("/admin/coupons", { method: "POST", body: JSON.stringify(input) })).coupon; }
export async function updateAdminCoupon(couponId, input) { return (await cartRequest(`/admin/coupons/${couponId}`, { method: "PATCH", body: JSON.stringify(input) })).coupon; }
export async function getAdminReviews() { return (await cartRequest("/admin/reviews", { method: "GET" })).items; }
export async function updateAdminReview(reviewId, input) { return (await cartRequest(`/admin/reviews/${reviewId}`, { method: "PATCH", body: JSON.stringify(input) })).review; }
export async function createReturnRequest(orderId, input) { return (await cartRequest(`/orders/${orderId}/returns`, { method: "POST", body: JSON.stringify(input) })).returnRequest; }
export async function getAdminReturns() { return (await cartRequest("/admin/returns", { method: "GET" })).items; }
export async function updateAdminReturn(returnId, input) { return (await cartRequest(`/admin/returns/${returnId}`, { method: "PATCH", body: JSON.stringify(input) })).returnRequest; }
export async function getNotifications(audience) { const query = audience ? `?audience=${encodeURIComponent(audience)}` : ""; return cartRequest(`/notifications${query}`, { method: "GET" }); }
export async function markNotificationRead(notificationId) { return (await cartRequest(`/notifications/${notificationId}/read`, { method: "PATCH" })).notification; }
export async function createSupportTicket(input) { return (await cartRequest("/support/contact", { method: "POST", body: JSON.stringify(input) })).ticket; }
export async function lookupSupportTicket(input) { const params = new URLSearchParams({ ticketNumber: input.ticketNumber, email: input.email }); return (await cartRequest(`/support/tickets/lookup?${params.toString()}`, { method: "GET" })).ticket; }
export async function getAdminSupportTickets() { return (await cartRequest("/admin/support-tickets", { method: "GET" })).items; }
export async function updateAdminSupportTicket(ticketId, input) { return (await cartRequest(`/admin/support-tickets/${ticketId}`, { method: "PATCH", body: JSON.stringify(input) })).ticket; }

export async function getAdminReports(params = new URLSearchParams()) { const query = params.toString(); return cartRequest(`/admin/reports${query ? `?${query}` : ""}`, { method: "GET" }); }
export function getAdminOrdersReportCsvUrl(params = new URLSearchParams()) { const query = params.toString(); return `${apiUrl}/admin/reports/orders.csv${query ? `?${query}` : ""}`; }
export function getAdminPaymentsReportCsvUrl(params = new URLSearchParams()) { const query = params.toString(); return `${apiUrl}/admin/reports/payments.csv${query ? `?${query}` : ""}`; }
export async function getAdminStaff() { return (await cartRequest("/admin/staff", { method: "GET" })).items; }
export async function createAdminStaff(input) { return (await cartRequest("/admin/staff", { method: "POST", body: JSON.stringify(input) })).staff; }
export async function updateAdminStaff(staffId, input) { return (await cartRequest(`/admin/staff/${staffId}`, { method: "PATCH", body: JSON.stringify(input) })).staff; }
export async function getPublicStoreSettings() { return (await cartRequest("/store-settings", { method: "GET" })).settings; }
export async function getAdminStoreSettings() { return (await cartRequest("/admin/store-settings", { method: "GET" })).settings; }
export async function updateAdminStoreSettings(input) { return (await cartRequest("/admin/store-settings", { method: "PATCH", body: JSON.stringify(input) })).settings; }
export async function getAdminActivityLogs() { return (await cartRequest("/admin/activity-logs", { method: "GET" })).items; }
export async function getHomepage() { return apiGet("/homepage"); }
export async function getAdminHomepageContent() { return (await cartRequest("/admin/homepage-content", { method: "GET" })).content; }
export async function updateAdminHomepageContent(input) { return (await cartRequest("/admin/homepage-content", { method: "PATCH", body: JSON.stringify(input) })).content; }
export async function getWishlist() { return (await cartRequest("/wishlist", { method: "GET" })).wishlist; }
export async function addWishlistItem(input) { return (await cartRequest("/wishlist/items", { method: "POST", body: JSON.stringify(input) })).wishlist; }
export async function removeWishlistItem(productId) { return (await cartRequest(`/wishlist/items/${productId}`, { method: "DELETE" })).wishlist; }
export async function moveWishlistItemToCart(productId) { return (await cartRequest(`/wishlist/items/${productId}/move-to-cart`, { method: "POST" })).wishlist; }
export async function subscribeBackInStockAlert(input) { return (await cartRequest("/stock-alerts", { method: "POST", body: JSON.stringify(input) })).alert; }
export async function subscribeNewsletter(input) { return (await cartRequest("/newsletter/subscribe", { method: "POST", body: JSON.stringify(input) })).subscriber; }
export async function getAccount() { return (await cartRequest("/account", { method: "GET" })).account; }
export async function updateAccountProfile(input) { return (await cartRequest("/account", { method: "PATCH", body: JSON.stringify(input) })).account; }
export async function addAccountAddress(input) { return (await cartRequest("/account/addresses", { method: "POST", body: JSON.stringify(input) })).account; }
export async function updateAccountAddress(addressId, input) { return (await cartRequest(`/account/addresses/${addressId}`, { method: "PATCH", body: JSON.stringify(input) })).account; }
export async function deleteAccountAddress(addressId) { return (await cartRequest(`/account/addresses/${addressId}`, { method: "DELETE" })).account; }

export async function getAdminNewsletterSubscribers(params = new URLSearchParams()) { const query = params.toString(); return cartRequest(`/admin/newsletter-subscribers${query ? `?${query}` : ""}`, { method: "GET" }); }
export async function updateAdminNewsletterSubscriber(subscriberId, input) { return (await cartRequest(`/admin/newsletter-subscribers/${subscriberId}`, { method: "PATCH", body: JSON.stringify(input) })).subscriber; }

export async function getAdminDeliveryZones() { return (await cartRequest("/admin/delivery-zones", { method: "GET" })).items; }
export async function createAdminDeliveryZone(input) { return (await cartRequest("/admin/delivery-zones", { method: "POST", body: JSON.stringify(input) })).zone; }
export async function updateAdminDeliveryZone(zoneId, input) { return (await cartRequest(`/admin/delivery-zones/${zoneId}`, { method: "PATCH", body: JSON.stringify(input) })).zone; }

export async function uploadAdminProductImage(input) { return (await cartRequest("/admin/uploads/product-image", { method: "POST", body: JSON.stringify(input) })).image; }
export async function attachAdminProductImage(productId, input) { return (await cartRequest(`/admin/products/${productId}/images`, { method: "POST", body: JSON.stringify(input) })).product; }
export async function setAdminProductPrimaryImage(productId, publicId) { return (await cartRequest(`/admin/products/${productId}/images/${encodeURIComponent(publicId)}/primary`, { method: "PATCH" })).product; }
export async function removeAdminProductImage(productId, publicId) { return (await cartRequest(`/admin/products/${productId}/images/${encodeURIComponent(publicId)}`, { method: "DELETE" })).product; }

export async function getAdminCatalogueLookups() { return cartRequest("/admin/catalogue-lookups", { method: "GET" }); }
export async function createAdminBrand(input) { return (await cartRequest("/admin/brands", { method: "POST", body: JSON.stringify(input) })).brand; }
export async function updateAdminBrand(brandId, input) { return (await cartRequest(`/admin/brands/${brandId}`, { method: "PATCH", body: JSON.stringify(input) })).brand; }
export async function createAdminCategory(input) { return (await cartRequest("/admin/categories", { method: "POST", body: JSON.stringify(input) })).category; }
export async function updateAdminCategory(categoryId, input) { return (await cartRequest(`/admin/categories/${categoryId}`, { method: "PATCH", body: JSON.stringify(input) })).category; }
export async function createAdminConditionGrade(input) { return (await cartRequest("/admin/condition-grades", { method: "POST", body: JSON.stringify(input) })).conditionGrade; }
export async function updateAdminConditionGrade(gradeId, input) { return (await cartRequest(`/admin/condition-grades/${gradeId}`, { method: "PATCH", body: JSON.stringify(input) })).conditionGrade; }
export async function registerUser(input) { return (await cartRequest("/auth/register", { method: "POST", body: JSON.stringify(input) })).user; }
export async function resendEmailVerification(input) { return cartRequest("/auth/resend-verification", { method: "POST", body: JSON.stringify(input) }); }
export async function verifyEmailToken(token) { return cartRequest("/auth/verify-email", { method: "POST", body: JSON.stringify({ token }) }); }
export async function requestPasswordReset(input) { return cartRequest("/auth/forgot-password", { method: "POST", body: JSON.stringify(input) }); }
export async function resetPassword(input) { return cartRequest("/auth/reset-password", { method: "POST", body: JSON.stringify(input) }); }
export async function getMyOrder(orderId) { return (await cartRequest(`/orders/my/${encodeURIComponent(orderId)}`, { method: "GET" })).order; }
export async function cancelMyOrder(orderId, input = {}) { return (await cartRequest(`/orders/my/${encodeURIComponent(orderId)}/cancel`, { method: "PATCH", body: JSON.stringify(input) })).order; }
export async function submitProductReview(productId, input) { return (await cartRequest(`/products/${encodeURIComponent(productId)}/reviews`, { method: "POST", body: JSON.stringify(input) })).review; }
export async function replySupportTicket(input) { return (await cartRequest("/support/tickets/reply", { method: "POST", body: JSON.stringify(input) })).ticket; }

