# Development Milestones

Each milestone is intentionally bounded. Work does not move forward until its exit checks pass and documentation reflects the implemented behavior.

Current state: Milestone 0 and Milestone 1 are implemented. Milestone 2 has not started.

## Milestone 0: Architecture and planning

Deliverables:

- Architecture and trust-boundary document
- Proposed data model and transaction boundaries
- REST API module map
- Customer and administrator page map
- Assumptions and decision register

Exit checks:

- Every requested feature has an owning module or later milestone.
- Payment, inventory, authentication, and guest-access risks have explicit designs.
- No application implementation begins before this review is complete.

## Milestone 1: Project foundation and database

Deliverables:

- npm package setup, JavaScript configuration, linting, formatting, and task runner
- `Just Adure Nigeria Ltd Frontend`, `Just Adure Nigeria Backend`, and backend documentation scaffolding
- MongoDB-backed local development
- Mongoose catalogue models, realistic seed data, and database scripts
- Typed environment validation and safe `.env.example` files
- Express health/readiness endpoints, error envelope, request IDs, structured logging, and Swagger foundation
- React/Vite design tokens, base layouts, accessible component foundation, and Just Adure Nigeria Ltd branding configuration

Verification:

- Install from a clean checkout
- Seed MongoDB successfully
- Run lint, API unit smoke tests, and production builds
- Confirm no secret values are tracked

## Milestone 2: Authentication and authorization

Deliverables:

- Registration, login, logout, token refresh, logout-all, email verification, and password reset
- Argon2id password hashing and rotated refresh-session persistence
- Secure cookie and CSRF handling
- Customer, admin, and super-admin authorization policies
- Profile and saved-address management
- Brevo adapter with a local/test fake and initial account email templates

Verification:

- Unit and integration tests for token rotation, reuse detection, expiry, CSRF, and role boundaries
- Browser tests for registration, verification, login, reset, and logout
- Rate-limit and account-enumeration review

## Milestone 3: Product catalogue and admin inventory

Deliverables:

- Product, category, brand, specifications, image, and inventory modules
- Public home, shop, search, category, and product pages
- Admin catalogue, image ordering, archive, and stock-adjustment interfaces
- Cloudinary signed upload flow with validation
- Public endpoint caching and invalidation
- Metadata, structured data, sitemap, robots, pagination, and image optimization

Verification:

- Catalogue API and permission tests
- Upload-validation and cache-invalidation tests
- Responsive product browsing tests
- Accessibility checks for navigation, filters, galleries, and forms

## Milestone 4: Cart and checkout

Deliverables:

- Persistent guest and customer carts with merge-on-login
- Wishlist
- Delivery-zone configuration and quote provider
- Coupon validation and order total calculation
- Guest and customer checkout
- Transactional order creation, stock reservations, and reservation expiry worker
- Nigerian phone/address validation and naira formatting

Verification:

- Concurrent inventory and oversell tests
- Price-tampering, coupon-limit, delivery-rule, cart-merge, and expiry tests
- End-to-end browsing-to-pending-order test

## Milestone 5: Paystack integration

Deliverables:

- Backend-only Paystack initialization and direct verification
- Signed raw-body webhook handler
- Idempotent payment-event processing
- Atomic payment, order, coupon, and inventory finalization
- Payment result page and recovery/polling states
- Fake Paystack adapter for tests and local workflows

Verification:

- Valid/invalid signature tests
- Duplicate event, redirect/webhook race, wrong amount/currency, failed payment, and replay tests
- Confirm the browser cannot set price, amount, paid state, or stock outcome

## Milestone 6: Order management

Deliverables:

- Customer order list, details, tracking timeline, and invoice
- Secure guest confirmation and tracking access
- Admin order queue, details, allowed status transitions, cancellations, and refund workflow
- Payment list and reconciliation views
- Customer administration and CSV exports

Verification:

- Ownership and guest-token authorization tests
- Status state-machine tests
- Invoice snapshot and CSV formula-injection tests
- End-to-end paid-order visibility for customer and admin

## Milestone 7: Brevo transactional emails

Deliverables:

- Responsive branded templates for welcome/verification, reset, order received, payment successful, processing, shipped, delivered, cancelled, refund, low-stock, and contact acknowledgement
- Idempotent email dispatch records and retry policy
- Admin low-stock notification workflow
- Development preview and fake transport

Verification:

- Template rendering and required-field tests
- Duplicate dispatch prevention tests
- Responsive email preview review

## Milestone 8: Reviews, promotions, delivery, and homepage management

Deliverables:

- Verified-purchase review submission and moderation
- Coupon administration and usage reporting
- Delivery-zone administration
- Homepage banners and featured-product administration
- Newsletter subscription/unsubscribe and contact-message administration

Verification:

- Review eligibility and moderation tests
- Coupon edge-case tests
- Delivery precedence tests
- Admin permission and audit-log checks

## Milestone 9: Security, test coverage, and documentation

Deliverables:

- Unit, API integration, authorization, checkout, inventory, webhook, component, and Playwright suites
- Security headers, CORS, rate limits, request limits, upload rules, redaction, dependency review, and abuse-case review
- Complete README, environment reference, seed/index instructions, Swagger guide, provider setup, architecture summary, and deployment guide

Verification:

- All automated checks pass from a clean checkout
- External services are mocked in automated tests
- Production builds pass
- Secret scan and authorization matrix review pass

## Milestone 10: Final responsive and accessibility review

Deliverables:

- Mobile, tablet, desktop, and wide-screen visual review
- Keyboard and screen-reader workflow review
- Loading, empty, error, offline, and retry states
- Performance profiling and Core Web Vitals improvements
- Final copy, placeholder-brand audit, and release checklist

Completion checks:

- Customers can browse and purchase on mobile and desktop.
- Conditions, defects, prices, and actual photos are prominent.
- Server-verified Paystack payments create visible paid orders.
- Concurrency controls prevent overselling.
- Required Brevo emails are dispatched idempotently.
- Administrators can manage all requested operational data.
- Authorization, seeds, tests, lint, types, and builds pass.
- Setup and deployment documentation is complete and contains no secrets.
