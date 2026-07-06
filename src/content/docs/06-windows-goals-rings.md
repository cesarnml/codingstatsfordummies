---
title: "06 — Windows, Goals & Rings"
description: The core fitness feature — preferred coding windows, daily and weekly goals, rest days, and the Apple-style activity rings that visualize them.
---

> Goal: implement the `GoalEngine` — the pure functions that turn sessions +
> settings into ring progress, window adherence, and streaks — and the
> SwiftUI rings that render it.

---

## The settings model: what the user declares

Apple Fitness asks "how many calories do you want to burn?" We ask four
questions, stored in `GoalConfig` ([Chapter 05](/05-ios-companion-architecture/)):

1. **Daily goal** — minutes of coding per *working* day (e.g. 240).
2. **Weekly goal** — minutes per week (e.g. 1500). Deliberately *not*
   `daily × 5`: many people run uneven days, and the weekly ring is the
   forgiving one.
3. **Preferred window** — the hours you *want* to code, e.g. 09:00–18:00.
   Coding outside it isn't cheating — it's data. The window gauge measures
   discipline of schedule, not volume.
4. **Rest days** — weekdays with **zero expectation** (default Sat/Sun).
   Crucial inversion: on rest days the app doesn't just skip the goal — it
   treats *not coding* as the success state ([Chapter 07](/07-burnout-signals/)
   scores rest-day coding as a burnout signal).

🗣️ **In plain English.** You tell the app: how much per day, how much per
week, which hours you prefer to work, and which days you don't work at all.
Everything else is arithmetic on those four answers.

---

## The GoalEngine: pure functions over sessions

All computation lives in a stateless engine — trivially unit-testable,
`(sessions, config, calendar) in → numbers out`:

```swift
struct GoalEngine {
    let config: GoalConfig
    let calendar: Calendar          // injected — the user's tz, not UTC!

    struct DayVerdict {
        let codedSeconds: Double
        let goalSeconds: Double
        let isRestDay: Bool
        var ringProgress: Double { goalSeconds > 0 ? codedSeconds / goalSeconds : 0 }
        var goalMet: Bool { isRestDay ? codedSeconds == 0 : codedSeconds >= goalSeconds }
    }

    func verdict(for day: DateOnly, sessions: [SessionRecord]) -> DayVerdict { … }
    func weekProgress(for week: [DayVerdict]) -> Double { … }
    func windowAdherence(sessions: [SessionRecord]) -> Double { … }
    func currentStreak(days: [DayVerdict]) -> Int { … }
}
```

### Window adherence: the one genuinely tricky computation

"What fraction of today's coding fell inside 09:00–18:00?" Sessions are
`(start, duration)` pairs and **can straddle the window edges** — an
08:45–09:20 session is 15 min outside + 20 min inside. Interval
intersection, in minutes-since-midnight space:

```swift
func secondsInsideWindow(_ s: SessionRecord) -> Double {
    let startMin = minutesSinceMidnight(s.start, calendar)          // e.g. 525 for 08:45
    let endMin   = startMin + s.seconds / 60
    let overlap  = max(0, min(endMin, Double(config.windowEndMinute))
                        - max(startMin, Double(config.windowStartMinute)))
    return overlap * 60
}
// adherence = Σ secondsInsideWindow / Σ seconds
```

⚠️ **Three edge cases to test before you trust it** (they're all real in
WakaTime data):
- Sessions **spanning midnight** — split at the day boundary first, or your
  "which day" attribution silently disagrees with WakaTime's.
- **Overnight windows** (a night owl sets 20:00–02:00, end < start) — the
  window itself wraps; the intersection needs two segments.
- **DST transition days** — a day can be 23 or 25 hours; only `Calendar`
  math survives, never `date + 86400`.

### Streaks, the humane version

