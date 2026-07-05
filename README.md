# HubSpot Health Check

A web-based CRM audit tool. Upload a HubSpot export (or run the built-in demo) and get a scored health report with an AI executive summary, per-issue fix recommendations, the exact affected records, and exportable cleanup plans.

Built by [Arnaud Chacon](https://www.linkedin.com/in/arnaud-chacon/) — fintech RevOps / finance ops. The duplicate detection reuses the Levenshtein scoring engine from EIJI Studios.

## Key features

- **Duplicate review workbench** (`/review`) — pairs scoring 0.80+ are clustered automatically; pairs in the 0.60–0.80 greyzone are dealt as swipeable cards for human triage (confirm / reject / skip, keyboard shortcuts, drag gestures). Confirmed pairs merge into pools and export as a merge-plan CSV ready for HubSpot re-import. Decisions persist in the browser.
- **AI executive summary** — one paragraph on the overall state plus the three actions to take this week, generated per audit.
- **Per-issue CSV exports** — every issue's full affected-record list downloads from the drill-down drawer.
- **Local audit history** — the last 10 reports are kept in localStorage (never on a server) and reloadable from the landing page.

## What it checks

| # | Check | What it finds |
|---|---|---|
| 1 | Duplicate contacts | Fuzzy-matched duplicate clusters (weighted Levenshtein on name + email + domain + phone) |
| 2 | Owner gaps | Contacts with no assigned owner, with age distribution to spot broken intake |
| 3 | Zombie workflows | Workflows marked active with zero enrollments in 30 days |
| 4 | Stale deals | Active-pipeline deals with no activity in 90+ days, with ARR at risk |
| 5 | Deal hygiene | Active deals missing owner or amount — invisible to forecasting |
| 6 | Phone formats | Mixed phone number formats that break calling/SMS integrations |
| 7 | Email quality | Freemail, role-based, and invalid email addresses in a B2B CRM |

Each detected issue gets a severity (HIGH / MEDIUM / LOW), a drill-down drawer showing the exact affected records, and an AI-generated recommendation (ROOT CAUSE → FIRST STEP → WATCH FOR).

## Stack

- **Next.js 14** (App Router) + TypeScript + Tailwind — one language, one deploy
- **Google Gemini** (`gemini-2.5-flash`) for recommendations; falls back to hand-written recs if unavailable
- **PapaParse** for client-side CSV parsing/validation before anything hits the server
- No database — uploads are processed in memory and discarded

## Architecture notes

- **Demo audits cost $0**: the demo dataset's recommendations are pre-generated once (`npm run cache-demo`) and served from `data/cached-recommendations.json`.
- **CSV audits call Gemini live** — one call per detected issue plus the executive summary (max 8), 2,000 rows per file. 429s are retried using the API's suggested delay.
- **Free-tier note**: Gemini's free tier allows 5 requests/min, so a single full audit barely fits and concurrent users will see fallback recommendations. For real usage, upgrade the key to the paid tier (an audit costs a fraction of a cent).
- The duplicates check prunes candidate pairs with a length-difference upper bound before running Levenshtein, so 2,000-contact uploads stay fast.

## Getting started

```bash
npm install
cp .env.example .env.local   # add your GEMINI_API_KEY
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

To regenerate the demo cache after changing the demo dataset, checks, or prompts:

```bash
npm run cache-demo
```

## CSV format

Three optional files (contacts required, deals and workflows unlock more checks). Templates are downloadable in the upload dialog, and common HubSpot export column names are aliased automatically.

- **contacts**: `id, first_name, last_name, email, phone, company_domain, owner_id, created_at`
- **deals**: `id, name, stage, amount_usd, owner_id, contact_id, created_at, last_activity_date`
- **workflows**: `id, name, is_active, enrollment_count_30d, last_enrollment_date`
