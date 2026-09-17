## 2026-09-17 - Asynchronous Non-Blocking I/O and In-Memory Caching for File-Based DB
**Learning:** Synchronous file I/O operations (`readFileSync`, `writeFileSync`) in Express route handlers block the Node.js event loop during concurrent requests, leading to increased response latency and poor request throughput. Utilizing `fs.promises` combined with an in-memory database cache (`dbCache`) and a serialized write queue (`writeQueue`) allows instant read hits while preventing file corruption and race conditions during concurrent write operations.
**Action:** Always wrap file system storage operations in asynchronous queues with in-memory caching to keep the event loop non-blocking.

## 2026-09-17 - Passive DOM Query Caching in Scroll Handlers
**Learning:** Executing `document.querySelector` queries on every window scroll event triggers repeated layout calculations and DOM query overhead. Lazy-caching the target DOM element on first scroll combined with `{ passive: true }` listener options prevents scroll thread blocking and eliminates DOM query overhead per frame.
**Action:** Use lazy element caching and passive event listener options for all high-frequency UI handlers (scroll, resize, mousemove).