A streak counts consecutive *successful* days — where rest days count as
successful when you *actually rested* (and don't break the streak either way
if you'd rather be lenient; the challenge in [Chapter 11](/11-challenges/)
makes you pick and defend a policy). One free-tier lesson from every fitness
app: streaks motivate until they tyrannize. Cap displayed streak celebration
at milestones (7, 30, 100) rather than pushing daily anxiety.

🗣️ **In plain English.** The engine answers: how full is today's ring, how
full is the week's ring, what share of your coding happened inside your
preferred hours (counting partial overlaps fairly), and how many days in a
row you've hit your target — with days off counting in your favor, not
against you.

---

## Rendering rings in SwiftUI

The Apple-Health look is ~30 lines — a trimmed circle plus overshoot lap:

```swift
struct ActivityRing: View {
    let progress: Double            // 1.3 = 130% — overshoot laps like Apple's
    let color: Color
    var lineWidth: CGFloat = 14

    var body: some View {
        ZStack {
            Circle().stroke(color.opacity(0.18), lineWidth: lineWidth)
            Circle()
                .trim(from: 0, to: min(progress, 1))
                .stroke(color, style: .init(lineWidth: lineWidth, lineCap: .round))
                .rotationEffect(.degrees(-90))
            if progress > 1 {       // second lap, slightly inset — the Apple overshoot cue
                Circle()
                    .trim(from: 0, to: progress - 1)
                    .stroke(color.opacity(0.85),
                            style: .init(lineWidth: lineWidth * 0.6, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .padding(lineWidth * 0.9)
            }
        }
        .animation(.spring(duration: 0.8), value: progress)
    }
}
```

The Today screen composes three of them — daily (green), weekly (indigo),
window adherence (amber) — nested like Apple's Move/Exercise/Stand:

```swift
ZStack {
    ActivityRing(progress: day.ringProgress,  color: .green)
    ActivityRing(progress: weekProgress,      color: .indigo).padding(22)
    ActivityRing(progress: windowAdherence,   color: .orange).padding(44)
}
```

On **rest days**, don't render a guilt-inducing empty ring — swap the center
for a leaf icon and "Rest day 🌱". The state design *is* the product here.

🗣️ **In plain English.** Three nested circles fill up as you code: today,
this week, and "inside my preferred hours." Beat a goal and the ring laps
itself, just like Apple's. On your days off the rings step aside instead of
shaming you.

---

## The week strip and month heatmap

Two more views complete the fitness picture, both straight Swift Charts:

- **Week strip** — seven mini-rings (Mon–Sun) under the hero rings;
  rest days show the leaf. Direct analog of Apple Fitness's weekly dots.
- **Month heatmap** — GitHub-contribution-style grid colored by
  `ringProgress`; rest days hatched, not gray — "planned rest," not
  "no data."

Both read only `[DayVerdict]` — by the time pixels are involved, all
decisions are already made in the engine. Views stay dumb.

---

## Notifications: the gentle nudge

Local notifications ([Chapter 03](/03-swiftui-xcode-primitives/)) driven by
engine output, scheduled at sync time:

- "1h 20m to close today's ring" — only fires *inside* the user's window
  (never nag at 22:00 about a 09:00–18:00 schedule).
- "Weekly goal hit 🎉" — fire-once per week.
- Rest-day silence is a **feature**: schedule *nothing* on rest days.

🗣️ **In plain English.** The app reminds you to code only during the hours
you said you like to code, celebrates when the week is done, and goes
completely quiet on your days off.

---

## Prove it to yourself

Unit-test the engine before touching any UI — fixtures, no simulator:

```swift
@Test func sessionStraddlingWindowStartIsSplitCorrectly() {
    let cfg = GoalConfig.fixture(windowStart: 9 * 60, windowEnd: 18 * 60)
    let s = SessionRecord.fixture(start: "08:45", minutes: 35)   // 15 out, 20 in
    #expect(GoalEngine(config: cfg, calendar: .fixtureDenver)
        .secondsInsideWindow(s) == 20 * 60)
}
```

Write the midnight-straddle and DST cases too. If those three pass, the
hardest math in the entire app is behind you.
