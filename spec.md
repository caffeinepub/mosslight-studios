# Mosslight Studios

## Current State
The app has an admin dashboard at `/admin-dashboard` with cards for products, orders, messages, gallery, analytics, portfolio, blog, and commissions. A Creator Dashboard exists at `/admin/creator`. No Task Board exists yet.

## Requested Changes (Diff)

### Add
- `Task` type in backend with fields: id, title, date (created), dueDate, priority (#high | #medium | #low), status (#notStarted | #started | #workingOnIt | #finished), createdAt
- Backend CRUD: `addTask`, `updateTask`, `deleteTask`, `getTasks`
- New admin page `/admin/tasks` with Monday.com-style board table
- Task Board card on the main admin dashboard (`/admin-dashboard`)
- Quick-add task form in the Creator Dashboard Today tab

### Modify
- `src/backend/main.mo` — add Task type, counter, map, and CRUD functions
- `src/frontend/src/App.tsx` — register `/admin/tasks` route
- `src/frontend/src/pages/AdminDashboardPage.tsx` — add Task Board card
- `src/frontend/src/pages/AdminCreatorDashboardPage.tsx` — add quick-add task in Today tab

### Remove
- Nothing

## Implementation Plan
1. Add Task type + CRUD to main.mo
2. Create AdminTaskBoardPage.tsx with Monday.com-style columns (Task, Date, Due Date, Priority, Started, Working On It, Finished), sortable by priority and status
3. Register route in App.tsx
4. Add Task Board card to AdminDashboardPage
5. Add quick-add task button/form in Creator Dashboard Today tab
