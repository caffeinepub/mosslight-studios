# Specification

## Summary
**Goal:** Add size-based pricing to the product variant system, allowing each size to have its own price.

**Planned changes:**
- Add price field to Variant data type in backend
- Update VariantManager component to include price input for each variant
- Display selected variant's price dynamically on ProductDetailPage
- Update cart functionality to use variant-specific pricing
- Show variant prices in cart and order history
- Create migration module to add price field to existing variants

**User-visible outcome:** Admins can set individual prices for each size variant. Customers see size-specific pricing that updates when they select different sizes, and their cart and order history reflect the exact variant prices.
