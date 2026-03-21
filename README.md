<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1QM8jKwMdH1TzMK1hJ8E1H2BnjfPL0gyB

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`


## Product planning

- See [`PRD.md`](./PRD.md) for requirements and implementation context.
- See [`FEATURE_ROADMAP.md`](./FEATURE_ROADMAP.md) for phased feature roadmap and next steps.
- See [`QA_SMOKE_CHECKLIST.md`](./QA_SMOKE_CHECKLIST.md) for release smoke validation and analytics checks.
- See [`docs/RELEASE_CHECKLIST.md`](./docs/RELEASE_CHECKLIST.md) for the PR/release checklist and required quality gates.
- Set `VITE_ANALYTICS_REMOTE_ENABLED=true` plus `VITE_ANALYTICS_REMOTE_ENDPOINT` to enable remote analytics dual-write and parity checks in the debug panel.
- AI prompt/runtime versions are centralized in `services/aiConfig.ts` and evaluated against fixed fixtures in `services/agentEvaluationFixtures.ts`.
- Preference learning and recommendation reranking now live in `services/personalizationService.ts`.
- Multi-agent production readiness heuristics and dashboard orchestration now live in `services/productionReadinessService.ts`.
- See [`VC_DEFENSIBILITY.md`](./VC_DEFENSIBILITY.md) for competitive review and defensibility strategy.
- See [`VC_PRODUCTION_ROADMAP.md`](./VC_PRODUCTION_ROADMAP.md) for the investor-facing roadmap to make Chromacloset VC- and production-worthy.
- See [`PRODUCTION_NEXT_5_PHASES.md`](./PRODUCTION_NEXT_5_PHASES.md) for the recommended next five phases to turn the current app into a production-grade product.
