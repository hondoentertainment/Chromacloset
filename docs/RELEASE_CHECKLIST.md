# Release & PR Checklist

Use this checklist for roadmap items that touch scan, stylist, analytics, or storage behavior.

## Automated gates
- [ ] `npm run typecheck`
- [ ] `npm run test:unit`
- [ ] `npm run build`
- [ ] Review CI run for the branch and confirm all required checks are green.

## Manual smoke verification
- [ ] Scan flow validates upload and live capture happy paths.
- [ ] Scan retry/error states are visible and `scan_failed` reasons look correct in the debug panel.
- [ ] Scan review edits, reset, and “apply to similar” still behave correctly.
- [ ] Stylist flow generates outfits or surfaces a clear fallback/failure path.
- [ ] Analytics debug export/copy returns JSON and CSV with `schema_version` on each payload.
- [ ] If remote analytics is enabled, verify local vs remote parity counts in the Analytics Debug panel session summary.

## Release notes prep
- [ ] Update README / roadmap docs when workflow, QA expectations, or architecture change.
- [ ] Call out any new analytics schema or AI prompt behavior in the PR description.
- [ ] Attach screenshots only for user-visible UI changes.
