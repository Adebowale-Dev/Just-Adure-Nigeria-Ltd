export const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";

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
export async function getCart() { return (await cartRequest("/cart", { method: "GET" })).cart; }
export async function addCartItem(input) { return (await cartRequest("/cart/items", { method: "POST", body: JSON.stringify(input) })).cart; }
export async function updateCartItem(productId, quantity) { return (await cartRequest(`/cart/items/${productId}`, { method: "PATCH", body: JSON.stringify({ quantity }) })).cart; }
export async function removeCartItem(productId) { return (await cartRequest(`/cart/items/${productId}`, { method: "DELETE" })).cart; }
export async function clearCart() { return (await cartRequest("/cart", { method: "DELETE" })).cart; }
export async function calculateDeliveryFee(input) { return cartRequest("/checkout/delivery-fee", { method: "POST", body: JSON.stringify(input) }); }
export async function createCheckoutOrder(input) { return (await cartRequest("/checkout", { method: "POST", body: JSON.stringify(input) })).order; }



