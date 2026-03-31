# Mosslight Studios

## Current State
The site has a main page with Shop Collection, View Gallery, and Newsletter buttons. There is a footer and an order confirmation/thank you page after checkout. The newsletter button links to an external Google Form.

## Requested Changes (Diff)

### Add
- A "Share Your Feedback" button on the order confirmation/thank you page linking to https://forms.gle/iHpYScSV2sfthoPb8 (opens in new tab)
- A subtle customer survey button/link in the footer (present on every page) linking to https://forms.gle/iHpYScSV2sfthoPb8 (opens in new tab)

### Modify
- Footer component: add survey link
- Order confirmation/thank you page: add feedback button after order details

### Remove
- Nothing removed

## Implementation Plan
1. Find the footer component and add a "Customer Survey" or "Share Your Feedback" link
2. Find the order confirmation/thank you page component and add a feedback button after the order summary
3. Both links open https://forms.gle/iHpYScSV2sfthoPb8 in a new tab
