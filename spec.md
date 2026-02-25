# Specification

## Summary
**Goal:** Restore all currency displays throughout the frontend from British Pounds (£) back to US Dollars ($).

**Planned changes:**
- Replace all `£` symbols and GBP formatting with `$` (USD) across the frontend
- Update currency formatting to use `en-US` locale (e.g., `$1,234.56`) on product prices, cart totals, checkout summaries, order totals, and admin analytics revenue figures

**User-visible outcome:** Every monetary value shown in the app — product prices, cart, checkout, orders, and analytics — displays in USD (`$`) with no `£` symbols remaining.
