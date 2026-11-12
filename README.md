# Portal Kasir RSI

Multi-tenant point-of-sale application built with Next.js, NestJS, Prisma, and PostgreSQL.

## Local development

See [LOCAL-SETUP.md](LOCAL-SETUP.md) for the Windows setup and local run scripts. Copy `.env.example` to `.env` and `backend/.env.example` to `backend/.env`, then replace placeholder values before running the app.

## Production

See [PRODUCTION.md](PRODUCTION.md) for Vercel environment variables, PostgreSQL setup, schema deployment, and the safe Toko Fajar feature setup. Production credentials belong in the hosting provider's encrypted environment settings and must never be committed.

The app uses PostgreSQL via Prisma. The Supabase connection available to this workspace is a separate inactive project and is not configured as this app's database.

Production hostname: https://portal-kasir-rsi.vercel.app/
