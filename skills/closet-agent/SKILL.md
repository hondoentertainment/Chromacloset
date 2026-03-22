---
name: closet-agent
description: Use this skill when working on Chromacloset features or fixes that benefit from coordinated sub-agents across scan ingestion, stylist logic, analytics/state, dashboard insights, and release validation.
---

# Closet Agent

Use this skill for feature work in this repo when the task spans multiple surfaces or when the user explicitly asks for multiple agents.

## What this skill does

It turns a single implementation request into a small set of coordinated workstreams:

1. **Scan agent** — intake, review, corrections, camera/upload UX.
2. **Stylist agent** — outfit generation, personalization, gap analysis, chat.
3. **Data agent** — closet state, persistence, analytics contracts, runtime config.
4. **Insights agent** — dashboard, colors, internal tools, product-facing metrics.
5. **Release agent** — tests, smoke checklist, release docs, CI impact.

Use only the lanes needed for the task. Prefer the smallest set that covers the change.

## Quick workflow

1. Read the user request and map it to one or more workstreams.
2. Open `references/workstreams.md` and load only the sections you need.
3. Build a plan that names the active lanes.
4. When tasks are independent, work them in parallel.
5. Reconcile shared types/contracts before final validation.
6. Run the repo checks listed in the validation section below.

## Lane selection guide

- **Scan-first tasks**: scanning, review ordering, edit flows, capture/retry UX.
- **Stylist-first tasks**: recommendation quality, outfit ranking, chat, wardrobe gaps.
- **Data-first tasks**: analytics events, local storage, context/provider state, runtime flags.
- **Insights-first tasks**: dashboard cards, color metrics, internal readouts.
- **Release-first tasks**: tests, QA checklist, changelog/release docs, CI.

## Multi-agent execution rules

- Split work only when file ownership is mostly independent.
- Rejoin before editing shared contracts like `types.ts`, analytics payloads, and context APIs.
- If a task touches both product UX and service logic, keep one lane on UI and one on service/test work.
- If the roadmap is ambiguous, prefer items in `FEATURE_ROADMAP.md` marked P0 or listed in the “Now” section.

## Validation

Run the smallest useful set, usually:

- `npm run test:unit`
- `npm run typecheck`
- `npm run build`

For flow-specific changes, also consult `QA_SMOKE_CHECKLIST.md`.

## Output expectations

- Summarize work by lane in the final response.
- Mention any roadmap item or checklist entry that the change advanced.
- If no inline comments were actually provided by the user, say that clearly and continue with the best repo-grounded implementation.
