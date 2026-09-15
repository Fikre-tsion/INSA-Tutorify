# Palette's Critical Learnings Journal

## 2026-09-15 - Fullstack Web Application Backend Integration
**Learning:** Fullstack web applications with static HTML frontends and Express backends require safe null-guards when parsing client storage (`localStorage`) and dynamic `replaceChildren` / text rendering to prevent XSS and runtime crashes.
**Action:** Always include null-guards when checking client-side auth tokens/user objects and safely manipulate DOM text elements dynamically.
