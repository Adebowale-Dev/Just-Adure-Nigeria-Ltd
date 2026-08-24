# Local Development Setup

## Prerequisites

- Node.js 22 or newer
- npm
- MongoDB
- Git

MongoDB is required for seeding and database-backed API work.

## 1. Install dependencies

From `Just Adure Nigeria Backend`:

```bash
npm.cmd install
npm.cmd --prefix "../Just Adure Nigeria Ltd Frontend" install
```

The backend and frontend each use npm. Run the commands above from the backend folder so both installs are prepared.

## 2. Configure environment files

Create `.env` from `.env.example` in the backend. Create `.env.local` from `../Just Adure Nigeria Ltd Frontend/.env.example` in the frontend.

Development placeholders are intentionally non-secret. Replace JWT values with separate random strings of at least 32 characters. Real Paystack, Brevo, and Cloudinary credentials are not needed until their implementation milestones, but production must never use placeholders.

Important variables:

- `MONGODB_URL`: MongoDB connection string
- `API_URL` and `WEB_URL`: exact application origins
- `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET`: distinct signing secrets
- `PAYSTACK_PUBLIC_KEY` and `PAYSTACK_SECRET_KEY`: payment credentials
- `BREVO_API_KEY` and sender identity: email credentials
- `CLOUDINARY_*`: product-image credentials
- `VITE_*`: browser-safe store and API configuration only

Never place a secret in a variable beginning with `VITE_`.

## 3. Prepare MongoDB

Install MongoDB locally or use MongoDB Atlas, then set `MONGODB_URL`.

The default development MongoDB connection string is:

```text
mongodb://localhost:27017/just_adure
```

In production, MongoDB is the required database dependency.

## 4. Seed MongoDB

```bash
npm.cmd run seed
```

The seed is idempotent and creates condition grades, delivery zones, brands, categories, and realistic demonstration products covering phones, laptops, televisions, game consoles, refrigerators, and accessories.

## 5. Run applications

```bash
npm.cmd run dev:all
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
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run test
npm.cmd run build
```

Or run all checks sequentially:

```bash
npm.cmd run check:all
```

Automated tests do not require live Paystack, Brevo, Cloudinary, or MongoDB services unless an integration test is explicitly marked for local infrastructure.
