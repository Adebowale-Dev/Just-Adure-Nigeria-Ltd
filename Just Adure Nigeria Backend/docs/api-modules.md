# REST API Modules

The proposed base path is `/api/v1`. JSON responses use a consistent envelope, and list endpoints use cursor or page-based pagination as appropriate. Swagger UI will be available at `/api/docs`, with the OpenAPI JSON document at `/api/openapi.json`.

## Response conventions

```json
{
  "data": {},
  "meta": {},
  "requestId": "req_..."
}
```

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Please correct the highlighted fields.",
    "fields": {}
  },
  "requestId": "req_..."
}
```

## System

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/health` | Public | Process liveness |
| GET | `/ready` | Public/internal | Database and Redis readiness |
| GET | `/api/docs` | Configurable | Swagger UI |
| GET | `/api/openapi.json` | Configurable | OpenAPI specification |

## Authentication

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/register` | Public | Create customer account |
| POST | `/api/v1/auth/login` | Public | Start cookie-based session |
| POST | `/api/v1/auth/refresh` | Refresh cookie | Rotate refresh session |
| POST | `/api/v1/auth/logout` | Authenticated | Revoke current session and clear cookies |
| POST | `/api/v1/auth/logout-all` | Authenticated | Revoke all user sessions |
| GET | `/api/v1/auth/me` | Authenticated | Return current profile and role |
| POST | `/api/v1/auth/verify-email` | Public token | Verify account email |
| POST | `/api/v1/auth/resend-verification` | Public/rate limited | Send a new verification message |
| POST | `/api/v1/auth/forgot-password` | Public/rate limited | Request reset without disclosing account existence |
| POST | `/api/v1/auth/reset-password` | Public token | Consume reset token and revoke sessions |
| GET | `/api/v1/auth/csrf` | Public session | Issue CSRF token for state-changing requests |

## Public catalogue

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/v1/products` | Public | Paginated search, sort, and filters |
| GET | `/api/v1/products/:slug` | Public | Product details and images |
| GET | `/api/v1/products/:slug/related` | Public | Related active products |
| GET | `/api/v1/categories` | Public | Category tree |
| GET | `/api/v1/categories/:slug/products` | Public | Category catalogue |
| GET | `/api/v1/brands` | Public | Active brand list |
| GET | `/api/v1/home` | Public | Banners, featured products, arrivals, offers, categories, and reviews |

Catalogue filters include category, subcategory, brand, condition, minimum/maximum price, availability, search text, featured status, and sort order.

## Cart and wishlist

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/v1/cart` | Guest session/customer | Read cart with current stock and prices |
| POST | `/api/v1/cart/items` | Guest session/customer | Add item after stock check |
| PATCH | `/api/v1/cart/items/:itemId` | Guest session/customer | Update quantity |
| DELETE | `/api/v1/cart/items/:itemId` | Guest session/customer | Remove item |
| DELETE | `/api/v1/cart` | Guest session/customer | Clear cart |
| POST | `/api/v1/cart/merge` | Customer | Merge guest cart after login |
| GET | `/api/v1/wishlist` | Customer | Read wishlist |
| POST | `/api/v1/wishlist/items` | Customer | Add product |
| DELETE | `/api/v1/wishlist/items/:productId` | Customer | Remove product |

## Checkout and payments

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/v1/checkout/quote` | Guest/customer | Recalculate products, coupon, and delivery fee |
| POST | `/api/v1/orders` | Guest/customer | Create pending order and reserve inventory |
| POST | `/api/v1/orders/:orderNumber/payments/paystack` | Guest/customer order token | Initialize trusted Paystack transaction |
| GET | `/api/v1/payments/paystack/:reference/verify` | Guest/customer order token | Server-side verification and safe status result |
| POST | `/api/v1/webhooks/paystack` | Paystack signature | Idempotently consume signed event |

Order creation requires an `Idempotency-Key` header. Guest order access uses a high-entropy order-access token stored hashed on the order and delivered through the confirmation email.

