# Napoleon — Intelligence Roadmap

**Status:** Draft / in progress
**Anchor:** Tier 1 (service integrity) + Tier 4 (economics & ROI)
**Principle:** integrity generates the money; ROI closes renewals. Everything else stacks on top.

---

## Where we are today

Napoleon is a **deterministic rules engine** with a correctly-designed data spine:

- `baselines` — per-site "normal" for 3 metrics (LATE_COUNT, INCIDENT_COUNT, PATROL_DURATION_MS)
- `napoleon` — aggregation, scoring, insights (weighted sums, not learned)
- `alerts` — 3 hardcoded rules (INCIDENT_SURGE, CRITICAL_INCIDENT, ANOMALY) + the label loop

It is **not a model yet**. The valuable, future-proof part is the label → AlertLog → training-data pipeline.

## The constraint that drives everything

At ~2 sites / 30 days / a handful of labels, **no supervised model generalises**. So:

1. Unsupervised + statistical first (needs no labels)
2. Accumulate labels via the operator loop
3. Supervised only when label volume justifies it

---

## Guiding principles

1. **Data-first, model-later.** Collect before you model.
2. **Cheap wins first.** Derivable-from-existing-data beats new sensors.
3. **Rules are guardrails, not bugs.** `CRITICAL_INCIDENT` always pages instantly.
4. **The label loop is the moat.** Outcome capture is a first-class deliverable.
5. **Explainable or it doesn't ship.** Security ops won't act on a black box.
6. **Supervised models are gated** on label volume.

---

## Phase overview

| Phase | Focus | Sellable output | New data required |
|---|---|---|---|
| **0** | Foundations & instrumentation | (internal) | fields + breadcrumbs + roster |
| **1** | **Service integrity** (anchor) | Integrity dashboard + margin-recovery report | from P0 |
| **2** | Risk perception | Predictive risk dashboard | external context |
| **3** | Prevention & allocation | Optimisation engine | risk surface from P2 |
| **4** | **Economics & ROI** (anchor) | Client-value / loss-prevented reporting | loss values + commercial data |
| **5** | Strategy & learned models | Expansion/portfolio intelligence | label volume + more sites |

---

## Phase 0 — Foundations & instrumentation

### 0a — Cheap wins (this increment)

Additive fields that unlock the most for the least risk:

| Field | Unlocks |
|---|---|
| `Incident.lossValue` (NGN) | Loss-prevented ROI — the Tier 4 selling point |
| `Incident.firstResponseAt`, `resolvedAt` | Response-time baselines, SLA tracking |
| `Incident.rootCause` | Pattern detection beyond incident type |
| `Attendance.deviceId`, `mockGpsFlag` | Buddy-clocking / attendance fraud — Tier 1 |

### 0b — Heavier foundations

- Continuous GPS breadcrumbs per shift (new high-volume table)
- Planned roster as a source of truth (needed for billing reconciliation + coverage gaps)
- Label-loop v2: incident outcome + operator action taken
- Evaluation harness: replay historical days, precision@k, PR-AUC, calibration
- NDPR compliance: consent, retention, purpose limitation for location + biometrics

**Exit:** breadcrumbs flowing, fields populated, harness producing numbers.

---

## Phase 1 — Service integrity (anchor #1)

- Ghost-guard / post-abandonment detection (dwell outside geofence while "checked in")
- Patrol fidelity (checkpoint timing, impossible-travel, trustworthy scan photos)
- Attendance fraud / buddy-clocking (device fingerprint + mock-GPS + biometric + collusion graph)
- **Billing reconciliation** — billed vs deployed guard-hours → direct margin recovery

**Exit:** can state per site per month "you paid for X hours, received Y, recovered ₦Z".

## Phase 2 — Risk perception

- Fix the statistics: incident counts are Poisson, not Gaussian; robust location/scale; per-weekday baselines; EWMA drift
- Dynamic site risk score (retire static `riskLevel`)
- Time-of-day / day-of-week forecasts with prediction intervals
- Guard attrition / failure prediction
- Coverage-gap risk (risk vs who is actually rostered)
- External context: weather, darkness, **power/grid status**, local crime feed, event calendar

## Phase 3 — Prevention & allocation

- Optimal patrol routing + shift timing vs peak-risk hours
- Dynamic guard reallocation across sites
- Staffing-to-risk matching
- Intervention effectiveness (causal, not correlational)

## Phase 4 — Economics & ROI (anchor #2)

- True cost-to-serve / profitability per site, client, guard
- **Loss-prevented valuation in NGN**
- **Churn prediction** — biggest revenue lever
- Price-to-risk optimisation
- Insurance underwriting angle — risk score as a new revenue line

## Phase 5 — Strategy & learned models

- Grow/exit decisions by client, site, sector
- Training-ROI quantification
- Geographic expansion signals
- **Supervised & deep models** — only once label volume justifies them

---

## Cross-cutting workstreams

| Workstream | Purpose |
|---|---|
| Rules + model hybrid | rules as guardrails, model as brain |
| Model registry / versioning / drift | know when it rots |
| Human-in-the-loop feedback | every operator action is a label |
| Privacy & compliance | NDPR, consent, retention |
| Evaluation harness | the honesty layer |

## Sequencing

```
P0 ──┬── P1 (integrity anchor) ──┐
     └── P2 (risk perception) ───┴── P4 (economics anchor)
                        │
                        └── P3 (prevention) ── P5 (strategy + learned models)
```

## Success metrics

- **P0:** harness live; fields populating
- **P1:** NGN recovered via reconciliation; fraud cases surfaced
- **P2:** precision@k on labelled alerts; forecast interval coverage
- **P3:** measured incident reduction post-intervention
- **P4:** churn predicted ahead of renewal; loss-prevented quantified
- **P5:** supervised model beats the rule baseline on PR-AUC

## Honest risks

- **Data volume** — P2+ predictive claims are best-effort at 2 sites
- **Roster source** — billing reconciliation stalls if planned shifts never become structured data
- **Label scarcity** — P5 is years-not-weeks unless labelling volume is driven deliberately
- **Compliance** — tracking-heavy phases must clear NDPR before deployment
