# Chromacloset Feature Roadmap

## Objective
Turn the current analytics and AI-scanning foundation into a measurable, trustworthy wardrobe assistant with stronger data quality, better recommendation outcomes, and clear retention loops.

---

## North Star (Next 2 Quarters)
- **Primary:** Increase % of users who complete first scan and generate first outfit in the same session.
- **Secondary:** Increase repeat usage via lookbook saves and second-scan retention.

Suggested KPI targets:
- First-scan completion rate: **+20%**
- Outfit generation/session: **+25%**
- 14-day repeat scan rate: **+15%**

---

## Immediate Next Steps (0–2 Weeks)

### 1) Analytics Quality Pass (P0)
**Why now:** Roadmap decisions depend on reliable event data.

Deliverables:
- Keep `scan_completed` emitted only at user-confirmed save (already aligned).
- Add event coverage for non-success states where missing (`scan_failed`, `chat_failed`, `outfits_generation_failed`) with reason buckets.
- Add light event schema/version field (e.g., `schema_version: 1`) to payloads.
- Add QA checklist for validating event writes via Analytics Debug Panel.

Success criteria:
- Event stream can reconstruct top funnels with no duplicate completion events.

### 2) Scan Review Corrections (P0)
**Why now:** Trust and recommendation quality depend on editable scan output.

Deliverables:
- In review screen, allow editing per item:
  - category
  - subcategory
  - color family
  - color name
  - pattern
- Add “apply to similar items” for batch correction (optional stretch).

Success criteria:
- Users can correct at least core metadata before save.

### 3) Error-State UX Hardening (P1)
**Why now:** AI latency/error paths currently reduce completion.

Deliverables:
- Distinct user messages for capture failure vs service failure.
- Retry actions in scan and stylist modules.
- Loading states with timeout fallback copy.

Success criteria:
- Lower abandonment in scan/stylist async operations.

---

## Near-Term Roadmap (2–6 Weeks)

### 4) Recommendation Relevance v1 (P0)
Deliverables:
- Enforce basic outfit composition rules (top + bottom + optional outerwear + optional accessories).
- Add weather-aware filtering by category/material proxy.
- Penalize repetitive outfits from same item sets.

Success criteria:
- Higher outfit save rate and lower “unusable outfit” feedback.

### 5) Closet Insights v1 (P1)
Deliverables:
- “Color balance score” and underrepresented family nudges.
- “Most worn look types” and simple wardrobe diversity metric.
- Dashboard card for “Suggested next item” from gap analysis.

Success criteria:
- Increased visits to Colors/Stylist tabs after first scan.

### 6) Analytics Export + Provider Adapter (P1)
Deliverables:
- Keep local analytics store, add pluggable transport interface.
- Optional provider integration behind env flag.
- Add CSV/JSON export for local QA snapshots.

Success criteria:
- Product metrics available without inspecting local storage manually.

---

## Mid-Term Roadmap (6–12 Weeks)

### 7) Lookbook Utility Upgrade (P1)
Deliverables:
- Last-worn timeline and “wear again” reminders.
- Occasion tags and quick filters.
- Favorite outfit cloning with minor variations.

### 8) Scan Throughput Improvements (P1)
Deliverables:
- Multi-photo scan session support.
- Better duplicate item detection across scans.
- Confidence-aware review ordering (low confidence first).

### 9) Personalization Loop (P2)
Deliverables:
- Feedback buttons on outfits (“great fit”, “not my style”).
- Persona adaptation over time based on saves/unsaves.
- Better prompts for style constraints.

---

## Priority Stack
1. **P0:** Analytics quality, scan corrections, recommendation relevance.
2. **P1:** Error UX hardening, closet insights, lookbook utility, throughput.
3. **P2:** Personalization loop and deeper experimentation.

---

## Proposed Release Plan

### Release A — “Trust & Telemetry” (2 weeks)
- Analytics quality pass
- Scan correction UI (core fields)
- Error-state retries and messaging

### Release B — “Useful Recommendations” (4 weeks)
- Outfit composition constraints
- Weather-aware generation improvements
- Gap-to-dashboard suggestion card

### Release C — “Retention Toolkit” (6+ weeks)
- Lookbook utility upgrade
- Multi-photo scanning and dedupe
- Personalized ranking feedback loop

---


## Immediate Next-Step Backlog (Actionable)

### Sprint 1 (This Week)
1. **Stabilize scan-edit UX**
   - Add field validation before save (non-empty subcategory/color name).
   - Add quick reset-to-AI button per item for edited fields.
   - Persist an `isEdited` flag on corrected items for quality tracking.

2. **Close analytics quality gaps**
   - Add `schema_version` to all analytics payloads.
   - Emit `scan_item_edited` event with edited fields summary.
   - Add a smoke checklist to validate top 10 events in Debug Panel.

3. **Error handling polish**
   - Add retry CTA in scan failure and stylist generation failure states.
   - Add user-facing message mapping from failure reason buckets.

### Sprint 2 (Next Week)
4. **Recommendation relevance rules v1**
   - Enforce composition constraints: top + bottom (+ optional outerwear/accessory).
   - Reject generated outfits with missing linked item IDs.
   - Add simple diversity rule to avoid near-duplicate outfits.

5. **Dashboard insight card v1**
   - Add “Suggested next item” card sourced from wardrobe gaps.
   - Add confidence indicator and rationale snippet for suggestion.

