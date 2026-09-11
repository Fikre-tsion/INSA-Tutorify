# Bolt's Journal - Critical Learnings

## 2026-05-21 - Asynchronous File I/O with In-Memory Caching and Write Queueing

**Learning:**
In file-backed Node.js Express architectures, synchronous `readFileSync` and `writeFileSync` calls block the Node.js event loop, degrading concurrent throughput significantly under load. By implementing an in-memory cache (`dbCache`) initialized on server start, read operations achieve sub-millisecond response latency without disk access. Synchronizing persistent writes through a serialized `Promise` write queue (`writeQueue`) guarantees concurrent write requests execute sequentially, preventing file corruption or race conditions.

**Action:**
Always combine in-memory caching for reads with a serialized async write queue for file-based JSON persistence in light Node.js backend services.

## 2026-05-21 - Scroll Event Throttling with Passive Listeners

**Learning:**
Attaching unthrottled scroll event listeners to window causes layout thrashing and high CPU usage per frame as DOM queries (like `document.querySelector('nav')`) execute on every pixel scroll. Using a 100ms throttle alongside `{ passive: true }` and lazy-caching the `nav` element reference eliminates main-thread jank and keeps scrolling smooth at 60fps.

**Action:**
Use `{ passive: true }` and 100ms throttling for all scroll-driven UI toggles while caching DOM element references.
