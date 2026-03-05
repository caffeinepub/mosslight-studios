# Mosslight Studios

## Current State

The app has a Gallery section where the admin can upload photos/videos as `GalleryItem` records (title, description, image, createdAt). The `GalleryGrid` component renders gallery items with a comment section. There is no way to link a gallery item to products in the shop.

Products are stored with full metadata (name, price, images, variants, SKU, categories, etc.) and are accessible via `getProducts()` and `getProduct(productId)`.

The `addGalleryItem` backend function takes `(title, description, image)` — no product tags. The `GalleryItem` type has no `taggedProductIds` field.

## Requested Changes (Diff)

### Add
- `taggedProductIds : [Text]` field to the `GalleryItem` type in the backend
- Updated `addGalleryItem` function signature to accept `taggedProductIds : [Text]` as an additional parameter
- New `updateGalleryItemTags(galleryItemId: Text, taggedProductIds: [Text])` admin function to update tags on existing gallery items
- New `deleteGalleryItem(id: Text)` admin function
- Frontend: product tag selector in `GalleryUploadForm` (admin) — multi-select from existing products by name, stores product IDs
- Frontend: "Shop This Product" button section below each gallery item in `GalleryGrid`, showing all tagged products with their name/thumbnail and a "Shop" button linking to `/products/:id`
- Frontend: support updating tags on existing gallery items from `AdminGalleryManagementPage`

### Modify
- `GalleryItem` type: add `taggedProductIds : [Text]`
- `addGalleryItem` backend: accept `taggedProductIds` parameter and store it
- `GalleryUploadForm`: add a product multi-select input that lets admin search/pick products to tag
- `GalleryGrid`: render "Shop This Product" section below each item when `taggedProductIds.length > 0`, showing product cards with a "Shop" button
- `useAddGalleryItem` hook: pass `taggedProductIds` parameter
- `useGallery.ts`: add `useDeleteGalleryItem` (wired to real backend) and `useUpdateGalleryItemTags` hooks

### Remove
- Nothing removed

## Implementation Plan

1. **Backend**: Add `taggedProductIds : [Text]` to `GalleryItem` type. Update `addGalleryItem` to accept `taggedProductIds`. Add `updateGalleryItemTags(id, taggedProductIds)` admin method. Add `deleteGalleryItem(id)` admin method.
2. **Frontend hooks**: Update `useAddGalleryItem` to pass `taggedProductIds`. Add `useUpdateGalleryItemTags` and wire `useDeleteGalleryItem` to the real backend method.
3. **GalleryUploadForm**: Add a product multi-select (search + checkbox list) that fetches existing products and lets admin pick which to tag. Pass selected IDs on submit.
4. **GalleryGrid**: After each gallery item's content, if `taggedProductIds` has entries, render a "Shop This Product" row showing each tagged product's name (and image if available) with a "Shop" button (`/products/:id`).
5. **AdminGalleryManagementPage**: Show existing gallery items with an "Edit Tags" action that opens a tag-editing UI, calling `updateGalleryItemTags`.
6. Validate and build.
