## 2026-05-30 - Backend Asynchronous I/O Optimization
**Learning:** Transitioning from synchronous `fs` methods to `fs.promises` significantly improves server responsiveness under load by not blocking the event loop.
**Action:** Always prefer asynchronous file operations for database-like JSON storage in Node.js backends.

## 2026-05-30 - Scroll Event Throttling
**Learning:** High-frequency events like `scroll` can cause layout thrashing and high CPU usage if not throttled.
**Action:** Use a throttle function for any scroll-based UI updates to ensure a smooth 60fps experience.
