## 2025-09-30 - In-Memory Database Caching & Serialized Write Queue
**Learning:** Synchronous file operations (`fs.readFileSync` / `fs.writeFileSync`) in Node.js Express route handlers block the single-threaded event loop, leading to extreme API latency and request queuing bottlenecks under concurrent load.
**Action:** Implement an in-memory cache (`dbCache`) for sub-millisecond read responses and wrap asynchronous file writes (`fs.promises.writeFile`) in a serialized promise chain queue (`writeQueue`) to eliminate loop blocking and prevent JSON corruption.

## 2025-09-30 - Passive Scroll Event Handler & DOM Cache
**Learning:** Querying the DOM via `document.querySelector('nav')` on every scroll event execution (up to 60+ calls per second) causes layout thrashing and unnecessary frame calculation overhead during user scroll.
**Action:** Lazily cache element references outside the event callback and pass `{ passive: true }` to `addEventListener('scroll')` so the browser UI thread can perform smooth scrolling without blocking on JS listener evaluation.
