# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev        # start Vite dev server (localhost:5173)
npm run build      # production build → dist/
npm run lint       # ESLint
npm run preview    # serve the dist/ build locally
```

There are no tests.

## Deployment

There are two deployment targets with different feature sets:

**GitHub Pages (static)** — triggered automatically on push to `main` via `.github/workflows/deploy.yml`. Builds with `VITE_USE_API=false` (default). No backend; data syncs to JSONBin. PIN auth is baked into the bundle at build time via `VITE_PIN`.

**Vercel (full-stack)** — `VITE_USE_API=true`. Enables the `/api/*` serverless functions, Upstash Redis storage, TrueLayer bank integration, and JWT session auth. The Vercel deployment is the production app.

## Environment Variables

| Variable | Used by | Purpose |
|---|---|---|
| `VITE_USE_API` | Frontend + Vite config | Switches between API mode and static mode |
| `VITE_PIN` | Static mode only | PIN baked into bundle |
| `VITE_JSONBIN_BIN_ID` / `VITE_JSONBIN_KEY` | Static mode only | JSONBin fallback storage |
| `HFSTORE_KV_REST_API_URL` / `HFSTORE_KV_REST_API_TOKEN` | API functions | Upstash Redis |
| `TRUELAYER_CLIENT_ID` / `TRUELAYER_CLIENT_SECRET` | TrueLayer functions | Bank OAuth |
| `TRUELAYER_SANDBOX` | TrueLayer functions | `"true"` for sandbox environment |
| `JWT_SECRET` / `ADMIN_PASSWORD_HASH` | Auth | Session tokens and login |

## Architecture

### Data layer

All user data (bills, payments, incomes, income receipts, settings) lives in **localStorage** and is synced to the cloud on every change. The sync target depends on `VITE_USE_API`:
- API mode: `PUT /api/data` → Upstash Redis key `hf:data`
- Static mode: JSONBin

`GistSync.jsx` loads cloud data into localStorage before the React app mounts. `FinanceContext.jsx` debounces a save (1.5s) on every change to bills, payments, incomes, or settings.

### State management

No global state library — all state flows through a single `FinanceContext` (wrapping the whole app). The context is composed from three hooks:
- `useBills` — bills array + payments array (mark paid/unpaid per month key `YYYY-MM`)
- `useIncome` — incomes array + income receipts array (mark received per month key)
- `useSettings` — currency, person names, etc.

Each hook reads/writes a dedicated localStorage key via `useLocalStorage`.

### Bill scheduling

`getBillOccurrence(bill, year, month)` in `billUtils.js` determines whether a bill falls in a given month and returns its due date string. It handles all frequencies: monthly, weekly, fortnightly, quarterly, 6-monthly, annual, custom (specific months), and one-off. `getBillsForMonth` calls this for every bill and returns `{ bill, dueDate }[]`.

The month key format used everywhere for payments/receipts is `YYYY-MM` (e.g. `2026-04`).

### TrueLayer bank integration (API mode only)

`api/_truelayer.js` — token management (silent refresh) and `fetchBankData` (accounts + balances).

Bank data is cached in Redis under `tl:data`. Transactions are fetched on demand and cached under `tl:transactions:YYYY-M` (10 min for current month, 24h for past).

The frontend stores the latest bank data in `truelayer` state on `FinanceContext`. `isConnectedWithBalance` is the key boolean used across pages to gate bank-dependent UI.

### Transaction auto-matching

`TransactionsPage.jsx` auto-matches debit transactions against unpaid bills using a two-pass approach:
1. **Learned links** (`api/learned-links.js`) — previously user-confirmed `txDescription → billId` pairs stored in Redis
2. **Name + amount scoring** — `nameScore()` checks if bill name words appear in transaction description; combined with amount tolerance (2% for auto-match, 30% for fuzzy suggestion)

Income matching on the dashboard uses **amount (within 15%) + pay day (within 3 days)** — not name matching, since bank references rarely match income labels.

### Pages and routing

Client-side routing via a `tab` state in `App.jsx` — no router library. Pages: Dashboard, Bills, Income, Transactions, Settings, Theme.
