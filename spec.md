# Specification

## Summary
**Goal:** Auto-register the first Internet Identity user who logs in as the admin principal, eliminating the need for manual admin setup.

**Planned changes:**
- Update the backend so that if no admin principal is stored, the first authenticated caller's principal is automatically saved as admin; subsequent logins do not overwrite it.
- Update the frontend admin authentication flow so that on first login, instead of showing a "Permission Denied" error, the app automatically registers that user as admin and grants admin access seamlessly.
- Ensure that if an admin is already registered and a different principal logs in, the permission denied message is still shown appropriately.

**User-visible outcome:** The first user to log in via Internet Identity is automatically granted admin access without any manual registration step or permission denied errors. Subsequent users who are not the registered admin still see the appropriate permission denied message.
