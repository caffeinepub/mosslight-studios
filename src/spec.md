# Specification

## Summary
**Goal:** Add a discussion board feature where customers can ask questions and admins can respond.

**Planned changes:**
- Create backend data model for discussion posts and replies with author, timestamp, and status tracking
- Implement backend methods for creating posts, adding replies, and querying discussions
- Add a public-facing forum page accessible from main navigation
- Build post list component showing questions with status badges and reply counts
- Create form for authenticated customers to submit new questions
- Build thread detail view displaying full questions and all replies
- Add admin-only reply form with visual distinction for admin responses
- Create React Query hooks for all discussion board operations
- Apply Mosslight Studios brand styling (dark emerald green and cool light nude palette) to all components

**User-visible outcome:** Customers can visit a new Discussion Board section to view existing questions and replies, post their own questions when authenticated, and see admin responses. Admins can respond to customer questions directly in the thread view.
