# Just Adure Nigeria Ltd

A secure, mobile-first e-commerce platform for Just Adure Nigeria Ltd, selling UK-used electronics and appliances in Nigeria.

The project is organized into two top-level application folders:

```text
Just Adure Nigeria Ltd/
  Just Adure Nigeria Ltd Frontend/  React/Vite storefront and admin dashboard
  Just Adure Nigeria Backend/       Express API, workspace configuration, and documentation
    docs/                           Architecture, data, API, page, and delivery plans
```

## Current status

Milestone 1 is implemented: the project structure, shared validation package, MongoDB development configuration, realistic seed catalogue, Express API foundation, Swagger documentation, and responsive React/Vite design foundation are in place.

Authentication and live catalogue APIs are intentionally not enabled yet. They belong to later controlled milestones.

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
| Web | React, Vite, JavaScript, Tailwind CSS |
| Forms and validation | React Hook Form and Zod |
| Server state | TanStack Query |
| API | Node.js, Express, JavaScript, REST, OpenAPI |
| Database | MongoDB with Mongoose |
| Authentication | Short-lived JWT access tokens and rotated refresh tokens in HTTP-only cookies |
| Payments | Paystack, initialized and verified by the API |
| Email | Brevo transactional email API |
| Images | Cloudinary |
| Tests | Vitest, Supertest, Testing Library, and Playwright |

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
