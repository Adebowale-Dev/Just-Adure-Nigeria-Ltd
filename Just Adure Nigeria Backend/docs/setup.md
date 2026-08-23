# Local Development Setup

## Prerequisites

- Node.js 22 or newer
- Corepack
- Docker Desktop with Docker Compose
- Git

This workspace was initially created on a machine without Docker or a functional Git repository. The Compose file and Git-safe ignore rules are present, but a developer must install/repair those tools before running the database-backed application locally.

## 1. Install dependencies

From `Just Adure Nigeria Backend`:

```bash
corepack enable
corepack pnpm install --frozen-lockfile
```

The backend folder contains the workspace `package.json` and `pnpm-workspace.yaml`. Dependency lifecycle scripts are explicitly allowlisted; do not replace that with a global allow-all setting.

## 2. Configure environment files

Create `.env` from `.env.example` in the backend. Create `.env.local` from `../Just Adure Nigeria Ltd Frontend/.env.example` in the frontend.

Development placeholders are intentionally non-secret. Replace JWT values with separate random strings of at least 32 characters. Real Paystack, Brevo, and Cloudinary credentials are not needed until their implementation milestones, but production must never use placeholders.

Important variables:

- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `API_URL` and `WEB_URL`: exact application origins
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`: distinct signing secrets
- `PAYSTACK_PUBLIC_KEY` and `PAYSTACK_SECRET_KEY`: payment credentials
- `BREVO_API_KEY` and sender identity: email credentials
- `CLOUDINARY_*`: product-image credentials
- `NEXT_PUBLIC_*`: browser-safe store and API configuration only

Never place a secret in a variable beginning with `NEXT_PUBLIC_`.

## 3. Start PostgreSQL and Redis

```bash
docker compose up -d
docker compose ps
```

The local defaults expose PostgreSQL on port `5432` and Redis on port `6379`. The Docker password is for local development only.

## 4. Generate, migrate, and seed

```bash
corepack pnpm db:generate
corepack pnpm db:migrate
corepack pnpm db:seed
```

The initial migration is stored at `prisma/migrations/20260823000000_initial/migration.sql`. The seed is idempotent and creates condition grades, delivery zones, and realistic demonstration products covering phones, laptops, televisions, game consoles, refrigerators, and accessories.

For production or CI deployments, use:

```bash
corepack pnpm --filter @store/api db:migrate:deploy
```

Do not run `prisma migrate dev` automatically when a production API process starts.

## 5. Run applications

```bash
corepack pnpm dev
```

- Web: `http://localhost:3000`
- API: `http://localhost:4000`
- Swagger UI: `http://localhost:4000/api/docs`
- OpenAPI JSON: `http://localhost:4000/api/openapi.json`
- Liveness: `http://localhost:4000/health`
- Dependency readiness: `http://localhost:4000/ready`

The Paystack webhook endpoint currently returns `501` deliberately. Signature verification and payment finalization are implemented in Milestone 5.

## 6. Quality checks

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

Or run all checks sequentially:

```bash
corepack pnpm check
```

Automated tests do not require live Paystack, Brevo, Cloudinary, PostgreSQL, or Redis services unless an integration test is explicitly marked for local infrastructure.

## 7. Database reset for local development

Resetting destroys local data and must never be run against production:

```bash
corepack pnpm --filter @store/api exec prisma migrate reset
```

Confirm the `DATABASE_URL` database name and host before using that command.
