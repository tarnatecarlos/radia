# Radia — Vercel + Supabase Deployment Guide

> Complete step-by-step instructions to deploy Radia to production.

---

## Architecture

```
Browser
  │ HTTPS
  ▼
Vercel (Next.js 16)
  │  Serverless Functions  ←── API Routes
  │  Edge Network          ←── Static Assets + SSR
  │
  ├──→ Supabase Postgres   (Database)
  ├──→ Supabase Storage    (Avatars, Attachments)
  ├──→ Stripe              (Subscriptions, Coupons)
  └──→ Resend              (Transactional Email)
```

---

## Prerequisites

- GitHub account (repo connected to Vercel)
- [Vercel account](https://vercel.com) (free tier works)
- [Supabase account](https://supabase.com) (free tier works)
- Node.js 20+ locally
- (Optional) [Stripe account](https://stripe.com) for billing
- (Optional) [Resend account](https://resend.com) for email

---

## Part 1 — Supabase Setup

### 1.1 Create a Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Choose a name (e.g., `radia-prod`) and region
4. Set a database password — save it securely
5. Wait for the project to be provisioned (~2 minutes)

### 1.2 Run the Schema

1. In the Supabase Dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy the entire contents of [`supabase/schema.sql`](./supabase/schema.sql) and paste it
4. Click **Run**
5. Verify: go to **Table Editor** — you should see 23 tables

The schema creates all tables with:
- `UUID` primary keys (auto-generated)
- `TIMESTAMPTZ` for all dates (timezone-aware)
- `BOOLEAN` instead of SQLite's `INTEGER 0/1`
- `JSONB` for arrays/objects (completed_lessons, config, scopes, metadata)
- Proper foreign keys, CHECK constraints, and indexes
- Auto-updating `updated_at` triggers on tasks, sops, and objectives
- Subscription and coupon tracking tables (for Stripe)

### 1.3 Get Your Credentials

Go to **Settings → API** and copy:

| Key | Where to Find | Usage |
|-----|---------------|-------|
| `Project URL` | Settings → API → URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon public` key | Settings → API → Project API keys | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` key | Settings → API → Project API keys | `SUPABASE_SERVICE_ROLE_KEY` |

> **Warning**: The `service_role` key bypasses Row-Level Security. Never expose it to the browser. Only use it in server-side API routes.

### 1.4 Storage Buckets (Optional)

If you want file uploads (avatars, SOP attachments):

```sql
-- Run in SQL Editor
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('attachments', 'attachments', false);
```

---

## Part 2 — Migrate the Database Layer

The current codebase uses `better-sqlite3` which is a native C++ addon. **This will not run on Vercel's serverless functions.** You must replace it with the Supabase client.

### 2.1 Key Differences: SQLite vs Postgres

| SQLite (current) | Postgres (target) |
|-------------------|-------------------|
| `TEXT` primary keys with `crypto.randomUUID()` | `UUID` with `gen_random_uuid()` |
| `INTEGER` booleans (0/1) | `BOOLEAN` (true/false) |
| `datetime('now')` | `NOW()` |
| `TEXT` for JSON (`'[]'`, `'{}'`) | `JSONB` native type |
| `db.prepare(sql).all(params)` (sync) | `supabase.from(table).select()` (async) |
| `db.prepare(sql).run(params)` (sync) | `supabase.from(table).insert()` (async) |
| Single file, no connection pool | Connection pooling via Supabase |
| `LIKE ?` with manual `%` | `.ilike('column', '%value%')` |

### 2.2 Replace the Database Module

The current `src/lib/db/index.ts` initializes SQLite. Replace it with a Supabase client:

```typescript
// src/lib/db/supabase-client.ts
import { createClient } from '@supabase/supabase-js';

// Server-side client with service_role key (bypasses RLS)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export function uid(): string {
  return crypto.randomUUID();
}
```

### 2.3 Query Migration Pattern

Every API route needs to be converted from synchronous SQLite to async Supabase:

**SELECT (list)**
```typescript
// Before (SQLite)
const tasks = db.prepare("SELECT * FROM tasks WHERE workspace_id = ?").all(wsId);

// After (Supabase)
const { data: tasks, error } = await supabase
  .from('tasks')
  .select('*')
  .eq('workspace_id', wsId);
```

**SELECT with JOIN**
```typescript
// Before
const tasks = db.prepare(`
  SELECT t.*, p.first_name, p.last_name
  FROM tasks t
  LEFT JOIN profiles p ON p.id = t.assignee_id
  WHERE t.workspace_id = ?
`).all(wsId);

// After
const { data: tasks } = await supabase
  .from('tasks')
  .select(`*, assignee:profiles!assignee_id(first_name, last_name)`)
  .eq('workspace_id', wsId);
```

**INSERT**
```typescript
// Before
db.prepare("INSERT INTO tasks (id, workspace_id, title) VALUES (?, ?, ?)")
  .run(id, wsId, title);

// After
const { data, error } = await supabase
  .from('tasks')
  .insert({ id: uid(), workspace_id: wsId, title })
  .select()
  .single();
```

**UPDATE**
```typescript
// Before
db.prepare("UPDATE tasks SET status = ? WHERE id = ?").run(status, id);

// After
const { data, error } = await supabase
  .from('tasks')
  .update({ status })
  .eq('id', id)
  .select()
  .single();
```

**DELETE**
```typescript
// Before
db.prepare("DELETE FROM tasks WHERE id = ?").run(id);

// After
const { error } = await supabase
  .from('tasks')
  .delete()
  .eq('id', id);
```

**TRANSACTION (multi-table writes)**
```typescript
// Before (SQLite transaction)
db.transaction(() => {
  db.prepare("INSERT INTO certifications ...").run(...);
  db.prepare("UPDATE profile_skills ...").run(...);
})();

// After (Supabase RPC or sequential with error handling)
const { error: e1 } = await supabase.from('certifications').insert({...});
if (e1) throw e1;
const { error: e2 } = await supabase.from('profile_skills').upsert({...});
if (e2) throw e2;

// Or use a Postgres function for true atomicity:
// const { error } = await supabase.rpc('complete_course', { ... });
```

**BOOLEAN conversion**
```typescript
// Before: SQLite returns 0/1, manual conversion needed
onboarding_completed: !!(profile.onboarding_completed as number)

// After: Postgres returns native booleans — no conversion needed
onboarding_completed: profile.onboarding_completed // already boolean
```

**JSON fields**
```typescript
// Before: JSON stored as TEXT, manual parse/stringify
completed_lessons: JSON.parse(row.completed_lessons as string)

// After: JSONB is auto-parsed by Supabase client
completed_lessons: row.completed_lessons // already an array
```

### 2.4 Files to Migrate

All 24 files that import `@/lib/db`:

| File | Queries | Complexity |
|------|---------|------------|
| `src/lib/db/index.ts` | Replace entirely | — |
| `src/lib/auth/index.ts` | 6 queries (sessions, users, profiles) | Medium |
| `src/lib/workspace-preferences.ts` | 2 queries | Low |
| `src/app/api/auth/login/route.ts` | 2 queries | Low |
| `src/app/api/auth/signup/route.ts` | 6 queries (user, workspace, profile, integrations, prefs) | Medium |
| `src/app/api/auth/me/route.ts` | 6 queries | Medium |
| `src/app/api/auth/password/route.ts` | 2 queries | Low |
| `src/app/api/profiles/route.ts` | 5+ queries | Medium |
| `src/app/api/tasks/route.ts` | 4 queries (CRUD + join) | Medium |
| `src/app/api/sops/route.ts` | 4 queries | Low |
| `src/app/api/courses/route.ts` | 3 queries + bulk lessons | Medium |
| `src/app/api/enrollments/route.ts` | 6+ queries (completion triggers) | High |
| `src/app/api/reviews/route.ts` | 8+ queries (cycles, reviews, skill gaps) | High |
| `src/app/api/skills/route.ts` | 4 queries | Low |
| `src/app/api/objectives/route.ts` | 4 queries | Low |
| `src/app/api/certifications/route.ts` | 1 query with join | Low |
| `src/app/api/integrations/route.ts` | 2 queries | Low |
| `src/app/api/invites/route.ts` | 4 queries | Low |
| `src/app/api/notifications/route.ts` | 2 queries | Low |
| `src/app/api/preferences/route.ts` | 2 queries | Low |
| `src/app/api/admin/route.ts` | 6+ queries | Medium |
| `src/app/api/api-keys/route.ts` | 4 queries | Low |
| `src/app/api/workspaces/route.ts` | 2 queries | Low |
| `src/app/api/workspaces/search/route.ts` | 1 query | Low |
| `src/app/api/seed/route.ts` | 20+ inserts | High (but only for dev) |

**Recommended migration order**: auth → profiles → tasks → sops → the rest.

### 2.5 After Migration: Clean Up

Once all routes are migrated:

```bash
npm uninstall better-sqlite3 @types/better-sqlite3
```

Remove from `next.config.ts`:
```diff
- serverExternalPackages: ["better-sqlite3"],
```

Delete the old SQLite files:
```bash
rm radia.db radia.db-shm radia.db-wal
```

---

## Part 3 — Vercel Deployment

### 3.1 Push to GitHub

```bash
git add -A
git commit -m "prepare for Vercel deployment"
git push origin main
```

### 3.2 Connect to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Import Git Repository** and select your repo
3. Vercel auto-detects Next.js — defaults are correct:
   - **Framework**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

### 3.3 Set Environment Variables

In the Vercel project settings → **Environment Variables**, add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_SITE_URL` | `https://your-app.vercel.app` | Production |
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | All |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service_role key | All |
| `STRIPE_SECRET_KEY` | `sk_live_...` | Production |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_live_...` | Production |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` | Production |
| `RESEND_API_KEY` | `re_...` | Production |
| `CRON_SECRET` | Random 64-char hex | Production |

> Tip: For Preview environments, use Stripe test keys (`sk_test_...`, `pk_test_...`).

### 3.4 Deploy

Click **Deploy**. Vercel will:
1. Clone the repo
2. Run `npm install`
3. Run `npm run build`
4. Deploy to the edge network
5. Provision SSL automatically

First deploy takes ~2 minutes. Subsequent deploys are faster.

### 3.5 Custom Domain

1. In Vercel → Project → **Settings → Domains**
2. Add your domain (e.g., `app.radiacorp.com`)
3. Update your DNS:
   - **CNAME** `app` → `cname.vercel-dns.com`
   - Or **A** record → Vercel's IP (shown in dashboard)
4. SSL is auto-provisioned via Let's Encrypt

### 3.6 Stripe Webhook

1. Go to Stripe → **Developers → Webhooks**
2. Add endpoint: `https://app.radiacorp.com/api/billing/webhook`
3. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
4. Copy the **Signing Secret** to `STRIPE_WEBHOOK_SECRET` in Vercel env vars

### 3.7 Vercel Cron Jobs (for Daily Digest)

Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/digest",
      "schedule": "0 8 * * *"
    }
  ]
}
```

This triggers the digest endpoint every day at 8 AM UTC.

---

## Part 4 — Seed Production Data

After the first deploy, seed the database with an initial admin account.

**Option A**: Run the seed endpoint once:
```bash
curl -X POST https://app.radiacorp.com/api/seed
```

**Option B**: Insert directly in Supabase SQL Editor:
```sql
-- Create admin user (password: your-secure-password)
-- Generate a bcrypt hash at https://bcrypt-generator.com/ (12 rounds)
INSERT INTO users (email, password_hash)
VALUES ('admin@yourcompany.com', '$2a$12$YOUR_HASH_HERE');

-- Create workspace
INSERT INTO workspaces (name, subdomain)
VALUES ('Your Company', 'your-company');

-- Create admin profile
INSERT INTO profiles (user_id, workspace_id, email, first_name, last_name, role, title, onboarding_completed, setup_completed)
SELECT u.id, w.id, 'admin@yourcompany.com', 'Admin', 'User', 'creator', 'Administrator', true, true
FROM users u, workspaces w
WHERE u.email = 'admin@yourcompany.com' AND w.subdomain = 'your-company';
```

---

## Part 5 — Cost Summary

### Vercel

| Plan | Price | Includes |
|------|-------|----------|
| Hobby (free) | $0/mo | 100GB bandwidth, serverless functions, 1 deploy/day |
| Pro | $20/mo | Unlimited deploys, team access, analytics, preview protection |

### Supabase

| Plan | Price | Includes |
|------|-------|----------|
| Free | $0/mo | 500 MB database, 1 GB storage, 50K monthly active users |
| Pro | $25/mo | 8 GB database, 100 GB storage, daily backups |

### Total Starting Cost

| Scenario | Monthly |
|----------|---------|
| Launch (free tiers) | **$0** |
| Growth (Vercel Pro + Supabase Pro) | **$45** |
| + Stripe (per transaction) | 2.9% + $0.30 |
| + Resend (first 3K emails/mo free) | $0 |
| + Custom domain | ~$1/mo |

---

## Part 6 — Post-Deploy Checklist

### Immediate
- [ ] Verify the app loads at your Vercel URL
- [ ] Test login with seeded admin account
- [ ] Verify all pages render (dashboard, tasks, SOPs, etc.)
- [ ] Test creating a task, SOP, and course
- [ ] Test invite flow end-to-end

### Security
- [ ] Verify `SUPABASE_SERVICE_ROLE_KEY` is not in any `NEXT_PUBLIC_*` variable
- [ ] Verify Stripe webhook signature validation works
- [ ] Test that unauthenticated requests to `/api/*` return 401
- [ ] Verify session cookies have `secure: true` in production

### Monitoring
- [ ] Enable Vercel Analytics (Settings → Analytics)
- [ ] Check Supabase logs for slow queries (Dashboard → Logs)
- [ ] Set up Vercel deployment notifications (Slack/email)

### Backup
- [ ] Supabase Pro plan includes daily backups
- [ ] Or manually: Dashboard → Database → Backups → Download

---

## Appendix: File Reference

| File | Purpose |
|------|---------|
| `supabase/schema.sql` | Full Postgres schema — run in Supabase SQL Editor |
| `.env.example` | All environment variables with descriptions |
| `next.config.ts` | Vercel-compatible Next.js configuration |
| `DEPLOYMENT.md` | This document |
| `src/lib/db/index.ts` | Current SQLite layer (replace during migration) |
| `src/lib/auth/index.ts` | Session management (update for Supabase) |
