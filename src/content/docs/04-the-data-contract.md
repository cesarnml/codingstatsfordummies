---
title: "04 — The Data Contract"
description: The exact Supabase tables and WakaTime JSON shapes the iOS app consumes — the single source of truth between web and phone.
---

> Goal: know every table the crons write, the JSON hiding in each `data`
> column, and the retention story well enough to design the Swift `Codable`
> models in Chapter 05 without guessing.

---

## The retention problem, precisely

WakaTime's free tier exposes rich stats — but only for the **trailing 7
days**. Day 8 falls off a cliff (paywalled). CodingStats' answer is a
copy-on-schedule pipeline driven by two GitHub Actions workflows in the
`coding-stats` repo:

| Workflow                | Schedule           | Hits                                              | Purpose                              |
| ----------------------- | ------------------ | ------------------------------------------------- | ------------------------------------ |
| `yesterday-crons.yaml`  | `01 01 * * *` (daily 01:01 UTC) | `/api/cron/wakatime/{durations, durations-by-language, summaries, project-summaries}` | Write **yesterday's finalized** data |
| `today-crons.yaml`      | `*/45 * * * *` (every 45 min)   | same four, `/today` variants                       | Keep **today's partial** data fresh  |

Each endpoint is an upsert: fetch the day from WakaTime, then update the
existing row for that date or insert a new one. Idempotent — running a cron
twice for the same date is harmless. (See
`src/routes/api/cron/wakatime/durations/+server.ts` in the web repo for the
canonical ~30-line pattern.)

⚠️ **Consequence for the iOS app:** *today's* row mutates all day long
(45-minute staleness), while *past* rows are effectively immutable after the
01:01 UTC finalization pass. This asymmetry is the entire cache-invalidation
strategy in Chapter 05: **past = cache forever, today = refetch freely.**

🗣️ **In plain English.** Every night a robot files yesterday's final numbers.
All day long, another robot updates today's running total every 45 minutes.
Old days never change; today changes constantly. The phone app can therefore
download old days once and keep them forever.

---

## The tables

Six tables matter. Four share one shape — the **day-snapshot pattern**:

```sql
-- durations, durations_by_language, summaries, project_summaries
id         uuid primary key
date       date        -- one row per calendar day (unique)
data       jsonb       -- the raw WakaTime API response for that day
created_at timestamptz
updated_at timestamptz
```

Plus `projects` (project metadata; names unique) and `profiles` (the
single user row, auto-created on GitHub-OAuth signup by the
`on_auth_user_created` trigger).

The interesting part is what's inside each `data` column.

### `durations` — the raw sessions (most important table)

WakaTime "durations" are **individual coding sessions with start times** —
the only table that knows *when* you coded, not just *how much*:

```jsonc
// data: array of session objects
[
  {
    "project": "coding-stats",
    "time": 1751742000.0,       // Unix epoch seconds — session start
    "duration": 1847.5          // seconds spent
  },
  { "project": "codogotchi", "time": 1751749230.0, "duration": 3120.0 }
]
```

**This is the table the fitness features live on.** Preferred-window analysis
("what % of coding happened 9–6?"), late-night detection, session-length
stats, and rest-day verification all need timestamps — only durations have
them.

### `summaries` — the daily rollup

One WakaTime summary object per day: grand total plus per-category,
per-language, per-editor, per-OS breakdowns:

```jsonc
{
  "grand_total": { "total_seconds": 20340.0, "text": "5 hrs 39 mins", "hours": 5, "minutes": 39 },
  "categories": [
    { "name": "Coding", "total_seconds": 15200.0 },
    { "name": "AI Coding", "total_seconds": 3600.0 },
    { "name": "Writing Docs", "total_seconds": 1540.0 }
  ],
  "languages": [ { "name": "TypeScript", "total_seconds": 9800.0 }, … ],
  "editors":   [ { "name": "VS Code", "total_seconds": 18000.0 }, … ],
  "range": { "date": "2026-07-05", "timezone": "America/Denver" }
}
```

Feeds: daily/weekly goal progress, top-language stat, the **AI-usage signal**
(the `AI Coding` category — Chapter 08), and no-code-day detection.

### `project_summaries` — the same rollup, per project

Daily summary data broken down by project — total seconds, languages,
branches per project per day. Feeds: per-project drill-downs and **the
invoicing engine** (Chapter 09), which is essentially
`sum(project_summaries.data.grand_total) over date range × hourly rate`.

### `durations_by_language` — sessions annotated by language

Same session shape as `durations`, one row-set per language. The web app uses
it for language-over-time charts; the iOS app treats it as optional garnish.

🗣️ **In plain English.** The database keeps four notebooks: one lists every
work session with its clock time, one totals each day, one totals each day
*per project*, and one slices sessions by programming language. The phone app
mostly reads the first two; invoices read the third.

---

## How the iOS app reads it: PostgREST

Supabase auto-exposes every table over REST (PostgREST). No SDK required —
plain `URLSession`:

```
GET https://<project>.supabase.co/rest/v1/summaries
    ?select=date,data
    &date=gte.2026-06-01
    &date=lte.2026-06-30
    &order=date.asc
Headers:
  apikey: <anon key>
  Authorization: Bearer <anon key — or user JWT>
```

Rules of engagement for the phone:

1. **The anon key is public** — shipping it in the app binary is fine and
   normal. Security comes from **Row Level Security**: with single-user data,
   the pragmatic setup is RLS policies allowing `select` for `anon` and
   writes only for the authenticated owner (goal settings, invoice records if
   you store them server-side).
2. **Query windows, not the world.** `date=gte.&date=lte.` + `order` +
   `limit` — the app pages by month and caches locally, never re-downloading
   history it already has (immutability guarantee above).
3. **Filter on `date`, decode `data`.** The JSON column comes back verbatim;
   Swift decodes it with the `Codable` models built in Chapter 05.

🗣️ **In plain English.** The database has a built-in web API. The phone asks
"give me the rows between these two dates," gets JSON back, and unpacks it.
The API key in the app isn't a secret — the database's own row-level rules
decide who can read and write what.

---

## Contract stability: the drift problem

Nothing pins these JSON shapes. The crons store **whatever WakaTime
returned**, so a WakaTime API change flows silently into `data` columns.
TypeScript handles this loosely (`data: Json`); Swift must be deliberate:

- Decode **defensively**: every field the app doesn't strictly need is
  optional; unknown fields are ignored (default `Codable` behavior).
- Decode **per-row, not per-batch**: one malformed day should drop that day,
  not fail the whole sync (`compactMap` over per-row decode results).
- **Version your local cache**: a SwiftData schema bump must not require
  re-downloading three years of history — keep raw JSON blobs alongside
  parsed fields so re-parsing is local.

🗣️ **In plain English.** The notebooks are filled by a third party whose
handwriting can change without warning. The phone app is built to shrug at a
page it can't read instead of throwing away the book.

---

## Prove it to yourself

Pull one real day of each shape and eyeball it (replace URL/key):

```bash
for t in durations summaries project_summaries; do
  echo "== $t =="
  curl -s "https://<project>.supabase.co/rest/v1/$t?select=date,data&order=date.desc&limit=1" \
    -H "apikey: $KEY" -H "Authorization: Bearer $KEY" | jq '.[0].data' | head -30
done
```

Check three things: `durations` rows have `time` + `duration` per session,
`summaries` has `grand_total` + a `categories` array (find `AI Coding`!), and
`project_summaries` nests per-project totals. Those three facts power
chapters 06, 08, and 09 respectively.
