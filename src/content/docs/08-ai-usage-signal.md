---
title: "08 — AI Usage as a Fitness Signal"
description: Tracking AI-assisted coding share like a heart-rate zone — what the data supports, what it honestly can't, and how to chart it.
---

> Goal: build the `AiUsageModel` on top of the `AI Coding` category that
> already flows through the pipeline — and be precise about what the metric
> does and does not mean.

---

## The data you already have

No new collection needed. WakaTime categorizes tracked time, and the daily
`summaries` snapshots ([Chapter 04](/04-the-data-contract/)) carry it:

```jsonc
"categories": [
  { "name": "Coding",        "total_seconds": 15200.0 },
  { "name": "AI Coding",     "total_seconds": 3600.0 },
  { "name": "Writing Docs",  "total_seconds": 1540.0 },
  { "name": "Writing Tests", "total_seconds": 900.0 }
]
```

`DayStat` already denormalizes it (`aiSeconds`, [Chapter 05](/05-ios-companion-architecture/)).
The headline metric is one division:

```
aiShare(day)  = aiSeconds / totalSeconds
aiShare(week) = Σ aiSeconds / Σ totalSeconds     // volume-weighted, not mean-of-days
```

The web dashboard also tracks WakaTime's AI line counts and token usage
(AI additions/deletions, total tokens). Treat those as **optional garnish**
on the phone: line counts measure churn, not effort, and token counts
measure cost, not work. Time-share is the one AI metric commensurate with
everything else in a time-tracking app.

🗣️ **In plain English.** Your tracker already labels time spent driving AI
tools separately from hand-coding. Divide AI time by total time and you get
"how AI-assisted was my week" — no new tracking required.

---

## Why it belongs in a *fitness* app

Think heart-rate zones, not judgment. A runner doesn't ask "is zone 4 bad?"
— they ask "was this the *planned* zone for this workout?" Same posture:

- **The number is neutral.** 70% AI share on a scaffolding week is the plan
  working; 70% on a week of subtle debugging might mean thrash. The app
  reports; the user interprets.
- **The *derivative* is the signal.** A share that drifts 20% → 60% over a
  quarter without a deliberate decision is worth *noticing* — exactly like
  late-night drift in [Chapter 07](/07-burnout-signals/). Surface the trend,
  not a verdict.
- **One honest burnout interaction.** High-AI time is often *supervisory*
  (review, prompt, wait, redirect) — it can feel lighter per hour while
  inviting longer hours. So the analyzer treats hours as hours: **AI-heavy
  time gets no discount in ACWR load**. If anything correlates in your own
  data (e.g. AI-heavy days running later), the Trends charts will show it —
  that's the point of owning the data.

⚠️ **What the data honestly cannot tell you:** whether AI made you faster,
whether the code was better, or what you'd have done without it. There is no
counterfactual in a time series. The UI copy must never claim productivity
effects — only *composition* of time. This restraint is what keeps the
feature trustworthy.

🗣️ **In plain English.** The app treats AI use like a heart-rate zone: not
good, not bad — just worth knowing. What it flags is quiet long-term drift,
so a big change in how you work is a decision you made, not something that
happened to you.

---

## The model and the charts

```swift
@MainActor @Observable
final class AiUsageModel {
    struct WeekPoint: Identifiable {
        let weekStart: DateOnly
        let aiShare: Double          // 0…1
        let totalHours: Double
        var id: DateOnly { weekStart }
    }
    private(set) var weeks: [WeekPoint] = []
    private(set) var drift: Drift = .stable   // .rising(perWeek:), .falling(perWeek:), .stable

    func recompute(days: [DayStat]) { … }     // pure fold; drift = least-squares slope
                                              // over trailing 12 weeks, thresholded
}
```

Drift detection is deliberately boring: a least-squares slope over the
trailing 12 weekly points, flagged only past ±1.5 percentage points/week —
the same "explainable heuristic" bar as Chapter 07. No ML, nothing you can't
narrate in one sentence.

Two Swift Charts on the Trends tab:

- **Stacked area** — AI vs non-AI hours per week. Shows *both* facts at
  once: total load (height) and composition (split). One chart, two stories.
- **Share line** — weekly `aiShare` with a 4-week rolling mean; drift badge
  when flagged.

```swift
Chart(weeks) { w in
    AreaMark(x: .value("wk", w.weekStart), y: .value("h", w.totalHours * w.aiShare))
        .foregroundStyle(by: .value("kind", "AI-assisted"))
    AreaMark(x: .value("wk", w.weekStart), y: .value("h", w.totalHours * (1 - w.aiShare)))
        .foregroundStyle(by: .value("kind", "Hands-on"))
}
```

A small "AI mix" tile on the Today screen shows the current week's share
with a spark-line — no colors implying good/bad; indigo/gray, not
green/red.

🗣️ **In plain English.** Two pictures: a stacked mountain showing how much
of each week was AI-assisted versus hands-on, and a line showing the mix
drifting over months. The colors are deliberately neutral — this is a
speedometer, not a report card.

---

## Prove it to yourself

Fixture three synthetic quarters through `AiUsageModel`:

1. **Flat 30%** → `.stable`, no badge.
2. **Slow creep** 20% → 65% over 12 weeks (~3.75 pp/week) → `.rising`, badge
   text names the numbers: "AI share rose from 20% to 65% over 12 weeks."
3. **Step change** — 25% for 8 weeks, then 60% for 4 (you adopted a new
   agent tool deliberately) → flags once, then re-stabilizes to `.stable`
   at the new level within a few weeks — drift, not permanent nagging about
   a choice you made on purpose.

Case 3 is the behavioral spec that matters: **the app adapts to your new
normal instead of moralizing about it.**
