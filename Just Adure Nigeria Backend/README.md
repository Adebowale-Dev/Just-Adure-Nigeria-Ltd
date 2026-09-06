# Just Adure Nigeria Ltd

A secure, mobile-first e-commerce platform for Just Adure Nigeria Ltd, selling inspected UK-used products in Nigeria.

The project is organized into two top-level application folders:

```text
Just Adure Nigeria Ltd/
  Just Adure Nigeria Ltd Frontend/  React/Vite storefront and admin dashboard
  Just Adure Nigeria Backend/       Express API, workspace configuration, and documentation
    docs/                           Architecture, setup, API, and data guides
```

## What works now

The storefront includes catalogue search and filters, product details, cart, wishlist, customer accounts, checkout, Paystack payment verification, order tracking, support, returns, and responsive customer pages.

The protected admin workspace manages products, images, stock, orders, delivery zones, returns, support, reviews, discounts, reports, homepage content, store settings, newsletter subscribers, and staff access.

Open `http://localhost:4000/api/docs` while the backend is running for interactive API documentation. The endpoints are grouped by the task they perform and include example request and response bodies.

## Blueprint

- [Architecture](docs/architecture.md)
- [Database schema](docs/database-schema.md)
- [API modules](docs/api-modules.md)
- [Page map](docs/page-map.md)
- [Development milestones](docs/milestones.md)
- [Assumptions and decisions](docs/assumptions.md)
- [Local setup](docs/setup.md)
- [Milestone 1 report](docs/milestone-1-report.md)

## Proposed stack

| Area | Technology |
| --- | --- |
| Project structure | Separate npm installs for backend and frontend |
| Web | Next.js, React, TypeScript, Tailwind CSS |
| Forms and validation | React Hook Form and Zod |
| Server state | TanStack Query |
| API | Node.js, Express, JavaScript, REST, OpenAPI |
| Database | MongoDB with Mongoose |
| Authentication | Short-lived JWT access tokens and rotated refresh tokens in HTTP-only cookies |
| Payments | Paystack, initialized and verified by the API |
| Email | Brevo transactional email API |
| Images | Cloudinary |
| Tests | Vitest, Supertest, and Testing Library |

## Delivery approach

Work proceeds one milestone at a time. Each milestone must pass linting, relevant tests, a production build where applicable, security review, and documentation review before the next milestone begins.

## Quick start

Requirements: Node.js 22 or newer, npm, MongoDB, and Git.

```bash
cd "Just Adure Nigeria Backend"
npm.cmd install
npm.cmd --prefix "../Just Adure Nigeria Ltd Frontend" install
```

Create `.env` from `.env.example` in the backend and create `.env.local` from `../Just Adure Nigeria Ltd Frontend/.env.example` in the frontend, replacing placeholders as needed. Make sure MongoDB is running at `MONGODB_URL`. Then run from the backend folder:

```bash
npm.cmd run seed
npm.cmd run dev:all
```

The web app runs at `http://localhost:3000`, the API at `http://localhost:4000`, and Swagger UI at `http://localhost:4000/api/docs`.

## Everyday workflow

1. Start MongoDB or confirm the Atlas connection in `MONGODB_URL` is available.
2. Run `npm.cmd run dev:all` from this backend folder.
3. Use the storefront at `http://localhost:3000` and the API guide at `http://localhost:4000/api/docs`.
4. Run `npm.cmd run check:all` before releasing changes.

Never place Paystack secret keys, database credentials, or JWT secrets in frontend environment variables or commit them to Git.
