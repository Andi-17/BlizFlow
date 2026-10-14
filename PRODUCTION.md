# BizFlow — Production deployment checklist

This document describes how to run BizFlow in production. **Never put real secrets in this file.**

## Stack

- Backend: Laravel 12 (PHP 8.2+), MySQL, Sanctum, Stripe, DomPDF
- Frontend: React (Vite), Bootstrap 5
- Multi-tenant SaaS: company isolation via `X-Company-Id` + `CompanyScope`

## Required environment (backend)

Copy `backend/.env.example` → `backend/.env` and set:

| Variable | Notes |
|----------|--------|
| `APP_ENV` | `production` |
| `APP_DEBUG` | `false` |
| `APP_KEY` | `php artisan key:generate` |
| `APP_URL` | Public API/HTTPS URL |
| `FRONTEND_URL` | SPA origin (HTTPS) |
| `FRONTEND_ROOT_DOMAIN` | Apex domain for tenant subdomains |
| `DB_*` | Production MySQL |
| `SESSION_SECURE_COOKIE` | `true` behind HTTPS |
| `SANCTUM_STATEFUL_DOMAINS` | Frontend host(s), comma-separated |
| `MAIL_*` | Real SMTP/API mailer |
| `QUEUE_CONNECTION` | `database` or `redis` |
| `STRIPE_KEY` | Publishable key |
| `STRIPE_SECRET` | **Backend only** — never in React/`VITE_*` |
| `STRIPE_WEBHOOK_SECRET` | From Stripe Dashboard webhook |
| `STRIPE_PRICE_PRO_MONTHLY` / `STRIPE_PRICE_BUSINESS_MONTHLY` | Stripe Price IDs (EUR) |
| `STRIPE_PRICE_PRO_MONTHLY_CHF` / `STRIPE_PRICE_BUSINESS_MONTHLY_CHF` | CHF prices for Switzerland/Liechtenstein |

Signup collects **country**. Backend sets company `currency`, `locale`, and `timezone` from that country (e.g. CH → CHF + German). Checkout uses the company’s currency Stripe Price ID — never trust React for money.

## Frontend env

Only public values (`frontend/.env.example`):

- `VITE_API_URL` — usually empty when reverse-proxied
- `VITE_ROOT_DOMAIN` — for subdomain landings

## Deploy steps

1. `composer install --no-dev --optimize-autoloader` in `backend/`
2. `php artisan migrate --force`
3. `php artisan db:seed --class=RolePermissionSeeder` (and PlanSeeder if needed)
4. `php artisan storage:link`
5. `php artisan config:cache && php artisan route:cache && php artisan view:cache`
6. Frontend: `npm ci && npm run build` — serve `frontend/dist` behind the same HTTPS host or CDN
7. Configure Nginx/Caddy: HTTPS, proxy `/api` + `/sanctum` to Laravel, SPA fallback for React
8. Run queue worker: `php artisan queue:work --tries=3`
9. Schedule: cron `* * * * * php artisan schedule:run`
10. Stripe webhook → `POST https://your-api/api/webhooks/stripe` (raw body, signature verified)

## Security baseline (enforced in code)

- Tenant models use `CompanyScope`; create always binds `company_id` from server context
- Policies require permission + same company (invoices/projects/categories included)
- Invoice `paid` only via `POST /invoices/{id}/mark-paid`
- FK validation scoped per company (`CompanyRules`)
- Stripe webhooks: signature required, unique event id, row lock + idempotent claim
- Auth/billing/contact endpoints throttled
- Platform admin ≠ company admin (`is_platform_admin` + `/api/v1/admin`)

## Backups

Configure outside the app (hosting provider or ops):

- Daily MySQL dumps + retention (e.g. 30 days)
- Backup `storage/app` (logos) and verify restore quarterly
- Store backups encrypted, off-box

## Monitoring

- Watch `failed_jobs`, Laravel logs, Stripe webhook delivery
- Uptime on `/up` and SPA origin
- Optional: Sentry/Bugsnag for exceptions (do not send secrets)

## Paysera

Schema columns exist for future provider support. **Paysera is not implemented.** Do not expose a Paysera checkout path until a real provider is finished.

## Rollback

1. Redeploy previous release artifact
2. `php artisan migrate:rollback` only if the release added reversible migrations
3. Restore DB/files from backup if data corruption occurred
