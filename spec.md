# Mosslight Studios

## Current State

The app is a full-stack art merchandise store and portfolio platform. It already has:
- Product management (add/edit/delete, variants, SKU, tax, shipping)
- Order management, customer messaging, discussion board
- Portfolio, gallery, blog with public comments
- Commission system with addons and request management
- Creator Dashboard (drawings tracker, merch pipeline, content bank, idea vault, monthly calendar)
- Admin auth via hardcoded principal + passcode
- Analytics, notifications

## Requested Changes (Diff)

### Add

- **ProductCatalogEntry type** in backend: stores all 14 CSV columns per row (merch_type, item_name, size, total_cost, production_cost, profit_margin, profit_amount, shipping, az_tax_rate, az_tax_total, quarter_sales, quarterly_earnings, yearly_sales, yearly_earnings) plus an auto-generated id, optional linkedProductId (to connect to a live shop product), and createdAt timestamp.
- **Backend APIs**:
  - `bulkUpsertCatalogEntries(entries)` — admin-only, accepts an array of catalog entry input records and replaces the entire catalog (for CSV re-upload)
  - `getCatalogEntries()` — admin-only, returns all catalog entries
  - `getCatalogEntry(id)` — admin-only, returns a single entry
  - `deleteCatalogEntry(id)` — admin-only, deletes a single entry
  - `clearCatalog()` — admin-only, wipes all entries (for fresh re-upload)
- **Frontend: Admin Product Catalog page** (`/admin/catalog`) — admin-only, added as a new card in the Admin Dashboard
  - CSV upload area: user uploads a `.csv` file, frontend parses it client-side, previews row count, then calls `bulkUpsertCatalogEntries` to store all rows
  - Main table view showing: merch_type, item_name, size, total_cost, profit_amount, quarterly_earnings, yearly_earnings
  - Filters at top: dropdown filter by merch_type, dropdown filter by size, text search by item_name
  - Sortable columns: item_name, size, profit_amount, quarterly_earnings, yearly_earnings (click column header to sort asc/desc)
  - Each row links to a Design Detail page
- **Frontend: Design Detail page** (`/admin/catalog/$itemName`) — admin-only
  - Shows all variants of a single item_name grouped together
  - Displays: all sizes available, all merch types available, profit_amount, total_cost, quarterly_earnings, yearly_earnings per row
  - Back button to return to catalog table

### Modify

- **AdminDashboardPage.tsx** — add a new "Product Catalog" card linking to `/admin/catalog`
- **App.tsx** — add routes for `/admin/catalog` and `/admin/catalog/$itemName`

### Remove

Nothing removed.

## Implementation Plan

1. Add `ProductCatalogEntry` and `ProductCatalogEntryInput` types to `main.mo`
2. Add `catalogEntries` map and `catalogIdCounter` state to backend
3. Implement `bulkUpsertCatalogEntries`, `getCatalogEntries`, `getCatalogEntry`, `deleteCatalogEntry`, `clearCatalog` — all admin-gated
4. Regenerate `backend.d.ts` bindings
5. Create `AdminProductCatalogPage.tsx`:
   - CSV file input using `papaparse` (or manual parsing) to parse the uploaded file
   - Preview parsed rows, call `bulkUpsertCatalogEntries` on confirm
   - Filtered/sortable table with column headers and filter controls
   - Row click navigates to design detail page
6. Create `AdminCatalogDetailPage.tsx`:
   - Accepts `$itemName` as route param
   - Fetches all catalog entries, filters by item_name
   - Displays a detail table with all columns
7. Add routes in `App.tsx`
8. Add card in `AdminDashboardPage.tsx`
