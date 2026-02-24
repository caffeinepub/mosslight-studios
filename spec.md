# Specification

## Summary
**Goal:** Add a SKU input field to the Add Product form in the AdminProductsPage.

**Planned changes:**
- Add a labeled "SKU" text input field to the ProductForm component
- Make the SKU field required with validation (shows error if left empty on submission)
- Accept alphanumeric input for the SKU field
- Include the SKU value in the product data submitted when the form is saved
- Pre-populate the SKU field when editing an existing product that has a SKU value

**User-visible outcome:** Admins can enter and save a SKU when adding or editing a product, with validation ensuring the field is not left empty.
