# Mosslight Studios

## Current State
Variants (sizes) for Stickers and Magnets auto-populate via the Quick Fill preset. Each variant has a size, price, and colors. There is no per-variant SKU field. The product-level SKU field exists on the Basic Information card.

## Requested Changes (Diff)

### Add
- `sku` field (optional string) to `ProductVariant` type
- Inline SKU input next to each size in the variant list in `VariantManager` — always visible and editable without entering edit mode
- SKU field also present in the add/edit variant form

### Modify
- `VariantManager.tsx` — add inline SKU `<Input>` in each variant header row and in the add/edit form
- `backendTypes.ts` — add `sku?: string` to `ProductVariant`
- `ProductForm.tsx` — pass `sku` through in `buildVariantsFromPreset` and in `preparedVariants`

### Remove
- Nothing removed

## Implementation Plan
1. Add `sku?: string` to `ProductVariant` in `backendTypes.ts`
2. Update `VariantManager` form state to include `sku`, add SKU input to the add/edit form
3. Add an inline always-visible SKU input in each variant row that calls `onChange` directly
4. Update `ProductForm.buildVariantsFromPreset` to include `sku: ''` placeholder
5. Update `preparedVariants` mapping to carry the `sku` field through to the backend call
