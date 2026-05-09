# Staging burn-in checklist

> Everything in `claude/analyze-argicrm-improvements-qkiby` is code-complete.
> This file is the runbook for the maintainer-side work that cannot happen
> over GitHub MCP — `npm install`, the staging deploy, and the click-through
> smoke that proves the new security/AI-Council/public-API stack works
> against real Postgres in a real browser.

Estimated total time: **2–4 hours** for a maintainer who knows the repo.

---

## 1. Local install (5 min)

```bash
git fetch origin claude/analyze-argicrm-improvements-qkiby
git checkout claude/analyze-argicrm-improvements-qkiby
npm install                       # picks up speakeasy, qrcode, vitest, supertest, @playwright/test, ...
npx playwright install --with-deps chromium
```

If TypeScript flags missing types after install:

```bash
npm run check                     # should be green
```

If `npm run check` is not green, copy the error and treat it as the first
issue to fix before continuing — all new code on this branch was written to
type-check cleanly against the existing codebase.

## 2. Run the test suite (3 min)

```bash
npm test                          # 63 cases — must be green
```

If any case fails, the failure points to a real regression — do **not**
proceed with the deploy until tests are fixed.

## 3. Local smoke run (15 min)

In one terminal:

```bash
# Use a throwaway local Postgres or a Neon dev branch. SESSION_SECRET +
# JWT_SECRET must be set; do not reuse production secrets.
export DATABASE_URL="postgresql://argi:argi@localhost:5432/argi_local"
export SESSION_SECRET="$(openssl rand -hex 32)"
export JWT_SECRET="$(openssl rand -hex 32)"

npm run db:push                   # creates schema; new tables come from extra-startup.ts on first request
npm run seed                      # generates ./bootstrap-credentials.txt (mode 0600)
cat bootstrap-credentials.txt     # note the email + random password
npm run dev                       # boots on http://localhost:5000
```

In a browser:

1. Visit `http://localhost:5000/login`.
2. Log in with the credentials from `bootstrap-credentials.txt`.
3. **Expect:** redirect to `/forced-password-change`. Set a new password.
4. **Expect:** land on `/dashboard`.
5. Visit `/settings/security` → **MFA tab** → **Enable TOTP**.
6. Scan the QR with Google Authenticator (or 1Password / Authy).
7. Enter the 6-digit code → **Expect:** 10 recovery codes shown once.
   Copy them somewhere durable.
8. Log out → log back in with email + password → **Expect:** prompted
   for the 6-digit TOTP code → enter it → land on `/dashboard`.
9. Visit `/settings/security` → **API Keys tab** → create a key named
   "smoke-test" with scopes `contacts:read,contacts:write` → copy the
   plaintext `argi_…` key shown once.
10. In a separate terminal:
    ```bash
    KEY="argi_..." # paste the key
    curl -H "Authorization: Bearer $KEY" http://localhost:5000/api/v1/contacts
    # → [] (empty array) and HTTP 200
    curl -H "Authorization: Bearer $KEY" -H "Content-Type: application/json" \
         -d '{"firstName":"Smoke","lastName":"Test","email":"st@example.com"}' \
         http://localhost:5000/api/v1/contacts
    # → 201 with the new contact
    ```
11. Visit `/settings/security` → **Webhooks tab** → add a webhook to
    https://webhook.site/<your-uuid> for events `contact.created` →
    save the secret shown once.
12. Re-run the contact create from step 10 → check webhook.site →
    **Expect:** POST received with `X-Argilette-Signature: sha256=…`
    header and the contact JSON.
13. Visit `/council` → click **Convene** on `lead.score` → enter inputs
    JSON (defaults are pre-filled) → **Expect:** running → succeeded
    within ~10–30s with a recommendation + dissent visible.
14. Visit `/council/usage` → **Expect:** quota bar shows 1/50 used
    (assuming the test account is on `starter`), per-topic table
    populated, sparkline shows today's bucket.
15. As `super_admin`, visit `/superadmin` → **Expect:** the audit log
    contains rows for login, password-change, contact.created,
    council.decision.created.

If any of steps 1–15 fail, capture the network tab + console + log a bug.

## 4. Run Playwright locally (5 min)

```bash
npm run e2e                       # boots dev server via webServer config
```

All cases should pass. If a council test fails because no AI provider is
configured, set at least one of `ANTHROPIC_API_KEY` / `OPENAI_API_KEY` /
`GOOGLE_AI_KEY` and re-run.

