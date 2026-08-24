# System Architecture

## 1. Architectural style

The platform uses a client-server architecture in a JavaScript client-server project. The React/Vite application owns presentation, browser interactions, SEO rendering, and the customer/admin user experience. The Express application owns authentication, authorization, business rules, persistence, payments, email dispatch, image-upload authorization, and integrations.

The React/Vite application will not contain the main backend business logic in route handlers. It communicates with the Express API over HTTPS.

```text
Browser
  |
  | HTTPS + secure cookies
  v
React/Vite web application
  |
  | REST/JSON
  v
Express API ---------------- Cloudinary
  |    |  |                  Paystack
  |    |  +----------------- Brevo
  +------------------------- MongoDB
```

## 2. Monorepo boundaries

### `Just Adure Nigeria Ltd Frontend`

- Public storefront and SEO pages
- Customer account, cart, checkout, and order tracking
- Protected admin dashboard
- Server-rendered catalogue pages where SEO benefits
- TanStack Query for interactive server state
- React Hook Form and shared Zod schemas for forms
- No direct database access and no Paystack secret usage

### `Just Adure Nigeria Backend`

- Express application and REST endpoints
- Mongoose database access
- Authentication and role-based authorization
- Product, inventory, cart, checkout, order, coupon, review, and delivery rules
- Paystack initialization, verification, callback, and webhook processing
- Brevo email dispatch and reusable template rendering
- Cloudinary signed upload operations and asset lifecycle
- OpenAPI document and Swagger UI
- Scheduled or queued maintenance jobs

## 3. Runtime components

MongoDB is the source of truth for users, products, stock, carts, orders, payments, coupons, reviews, delivery configuration, email logs, and audit records. Financial and inventory operations use MongoDB sessions and transactions where multi-document consistency is required.

Cloudinary stores product images. MongoDB stores each image's public identifier, secure URL, dimensions, order, and metadata. The API authorizes uploads and constrains file type, size, and transformations.

## 4. Authentication model

- Passwords are hashed with Argon2id.
- Email verification is required for account-sensitive actions, while browsing and guest checkout remain public.
- A short-lived access JWT and longer-lived, single-use refresh token are stored in `HttpOnly`, `Secure`, `SameSite=Lax` cookies in production.
- Refresh tokens are hashed before persistence and rotated after every successful refresh.
- Reuse of an invalidated refresh token revokes the affected token family.
- State-changing cookie-authenticated requests require an origin check and double-submit CSRF token.
- Admin routes require an `admin` or `super_admin` role.
- High-impact administrative actions are audited.

## 5. Checkout and inventory consistency

Product availability is checked when a cart is viewed, when checkout is submitted, and immediately before Paystack initialization. The backend calculates prices, discounts, delivery charges, and totals from trusted database records.

Checkout creates a pending order and reserves stock in one database transaction. Each order item stores an immutable snapshot of product name, SKU, condition, selected specifications, image, unit price, discount, and quantity.

Because UK-used products can be one-off units, inventory tracks both stock and reserved quantities. Every pending order has a reservation expiry. Payment confirmation atomically converts reserved units to sold units; expired unpaid orders release them. A transaction locks affected inventory rows in deterministic order to prevent concurrent overselling.

## 6. Paystack trust boundary

Only the API communicates with Paystack using secret credentials.

1. The client submits checkout data and an idempotency key.
2. The API validates stock, coupon eligibility, and delivery fees.
3. The API creates an order and stock reservations transactionally.
4. The API initializes Paystack with a server-calculated amount in kobo and unique reference.
5. The client redirects to the returned authorization URL.
6. The payment-result page asks the API for verification status; it never marks an order paid itself.
7. The API verifies the transaction directly with Paystack.
8. The webhook validates the raw-body HMAC SHA-512 signature before processing.
9. A unique payment reference and processed-event record make processing idempotent.
10. Payment, order, inventory, coupon, and audit changes are committed together.

Redirect verification and webhook delivery may race. Both use the same idempotent payment-finalization service.

## 7. Delivery integration boundary

Delivery calculation is exposed through a provider interface. The first implementation uses database-configured zones and fees. Future logistics providers can add quoting, shipment creation, and tracking without changing checkout contracts.

```ts
interface DeliveryProvider {
  quote(input: DeliveryQuoteInput): Promise<DeliveryQuote>;
  createShipment?(input: ShipmentInput): Promise<ShipmentResult>;
  track?(trackingId: string): Promise<TrackingEvent[]>;
}
```

## 8. Caching and invalidation

- Public catalogue GET endpoints may be cached by normalized query.
- Product, category, brand, image, price, or stock changes invalidate relevant keys and frontend cache keys.
- Customer-specific responses, carts, checkout, orders, and payments are never publicly cached.
- Browser/API caching is used only where it is safe and explicit.

## 9. Errors, logging, and operations

- API responses use a consistent error envelope with a code, safe message, optional field errors, and request ID.
- Stack traces and provider payloads are never exposed in production.
- Structured logs redact cookies, authorization headers, passwords, tokens, and payment-sensitive values.
- Admin changes, payment transitions, refunds, and stock adjustments create immutable audit entries.
- Health and readiness endpoints separately report process health and dependency availability.

## 10. Deployment model

The web app, API, and MongoDB are separate services. HTTPS terminates at the hosting edge or load balancer. Database indexes and seed data are applied as controlled release steps rather than automatically on every process start. Webhook endpoints use the public API URL and retain the raw body required for signature verification.
