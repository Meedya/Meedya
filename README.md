# Meedya Web App

Next.js 15 app for Meedya with:

- Corporate landing page (modern + professional design)
- Lead intake form (`/api/leads`)
- PostgreSQL backend with Prisma
- Protected admin dashboard (`/admin`) for lead management

## 1) Local setup

```bash
cp .env.example .env
npm install
npm run prisma:generate
npm run prisma:push
npm run dev
```

Routes:

- `/` public website
- `/admin/login` admin login
- `/admin` lead dashboard

## 2) Required environment variables

From `.env.example`:

- `DATABASE_URL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `SESSION_SECRET`
- `COOKIE_SECURE` (set `false` for http testing without TLS)

Generate password hash:

```bash
node -e "const bcrypt=require('bcryptjs'); console.log(bcrypt.hashSync('replace-with-secure-password',12))"
```

Generate session secret:

```bash
openssl rand -hex 32
```

## 3) Coolify deployment guide

### A. Create Postgres service in Coolify

1. In Coolify, create a new PostgreSQL resource.
2. Note host, port, database, username, password.
3. Build `DATABASE_URL`:

```txt
postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public
```

### B. Create the app service from GitHub

1. Add new `Application` from your GitHub repo.
2. Build Pack: `Nixpacks` (default for Node works).
3. Set **Port** to `3000`.
4. Set branch to your production branch (e.g. `main`).

### C. Configure environment variables

Add:

- `DATABASE_URL`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD_HASH`
- `SESSION_SECRET`
- `NODE_ENV=production`

### D. Build & start commands

Use:

- Install command: `npm install`
- Build command: `npm run build`
- Start command: `npm run start`

### E. Run DB migration at deploy

Recommended before first production start:

```bash
npm run prisma:migrate
```

If you start without migration files and just want schema sync:

```bash
npm run prisma:push
```

In Coolify this can be done as:

- Pre-deploy command: `npm run prisma:migrate`
- Fallback pre-deploy (if no migrations yet): `npm run prisma:push`

### F. Domain and SSL

1. Attach your domain in Coolify.
2. Enable automatic TLS/Let's Encrypt.
3. Verify DNS points to the Coolify server.

## 4) First production checklist

1. Open `/` and submit a test lead.
2. Login at `/admin/login`.
3. Confirm lead appears in `/admin`.
4. Delete test lead from admin dashboard.
