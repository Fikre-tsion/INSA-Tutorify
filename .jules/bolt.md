# Bolt's Performance Journal ⚡

## 2025-05-15 - Initial Performance Audit
**Learning:** Transitioning static content to client-side fetches (CSR) can degrade First Contentful Paint (FCP) if not handled with skeletons or placeholders. Throttling scroll events is essential for UI responsiveness in vanilla JS apps.
**Action:** Use `loading="lazy"` for all non-critical images and implement a robust `throttle` for frequent events. Always use async I/O on the backend to avoid blocking the main thread.