## Customer account

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/v1/account/profile` | Customer | Read profile |
| PATCH | `/api/v1/account/profile` | Customer | Update profile |
| GET | `/api/v1/account/addresses` | Customer | List addresses |
| POST | `/api/v1/account/addresses` | Customer | Create address |
| PATCH | `/api/v1/account/addresses/:id` | Customer | Update owned address |
| DELETE | `/api/v1/account/addresses/:id` | Customer | Delete owned address |
| GET | `/api/v1/account/orders` | Customer | Paginated order history |
| GET | `/api/v1/account/orders/:orderNumber` | Customer | Order details and timeline |
| GET | `/api/v1/account/orders/:orderNumber/invoice` | Customer | View/download invoice |

## Reviews and communication

| Method | Route | Access | Purpose |
| --- | --- | --- | --- |
| GET | `/api/v1/products/:slug/reviews` | Public | Approved product reviews |
| POST | `/api/v1/products/:productId/reviews` | Verified customer | Submit verified-purchase review |
| POST | `/api/v1/newsletter/subscriptions` | Public | Subscribe with consent record |
| DELETE | `/api/v1/newsletter/subscriptions/:token` | Public token | Unsubscribe |
| POST | `/api/v1/contact` | Public/rate limited | Store message and send acknowledgement |

## Admin overview

All routes below require `admin` or `super_admin`; destructive role/security operations require `super_admin`.

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/v1/admin/dashboard` | Revenue, orders, customers, stock, trends, and recent activity |
| GET | `/api/v1/admin/activity` | Paginated administrative audit log |
| GET | `/api/v1/admin/exports/orders.csv` | Stream filtered order CSV |
| GET | `/api/v1/admin/exports/sales.csv` | Stream filtered sales CSV |

## Admin catalogue and inventory

| Method | Route | Purpose |
| --- | --- | --- |
| GET/POST | `/api/v1/admin/products` | List or create products |
| GET/PATCH/DELETE | `/api/v1/admin/products/:id` | Read, update, or archive product |
| POST | `/api/v1/admin/products/:id/images/signature` | Authorize constrained Cloudinary upload |
| POST | `/api/v1/admin/products/:id/images` | Confirm uploaded image metadata |
| PATCH | `/api/v1/admin/products/:id/images/order` | Reorder product images |
| DELETE | `/api/v1/admin/products/:id/images/:imageId` | Remove image and Cloudinary asset |
| POST | `/api/v1/admin/products/:id/stock-adjustments` | Adjust stock with reason and audit entry |
| GET/POST/PATCH/DELETE | `/api/v1/admin/categories...` | Manage category tree |
| GET/POST/PATCH/DELETE | `/api/v1/admin/brands...` | Manage brands |
| GET/POST/PATCH/DELETE | `/api/v1/admin/condition-grades...` | Manage condition labels and explanations |
| GET | `/api/v1/admin/inventory/low-stock` | Low-stock products |

## Admin orders, payments, and customers

| Method | Route | Purpose |
| --- | --- | --- |
| GET | `/api/v1/admin/orders` | Search and filter orders |
| GET | `/api/v1/admin/orders/:id` | Full order, payment, and timeline |
| PATCH | `/api/v1/admin/orders/:id/status` | Validated status transition |
| POST | `/api/v1/admin/orders/:id/refund` | Initiate/record authorized refund workflow |
| GET | `/api/v1/admin/payments` | Search payment records |
| GET | `/api/v1/admin/customers` | Search customers |
| GET | `/api/v1/admin/customers/:id` | Customer profile and order summary |
| PATCH | `/api/v1/admin/customers/:id/status` | Activate or suspend customer |

## Admin promotions, delivery, content, and reviews

| Method | Route | Purpose |
| --- | --- | --- |
| GET/POST | `/api/v1/admin/coupons` | List or create coupons |
| GET/PATCH/DELETE | `/api/v1/admin/coupons/:id` | Read, update, or deactivate coupon |
| GET/POST | `/api/v1/admin/delivery-zones` | List or create zones |
| PATCH/DELETE | `/api/v1/admin/delivery-zones/:id` | Update or deactivate zone |
| GET/POST | `/api/v1/admin/banners` | List or create homepage banners |
| PATCH/DELETE | `/api/v1/admin/banners/:id` | Update or archive banner |
| GET | `/api/v1/admin/reviews` | Moderation queue |
| PATCH | `/api/v1/admin/reviews/:id/status` | Approve or reject review |

## Internal service modules

The API will use domain modules rather than large controllers:

- `auth`: credentials, sessions, verification, password reset, CSRF
- `catalogue`: products, categories, brands, specifications, public queries
- `inventory`: availability, reservations, expiry, movements, adjustments
- `cart`: guest/customer carts and merging
- `checkout`: trusted totals, coupons, delivery quote, order creation
- `payments`: Paystack adapter, verification, webhook, idempotent finalization
- `orders`: order queries, status transitions, tracking, invoices
- `delivery`: zone provider and future logistics adapters
- `reviews`: eligibility, submission, moderation
- `notifications`: email orchestration and template data
- `media`: Cloudinary signatures, metadata, deletion
- `admin`: dashboard aggregation, export, customer administration, audit
