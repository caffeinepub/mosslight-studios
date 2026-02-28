# Specification

## Summary
**Goal:** Add Portfolio, Gallery, Blog, and Admin Panel sections to the Mosslight Studios site, along with public commenting on Gallery items and Blog posts.

**Planned changes:**
- Add a `/portfolio` page displaying finished artwork in a responsive grid with title, image, description, and category/medium tag
- Add a `/gallery` page displaying photos and behind-the-scenes content in a responsive grid, with a public comments section (name + comment text, no login required) on each item
- Add a `/blog` page listing published blog posts as cards, and individual `/blog/:id` pages showing full post content with a public comments section (name + comment text, no login required)
- Extend the backend with data types and CRUD functions for PortfolioItem, GalleryItem, BlogPost, and PublicComment; admin write operations are authenticated, comment submission is public
- Add an Admin Panel with protected pages at `/admin/portfolio`, `/admin/gallery`, and `/admin/blog` for creating, editing, and deleting content including image blob uploads
- Add Portfolio and Blog navigation links to the site Header alongside the existing Gallery link

**User-visible outcome:** Visitors can browse portfolio artwork, explore the gallery and leave comments, read blog posts and comment on them. The admin can log in to manage all portfolio, gallery, and blog content through a protected admin panel.
