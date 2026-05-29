# Radia — Deployment Guide

## Architecture

```
┌──────────────────┐       ┌──────────────────────┐
│  DigitalOcean    │       │  Supabase             │
│  App Platform    │◄─────►│  (Postgres + Auth)    │
│  (Next.js app)   │       │                       │
└──────────────────┘       └──────────────────────┘
```

- **App hosting** — DigitalOcean App Platform (Docker container)
- **Database + Auth** — Supabase (managed Postgres with built-in auth, RLS, and real-time)

### Why this split?

| Concern | Supabase | DigitalOcean |
|---------|----------|--------------|
| Postgres with RLS | Built-in, zero config | You'd need to set up `auth.uid()` manually — not practical |
| Auth (sign-up, login, sessions) | Built-in, works with RLS | You'd need a separate auth provider |
| Hosting a Next.js container | Possible but limited | App Platform, Droplets, or Kubernetes — full control |
| Custom domains, SSL | Limited to Supabase dashboard | Full DNS + cert management |
| Scaling the app | Not designed for app hosting | Horizontal scaling, health checks, zero-downtime deploys |

**Bottom line**: Supabase owns the data layer. DigitalOcean owns the compute layer.

---

## 1. Supabase Setup

### 1.1 Create a project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click **New Project**
3. Choose an org, name it `radia`, pick the region closest to your users
4. Save the generated **database password** — you'll need it later

### 1.2 Run the migration

1. Open the **SQL Editor** in your Supabase dashboard
2. Copy the contents of `supabase/migrations/00001_initial_schema.sql`
3. Paste and click **Run**

This creates all 12 tables, enums, indexes, triggers, and RLS policies.

### 1.3 Seed demo data (optional)

1. Still in the SQL Editor, paste the contents of `supabase/seed.sql`
2. Click **Run**

> **Note**: The seed data inserts profiles with `auth_user_id = NULL`. After signing up real users through Supabase Auth, update the `auth_user_id` column to link profiles to auth accounts:
> ```sql
> update public.profiles
> set auth_user_id = '<supabase-auth-user-uuid>'
> where email = 'alex.rivera@radiacorp.com';
> ```

### 1.4 Get your API keys

Go to **Settings → API** and note:

| Key | Where to use |
|-----|--------------|
| **Project URL** | `NEXT_PUBLIC_SUPABASE_URL` |
| **anon / public key** | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| **service_role key** | `SUPABASE_SERVICE_ROLE_KEY` (server-side only, never expose to client) |

---

## 2. DigitalOcean Deployment

### Option A: App Platform (recommended)

App Platform auto-builds from your repo and manages containers for you.

#### 2.1 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USER/radia.git
git push -u origin main
```

#### 2.2 Create the app

1. Go to [cloud.digitalocean.com/apps](https://cloud.digitalocean.com/apps)
2. Click **Create App**
3. Connect your GitHub repo → select the `radia` repository
4. App Platform will auto-detect the `Dockerfile`

#### 2.3 Set environment variables

In the App Platform settings, add these env vars:

| Variable | Value | Type |
|----------|-------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | **Build-time + Runtime** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGci...` | **Build-time + Runtime** |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGci...` | **Runtime only** (encrypted) |
| `PORT` | `8080` | Runtime |

> `NEXT_PUBLIC_*` vars must be available at **build time** because Next.js inlines them during the build. In App Platform, mark them as both build-time and runtime environment variables.

#### 2.4 Configure resources

| Setting | Recommended |
|---------|-------------|
| Plan | Basic ($5/mo) or Pro ($12/mo) |
| Instance size | 1 vCPU, 512 MB (Basic) or 1 vCPU, 1 GB (Pro) |
| Instance count | 1 (scale up later) |
| HTTP port | 8080 |
| Health check path | `/` |
| Build command | (auto — uses Dockerfile) |

#### 2.5 Add a custom domain (optional)

1. In the app settings, go to **Domains**
2. Add your domain (e.g., `app.radia.com`)
3. Update your DNS:
   - **CNAME** → `your-app-xxxxx.ondigitalocean.app`
4. SSL is auto-provisioned via Let's Encrypt

#### 2.6 Deploy

Click **Deploy**. App Platform will:
1. Clone the repo
2. Build the Docker image (multi-stage, ~200 MB final)
3. Start the container on port 8080
4. Route traffic through its load balancer with HTTPS

---

### Option B: Droplet (manual)

For full control (e.g., you already have a Droplet).

#### 2.1 SSH into your Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

#### 2.2 Install dependencies

```bash
# Docker
curl -fsSL https://get.docker.com | sh

# Git
apt-get install -y git
```

#### 2.3 Clone and build

```bash
git clone https://github.com/YOUR_USER/radia.git
cd radia

docker build \
  --build-arg NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co" \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGci..." \
  -t radia .
```

#### 2.4 Run

```bash
docker run -d \
  --name radia \
  --restart unless-stopped \
  -p 80:8080 \
  -e SUPABASE_SERVICE_ROLE_KEY="eyJhbGci..." \
  radia
```

#### 2.5 HTTPS with Caddy (recommended)

```bash
apt-get install -y caddy
```

Create `/etc/caddy/Caddyfile`:

```
app.radia.com {
    reverse_proxy localhost:8080
}
```

```bash
systemctl restart caddy
```

Caddy auto-provisions HTTPS via Let's Encrypt.

---

## 3. Post-Deployment Checklist

- [ ] App loads at your domain
- [ ] Supabase connection works (check browser console for errors)
- [ ] Auth flow works (sign up, login, logout)
- [ ] RLS policies restrict data correctly (users only see their workspace)
- [ ] All pages render: `/`, `/tasks`, `/org-chart`, `/onboarding`, `/sops`, `/integrations`, `/settings`, `/admin`
- [ ] Dark/light theme toggle works
- [ ] No `NEXT_PUBLIC_*` values are undefined in the browser (check page source)

---

## 4. CI/CD (optional)

App Platform auto-deploys on push to `main`. For a Droplet, add a GitHub Actions workflow:

```yaml
# .github/workflows/deploy.yml
name: Deploy to DigitalOcean

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build and push Docker image
        run: |
          docker build \
            --build-arg NEXT_PUBLIC_SUPABASE_URL=${{ secrets.NEXT_PUBLIC_SUPABASE_URL }} \
            --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }} \
            -t registry.digitalocean.com/YOUR_REGISTRY/radia:${{ github.sha }} .
          docker push registry.digitalocean.com/YOUR_REGISTRY/radia:${{ github.sha }}

      - name: Deploy to Droplet
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.DROPLET_IP }}
          username: root
          key: ${{ secrets.SSH_KEY }}
          script: |
            docker pull registry.digitalocean.com/YOUR_REGISTRY/radia:${{ github.sha }}
            docker stop radia || true
            docker rm radia || true
            docker run -d --name radia --restart unless-stopped \
              -p 80:8080 \
              -e SUPABASE_SERVICE_ROLE_KEY="${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}" \
              registry.digitalocean.com/YOUR_REGISTRY/radia:${{ github.sha }}
```

---

## 5. Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Blank page, no errors | `NEXT_PUBLIC_*` vars missing at build time | Rebuild with build args set |
| `auth.uid() is not a function` | Running migration on plain Postgres | Use Supabase — these are Supabase-specific functions |
| 502 Bad Gateway | Container crashed | Check logs: `doctl apps logs YOUR_APP_ID` |
| RLS blocks all queries | No `auth_user_id` linked to profiles | Update profiles with real Supabase Auth user UUIDs |
| Docker build OOM | Not enough memory | Use at least 1 GB instance, or build locally and push image |
