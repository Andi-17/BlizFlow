# BizFlow — Multi-tenant Business Management SaaS

Production-oriented V1: **Laravel 12 REST API** + **React (Vite) SPA**.  
Mobile apps are out of scope for V1; the same `/api/v1` API is designed for future iOS/Android clients.

## Stack

| Layer | Technology |
|-------|------------|
| Backend | Laravel 12, PHP 8.2+, MySQL, Sanctum, Queues, Notifications, Policies |
| Frontend | React 19, Vite, Bootstrap 5, Axios, React Router |
| Payments | Stripe Checkout, Subscriptions, Webhooks |

## Repository layout

```
backend/     Laravel API (source of truth for business logic & auth)
frontend/    React SPA (consumes API only)
```

## Local setup

### Prerequisites

- PHP 8.2+ with extensions (pdo_mysql, mbstring, openssl, tokenizer, xml, ctype, json, bcmath)
- Composer
- Node.js 20+
- MySQL 8+ (XAMPP MySQL is fine)
- Stripe account (for paid plans; FREE plan works without Stripe)

### 1. Database

```sql
CREATE DATABASE business_saas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Backend

```bash
cd backend
copy .env.example .env   # Windows
php artisan key:generate
# Edit .env: DB_*, FRONTEND_URL, STRIPE_*
php artisan migrate --seed
php artisan serve
```

API: `http://localhost:8000`  
If port 8000 is already in use on Windows, run:

```bash
php -S 127.0.0.1:18080 -t public
```

and leave `VITE_API_URL` empty so Vite proxies `/api` + `/sanctum` to `VITE_PROXY_TARGET` (default `http://127.0.0.1:18080`). This avoids CSRF cookie host mismatches.

**Seeded admin:** `admin@bizflow.test` / `password`

### 3. Frontend

```bash
cd frontend
copy .env.example .env
npm install
npm run dev
```

SPA: `http://localhost:5173`

### 4. Stripe (paid plans — yearly only)

1. Create Products/Prices in Stripe for **Pro yearly** and **Business yearly** (no monthly plans in V1).
2. Put Price IDs into `plans.stripe_price_id` (Admin → Plans) or `STRIPE_PRICE_PRO_YEARLY` / `STRIPE_PRICE_BUSINESS_YEARLY`.
3. Set in `backend/.env`:
   - `STRIPE_KEY` (publishable)
   - `STRIPE_SECRET`
   - `STRIPE_WEBHOOK_SECRET`
4. Forward webhooks locally:

```bash
stripe listen --forward-to localhost:18080/api/webhooks/stripe
```

**Seeded plans:** Free (€0), Pro (€99/year), Business (€249/year). Monthly plans are deactivated.

## Onboarding flow

```
Register → Verify email → Create company (pick industry) → Choose yearly plan
  ├─ FREE → Dashboard (industry labels + starter categories)
  └─ Paid → Stripe Checkout → Webhook activates → Dashboard
```

## Industries

Companies pick a trade on onboarding (barber, mechanic, plumber, restaurant, electrician, cleaning, construction, clinic, fitness, consulting, retail, general). BizFlow then:

- Renames nav labels (e.g. Customers → Clients / Guests / Patients)
- Seeds starter categories
- Sets invoice/order prefixes
- Shows industry chip in the dashboard shell

Change industry anytime under Settings.

## Multi-tenancy

- Every tenant resource has `company_id`
- Active company sent as `X-Company-Id`
- Eloquent global scope + policies enforce isolation
- Critical rule: Company A cannot read Company B’s data by guessing IDs

## API overview

Prefix: `/api/v1`

- Auth: `/auth/*`
- Plans / contact (public)
- Onboarding, company, customers, products, inventory, orders, invoices
- Employees, projects, tasks, reports, billing, dashboard
- Admin: `/admin/*` (platform admin only)
- Webhook: `POST /api/webhooks/stripe`

Auth modes:

- **Web SPA:** Sanctum cookie session (`/sanctum/csrf-cookie` + credentials)
- **Future mobile:** Sanctum personal access tokens (`device_name` / `issue_token` on login/register)

## Tests

```bash
cd backend
php artisan test
```

Coverage includes registration/login, tenant isolation, order/invoice totals, Stripe webhook idempotency.

## Production checklist

- [ ] `APP_ENV=production`, `APP_DEBUG=false`
- [ ] Strong `APP_KEY`, HTTPS only
- [ ] MySQL credentials via secrets manager / host env
- [ ] Real SMTP (`MAIL_*`) for verification & password reset
- [ ] Stripe **live** keys + webhook endpoint with signature secret
- [ ] `FRONTEND_URL` + `SANCTUM_STATEFUL_DOMAINS` match production host(s)
- [ ] `SESSION_DOMAIN` / secure cookies configured for your domain
- [ ] Queue worker: `php artisan queue:work` (or Horizon later with Redis)
- [ ] Scheduler: cron `php artisan schedule:run`
- [ ] `FILESYSTEM_DISK=s3` when ready (code is disk-agnostic)
- [ ] `CACHE_STORE` / `QUEUE_CONNECTION=redis` when Redis is available
- [ ] Backups for MySQL
- [ ] Rate limiting / WAF in front of API
- [ ] Serve SPA build (`frontend/dist`) from CDN or same host reverse proxy
- [ ] Rotate admin password immediately after first deploy

## Architecture notes (V1 decisions)

- Shared-database multi-tenancy (simplest production path)
- FREE plan = local subscription row, no Stripe object
- `billing_invoices` = SaaS/Stripe invoices; `invoices` = customer business invoices
- Employees = company membership (`company_user`) with roles
- Money: `decimal(12,2)` EUR for V1
- PDF invoices: not generated yet; invoice model ready for a PDF service later

## License

Proprietary — all rights reserved unless otherwise stated.
