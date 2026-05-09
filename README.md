# 🚀 ARGILETTE CRM — Plug & Play Replit Setup

> **Multi-tenant SaaS CRM** — Complete authentication, contacts, leads, deals, campaigns, invoicing, and team management.

---

## ⚡ Replit Setup (5 minutes)

### Step 1 — Import the project
1. Go to [replit.com](https://replit.com) → **Create Repl** → **Import from ZIP**
2. Upload `ARGILETTE-CRM-REPLIT-READY.zip`
3. Select **Node.js** as the language

### Step 2 — Add Secrets (Environment Variables)
In Replit, go to **Tools → Secrets** and add:

| Secret Key | Value | Required |
|---|---|---|
| `DATABASE_URL` | `postgresql://...` (from Neon.tech) | ✅ YES |
| `SESSION_SECRET` | Any random 64-char string | ✅ YES |
| `JWT_SECRET` | Any random 64-char string | ✅ YES |
| `ANTHROPIC_API_KEY` | `sk-ant-...` | Optional (AI features) |
| `OPENAI_API_KEY` | `sk-...` | Optional |
| `STRIPE_SECRET_KEY` | `sk_test_...` | Optional (billing) |

**Get a free PostgreSQL database:** [neon.tech](https://neon.tech) → New Project → Copy connection string

### Step 3 — Run
```bash
npm install && npm run db:push && npm run seed && npm run dev
```

Or just click the **▶ Run** button — the `.replit` file handles everything.

---

## 🔐 First-Run Setup

Default passwords are **no longer shipped in this repo**. On the first run
the seed script creates the platform-owner account using one of two flows:

**Auto-generated (recommended)** — if you set neither `PLATFORM_OWNER_EMAIL`
nor `PLATFORM_OWNER_PASSWORD`, the seed generates a random 32-char password
and writes it to `./bootstrap-credentials.txt` (mode `0600`).

```bash
cat ./bootstrap-credentials.txt
# email:    <generated-or-default>
# password: <random>
```

Read it once, log in, change the password immediately, and delete the file.

**Custom (development only)** — if you set both env vars and `NODE_ENV !==
"production"`, the seed uses your values. Setting these in production is
rejected by the seed script.

On first login the account is forced through a password change and TOTP
enrollment if its role is `admin` or higher.

---

## 🏗️ Architecture

```
argilette-saas/
├── client/                 # React 18 + TypeScript frontend
│   ├── src/
│   │   ├── pages/          # 13 fully functional pages
│   │   ├── components/     # Layout, UI components
│   │   ├── contexts/       # Auth context
│   │   └── lib/            # API client, queryClient
│   └── index.html
│
├── server/                 # Express.js + TypeScript backend
│   ├── index.ts            # Server entry point
│   ├── routes.ts           # All API routes
│   ├── storage.ts          # Database queries (Drizzle ORM)
│   ├── db.ts               # PostgreSQL connection
│   ├── seed.ts             # Demo data seeder
│   ├── vite.ts             # Vite dev middleware
│   ├── middleware/
│   │   └── auth.ts         # JWT auth + role middleware
│   └── routes/
│       └── auth.ts         # Login, register, invite
│
└── shared/
    └── schema.ts           # Database schema + types
```

---

## 📦 Features

| Module | What it does |
|---|---|
| **Multi-tenant Auth** | Register workspaces, JWT login, role-based access |
| **Contacts** | Full CRUD, search, filter by status/source |
| **Leads** | Pipeline leads with scoring (0-100) and value tracking |
| **Deals** | Kanban + list view, 6-stage pipeline, value tracking |
| **Tasks** | 3-column kanban (Todo/In Progress/Done), due dates, priorities |
| **Accounts** | Company management with industry/size classification |
| **Campaigns** | Email/SMS/LinkedIn campaign creation and tracking |
| **Invoices** | Multi-currency invoicing (USD, EUR, XOF/CFA, GBP) |
| **Team** | Invite members, assign roles (admin/manager/user/viewer) |
| **Settings** | Profile editing, workspace branding, plan details |
| **Dashboard** | Live stats: contacts, leads, deals pipeline, tasks, activity feed |

---

## 🛡️ Security

- JWT tokens (7-day expiry) stored in localStorage
- bcrypt password hashing (12 rounds)
- All routes authenticated + tenant-isolated at DB level
- Rate limiting in production (20 auth req/15min, 500 API req/15min)
- Role hierarchy: `platform_owner > super_admin > admin > manager > user > viewer`
- Platform owner (`abel@argilette.com`) has unrestricted access to all tenants

---

## 💳 Subscription Plans

| Plan | Users | Contacts | Price |
|---|---|---|---|
| Trial | 3 | 500 | Free (14 days) |
| Starter | 5 | 2,000 | $69.99/mo |
| Pro | 25 | 10,000 | $179.99/mo |
| Business | Unlimited | 50,000 | $349.99/mo |
| Enterprise | Unlimited | Unlimited | $899.99/mo |

---

## 🔧 Scripts

```bash
npm run dev        # Start development server (port 5000)
npm run build      # Build for production  
npm run start      # Start production server
npm run db:push    # Push schema to database (run after changes)
npm run seed       # Seed demo data
```

---

## 📡 API Reference

### Auth
```
POST /api/auth/register    — Create workspace + admin user
POST /api/auth/login       — Login (returns JWT token)
GET  /api/auth/me          — Get current user + tenant
POST /api/auth/logout      — Logout
POST /api/auth/invite      — Invite team member (admin only)
```

### CRM
```
GET/POST        /api/contacts
GET/PUT/DELETE  /api/contacts/:id
GET/POST        /api/leads
GET/PUT/DELETE  /api/leads/:id
GET/POST        /api/deals
GET/PUT/DELETE  /api/deals/:id
GET/POST        /api/tasks
GET/PUT/DELETE  /api/tasks/:id
GET/POST        /api/accounts
GET/PUT/DELETE  /api/accounts/:id
GET/POST        /api/activities
GET/POST        /api/campaigns
GET/POST        /api/invoices
```

### Admin
```
GET  /api/dashboard          — Stats + recent activity
GET  /api/users              — List team members
PUT  /api/users/:id          — Update user role/status
DELETE /api/users/:id        — Remove user
GET  /api/settings           — Workspace settings
PUT  /api/settings           — Update workspace settings
PUT  /api/profile            — Update own profile
GET  /api/admin/tenants      — All tenants (platform owner only)
GET  /api/health             — Health check
```

---

## 🌍 Deployment

### Replit (recommended)
The `.replit` file is pre-configured. Just add secrets and hit Run.

### VPS / Docker
```bash
npm run build
NODE_ENV=production PORT=5000 node dist/index.js
```

### Environment Variables
See `.env.example` for the complete list.

---

Built by Abel Nkawula · ARGILETTE LLC · argilette.com