6. **Developer productivity**
   - Add `npm run typecheck` script and run in CI/local checks.
   - Add minimal unit tests for analytics service parser/clear behavior.

### Definition of Ready (for each roadmap task)
- Event names + payload schema specified.
- UI states defined: loading, success, empty, error.
- Acceptance checks documented (happy path + one failure path).

### Definition of Done (for each shipped increment)
- `npm run build` passes.
- Manual smoke path completed for impacted flow.
- Analytics events visible and correct in Debug Panel.
- Short changelog entry added to planning docs.


## Dependencies & Risks

Dependencies:
- Stable AI response schema from Gemini services.
- Consistent item taxonomy for corrections and outfit constraints.
- Defined analytics event contracts across components.

Risks:
- Over-constraining outfit logic can reduce variety.
- Correction UX complexity may increase friction if overdesigned.
- Analytics noise if event naming/schema drifts.

Mitigations:
- Keep rule engine simple first; add controlled experimentation.
- Start with minimal correction fields + fast save.
- Centralize event typing and add dev QA checklist per release.

---

## Team Execution Guidance
- **Weekly cadence:**
  - Week 1: telemetry and correction UI foundations.
  - Week 2: reliability polish + release hardening.
  - Weeks 3–6: relevance and insights.
- **Definition of Done per feature:**
  - UX state coverage (success/loading/error/empty)
  - Analytics events emitted and visible in debug panel
  - Basic regression pass (`npm run build` + manual smoke path)


---

## Roadmap Enhancement: Status, Sequencing, and Ownership

### Current Delivery Snapshot
- ✅ Completed foundation work:
  - Typed analytics service + debug panel
  - Scan review editing and retry/error handling
  - Outfit normalization and relevance guardrails
  - Dashboard “Suggested next item” card
- 🟡 In progress:
  - Hardening tests around analytics helpers and scan edit flows
  - Tightening recommendation quality evaluation criteria
- ⏭️ Next:
  - Provider adapter + export pathways
  - Personalization loop and explicit user feedback signals

### Now / Next / Later View

#### Now (0–2 weeks)
- Stabilize quality gates for shipped roadmap items.
- Add regression checks for:
  - scan correction save path
  - telemetry event integrity
  - outfit normalization constraints
- Ship analytics QA checklist as a tracked artifact in repo docs.

#### Next (2–6 weeks)
- Introduce analytics transport adapter with local+remote dual-write capability.
- Add color-balance and wardrobe-diversity scoring modules.
- Add first A/B experiment framework for recommendation prompt variants.

#### Later (6–12 weeks)
- Build preference learning loop from outfit feedback.
- Add multi-session planning (calendar/daypart suggestions).
- Add optional cross-device sync with conflict resolution.

---

## Milestone Plan (Execution-Level)

| Milestone | Target Window | Scope | Exit Criteria |
|---|---:|---|---|
| M1: Reliability Baseline | Week 1 | Test + telemetry hardening for scan/stylist flows | No duplicate completion events; retry paths validated |
| M2: Recommendation Quality v1 | Weeks 2–3 | Composition constraints + duplicate suppression + weather shaping | Outfit save rate improves vs current baseline |
| M3: Insight Surface Expansion | Weeks 4–5 | Dashboard insight cards + color balance indicators | Higher dashboard-to-stylist clickthrough |
| M4: Analytics Portability | Weeks 6–7 | Provider adapter + export workflow | Event parity between local stream and adapter output |
| M5: Personalization Beta | Weeks 8–10 | Feedback-driven ranking and persona adaptation | Measurable lift in repeat stylist sessions |

---

## Responsibility Matrix (Lightweight)

- **Product/PM**
  - Own KPI definitions, milestone prioritization, release decisions.
- **Frontend**
  - Own scan review UX, dashboard insights, stylist flow UX states.
- **AI/Prompt**
  - Own recommendation prompt quality and relevance tuning.
- **Data/Analytics**
  - Own schema governance, event QA, adapter integration.
- **QA**
  - Own smoke plans for each milestone and regression checklists.

---

## Measurement Expansion (beyond current KPIs)

### Funnel Metrics
- Scan start → review → save completion conversion.
- Dashboard insight interaction rate.
- Stylist request → generated → saved outfit conversion.

### Quality Metrics
- % scanned items marked `isEdited` before save.
- Failure-rate by event reason bucket (`scan_failed`, `chat_failed`, etc.).
- Duplicate outfit suppression rate after normalization.

### Retention Metrics
- 7-day and 14-day return after first successful scan.
- Repeat stylist-session rate per active user.

---

## Implementation Risks (Enhanced)

1. **Overfitting constraints may reduce creativity**
   - Mitigation: keep strict rules minimal and run controlled A/B prompt tests.

2. **Telemetry schema drift across components**
   - Mitigation: central schema ownership + type-checked payload contracts.

3. **Feature accretion in scan review could increase user effort**
   - Mitigation: progressive disclosure (advanced edit controls collapsed by default).

4. **AI latency impacts interactive UX**
   - Mitigation: optimistic UI cues, explicit retries, and fail-soft messaging.

---

## Recommended Next PR Sequence
1. **PR-1:** Add analytics helper tests + scan/stylist smoke checklist doc.
2. **PR-2:** Add composition quality dashboard metrics and instrumentation.
3. **PR-3:** Add adapter interface for analytics transport + local export.
4. **PR-4:** Add first personalization signal capture (`outfit_feedback_given`).

This sequence keeps technical risk low while compounding product insight quality each sprint.