## 5. Push the branch + open a PR (5 min)

```bash
git push -u origin claude/analyze-argicrm-improvements-qkiby
```

CI runs two jobs:

- **`unit`**: type-check + Vitest + coverage upload.
- **`e2e`**: Postgres service container + Playwright against a fresh
  build. Job artefacts (`playwright-report/`) are retained 14 days on
  failure.

Both should be green before merging.

## 6. Staging deploy (1–2 hours)

Replit / Render / Fly / your preferred host. Required env vars:

```
DATABASE_URL=postgresql://...                 # production-grade Postgres (Neon prod branch is fine)
SESSION_SECRET=<openssl rand -hex 32>         # NEW per environment
JWT_SECRET=<openssl rand -hex 32>             # NEW per environment
NODE_ENV=production
PORT=5000

# At least one AI provider for the council
ANTHROPIC_API_KEY=sk-ant-...

# Optional but recommended
STRIPE_SECRET_KEY=sk_live_...
SMTP_HOST=...
SMTP_USER=...
SMTP_PASS=...
PLATFORM_OWNER_EMAIL=abel@argilette.com   # only used for the seed; do NOT set PLATFORM_OWNER_PASSWORD in production
```

On first boot:

- `extra-startup.ts` runs the idempotent CREATE TABLE / ALTER TABLE
  statements for `audit_logs`, `council_topics`, `council_decisions`,
  `api_keys`, `webhook_endpoints`, `webhook_deliveries`, plus the new
  `users` MFA columns.
- Run `npm run seed` once via your platform's shell (Replit → Shell
  tab; Render → "Run Job"; Fly → `fly ssh console`). This writes
  `bootstrap-credentials.txt` to the container's working directory.
  Read it ONCE (e.g. `cat bootstrap-credentials.txt` in the same shell)
  and copy the password out, then delete the file:
  `rm bootstrap-credentials.txt`.
- Log in as the platform owner → forced password change → enable TOTP.

## 7. Production hardening checklist before announcing the new features

- [ ] CSP headers reviewed (`helmet` is already a dep — verify config in
      `server/index.ts`).
- [ ] CORS allowlist matches your tenant subdomains.
- [ ] Rate limits tuned for your traffic (defaults: 20 auth/15min, 500
      API/15min).
- [ ] Stripe webhook secret rotated, webhook receiver wired (or webhook
      feature documented as opt-in).
- [ ] At least one AI provider key set with a billing alert at e.g. $100/mo.
- [ ] Audit log retention policy decided (90 days hot recommended;
      archive older to S3/Spaces — code path not yet built, follow-up).
- [ ] Council monthly quotas reviewed against your plan-tier offering.
- [ ] `force_password_change` set on every existing user before the
      first login under the new code (one-line SQL: `UPDATE users SET
      force_password_change = true WHERE force_password_change IS NULL`).

## 8. Post-deploy verification

Hit the production URL and walk through steps 2–14 of section 3 again.
This is the burn-in. If anything fails, roll back immediately —
audit_logs will record the failed login attempts and the diagnostic
trail.

## 9. Marketing / sales updates

Once burn-in is clean:

- Update the pricing page screenshot to feature `/council/usage`.
- Add MFA + audit-log + signed webhooks to your security one-pager.
- Add the OpenAPI spec link (`/api/v1/openapi.json`) to the docs site.
- Add the council "AI you can replay" claim to landing page hero.

---

## What this branch did NOT change

- The 60+ existing routes (contacts, leads, deals, tasks, accounts,
  campaigns, invoices, SEO, e-commerce, finance, healing, agents, ARIA,
  intelligence, marketplace) — all behaviour preserved. The only
  cross-cutting change is the audit middleware, which writes one row
  per mutation to `audit_logs` with sensitive fields redacted.
- The mega-files (`server/routes.ts`, `server/index.ts`, `Seo.tsx`,
  `Ecommerce.tsx`, `Storefront.tsx`, `Settings.tsx`) are untouched. The
  modularization PR (§8.4 in the plan file) is the recommended next
  branch.
- The Argiflow-AI sister repo. If you want the same hygiene + council
  + public-API work mirrored there, that's a parallel branch.

## Support

Plan + per-commit summary: `/root/.claude/plans/oepen-argicrm-full-and-lively-flute.md`
(11 commits' worth of detail in §11–14).

— end of staging runbook —
