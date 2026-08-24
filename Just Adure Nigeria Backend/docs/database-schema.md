# Proposed Database Schema

This document describes the intended MongoDB collections, embedded documents, and constraints that matter most. Mongoose schemas provide runtime validation and indexes.

## Identity

### User

Fields include `id`, `email`, `passwordHash`, `firstName`, `lastName`, `phone`, `role`, `emailVerifiedAt`, `status`, `createdAt`, and `updatedAt`.

- Email is normalized and unique.
- Role is `customer`, `admin`, or `super_admin`.
- Password hashes and token data never appear in API responses.

### RefreshSession

Stores a hashed refresh token, token family, user, expiry, revocation time, replacement relationship, IP metadata, and user-agent metadata. This supports rotation and reuse detection.

### VerificationToken

Stores hashed, expiring, single-use email-verification and password-reset tokens. Plain tokens are sent to users but never stored.

### Address

Belongs to a user and stores recipient name, Nigerian phone number, address lines, landmark, city, state, postal code, delivery instructions, and default status. Guest checkout addresses are copied into the order snapshot instead of being attached to a user.

## Catalogue

### Product

Stores name, slug, SKU, brand, category, optional subcategory, selling price, optional previous price, stock quantity, reserved quantity, descriptions, condition grade, visible defects, included accessories, warranty, colour, model number, active/archived status, availability, featured flag, SEO title, SEO description, and timestamps.

Money is stored as integer kobo, never floating-point naira.

Mongoose validation enforces positive prices and payment amounts, non-negative totals, valid order arithmetic, positive quantities, one-to-five review ratings, valid delivery-day ranges, and reserved stock rules. Multi-document writes that affect money, orders, or stock should use MongoDB transactions.

### ProductImage

Embedded inside a product and stores Cloudinary public ID, secure URL, width, height, alt text, sort order, and primary-image status.

### Category

Stores name, slug, description, image, active status, SEO fields, and an optional parent category. This self-reference supports category and subcategory navigation.

### Brand

Stores name, slug, description, logo, and active status.

### ConditionGrade

Stores a stable code, display name, customer-facing description, display order, and active status. Products reference a grade record, allowing administrators to maintain explanations and ordering while protected stable codes preserve reporting consistency.

### ProductSpecification

Embedded inside a product as label/value pairs with group name and sort order. This supports different specification sets for phones, laptops, televisions, consoles, and appliances.

### InventoryMovement

Records every reservation, release, sale, refund/restock, adjustment, and correction. It stores the product, quantity delta, reason, order reference, actor, and resulting quantities.

## Shopping

### Cart

A cart belongs either to a user or an anonymous session identifier. It has a currency, expiry, and timestamps. A guest cart can be merged into a customer cart after login.

### CartItem

Joins cart and product with quantity. `(cartId, productId)` is unique. Product price is never trusted from this record during checkout; authoritative pricing is recalculated.

### Wishlist and WishlistItem

A user has one wishlist. Wishlist items uniquely join the wishlist to products.

## Orders and payments

### Order

Stores order number, optional user, guest email, guest phone, status, currency, subtotal, discount, delivery fee, total, coupon snapshot, delivery-address snapshot, delivery-zone snapshot, notes, reservation expiry, paid time, cancellation time, and timestamps.

Status values are `pending_payment`, `paid`, `processing`, `ready_for_delivery`, `shipped`, `delivered`, `cancelled`, and `refunded`.

### OrderItem

Stores immutable snapshots of product ID, name, slug, SKU, primary image, condition grade, defects, model, selected specifications, unit price, previous price, discount, quantity, and line total. Historical order accuracy does not depend on the current product record.

### OrderStatusHistory

Stores every status transition with actor, source, note, and timestamp. This powers customer tracking and administrative accountability.

### Payment

Stores order, provider, unique provider reference, amount in kobo, currency, status, channel, safe gateway response summary, paid time, failure reason, and timestamps.

### PaymentEvent

Stores a unique event key, Paystack reference, event type, payload hash, processing status, attempts, processed time, and failure details. It prevents duplicate webhook processing without treating provider payloads as trusted business state.

## Promotions and delivery

### Coupon

Stores normalized code, discount type, value, optional maximum discount, minimum spend, start/end times, total and per-customer limits, active status, and optional product/category restrictions.

### CouponUsage

Links coupon, order, and optional user/email. Usage becomes final only after successful payment; abandoned pending orders do not permanently consume a coupon.

### DeliveryZone

Stores name, state, optional city pattern, fee in kobo, minimum and maximum delivery days, active status, and priority. Specific city rules take precedence over state-wide defaults.

## Engagement and operations

### Review

Belongs to a user, product, and order item. It stores rating, title, body, moderation status, and timestamps. A unique order-item relation enforces one verified-purchase review per purchased item.

### NewsletterSubscriber

Stores normalized unique email, status, consent timestamp, source, unsubscribe token hash, and unsubscribe time.

### ContactMessage

Stores sender details, subject, message, status, assignment, acknowledgement time, and timestamps.

### EmailLog

Stores provider message ID, template type, recipient, related user/order, delivery status, attempts, error summary, and timestamps. Sensitive template variables are not persisted wholesale.

### AdminActivityLog

Stores administrator, action, entity type, entity ID, sanitized before/after summaries, IP, user agent, request ID, and timestamp.

### HomepageBanner

Stores headline, supporting text, image, destination, display order, active period, and active status.

## Relationship overview

```text
User 1---* Address
User 1---* RefreshSession
User 1---0..1 Cart 1---* CartItem *---1 Product
User 1---1 Wishlist 1---* WishlistItem *---1 Product
Brand 1---* Product *---1 Category
ConditionGrade 1---* Product
Category 1---* Category (parent/children)
Product 1---* ProductImage
Product 1---* ProductSpecification
Order 1---* OrderItem *---0..1 Product
Order 1---* Payment
Order 1---* OrderStatusHistory
Coupon 1---* CouponUsage *---1 Order
Product 1---* Review *---1 User
```

## Required transaction boundaries

- Create an order, validate totals, create coupon intent, and reserve inventory.
- Release inventory for expired or cancelled unpaid orders.
- Finalize verified payment, transition the order, consume coupon usage, and convert reserved stock to sold stock.
- Process a refund and apply any approved restock.
- Apply an administrative stock adjustment and record its audit movement.

External API calls are not held inside long database transactions. Provider results are recorded and then finalized through short, idempotent transactions.
