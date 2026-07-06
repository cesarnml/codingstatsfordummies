---
title: "11 — Challenges"
description: Seven hands-on challenges from empty Xcode project to home-screen widget, each with tiered hints — try before you peek.
---

> Rules of engagement: attempt each challenge cold, then open hints in order
> — 💡 *nudge* → 🔧 *approach* → 📜 *the answer's shape*. Each challenge
> names the chapter that teaches its material. They stack: do them in order
> and you end with the real app.

---

## Challenge 1 — The walking skeleton *(Chapters 03, 05)*

Empty project → a `List` of the last 14 days as `"Jul 5 — 5h 39m"`, fetched
live from Supabase. No cache, no goals — just proof the spine conducts
electricity.

<details><summary>💡 Nudge</summary>

You need exactly three pieces: a `Decodable` struct pair (`SummaryRow` →
`DaySummary` → `grandTotal.totalSeconds`), one `URLSession` GET with two
headers, and a view with `.task { }`. Resist building more.

</details>
<details><summary>🔧 Approach</summary>

Build the PostgREST URL with `URLComponents`:
`/rest/v1/summaries?select=date,data&order=date.desc&limit=14`. Set `apikey`
and `Authorization: Bearer` headers to the anon key. Decode with
`.convertFromSnakeCase`. Keep state as `LoadState<[SummaryRow]>` (the enum
from Chapter 02) and `switch` in the view body.

</details>
<details><summary>📜 Shape of the answer</summary>

~80 lines total: `SupabaseClient.rows(…)` (Chapter 05's listing, minus
generics if you like), two DTO structs, one `@Observable` model with
`func load() async`, one `List`. Formatting: `Duration.seconds(total)`
`.formatted(.units(allowed: [.hours, .minutes]))` — don't hand-roll "5h 39m".

</details>

---

## Challenge 2 — DateOnly and the midnight monster *(Chapters 04, 06)*

Write `DateOnly` (a `Hashable`, `Comparable`, `Codable` year-month-day type)
plus `func dayKey(for session: SessionRecord, calendar: Calendar) -> DateOnly`
that attributes epoch-timestamped sessions to calendar days — then make these
tests pass: a 23:50 session lands on its start day; a session *spanning*
midnight splits its seconds across both days; the answers hold in
`America/Denver` across a DST transition.

<details><summary>💡 Nudge</summary>

The bug you're defending against: `Date` → `ISO8601` string conversions
default to UTC, so a 22:00 Denver session becomes "tomorrow." Never let a
bare `Date` decide what day it is — only a `Calendar` with the right
`timeZone` may answer that.

</details>
<details><summary>🔧 Approach</summary>

Store `DateOnly` as three `Int`s. Construct from `Date` via
`calendar.dateComponents([.year, .month, .day], from:)`. For the split:
`calendar.startOfDay(for: start.addingTimeInterval(seconds))` gives the
boundary; seconds before/after it belong to different keys. Return
`[(DateOnly, Double)]` from a `splitByDay` helper rather than forcing one key.

</details>
<details><summary>📜 Shape of the answer</summary>

~60 lines + tests. The DST test: construct March 8 2026 01:30 in Denver,
add a 2-hour session, assert total attributed seconds still equal the
session's seconds (conservation law — the assertion that catches naive
`+ 86400` math).

</details>

---

## Challenge 3 — The GoalEngine, test-first *(Chapter 06)*

Implement `verdict(for:sessions:)`, `windowAdherence`, and `currentStreak`
— written test-first against Chapter 06's three edge cases (straddling
sessions, overnight windows, rest days as success).

<details><summary>💡 Nudge</summary>

Everything is interval intersection in minutes-since-midnight space. Write
`overlap(_ a: Range<Double>, _ b: Range<Double>) -> Double` first; both
window adherence and the overnight case are calls to it.

</details>
<details><summary>🔧 Approach</summary>

Overnight window (end < start) = union of two ranges:
`[start, 1440)` and `[0, end)` — sum the two overlaps. For streaks, walk
`days.reversed()`, counting while `goalMet` (remember: rest day + zero
coding ⇒ `goalMet == true`), and decide your policy for *today* (it's
incomplete — most humane: today never breaks a streak, it can only extend it).

</details>
<details><summary>📜 Shape of the answer</summary>

`GoalEngine` stays a pure struct, ~120 lines; the test file is *longer* than
the engine. That ratio is correct — this is the code invoices and rings both
trust.

</details>

---

## Challenge 4 — Rings that feel Apple *(Chapter 06)*

The three nested rings with spring animation, overshoot lap past 100%, rest-day
leaf state, and a week strip of seven mini-rings underneath.

<details><summary>💡 Nudge</summary>

`Circle().trim(from:to:)` + `rotationEffect(.degrees(-90))` is 90% of it.
The animation comes free from `.animation(.spring(duration: 0.8), value: progress)`
— animate the *data*, don't orchestrate.

