# Mosslight Studios

## Current State
Full creator ecommerce platform with admin dashboard, product management, orders, commissions, creator dashboard, task board, and timesheet tracker.

## Requested Changes (Diff)

### Add
- Admin Sales Tracker page at `/admin/sales` — shows all orders/sales data for tax purposes and popularity tracking
- Groups sales by customer name and by item name
- Shows tax collected per sale (8.5% rate)
- Shows item popularity (units sold per product)
- New admin dashboard tile linking to the Sales Tracker

### Modify
- App.tsx: add route for `/admin/sales`
- AdminDashboardPage: add Sales Tracker tile

### Remove
- Nothing

## Implementation Plan
1. Add `getSalesReport` backend query that returns orders with product info
2. Create `AdminSalesPage` frontend component with:
   - Summary stats (total revenue, total tax collected, total orders)
   - Table grouped by item name showing units sold, revenue, tax
   - Table grouped by customer name showing their orders and totals
3. Add route and dashboard tile
