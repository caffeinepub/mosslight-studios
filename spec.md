# Mosslight Studios

## Current State
The admin dashboard shows an `AdminNotificationsPanel` that fetches notifications using `getUnreadNotifications` — a backend endpoint that requires `#user` permission. The admin logs in via Internet Identity (with a hardcoded principal check via `isAdminCaller`) and does not have the `#user` role, so the query silently fails or errors, causing notifications to show up again on every visit because they are never successfully marked as read.

## Requested Changes (Diff)

### Add
- Backend: `getAdminNotifications` — query func, requires `isAdminCaller`, returns all unread notifications where `notifType` is `#adminAlert` or `#lowInventory`
- Backend: `dismissAdminNotification(id: Text)` — shared func, requires `isAdminCaller`, marks a single notification as read
- Backend: `dismissAllAdminNotifications()` — shared func, requires `isAdminCaller`, marks all admin-type unread notifications as read
- Frontend hook `useAdminNotifications.ts` — uses `getAdminNotifications`, `dismissAdminNotification`, `dismissAllAdminNotifications` backend calls. Does NOT require `identity` to be set (admin uses II principal). Enabled when `actor` is available.
- "Dismiss All" button in `AdminNotificationsPanel`
- Each notification row gets a checkbox/check button to dismiss individually

### Modify
- `AdminNotificationsPanel.tsx` — switch from `useGetUnreadNotifications` / `useMarkNotificationAsRead` to the new admin-specific hooks. Add "Dismiss All" button in the card header. Add `data-ocid` markers.
- Low-inventory and adminAlert notifications should be sent to `HARD_CODED_ADMIN_PRINCIPAL` (not to all user profiles) so they appear only for the admin.

### Remove
- `AdminNotificationsPanel` no longer imports or uses `useGetUnreadNotifications` or `useMarkNotificationAsRead`

## Implementation Plan
1. Update `main.mo`: add `getAdminNotifications`, `dismissAdminNotification`, `dismissAllAdminNotifications` endpoints using `isAdminCaller`. Fix `sendLowInventoryNotifications` and `sendAdminBroadcastAlert` to send notifications to `HARD_CODED_ADMIN_PRINCIPAL` instead of all user profiles.
2. Add `src/frontend/src/hooks/useAdminNotifications.ts` — React Query hooks wrapping the three new backend calls, enabled based only on `!!actor`.
3. Rewrite `AdminNotificationsPanel.tsx` to use new hooks, add "Dismiss All" button and individual dismiss checkmarks.
