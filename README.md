# CodingStats for Dummies

A dev-guide companion site for [coding-stats](https://codingstats.vercel.app) —
a field guide to building the **CodingStats iOS companion app**: Apple Health,
but for coding fitness.

Live at [codingstatsfordummies.vercel.app](https://codingstatsfordummies.vercel.app).

## What's inside

- **Apple primer (02–03)** — Swift & SwiftUI/Xcode primitives mapped to TypeScript/web concepts
- **The data spine (04–05)** — the WakaTime → GitHub Actions cron → Supabase pipeline and the iOS architecture that consumes it
- **Coding fitness (06–09)** — preferred coding windows, daily/weekly goals, rest days, activity rings, burnout/sustainability analysis (ACWR), AI-usage tracking, and client invoicing
- **Shipping (10)** — code signing, TestFlight, App Store review
- **Hands-on (11–12)** — tiered-hint challenges and curated learning resources

Sibling site in spirit: [codogotchifordummies.vercel.app](https://codogotchifordummies.vercel.app).

## Development

Built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build).

```bash
npm install
npm run dev       # localhost:4321
npm run build     # static build to ./dist
npm run preview
```

Content lives in `src/content/docs/` — one Markdown file per chapter. Sidebar
order is defined in `astro.config.mjs`. Theme tokens in `src/styles/custom.css`.
