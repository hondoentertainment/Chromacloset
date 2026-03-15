# Chromacloset Product Requirements Document (PRD)

## 1. Product Overview

### 1.1 Product Name
Chromacloset

### 1.2 Product Vision
Chromacloset is an AI-powered wardrobe intelligence experience that transforms a user’s closet into a structured, color-aware digital inventory and turns that inventory into actionable outfit recommendations, style guidance, and gap analysis.

### 1.3 Problem Statement
People often own many clothing items but struggle to:
- See the full contents of their wardrobe in one place.
- Understand their true color distribution and style balance.
- Build outfits quickly for specific occasions.
- Identify strategic purchases that improve versatility.

Most closet apps depend on slow manual item entry, resulting in poor adoption and stale inventories.

### 1.4 Product Goals
- Enable fast wardrobe digitization with camera-based, AI-assisted item detection.
- Provide reliable color-centric wardrobe insights.
- Offer practical outfit recommendations tied to occasion, weather, and personal style persona.
- Keep data local-first and frictionless for casual users.

### 1.5 Non-Goals (Current Scope)
- No social sharing or community feed.
- No e-commerce checkout flow.
- No calendar-level outfit planning automation.
- No multi-user collaboration in a single closet.

---

## 2. Target Users

### 2.1 Primary Personas
1. **Busy Professional**
   - Needs quick outfit decisions for work and events.
   - Values polished recommendations with minimal effort.

2. **Style Explorer**
   - Wants to understand color pairings and try new combinations.
   - Uses the app as a creativity tool.

3. **Wardrobe Optimizer**
   - Focuses on reducing waste and buying intentionally.
   - Wants actionable “what’s missing” insights.

### 2.2 User Needs
- Fast capture of existing closet contents.
- Accurate color naming and color-family grouping.
- Easy browsing by category and visual identity.
- AI outfit recommendations grounded in owned items.
- Lightweight, chat-style style advice.

---

## 3. Core User Experience

### 3.1 Primary Navigation
The product is organized into four primary tabs:
- **Home (Dashboard):** Inventory overview, scan history, KPIs, and closet identity.
- **Scan:** Camera/photo ingestion and AI-based closet analysis.
- **Colors (Explorer):** Color intelligence, palette exploration, and discovery.
- **Stylist:** Outfit generation, lookbook management, and AI consultation.

### 3.2 End-to-End Happy Path
1. User opens app and lands on an empty-state dashboard.
2. User navigates to Scan and uploads/captures a closet image.
3. Gemini returns detected clothing/accessory items with metadata + bounding boxes.
4. App stores parsed items in local storage, updates lifetime scan metrics, and logs scan record.
5. User reviews inventory on Dashboard and color composition in Colors tab.
6. User opens Stylist, selects occasion/persona/weather, and generates outfit recommendations.
7. User saves favorite outfits and asks follow-up style questions via in-app consultant chat.

---

## 4. Functional Requirements

### 4.1 Closet Scanning & Item Extraction
- FR-1: The app must accept a closet image as input.
- FR-2: The AI analysis service must detect **every distinct** clothing item/accessory visible.
- FR-3: Each detected item must include:
  - category (top, bottom, outerwear, shoes, accessories)
  - subcategory
  - brand (or Unknown)
  - dominant color hex
  - color name
  - color family
  - pattern type (solid/striped/plaid/floral/other)
  - confidence score
  - normalized bounding box
- FR-4: The app must create normalized item records with stable local IDs and timestamps.
- FR-5: The app must append new scans to scan history and cap retained history to recent entries (current implementation target: 20).

### 4.2 Inventory & Persistence
- FR-6: Item inventory must persist locally across sessions.
- FR-7: Scan history and lifetime scanned count must persist locally.
- FR-8: The app must support deleting a single scan and removing all items associated with that scan.
- FR-9: The app must provide “Reset Entire Closet” to clear all inventory and brand identity state.

### 4.3 Dashboard
- FR-10: Dashboard must display closet metrics (e.g., scanned totals, inventory summaries).
- FR-11: Dashboard must render visual cards for items and recent scan records.
- FR-12: Dashboard must allow setting/updating a global closet icon (brand identity image).

### 4.4 Color Explorer
- FR-13: Explorer must visualize wardrobe colors and support browsing by color characteristics.
- FR-14: Explorer must derive insights from item-level color metadata.
- FR-15: Explorer should help users identify overrepresented and underrepresented color families.

