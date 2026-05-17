# Bolt's Performance Journal

## 2025-05-15 - Async I/O for Database
**Learning:** Synchronous file operations in Express block the event loop, leading to poor performance under load. Using `fs.promises` ensures the server can handle more concurrent requests.
**Action:** Always prefer asynchronous file I/O in Node.js backends.

## 2025-05-15 - Frontend Event Throttling
**Learning:** Scroll events fire at a high frequency. Unthrottled listeners can cause layout thrashing and "jank" during scrolling.
**Action:** Use a throttle function for scroll-heavy interactions.
