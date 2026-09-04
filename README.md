# 🧶 Crochet Business Dashboard

A complete inventory, production, sales, and analytics dashboard for a small crochet business. Built for the kind of handmade-goods shop that needs to know *exactly* how much yarn they have, what each product costs to make, and whether they're actually making money.

![Status](https://img.shields.io/badge/status-MVP-blue)
![Stack](https://img.shields.io/badge/stack-Next.js%2015%20%7C%20Prisma%20%7C%20PostgreSQL-orange)

---

## ✨ Features

### Raw Materials
- Yarn stock tracking by SKU, brand, color, weight (Sport/DK/Worsted/Bulky)
- Cost per gram + supplier + low-stock alert threshold
- Restock history with full audit trail
- Append-only `StockMovement` ledger — every change is recorded

### Products (Dynamic)
- Create any product on the fly — name, category, selling price, labor hours
- Each product has a **recipe** (which yarns + how many grams per unit)
- Material cost and margin auto-calculated from recipe

### Production
- "I made 5 of these today" → auto-deducts yarn via the recipe
- **Atomic stock protection** — the system physically cannot let you produce more than you have yarn for (prevents negative stock, race-condition safe)
- Labor hours captured for cost tracking

### Sales & Customers
- Multi-item orders with payment status (pending/partial/paid/delivered)
- Channel tracking (Instagram / WhatsApp / in-person / website / Food Story)
- Customer database with lifetime value (LTV) auto-computed
- Amount paid vs pending surfaced everywhere

### Finances
- Categorized expenditures (rent, utilities, marketing, materials, misc)
- Recurring vs one-time flag
- Monthly salary records per employee
- Auto P&L: revenue − material cost − expenditure = **net profit**

### Analytics Dashboard
- Monthly revenue, expenditure, net profit, margin %
- Top 5 best-selling products
- Most-used yarn this month
- 6-month revenue vs expenditure trend
- Expenditure breakdown by category (pie chart)
- Low-stock alerts
- Stock value (sum of grams × cost/gram)

---

## 🛠 Tech Stack

| Layer | Choice |
|---|---|
| Framework | **Next.js 15** (App Router, Server Actions) |
| Language | TypeScript |
| Database | **PostgreSQL** (Neon) — set `DATABASE_URL` |
| ORM | **Prisma 5** |
| UI | Tailwind CSS with custom warm pastel palette (peach, mint, lilac, sun-yellow) |
| Charts | Recharts |
| Validation | Zod |

---

## 🚀 Quick Start

```bash
# 1. Install deps
pnpm install

# 2. Set up the database
#    Point DATABASE_URL at your Postgres (Neon) connection string in .env,
#    then push the schema and seed an admin user:
pnpm db:push   # applies prisma/schema.prisma to the database
SEED_ADMIN_USERNAME=admin SEED_ADMIN_PASSWORD='<a strong password>' pnpm db:seed

# 3. Run
pnpm dev        # http://localhost:3000 — login with the admin you created above
```

Optional:
- `pnpm db:studio` — browse/edit the DB in a web UI

---

## 📁 Project Structure

```
prisma/
  schema.prisma      # 11 models: Yarn, Product, Recipe, Production, Order...
  seed.ts            # Sample data (yarn, products, customers, orders)
src/
  app/
    page.tsx              # Dashboard
    yarns/                # Stock + restock
    products/             # Cards grid + recipe builder
    production/           # Auto-deducting log
    orders/               # Multi-item order form
    customers/
    expenditures/
    salaries/
    api/                  # API routes for client-side forms
  components/
    Charts.tsx            # Recharts wrappers
  lib/
    prisma.ts             # Prisma client singleton
    analytics.ts          # All dashboard metrics, computed on the fly
    format.ts             # PKR / grams / date helpers
```

---

## 🧠 Key Design Decisions

### Why an append-only stock ledger?
We never directly edit `Yarn.stockGrams`. Every change writes a `StockMovement` row (positive for restock, negative for production). This gives you:
- A complete audit trail — "why did my stock change on Tuesday?"
- The ability to rebuild `stockGrams` from history at any time
- Easy debugging of "off by 50g" discrepancies

### Why recipes (Bill of Materials)?
The client sells products that change based on customer choice — there's no fixed catalog. So instead of hardcoded SKUs, each product has a **recipe** (yarn SKUs + grams per unit). This is the manufacturing-industry pattern called *BOM (Bill of Materials)*. When production is logged, the system looks up the recipe and deducts accordingly.

### Why compute analytics on every page load?
We never store "total revenue this month" or "profit margin" anywhere. They're always derived from the underlying data. Tradeoff: slightly more DB queries per dashboard view. Benefit: the numbers can never go stale, and adding a new data source (e.g. refunds) automatically updates all metrics.

### Race-condition safety in production logging
The classic bug: two employees log production at the same moment, both pass the "do I have enough yarn?" check, and stock goes negative. We prevent this with:
1. Input validation
2. A pre-flight check (catches 99% of cases)
3. **Inside a `prisma.$transaction`**, re-read the stock and use a conditional `updateMany` (`where: { stockGrams: { gte: needed } }`) — this is the atomic guard. If stock changed under us, the update matches zero rows and we throw.

---

## 🗄 Schema (11 models)

```
Yarn ──┬─ Restock        (every yarn purchase)
       ├─ StockMovement  (append-only ledger: production/restock/adjustment)
       └─ RecipeItem     (which products use this yarn, how many grams)

Product ──┬─ RecipeItem    (this product's BOM)
         ├─ Production    (every batch made)
         └─ OrderItem     (every order containing this product)

Customer ── Order ── OrderItem

Expenditure   (rent, utilities, marketing, materials, misc)
SalaryRecord  (per employee, per month)
```

Full schema: see `prisma/schema.prisma`.

---

## 🚢 Deployment

### Option 1: Vercel (easiest, free tier)
1. Create a Postgres DB at [neon.tech](https://neon.tech) (free tier is fine).
2. Import this repo on [vercel.com](https://vercel.com).
3. In Vercel project settings → Environment Variables, add:
   - `DATABASE_URL` = your Neon connection string (**use the pooled/connection-pooler URL**, not the direct one, so serverless functions don't exhaust the connection pool).
   - `SESSION_PASSWORD` = a random string of at least 32 characters. Generate one with: `openssl rand -hex 32`
4. Vercel builds with `prisma generate && next build` (set in `vercel.json`) — build doesn't need a DB connection.
5. After the first deploy (or locally), apply the schema to Neon and seed the admin:
   ```bash
   # run locally with the same DATABASE_URL as Vercel
   pnpm db:push
   SEED_ADMIN_USERNAME=admin SEED_ADMIN_PASSWORD='<a strong password>' pnpm db:seed
   ```
   ⚠️ `db:seed` **wipes existing data** (it deletes all rows first) — run it only on an empty database.

### Option 2: VPS (most control)
1. Get a $5/mo VPS (Hetzner/DigitalOcean)
2. SSH in, install Node 20+
3. Clone, `pnpm install && pnpm build`
4. `pm2 start npm --name dashboard -- start`
5. nginx + certbot for HTTPS

Postgres (Neon) works the same on a VPS — just point `DATABASE_URL` at Neon.

---

## 📋 What's NOT built yet (Tier 2/3 features)

- Photo uploads per product
- PDF invoices for customers
- CSV export for the accountant
- Multi-user roles (owner/employee/accountant)
- Voice-to-product logging
- Recurring salary auto-generation cron
- WhatsApp/Instagram order import (paste chat → draft order)

---

## 📜 License

Built for a real client. Treat as proprietary unless otherwise specified.
