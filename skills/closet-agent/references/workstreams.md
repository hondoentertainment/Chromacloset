# Chromacloset Workstreams

Use this reference when routing work to one or more sub-agents.

## 1) Scan agent

**Primary files**
- `components/ScanModule.tsx`
- `services/scanReviewService.ts`
- `services/geminiService.ts`
- `types.ts`

**Owns**
- upload/live capture
- review ordering
- editable metadata
- retry/error messaging
- scan-related analytics

**Typical validation**
- scan save path
- scan failure path
- `scan_started`, `scan_failed`, `scan_completed`, `scan_item_edited`

## 2) Stylist agent

**Primary files**
- `components/StylistModule.tsx`
- `services/stylistService.ts`
- `services/stylistLogic.ts`
- `services/personalizationService.ts`
- `services/agentEvaluationFixtures.ts`

**Owns**
- outfit generation
- fallback logic
- reranking/personalization
- wardrobe gaps
- stylist chat

**Typical validation**
- valid outfit composition
- duplicate suppression
- save/usefulness feedback paths

## 3) Data agent

**Primary files**
- `contexts/ClosetContext.tsx`
- `services/analyticsService.ts`
- `services/storageService.ts`
- `services/runtimeConfig.ts`
- `services/aiConfig.ts`
- `types.ts`

**Owns**
- shared state shape
- storage schema
- analytics contracts
- environment/runtime toggles

**Typical validation**
- payload compatibility
- persistence round-trip
- schema version coverage

## 4) Insights agent

**Primary files**
- `components/Dashboard.tsx`
- `components/ColorExplorer.tsx`
- `components/InternalToolsPanel.tsx`
- `services/productionReadinessService.ts`

**Owns**
- closet KPIs
- dashboard cards
- color insights
- internal visibility panels

**Typical validation**
- empty/loading/error states
- insight rationale copy
- metrics consistency with shared state

## 5) Release agent

**Primary files**
- `tests/services/*`
- `QA_SMOKE_CHECKLIST.md`
- `docs/RELEASE_CHECKLIST.md`
- `.github/workflows/ci.yml`
- `README.md`

**Owns**
- regression tests
- manual smoke guidance
- release gates
- CI alignment

**Typical validation**
- impacted tests updated
- docs reflect new flow
- commands in CI still match repo scripts

## Coordination notes

- If a task spans `ScanModule.tsx` and `analyticsService.ts`, use scan + data lanes.
- If a task spans `StylistModule.tsx` and `Dashboard.tsx`, use stylist + insights lanes.
- If a task changes behavior visible to users, pull in release lane for checklist/test updates.
- Keep `types.ts` and shared analytics payload definitions as merge points, not parallel edit zones.
