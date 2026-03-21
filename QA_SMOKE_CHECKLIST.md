# Chromacloset QA Smoke Checklist

## Purpose
Quick manual verification checklist for core UX and analytics integrity before each release increment.

## Pre-check
- Run `npm run typecheck`
- Run `npm run build`
- Run `npm run dev`

## Core User Flows
1. **App Launch**
   - Open app and confirm no console runtime errors.
   - Verify `app_opened` appears in Analytics Debug Panel.

2. **Navigation Tracking**
   - Switch across Home / Scan / Colors / Stylist tabs.
   - Verify `tab_switched` events with expected `to_tab`.

3. **Scan Flow**
   - Upload or capture a scan.
   - Confirm `scan_started` event.
   - Confirm the review queue surfaces lowest-confidence / incomplete items first.
   - In review mode, edit an item field and confirm `scan_item_edited`.
   - Use **Apply to similar** on at least one editable field.
   - Confirm validation blocks save when subcategory or color name is blank.
   - Save to closet and confirm `scan_completed`.

4. **Scan Error & Retry**
   - Trigger scan failure case (bad image/capture interruption).
   - Confirm retry UI appears and `scan_failed` is logged.

5. **Dashboard Suggested Next Item**
   - Click **Generate** on Suggested Next Item card.
   - Verify `dashboard_gap_suggestion_requested`.
   - Verify either `dashboard_gap_suggestion_generated` or `dashboard_gap_suggestion_failed`.

6. **Stylist Generate**
   - Generate outfits with >=2 inventory items.
   - Add a weather context and confirm suggestions still include top + bottom.
   - Verify `outfits_requested` and `outfits_generated` (or `outfits_generation_failed`).
   - On long-running or failed requests, verify retry/error copy appears.

7. **Stylist Chat**
   - Open chat and send a message.
   - Verify `stylist_chat_opened` and `stylist_chat_message_sent`.
   - On failure path, verify `chat_failed`.

8. **Lookbook Save/Unsave**
   - Save and unsave one outfit.
   - Verify `outfit_saved` and `outfit_unsaved`.

## Data Integrity Checks
- Confirm all events include `schema_version` in payload.
- Confirm no duplicate `scan_completed` event for a single save action.
- Confirm analytics export copy buttons return JSON/CSV payloads from the Debug Panel.

## Exit Criteria
- All flows pass without blocking UI issues.
- Event stream aligns with actions and includes schema versioning.
- Build/typecheck pass locally.
