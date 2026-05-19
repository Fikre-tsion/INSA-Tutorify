# Bolt's Performance Journal

## 2025-05-15 - Initial Performance Audit
**Learning:** Found that the frontend scroll event is not throttled, leading to excessive function calls during scroll. The backend uses synchronous file I/O which blocks the event loop. Images are missing lazy loading.
**Action:** Implement throttle for scroll, switch to `fs.promises` in `server.js`, and add `loading="lazy"` to images.
