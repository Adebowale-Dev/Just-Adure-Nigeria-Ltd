# Just Adure Nigeria Ltd

A secure, mobile-first e-commerce platform for Just Adure Nigeria Ltd, selling UK-used electronics and appliances in Nigeria.

The project is organized into two top-level application folders:

```text
Just Adure Nigeria Ltd/
  Just Adure Nigeria Ltd Frontend/  Next.js storefront and admin dashboard
  Just Adure Nigeria Backend/       Express API, workspace configuration, and documentation
    packages/shared/                Shared types, constants, and Zod schemas
    docs/                           Architecture, data, API, page, and delivery plans
```

## Current status

Milestone 1 is implemented: the monorepo, shared validation package, PostgreSQL/Redis development configuration, Prisma schema and migration, realistic seed catalogue, Express API foundation, Swagger documentation, and responsive Next.js design foundation are in place.

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
| Monorepo | pnpm workspaces with task orchestration |
| Web | Next.js App Router, TypeScript, Tailwind CSS, shadcn/ui |
| Forms and validation | React Hook Form and Zod |
| Server state | TanStack Query |
| API | Node.js, Express, TypeScript, REST, OpenAPI |
| Database | PostgreSQL and Prisma ORM |
| Cache and temporary data | Redis |
| Authentication | Short-lived JWT access tokens and rotated refresh tokens in HTTP-only cookies |
| Payments | Paystack, initialized and verified by the API |
| Email | Brevo transactional email API |
| Images | Cloudinary |
| Tests | Vitest, Supertest, Testing Library, and Playwright |

## Delivery approach

Work proceeds one milestone at a time. Each milestone must pass linting, type checking, relevant tests, a production build where applicable, security review, and documentation review before the next milestone begins.

## Quick start

Requirements: Node.js 22 or newer, Corepack, Docker Desktop with Compose, and Git.

```bash
cd "Just Adure Nigeria Backend"
corepack enable
corepack pnpm install --frozen-lockfile
docker compose up -d
```

Create `.env` from `.env.example` in the backend and create `.env.local` from `../Just Adure Nigeria Ltd Frontend/.env.example` in the frontend, replacing placeholders as needed. Then run from the backend folder:

```bash
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:seed
corepack pnpm run dev:all
```

The web app runs at `http://localhost:3000`, the API at `http://localhost:4000`, and Swagger UI at `http://localhost:4000/api/docs`.
