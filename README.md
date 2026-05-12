# gahnagharjogbani

A password-protected web app to manage your jewellery shop's gold and silver stock.

## Features

- **Dashboard** — total gold/silver pure weight, market value, item count
- **Stock Management** — add, edit, delete jewellery items with full details
- **Gold items**: item code, name, type, purity (24K/22K/18K/14.4K), gross weight, net weight, making charge %, quantity
- **Silver items**: item code, name, type, purity % (free entry), net weight, quantity
- **Live price preview** — shows pure weight + market price as you fill the form
- **Rates page** — set daily gold and silver per-gram rates
- **Photo upload** — optional item photos via Vercel Blob
- **Single password login** — protected by a shop password stored in env

---

## Quick Start (local development)

### 1. Prerequisites

- Node.js 18+
- A PostgreSQL database (local or cloud — see Neon below)

### 2. Install dependencies

```bash
cd jewellery-inventory
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/jewellery_inventory"
APP_PASSWORD="your-shop-password"
SESSION_SECRET="a-random-32-character-string-here"
```

### 4. Run database migrations

```bash
npm run db:migrate
```

### 5. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and log in with your `APP_PASSWORD`.

---

## Free Production Deployment (Vercel + Neon)

This app is designed to be hosted **completely free** using:

| Service | Free tier |
|---------|-----------|
| [Vercel](https://vercel.com) | Unlimited deploys, HTTPS, custom domain |
| [Neon](https://neon.tech) | 0.5 GB Postgres, always-free |
| [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) | 1 GB storage for photos |

### Step 1 — Create a Neon database

1. Go to [neon.tech](https://neon.tech) → Sign up (free, no card needed)
2. Create a new project → copy the **connection string** (looks like `postgresql://user:pass@ep-xxxx.neon.tech/dbname?sslmode=require`)

### Step 2 — Push code to GitHub

```bash
cd jewellery-inventory
git init
git add .
git commit -m "Initial commit"
# Create a repo on github.com, then:
git remote add origin https://github.com/YOUR_USERNAME/jewellery-inventory.git
git push -u origin main
```

### Step 3 — Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → Sign up with GitHub (free Hobby plan)
2. Click **"Add New Project"** → import your GitHub repo
3. In **Environment Variables**, add:

   | Key | Value |
   |-----|-------|
   | `DATABASE_URL` | Your Neon connection string |
   | `APP_PASSWORD` | Your shop password (plain text) |
   | `SESSION_SECRET` | A random 32+ character string |
   | `BLOB_READ_WRITE_TOKEN` | (Optional, for photos — see below) |

4. Click **Deploy**. Done! Vercel will run `prisma migrate deploy` and `next build` automatically.

You get a free URL like `https://jewellery-inventory-xxx.vercel.app`.

### Step 4 (optional) — Enable photo uploads

1. In your Vercel project → **Storage** → **Create a Blob Store**
2. Vercel will automatically add `BLOB_READ_WRITE_TOKEN` to your env vars
3. Redeploy — photo uploads will work

### Step 5 (optional) — Custom domain

In Vercel → your project → **Domains** → add your own domain for free.

---

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `APP_PASSWORD` | Yes | Plain-text shop password for login |
| `SESSION_SECRET` | Yes | Random string for signing session cookies (min 32 chars) |
| `BLOB_READ_WRITE_TOKEN` | No | Vercel Blob token for photo uploads |

---

## How Prices Are Calculated

| Metal | Formula |
|-------|---------|
| Gold | Pure Weight = Net Weight × (Purity% ÷ 100) |
| Silver | Pure Weight = Net Weight × (Purity% ÷ 100) |
| Both | Market Price = Pure Weight × Rate per gram × Quantity |

Rates are set on the **Rates** page. Enter the price of **pure metal** per gram (24K gold / 999 silver).

**Example:** 10g 22K gold ring @ ₹7,500/g per pure gram  
→ Pure weight = 10 × 0.916 = 9.16g  
→ Market price = 9.16 × ₹7,500 = ₹68,700

---

## Project Structure

```
jewellery-inventory/
├── app/
│   ├── (app)/              # Protected pages (require login)
│   │   ├── page.tsx        # Dashboard
│   │   ├── stock/          # Stock listing + add/edit
│   │   └── rates/          # Gold/silver rate management
│   ├── login/              # Login page (public)
│   └── api/                # API routes
│       ├── auth/login      # POST login
│       ├── auth/logout     # POST logout
│       ├── items/          # GET list, POST create
│       ├── items/[id]/     # GET, PUT, DELETE item
│       ├── rates/          # GET rates, PUT update rate
│       └── upload/         # POST photo upload
├── components/
│   ├── inventory/          # App-specific components
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── prisma.ts           # Prisma client singleton
│   ├── auth.ts             # Session utilities
│   └── calculations.ts     # Price/weight formulas
├── prisma/
│   └── schema.prisma       # Database schema
└── middleware.ts            # Auth guard
```

---

## Tech Stack

- **Next.js 15** (App Router, TypeScript)
- **Tailwind CSS** + **shadcn/ui**
- **Prisma** ORM + **PostgreSQL** (Neon)
- **jose** for JWT session cookies
- **Vercel Blob** for photo storage
