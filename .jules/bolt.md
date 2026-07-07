## 2025-05-15 - [Backend Performance: Caching & Async I/O]
**Learning:** Transitioning from synchronous `fs` operations to asynchronous `fs.promises` with a simple in-memory cache significantly reduces event loop blocking and disk I/O latency in small Node.js applications. This is especially effective when the database is a single JSON file.
**Action:** Always prefer `fs.promises` and implement a simple read-through cache for static or semi-static data read from the filesystem.

## 2025-05-15 - [Passive Event Listeners]
**Learning:** Using `{ passive: true }` for scroll event listeners allows the browser to perform scrolling immediately without waiting for the listener to finish, which prevents jank and improves Lighthouse performance scores.
**Action:** Use passive listeners for non-blocking UI interactions like scroll or touch events.
