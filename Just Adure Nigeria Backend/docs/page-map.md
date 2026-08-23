# Web Page Map

The web application uses Next.js route groups so public, account, checkout, and admin layouts remain distinct without changing public URLs.

## Public storefront

| Route | Page | Rendering intent |
| --- | --- | --- |
| `/` | Home | Server-rendered, revalidated merchandising content |
| `/shop` | Shop | Server-rendered first page with client filters and pagination |
| `/category/[slug]` | Category | SEO-focused category listing |
| `/product/[slug]` | Product details | Server-rendered metadata, product and offer structured data |
| `/search` | Search results | Query-driven results with empty and correction states |
| `/cart` | Cart | Interactive cart with refreshed stock and price warnings |
| `/about` | About | Static content |
| `/contact` | Contact | Validated contact form |
| `/faq` | Frequently asked questions | Static, accessible disclosure content |
| `/delivery-returns` | Delivery and returns | Static policy content |
| `/privacy` | Privacy policy | Static legal content |
| `/terms` | Terms and conditions | Static legal content |
| `/wishlist` | Wishlist | Sign-in-aware product list |

## Authentication

| Route | Page |
| --- | --- |
| `/register` | Customer registration |
| `/login` | Customer and administrator login entry |
| `/verify-email` | Email verification result and resend action |
| `/forgot-password` | Password reset request |
| `/reset-password` | New password form |

## Checkout and guest order access

| Route | Page |
| --- | --- |
| `/checkout` | Contact, address, delivery quote, coupon, and final order review |
| `/payment/result` | Safe polling/verification result after Paystack redirect |
| `/order/confirmation/[orderNumber]` | Guest or customer confirmation using authorized access context |
| `/order/track` | Guest tracking lookup with order number and secure verification data |

## Customer account

| Route | Page |
| --- | --- |
| `/account` | Account overview |
| `/account/profile` | Profile management |
| `/account/addresses` | Saved delivery addresses |
| `/account/orders` | Current and previous orders |
| `/account/orders/[orderNumber]` | Order details, timeline, and invoice |
| `/account/wishlist` | Saved products |
| `/account/reviews` | Eligible and submitted reviews |

## Admin dashboard

| Route | Page |
| --- | --- |
| `/admin` | Sales, order, customer, and stock dashboard |
| `/admin/products` | Product table and filters |
| `/admin/products/new` | Product creation workflow |
| `/admin/products/[id]` | Product editing, images, specifications, and stock |
| `/admin/categories` | Category and subcategory management |
| `/admin/brands` | Brand management |
| `/admin/condition-grades` | Condition labels, explanations, and ordering |
| `/admin/inventory` | Stock status, movements, and low-stock alerts |
| `/admin/orders` | Order queue and filters |
| `/admin/orders/[id]` | Order, payment, address, timeline, and status controls |
| `/admin/payments` | Payment records and reconciliation filters |
| `/admin/customers` | Customer search and account state |
| `/admin/customers/[id]` | Customer details and order history |
| `/admin/coupons` | Coupon management |
| `/admin/delivery-zones` | State/city delivery fees and estimates |
| `/admin/banners` | Homepage banner and feature merchandising |
| `/admin/reviews` | Review moderation |
| `/admin/exports` | Order and sales CSV exports |
| `/admin/activity` | Recent administrative actions |
| `/admin/settings` | Store placeholders, contacts, and operational settings |
| `/admin/users` | Admin-role management, super-admin only |

## Homepage composition

The homepage will contain:

1. Utility strip and primary navigation with category, search, account, wishlist, and cart access.
2. A confident editorial hero introducing Just Adure Nigeria Ltd.
3. Featured products with prominent naira prices and condition labels.
4. Latest arrivals suitable for one-off inventory.
5. Popular categories for phones, laptops, televisions, consoles, refrigerators, and accessories.
6. Special offers with honest previous-price presentation.
7. A trust section explaining actual photos, disclosed defects, secure payment, warranty, and delivery.
8. Verified customer reviews.
9. Newsletter signup.
10. Footer with placeholder contacts, policies, and social links.

## Product-details priorities

The actual product must be easy to judge before purchase. Above the fold, the page shows actual-product photography, price, previous price when valid, condition grade, stock state, visible defects, included accessories, warranty, and add-to-cart action. Specifications and full description follow. Images support keyboard navigation, meaningful alt text, zoom, and mobile swipe.

## Responsive and accessibility baseline

- Mobile-first layout with a compact sticky header and accessible navigation drawer.
- Keyboard-operable menus, dialogs, carousels, filters, and admin tables.
- Semantic headings and landmarks.
- Visible focus states and accessible form errors.
- Colour contrast that does not rely on colour alone for condition or status.
- Skeletons that preserve layout, purposeful empty states, and recoverable errors.
- Confirmation dialogs for archive, refund, stock adjustment, and status changes.
- Motion respects `prefers-reduced-motion`.

## SEO endpoints

- `/sitemap.xml` includes active products, categories, and public content.
- `/robots.txt` allows storefront pages and blocks account, checkout, search parameters, and admin pages where appropriate.
- Product pages expose Product, Offer, AggregateRating when eligible, and BreadcrumbList structured data.
- The root layout exposes Organization/WebSite structured data and search action metadata.
