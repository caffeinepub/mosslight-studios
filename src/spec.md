# Specification

## Summary
**Goal:** Fix admin authentication validation to allow authenticated admin users to successfully create products.

**Planned changes:**
- Remove or bypass the permission check in the backend addProduct method that is incorrectly rejecting authenticated admin users
- Add detailed error logging to the backend addProduct method to capture authentication state, caller principal, and permission validation results
- Update the frontend useProducts hook to log complete error responses and display specific error messages to users instead of generic failure messages

**User-visible outcome:** Admin users authenticated with the correct passcode can successfully add products with all required fields, and see specific error messages if creation fails.
