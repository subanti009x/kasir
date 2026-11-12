# Production setup

## Hosting layout

The Vercel project deploys the Next.js frontend and the NestJS API as Vercel services. Keep the Vercel project root at the repository root and deploy the `master` branch. `vercel.json` routes `/` to the frontend and `/_/backend` to the API.

## Production environment variables

Set these in the Vercel project's **Production** environment. Never commit real values to GitHub.

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string from the database provider's Prisma-compatible connection. |
| `JWT_SECRET` | Random secret with at least 32 characters, shared by API authentication and notification sockets. |
| `FRONTEND_URL` | Allowed frontend origins, separated by commas. Include the production Vercel URL. |
| `NEXT_PUBLIC_BACKEND_ROUTE_PREFIX` | Set to `/_/backend` so browser API and socket requests reach the backend service. |

Vercel's system variables provide the deployment URL. The `NEXT_PUBLIC_` value is embedded when Next.js builds, so set it before deploying. Do not add database passwords or JWT secrets to `.env.example` or source files.

Generate a JWT secret locally with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` and enter it directly in Vercel's encrypted environment settings. Do not paste the generated value into a commit or support ticket.

## Database preparation

The application uses PostgreSQL and Prisma; it does not use Supabase. Provision a production PostgreSQL database and set its runtime connection as `DATABASE_URL`. For a new database, run `npm run deploy:db --prefix backend` once from a trusted environment with that database URL configured. This syncs the checked-in Prisma schema and does not insert demo accounts. Review any Prisma data-loss prompt before accepting it. Back up an existing database before schema changes.

For future schema evolution, create and review Prisma migrations, then apply them with `prisma migrate deploy`. This repository currently has no migration history, so do not run `migrate deploy` until a baseline migration has been established.

## Toko Fajar

1. Create or confirm the Toko Fajar tenant and its Owner account in the application. The setup script defaults to tenant slug `toko-fajar`; set `TOKO_FAJAR_TENANT_SLUG` if the existing tenant uses a different slug.
2. With `DATABASE_URL` set for the intended database, run `npm run db:setup:toko-fajar --prefix backend` once. It safely upserts the three tenant features documented in the user guide: wholesale pricing, multiple product units, and expiry dates.
3. Add Toko Fajar's real products, staff, customers, and payment settings through the Owner account. Do not use the demo seed in production.

`npm run db:seed --prefix backend` contains sample tenants and shared demo passwords. It is disabled when `NODE_ENV=production` and must only be used with a disposable development database.

## Vercel runtime limits

The API explicitly disables WhatsApp Web sessions when running in a serverless environment such as Vercel. Product and logo uploads currently write to the API's local `uploads/` directory, which is not durable storage for serverless deployments. Keep uploads disabled for production use on Vercel until the controllers are moved to persistent object storage. Use a persistent Node.js host for WhatsApp sessions; do not copy local Baileys session files to production.

## Local development

Copy `.env.example` to `.env` and `backend/.env.example` to `backend/.env`, then replace the placeholder values. The Docker Compose PostgreSQL service is for local development only; it binds to port 5433. Production must use a managed PostgreSQL provider, not the local Compose database.

Install dependencies with `npm ci` at the repository root and `npm ci --prefix backend` for the API. Build the frontend with `npm run build` and the API with `npm run build --prefix backend`.
