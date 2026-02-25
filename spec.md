# Specification

## Summary
**Goal:** Fix all currency handling across the stack so prices are always stored, transmitted, and displayed in USD dollars with no conversion to cents, pence, or GBP.

**Planned changes:**
- Remove any dollars-to-cents or USD-to-GBP conversion logic in the `ProductForm` so prices are submitted as-is in USD dollars.
- Remove or bypass any currency conversion utility/helper functions used in cart, checkout, and order summary views so item totals are calculated as `price × quantity` in USD.
- Audit and fix the backend product creation and update handlers to store prices exactly as submitted, removing any multiplication by 100 or exchange-rate conversion.

**User-visible outcome:** Products uploaded with a price of $25.00 are stored and displayed as $25.00 throughout the app. Cart line totals, checkout summaries, and order views all show correct USD dollar amounts with no pound symbols or cent values appearing anywhere.
