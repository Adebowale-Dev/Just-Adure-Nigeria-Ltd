# Assumptions and Decision Register

These assumptions let implementation proceed without choosing branding or logistics details prematurely. They can be changed before the affected milestone.

## Confirmed from the brief

- The store serves Nigeria and displays prices in Nigerian naira.
- Products are mainly UK-used electronics and appliances.
- Guests may browse, use a cart, and complete checkout.
- Registered customers gain addresses, order history, wishlist, invoices, tracking, and reviews.
- The frontend and Express backend remain separate applications.
- Paystack, Brevo, and Cloudinary are the required providers.
- Branding and contact details remain configurable placeholders.

## Working assumptions

1. The repository root is this currently empty workspace, and the requested monorepo will be created directly here.
2. npm will manage dependencies for the backend, frontend, and shared package. Root scripts will coordinate `lint`, `typecheck`, `test`, and `build` without coupling applications.
3. The first production target is a single Nigerian storefront using `NGN`; data still records currency explicitly.
4. Prices and fees are stored in kobo as integers.
5. Product condition grades are seeded as Like New, Excellent, Good, and Fair. Administrators may manage their display names, explanations, ordering, and active state; stable internal codes preserve historical reporting.
6. MongoDB-configured state/city delivery zones are the first delivery provider. No logistics vendor is selected yet.
7. Guest carts use an opaque, HTTP-only session cookie. Guest order links use revocable high-entropy access tokens whose hashes are stored.
8. Stock is reserved for a configurable short payment window. The initial default will be 15 minutes and will live in validated environment configuration.
9. Admin accounts are invitation-created by a super administrator; there is no public admin registration.
10. Refund initiation is modeled behind a provider adapter. Whether Paystack refunds are executed automatically or recorded after an external process will be finalized during Milestone 6.
11. Product reviews require a delivered order item and one review per order item.
12. The initial application language is English.
13. Store policy and legal copy will use explicit placeholder content and must be replaced before production launch.
14. Product images shown to customers are the actual unit images supplied by administrators, not generic catalogue photography.

## Decisions intentionally deferred

- Final store name, logo, accent colour, typography, contacts, and social links
- Hosting providers and final deployment topology
- Production domain names and cookie domain strategy
- Delivery/logistics provider beyond the database zone implementation
- Final delivery fee table and serviceable locations
- Warranty rules and return windows
- Tax treatment and invoice wording
- Exact payment-reservation timeout
- Automated versus operational Paystack refunds
- Customer support workflow and administrator notification recipients

## Decisions needed before production, not before Milestone 1

- Final branding assets and business contact information
- Legal business name and policy wording
- Paystack, Brevo, and Cloudinary production accounts
- Public web/API domains
- Delivery zones, prices, and estimated timelines
- Operational low-stock thresholds by product/category

## Change control

Any decision that changes payment trust, inventory consistency, authentication, guest authorization, or the database's financial records must update the architecture and schema documents before implementation is changed.
