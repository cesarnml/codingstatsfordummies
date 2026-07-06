---
title: "07 — Sustainability & Burnout Signals"
description: Turning session data into an overtraining analysis — rolling workload ratios, late-night drift, rest-day violations, and how to present warnings without being preachy.
---

> Goal: implement the `BurnoutAnalyzer` — a small set of well-founded,
> explainable heuristics borrowed from sports science — and learn the
> presentation rules that keep it useful instead of annoying.

---

## Borrow from sports science, not vibes

Athletic training has a standard overtraining question: *is recent load out
of proportion to what the body is adapted to?* The common tool is the
**acute:chronic workload ratio (ACWR)** — recent 7-day load divided by the
trailing 28-day average load. We steal it wholesale:

```
acute   = mean(daily coding seconds, last 7 days)
chronic = mean(daily coding seconds, last 28 days)
ACWR    = acute / chronic
```

| ACWR        | Sports reading            | Coding reading                          |
| ----------- | ------------------------- | ---------------------------------------- |
| < 0.8       | detraining                | winding down / vacation                  |
| 0.8 – 1.3   | **sweet spot**            | sustainable pace                         |
| 1.3 – 1.5   | elevated risk             | hot streak — watch it                    |
| > 1.5       | danger zone               | sprinting beyond your base — burnout risk |

Why this beats a naive "you coded a lot this week": it's **personalized by
construction**. 45 h/week is a red flag for someone adapted to 25, and a
normal Tuesday for someone adapted to 40. The denominator *is* the user's
own baseline.

⚠️ **Implementation details that matter:**
- **Rest days stay in the mean as zeros** — they're part of the true weekly
  rhythm. Dropping them inflates chronic load and hides overload.
- **Cold start:** with < 28 days of history, show "calibrating (n/28 days)"
  rather than a ratio — an unstable denominator produces alarming nonsense.
- All inputs come from `DayStat.totalSeconds` — this is a pure fold over the
  cache, unit-testable like everything else.

🗣️ **In plain English.** Compare this week's coding to your own last month.
Close to your normal: fine. Way above your normal — the thing you're not
trained for: that's the classic setup for burning out, in sports and at a
keyboard alike.

---

## The other four signals

ACWR sees volume. Four cheap, explainable heuristics see *pattern* — each is
a few lines over `SessionRecord` timestamps ([Chapter 04](/04-the-data-contract/):
only `durations` knows clock time):

### 1. Late-night drift
Sessions starting in the "late zone" (default 22:00–05:00, derived from the
user's window). One is nothing; the *trend* is the signal:

```
lateShare(week) = late-zone seconds / total seconds
signal: lateShare rising ≥ 3 consecutive weeks, or > 20% in any week
```

### 2. Rest-day violations
Coding > 15 min on a declared rest day ([Chapter 06](/06-windows-goals-rings/)'s
inversion). One violation = noted quietly. **Three consecutive planned-rest
days with real work = the single most literal burnout signal this app can
detect** — the user has stopped taking their own breaks.

### 3. Days-without-rest run
Longest current run of consecutive nonzero-coding days, rest days included.
Research on recovery is unambiguous: > 13 straight days earns a nudge no
matter what the volume ratio says.

### 4. Window erosion
Chapter 06's `windowAdherence`, differentiated over weeks. Adherence sliding
from 85% → 60% over a month means the schedule is dissolving — usually into
evenings, which is how late-night drift *starts*.

🗣️ **In plain English.** Beyond raw volume, the app watches four patterns:
work creeping past bedtime, work invading your days off, too many days in a
row without a break, and your neat schedule slowly leaking into the evening.
Each is easy to explain — which is exactly why we chose them.

---

## Composing the verdict

Resist inventing a fake-precise 0–100 "burnout score." Ship an ordered
verdict plus *named reasons* — honest and actionable:

```swift
enum SustainabilityVerdict: Comparable {
    case sustainable, watch, overreaching, unsustainable
}

struct SustainabilityReport {
    let verdict: SustainabilityVerdict
    let reasons: [Signal]        // each: name, evidence sentence, weeks observed
    let acwr: Double?
}
```

Rules of thumb for the mapping: ACWR alone can raise to `.watch`; it takes
ACWR > 1.3 **plus** a pattern signal to reach `.overreaching`; rest-day
violations 3 weeks running or a 14-day no-rest run reach `.unsustainable`
regardless of ratio. Every escalation carries its evidence:

> **Overreaching.** 7-day load is 1.6× your 28-day baseline · late-night
> share rose 3 weeks straight (8% → 22%).

### Presentation rules (the part everyone gets wrong)

1. **Explain, never diagnose.** "Burnout" is a clinical word; the UI says
   *sustainable / watch / overreaching / unsustainable* — training language.
2. **Evidence-first.** Every warning shows its receipts — the exact numbers
   and weeks. No unexplained red badges.
3. **Quiet by default.** The panel lives on the Trends tab. It sends at most
   **one** notification per verdict *escalation* — never a daily drumbeat.
4. **Down-transitions are celebrated.** Returning to `sustainable` after an
   `overreaching` stretch is ring-closing-level good news. Say so.

🗣️ **In plain English.** The app grades your pace like a coach: fine, keep
an eye on it, overdoing it, or seriously overdoing it — and always shows the
specific evidence. It mentions problems once, not every morning, and it
congratulates you for cooling back down.

---

## The Trends panel

Swift Charts, all reading precomputed analyzer output:

- **Load chart** — daily bars + 7-day and 28-day rolling lines; the ACWR
  sweet-spot band (0.8–1.3× chronic) shaded behind, Apple-style
  (`RuleMark`/`RectangleMark` + `BarMark` + two `LineMark`s).
- **Clock histogram** — coding seconds by hour-of-day, this month vs last;
  late-night drift is *visible* here before it's ever flagged.
- **Rest ledger** — planned rest days vs honored rest days, per week.

```swift
Chart {
    RectangleMark(yStart: .value("lo", chronic * 0.8), yEnd: .value("hi", chronic * 1.3))
        .foregroundStyle(.green.opacity(0.1))
    ForEach(days) { BarMark(x: .value("day", $0.date), y: .value("h", $0.hours)) }
    ForEach(rolling7)  { LineMark(x: .value("day", $0.date), y: .value("h", $0.mean)) }
}
```

---

## Prove it to yourself

Feed the analyzer three synthetic months and check the verdicts flip where
they should:

1. **Steady Eddie** — 4 h/day, weekdays only → `sustainable` forever.
2. **Crunch** — Eddie, then 3 weeks at 9 h/day including Saturdays →
   `watch` in week 1, `overreaching` by week 2 (ACWR crosses 1.3 with
   rest-day violations), reasons list both.
3. **Recovery** — Crunch, then 2 normal weeks → verdict steps back down and
   the "back to sustainable" event fires exactly once.

If the fixtures read like little stories, you've built the analyzer right —
it should be legible enough to narrate.