</details>
<details><summary>🔧 Approach</summary>

Chapter 06's listing is the answer for one ring. Composition: `ZStack` +
increasing `.padding`. Week strip: `HStack(ForEach(verdicts))` reusing the
same `ActivityRing` at `lineWidth: 5`. Rest day: `if verdict.isRestDay`
swap in `Image(systemName: "leaf.fill")` — views are values; branching is
free.

</details>
<details><summary>📜 Shape of the answer</summary>

One `ActivityRing` (~35 lines) reused at three sizes and seven mini sizes.
If you wrote two ring implementations, refactor — the reuse *is* the lesson.
Bonus polish: `.sensoryFeedback(.success, trigger: goalJustMet)`.

</details>

---

## Challenge 5 — The burnout fixtures *(Chapter 07)*

Implement `BurnoutAnalyzer.report(days:sessions:config:)` and make the three
narrative fixtures pass: Steady Eddie stays `sustainable`, Crunch escalates
`watch → overreaching` with *both* reasons named, Recovery steps back down
and fires the celebration event exactly once.

<details><summary>💡 Nudge</summary>

Build the two rolling means first and *chart them in a test playground*
before writing thresholds — you'll immediately see why rest-day zeros must
stay in the denominator.

</details>
<details><summary>🔧 Approach</summary>

`acute = days.suffix(7)`, `chronic = days.suffix(28)` means over
`totalSeconds`. Each pattern signal is its own tiny pure function returning
`Signal?`; the verdict is a fold over `[Signal]` + ACWR using Chapter 07's
escalation rules. "Fires exactly once" = compare against the *previous*
verdict (persist last verdict in `GoalConfig` or a tiny `@Model`).

</details>
<details><summary>📜 Shape of the answer</summary>

Analyzer ~150 lines, five pure signal functions, one mapping function.
Fixtures generated by helpers like
`days(hours: 4, weekdaysOnly: true, weeks: 8) + days(hours: 9, includeWeekends: true, weeks: 3)`
— readable as the story they tell.

</details>

---

## Challenge 6 — Invoice PDF round-trip *(Chapter 09)*

Timesheet → `InvoicePage` SwiftUI view → PDF bytes via `ImageRenderer` →
in-app `PDFView` preview → `ShareLink`. Plus the rounding and immutability
tests from Chapter 09's "prove it."

<details><summary>💡 Nudge</summary>

Design `InvoicePage` at fixed `612 × 792` and preview it as a normal SwiftUI
view first — get it beautiful *before* involving `CGContext`.

</details>
<details><summary>🔧 Approach</summary>

Chapter 09's `renderInvoicePDF` listing is complete — the work is the view:
`Grid { GridRow { … } }` for line items, `.monospacedDigit()` on all
numbers, `Decimal.FormatStyle.Currency(code:)` for money. Preview via
`UIViewRepresentable` wrapping `PDFKit.PDFView`; share via a temp file URL
named `CS-2026-014.pdf`.

</details>
<details><summary>📜 Shape of the answer</summary>

~200 lines: view (120), renderer (30, from the chapter), preview wrapper
(20), share plumbing (10). Acceptance test: AirDrop it to your Mac and ask
"would I send this to a client?" — that bar, not pixel-perfection.

</details>

---

## Challenge 7 — The ring on the home screen *(Chapters 03, 05, 06)*

A WidgetKit extension showing today's ring + hours, refreshed on a sensible
timeline, sharing data with the app via an App Group.

<details><summary>💡 Nudge</summary>

The widget is a *separate process* — it cannot call your repository or hit
the network on demand. It reads a pre-computed snapshot the app leaves
behind. Decide the snapshot's shape first; the rest is plumbing.

</details>
<details><summary>🔧 Approach</summary>

App Group container (`group.com.cesarnml.codingstatsfitness`) + a tiny JSON
file (`WidgetSnapshot: Codable` — progress, hours, isRestDay, asOf). App
writes it after every sync; widget's `TimelineProvider` reads it and emits a
few entries with `.after(15 min)` policy. Reuse `ActivityRing` by moving it
(and `WidgetSnapshot`) into a shared framework target — your first real
multi-target moment (Chapter 03's vocabulary pays off here).

</details>
<details><summary>📜 Shape of the answer</summary>

New target (~80 lines) + shared framework + ~10 lines in the app's sync
path. Gotchas the hints already defused: placeholder entries for App Review
(Chapter 10), and `containerURL(forSecurityApplicationGroupIdentifier:)`
returning `nil` = the App Group capability isn't on *both* targets.

</details>

---

## Boss fight (no hints)

Ship it. TestFlight for a week of real use, fix what annoys you, write the
privacy label, submit for review. When the "Ready for Sale" email arrives,
you've earned the right to call [Chapter 10](/10-app-store/) boring.
