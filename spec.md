# Mosslight Studios

## Current State
The app is a full-stack art portfolio and merchandise store with admin areas for products, orders, messages, gallery, analytics, portfolio, blog, and commissions. The admin dashboard at `/admin-dashboard` lists all admin sections as cards. There is currently no creator dashboard.

## Requested Changes (Diff)

### Add
- **Creator Dashboard** page at `/admin/creator` — admin-only, accessible from the admin dashboard
- **Backend data models and APIs** for:
  - `Drawing` — title, scheduled post date, week label, status fields (POV, BTS, external TL, Procreate TL, edited, posted, merch status)
  - `MerchPipeline` per drawing — sticker, magnet, keychain, tote, print, uploaded, live (booleans)
  - `ContentBankEntry` — URL link + label/note
  - `IdeaVaultEntry` — category (drawing_idea | merch_idea | lore | social_hook), text content
  - `WeeklyBatch` — label (e.g. "Week of Mar 10"), list of drawing IDs, date range
- **Creator Dashboard frontend** with 7 tabs/sections:
  1. **Today's Reminder** — shown as an alert on load: summary of drawings scheduled today, pending checklist items
  2. **Weekly Workflow Board** — columns Tue–Mon; shows drawing cards per day; navigate back/forward through past weeks by week label
  3. **Drawing Batch Tracker** — table of all drawings with checkboxes for POV, BTS, external TL, Procreate TL, edited, posted, merch status; add new drawing button
  4. **Merch Pipeline** — per drawing row: sticker, magnet, keychain, tote, print, uploaded, live checkboxes
  5. **Content Bank** — list of saved links with label/note; add/delete entries
  6. **Idea Vault** — 4 columns: drawing ideas, merch ideas, lore, social hooks; add/delete ideas per category
  7. **Monthly Calendar** — current month default, navigate forward/back; drawing titles shown on their scheduled date; drag a drawing to a new day to update its post date across the whole dashboard
- **Admin dashboard card** linking to `/admin/creator` with a Sparkles/Pencil icon

### Modify
- `AdminDashboardPage.tsx` — add a "Creator Dashboard" card linking to `/admin/creator`
- `App.tsx` — add route for `/admin/creator`

### Remove
- Nothing removed

## Implementation Plan
1. Add backend APIs: CRUD for Drawing, MerchPipeline, ContentBankEntry, IdeaVaultEntry, WeeklyBatch
2. Generate `backend.d.ts` bindings
3. Build `AdminCreatorDashboardPage.tsx` with 7 tabbed sections
4. Update `AdminDashboardPage.tsx` to add the Creator Dashboard card
5. Update `App.tsx` to register the new route
6. Validate and deploy
