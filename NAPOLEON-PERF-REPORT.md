# Napoleon — How It's Testing and How It's Performing

**Date:** 23 September 2026
**What this covers:** Napoleon — the part of BastionOS that analyses operations and raises alerts.

---

## What Napoleon is, in plain terms

Napoleon looks at day-to-day security data — guard check-ins, incidents, and patrols — and answers three questions:

1. **What is "normal" for this site?** (called a *baseline*)
2. **How unusual is today?** (called a *surprise score* — 0 is normal, 1 is very unusual)
3. **What deserves attention?** (the alert list, sorted by importance)

Everything below is about whether that works, and how fast it runs.

---

## The headline

- **All 9 tests passed.** The analysis works and gives correct answers.
- **We found and fixed 7 problems**, including one that quietly stopped alerts from firing.
- **There are no automatic tests** for this part of the system. Everything was checked by hand.
- **We have not measured speed yet.** We know the weak spots from reading the code, but nobody has timed it.
- **2 problems are still open**, described in section 5.

---

## 1. What we tested, and the result

| Test | Result |
|---|---|
| Logging in as the CEO | Passed |
| Reading a site's "normal" numbers | Passed |
| Checking how unusual different situations are | Passed |
| Raising alerts by reporting incidents | Passed (3 alerts raised) |
| Reading the priority alert list | Passed (correct order) |
| Marking an alert as real or false | Passed |
| Exporting the learning data | Passed |
| Using the alert screen | Passed |
| Re-loading the sample data | Passed |

---

## 2. How accurate the numbers were

For one test site, this is what "normal" looks like:

| What we measured | Average | Typical variation | 95th percentile | Days of data |
|---|---|---|---|---|
| Late check-ins per day | 2.43 | ±0.73 | 3 | 7 |
| Incidents per day | 1.93 | ±1.34 | 4 | 30 |
| Patrol length | ~36 minutes | ±5 minutes | ~43 minutes | 30 |

When we tested how unusual different incident counts were:

| Incidents in a day | Unusual-ness score | Meaning |
|---|---|---|
| 2 | 0.30 | Normal |
| 4 | 0.69 | Somewhat unusual |
| 5 | 0.95 | Unusual |
| 10 | 1.00 | Extremely unusual |

The scores move smoothly and sensibly. The alert list also sorted correctly: a critical incident came first, then the unusual-volume alert, then the surge alert.

---

## 3. Problems we found and fixed

| Problem | What it meant | Fixed? |
|---|---|---|
| A day was being compared partly against itself | Alerts quietly stopped firing after repeated activity | Yes |
| The learning data only contained "real alert" examples | The system could never learn what a *false* alarm looks like | Yes |
| Sample data kept old dates when reloaded | "Normal" was being calculated from six-week-old data | Yes |
| A setup script was missing; some valid reports were rejected | The test plan could not run as written | Yes |
| Alert sensitivity was fixed in the code | Staff could not adjust it without a developer | Yes |
| Alert screen had no paging, notes, or live updates | Awkward to use | Yes |
| No setup instructions for new developers | Slow to get running | Yes |

---

## 4. Problems still open

**Problem 1 — The overview screens use the wrong clock.**
The "normal" numbers correctly use the time an event *actually happened*. But three of the dashboard screens (`overview`, `risk-by-site`, `at-risk-guards`) use the time the record was *entered into the system* instead. If data is ever back-filled or moved, these screens will disagree with each other and with the "normal" figures. This is a correctness issue, not a speed one.

**Problem 2 — Two screens named "surprise" send back different information.**
There are two web addresses called `/surprise`. They return different sets of numbers, which is confusing for anything that uses them. They should be made consistent.

Both are small fixes.

---

## 5. Do we have automatic tests? — No. This is the biggest gap.

Automatic tests are checks that run by themselves and catch mistakes when new code is added.

| What we found | Status |
|---|---|
| A real, useful test file for incidents (9 checks) | Good |
| Two leftover "placeholder" test files that don't check anything real | Not useful |
| Any tests for Napoleon, the "normal" numbers, or alerts | **None** |

**Why this matters:** these three parts are the company's differentiator, and there is **no safety net** if someone changes the code. Every problem listed above was found by hand. Nothing would catch them automatically next time.

---

## 6. Speed and performance — what we know, and what we don't

**We have not timed the system.** No speed testing has been done. What follows comes from reading the code, not from measurements:

- **The app does the maths itself.** The overview screens pull all the raw records into the app and add them up, instead of letting the database do it. This gets slower as history grows.
- **Every incident report triggers a 30-day re-calculation.** So the more history there is, the slower submitting a report becomes.
- **The database has no shortcuts on its busiest lookups.** The most frequently searched tables have no "indexes" — the database's equivalent of a book's index. Without them, it reads through the whole list every time.
- **Some screens load every record before trimming the list.**
- **Nothing is cached.** The same numbers are recalculated from scratch on every request.

None of this is measured yet — it's what a careful reading of the code suggests could be slow.

---

## 7. Other things worth knowing

- Login sessions expire after **15 minutes**, so users sign in often.
- The **live alert pop-up stops working when the session times out.**
- Logging in on **Safari** doesn't work on the local test setup.
- The test database's clock is about **2 days ahead** of the app, which can throw off time-based checks.
- There is **no record of which version of the analysis produced a given result**, and no way to detect if it starts drifting.

---

## 8. What we did NOT test

- Any role other than the CEO (supervisors, guards, HR, clients)
- Whether one company's data is properly kept separate from another's
- The day-to-day workflow (checking in at a site, patrols, incident reports, PDF reports)
- The dashboard summary screens
- Email, file uploads, and phone notifications
- Screens other than Alerts and Napoleon

---

## 9. What we recommend next

1. **Fix the wrong-clock problem** (section 4) — it affects correctness.
2. **Add database shortcuts** on the busiest lookups — quick win, low effort.
3. **Write automatic tests** for the "normal" numbers, the unusual-ness score, and the alert rules.
4. **Actually time the system** so we know where we stand.
5. **Stop re-calculating 30 days of history every time an incident is reported.**
6. Remove the two leftover placeholder test files.

---

## 10. Bottom line

Napoleon **works and gives correct answers** — the analysis behaves properly, and we fixed seven real problems. Its two weak spots are not about the logic: it has **no automatic tests** and **no measured speed**, and three dashboard screens read the wrong clock. All three are fixable quickly, and all three should be closed before we call this production-ready.

---

*One note for transparency: the accuracy figures in section 2 are what we actually measured. Section 6 is what a careful reading of the code suggests — it is not yet measured.*