### 4.5 AI Stylist & Lookbook
- FR-16: Stylist must generate outfit recommendations from the user’s owned items.
- FR-17: Outfit generation inputs must include occasion and persona, with optional weather context.
- FR-18: Outfit output must include title, description, stylist tip, associated item IDs, occasion, and vibe.
- FR-19: Users must be able to save and unsave outfits to a Lookbook view.
- FR-20: Users must be able to annotate or track lightweight outfit metadata (e.g., notes, wear status) when supported.

### 4.6 Conversational Styling Assistant
- FR-21: Users must be able to ask freeform style questions in a chat interface.
- FR-22: Assistant responses must be grounded in wardrobe context and selected style persona.
- FR-23: Chat panel must support multi-turn context within an active session.

### 4.7 QR Data Support (Foundation Capability)
- FR-24: The system should support extracting apparel metadata from a QR code image where available.
- FR-25: Extracted QR metadata should map into the same wardrobe item schema.

---

## 5. Non-Functional Requirements

### 5.1 Performance
- NFR-1: Initial app interaction should feel instantaneous on modern devices (local-first rendering).
- NFR-2: AI operations should present clear loading feedback for asynchronous calls.

### 5.2 Reliability & Data Integrity
- NFR-3: App must fail safely when AI responses are malformed or unavailable.
- NFR-4: Local storage parsing/writes must be wrapped with error tolerance to avoid app crashes.

### 5.3 Privacy & Security
- NFR-5: Wardrobe data should remain client-local by default unless external AI inference is explicitly invoked.
- NFR-6: API keys must be supplied via environment configuration and never hard-coded.

### 5.4 Accessibility & UX Quality
- NFR-7: Primary interactions must be operable on mobile and desktop viewports.
- NFR-8: Navigation state and major actions should be visually clear and recoverable.

---

## 6. Success Metrics

### 6.1 Activation
- % of new users who complete first scan within first session.
- Median time from first launch to first successful item ingestion.

### 6.2 Engagement
- Weekly active users who generate at least one outfit.
- Average number of saved lookbook entries per active user.
- Chat consultations per active stylist session.

### 6.3 Retention / Value Realization
- Return rate of users with at least one prior scan.
- % of users performing a second scan within 14 days.
- % of users revisiting Colors/Stylist tabs after first scan.

### 6.4 Quality
- User-reported perceived scan accuracy.
- Manual correction rate (future edit feature) as a proxy for extraction quality.

---

## 7. Analytics & Instrumentation Plan

Track the following events:
- `app_opened`
- `tab_switched` (target tab)
- `scan_started`
- `scan_completed` (items_detected, latency_bucket)
- `scan_deleted`
- `closet_reset`
- `outfits_requested` (occasion, persona, weather_present)
- `outfits_generated` (count)
- `outfit_saved` / `outfit_unsaved`
- `stylist_chat_opened`
- `stylist_chat_message_sent`

---

## 8. Risks & Mitigations

1. **AI extraction inconsistency across image quality**
   - Mitigation: Encourage capture guidance, show confidence values, and support future item editing.

2. **Latency variability from AI calls**
   - Mitigation: Progressive loading states, retries where safe, and clear failure messages.

3. **Local storage limits for heavy image usage**
   - Mitigation: Keep lightweight metadata records and control scan-history depth.

4. **User trust in recommendations**
   - Mitigation: Explain rationale (stylist tip + color logic), allow persona tuning, and conversational Q&A.

---

## 9. Roadmap (Phased)

### Phase 1 (Current Foundation)
- AI scan to structured closet inventory.
- Dashboard + scan history + reset workflows.
- Color exploration basics.
- Stylist outfit generation and lookbook save flow.
- Brand icon generation support.

### Phase 2 (Quality & Control)
- Manual edit and correction for detected items.
- Batch item tagging and filtering.
- Improved confidence/error handling UI.
- Expanded analytics instrumentation.

### Phase 3 (Personalization & Ecosystem)
- Smart outfit planning calendar.
- Intentional shopping recommendations based on gap analysis.
- Optional cloud sync and multi-device continuity.

---

## 10. Open Questions

1. Should outfit recommendations enforce strict category composition rules (e.g., exactly one top + one bottom + optional outerwear)?
2. Do we want deterministic recommendation reproducibility for the same input + persona?
3. What retention period should scan history use beyond the current practical cap?
4. Should QR extraction be exposed in UI now or remain service-level until validated?
5. What level of manual override should users get for AI-generated color names/families?

---

## 11. Technical Notes (Implementation Alignment)

- Front-end stack: React + TypeScript + Vite.
- AI provider integration: Google GenAI models for vision, text, and image generation.
- Local state + storage keys include closet items, scans, total scanned count, and brand icon.
- Environment requires API key configuration prior to AI workflows.

