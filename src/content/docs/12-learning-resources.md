---
title: "12 — Learning Resources"
description: A curated, opinionated reading list — the shortest path from TypeScript fluency to shipping this app, and nothing else.
---

> Curation rule: nothing lands here unless it directly serves this app.
> Ordered by when you'll need it, annotated with *why* and *how much*.

---

## Swift, the language *(with Chapter 02)*

- **[The Swift Programming Language](https://docs.swift.org/swift-book/)** —
  the official book. Don't read linearly; hit *The Basics*, *Optionals*,
  *Enumerations*, *Protocols*, *Concurrency*. ~3 evenings for a TS dev.
- **[Swift for JavaScript developers](https://www.swift.org/documentation/articles/)** —
  swift.org's own articles collection; short and honest about the mapping.
- **[Hacking with Swift — 100 Days of SwiftUI](https://www.hackingwithswift.com/100/swiftui)**
  (Paul Hudson) — the community-standard course. You don't need 100 days;
  days 1–15 (language) + 16–24 (SwiftUI basics) cover this guide's needs.
  Free, and the reference you'll keep returning to.
- **[Swift Playgrounds](https://www.apple.com/swift/playgrounds/)** — for the
  Chapter 02 "prove it" exercises without project ceremony.

## SwiftUI & app architecture *(with Chapters 03, 05, 06)*

- **[Apple SwiftUI Tutorials](https://developer.apple.com/tutorials/swiftui)** —
  the official interactive path. Do *Introducing SwiftUI* start-to-finish
  (~4 h); it's genuinely good and teaches Xcode alongside.
- **[Fatbobman's blog](https://fatbobman.com/en/)** — the best deep dives on
  SwiftData and SwiftUI internals when `@Query` behaves mysteriously.
- **[Swift Charts documentation](https://developer.apple.com/documentation/charts)** +
  the WWDC22 session *Hello Swift Charts* — everything Chapters 06–08 render.
- **[objc.io — Thinking in SwiftUI](https://www.objc.io/books/thinking-in-swiftui/)** —
  short book; the mental model of view identity and state that separates
  "it works" from "I know why it works."

## The platform bits *(with Chapters 03, 09, 10, 11)*

- **[WWDC23 — Meet SwiftData](https://developer.apple.com/videos/play/wwdc2023/10187/)** —
  30 minutes, covers everything Chapter 05's cache uses.
- **[WidgetKit documentation](https://developer.apple.com/documentation/widgetkit)** +
  WWDC20 *Widgets Code-along* — Challenge 7's source material. Timelines are
  the only genuinely new concept.
- **[ImageRenderer documentation](https://developer.apple.com/documentation/swiftui/imagerenderer)** —
  the PDF trick from Chapter 09 is officially supported, not a hack.
- **[App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)** —
  skim 2.1, 4.2, 5.1 before submission (Chapter 10 told you why).
- **[TestFlight docs](https://developer.apple.com/testflight/)** — 10 minutes.

## The data side *(with Chapter 04)*

- **[PostgREST API reference](https://postgrest.org/en/stable/references/api.html)** —
  the query syntax (`gte.`, `lte.`, `order`) the app speaks. Bookmark the
  *Tables and Views* page.
- **[Supabase REST docs](https://supabase.com/docs/guides/api)** — RLS +
  anon-key model in Supabase's own words.
- **[WakaTime API docs](https://wakatime.com/developers)** — *Durations* and
  *Summaries* endpoints are the upstream truth behind Chapter 04's shapes.
- **The `coding-stats` repo itself** — `src/routes/api/cron/wakatime/*/+server.ts`
  are ~30 lines each and *are* the data contract's producer side. Read them
  once; they're shorter than Chapter 04.

## Taste and judgment *(with Chapters 06–08)*

- **[Apple Human Interface Guidelines — Charts](https://developer.apple.com/design/human-interface-guidelines/charts)**
  and **[— Widgets](https://developer.apple.com/design/human-interface-guidelines/widgets)** —
  why Apple's rings feel right; directly informs Chapter 06's choices.
- **Gabbett, T. (2016), [the training–injury prevention paradox](https://bjsm.bmj.com/content/50/5/273)** —
  the ACWR paper Chapter 07 borrows from. Read the abstract; know the
  sweet-spot band's origin (and its critics — it's a heuristic, which is
  exactly how the app presents it).

---

## The order that works

If you want a single prescription:

1. Swift book highlights + 100 Days days 1–15 *(one week of evenings)*
2. Apple's *Introducing SwiftUI* tutorial *(one weekend morning)*
3. **Build Challenge 1** — the walking skeleton *(same weekend)*
4. Chapters 04–06 of this guide + Challenges 2–4 *(week two)*
5. *Meet SwiftData* + wire the cache *(a few evenings)*
6. Chapters 07–09 + Challenges 5–6 *(week three)*
7. Widget code-along + Challenge 7, then Chapter 10 and ship *(week four)*

A month of evenings, honestly paced. The skill you're actually acquiring —
reading Apple's documentation without flinching — compounds for every iOS
thing you ever build after this.

🗣️ **In plain English.** Learn just enough Swift, do Apple's one good
tutorial, then build this app challenge by challenge, reading deeper only
when a chapter sends you. Four weeks of evenings, and the phone app on your
home screen is yours — rings, warnings, invoices and all.
