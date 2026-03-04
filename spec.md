# Mosslight Studios

## Current State
Full-stack art portfolio and merchandise store with:
- Product management with variants, colors, sizes, SKU, tax, and shipping
- Order management with cart, checkout, and order tracking
- Admin portal (passcode + hardcoded principal auth)
- Portfolio, Gallery, Blog sections with public comments
- Discussion forum, FAQ, About page
- Analytics dashboard, notifications, product reviews
- Stripe payments

## Requested Changes (Diff)

### Add
- Commission data types in backend: `CommissionAddon` (name, price), `Commission` (id, title, description, basePrice, openSpots, totalSpots, addons, createdAt), `CommissionRequest` (id, commissionId, commissionTitle, name, discordUsername, phoneNumber, email, description, selectedAddons, totalPrice, referenceImages, status, createdAt)
- Commission status type: `#pending`, `#accepted`, `#inProgress`, `#completed`, `#rejected`
- Backend functions: `addCommission`, `updateCommission`, `deleteCommission`, `getCommissions`, `getCommission`, `submitCommissionRequest`, `getCommissionRequests` (admin), `updateCommissionRequestStatus` (admin - adjusts openSpots: accepting fills a spot, completing releases a spot)
- Frontend page: `/commissions` — public-facing commission listing with each commission showing title, description, base price, open spots, addons list, and a "Request This Commission" button
- Frontend page: `/commissions/$id` — commission detail + request submission form (name, Discord, phone, email, description, addon checkboxes with live price total, reference image uploads)
- Frontend admin page: `/admin/commissions` — add/edit/delete commissions with addon manager (like VariantManager), view all requests, change request status (accept/reject/in-progress/complete)
- Navigation: Add "Commissions" link to header nav and admin dashboard
- Routes in App.tsx for all new pages

### Modify
- `App.tsx`: Add commission routes and admin commission route
- `AdminDashboardPage.tsx`: Add Commissions card linking to `/admin/commissions`
- `Header.tsx` / nav: Add Commissions link in public nav

### Remove
- Nothing removed

## Implementation Plan
1. Add Commission and CommissionRequest types + CRUD functions to `main.mo` backend
2. Create frontend pages: `CommissionsPage.tsx`, `CommissionDetailPage.tsx`, `AdminCommissionsPage.tsx`
3. Create `CommissionForm.tsx` admin form component with addon manager
4. Create `CommissionRequestForm.tsx` customer-facing request form with image uploads and live price calc
5. Wire routes in `App.tsx`
6. Add Commissions nav link in `Header.tsx`
7. Add Commissions card in `AdminDashboardPage.tsx`
