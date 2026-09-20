# Bolt's Performance Journal

## 2026-05-12 - In-Memory Caching & Serialized Async Write Queue for File-Based DB
**Learning:** In Node.js Express backends that use JSON file persistence (`db.json`), synchronous file I/O (`fs.readFileSync`/`fs.writeFileSync`) on every request blocks the single-threaded event loop, adding 10-20ms latency per request and bottlenecking throughput under concurrent traffic.

**Action:** Maintain an in-memory cache (`dbCache`) populated on server startup for instant sub-millisecond reads. Queue all disk persistence operations via `fs.promises` in a serialized async Promise chain (`writeQueue`) to ensure atomic writes without blocking incoming request handling.

## 2026-05-12 - Passive Scroll Listener & DOM Query Caching
**Learning:** Querying the DOM (`document.querySelector('nav')`) inside a `scroll` event listener forces DOM traversal on every scroll frame (up to 120 times/sec), causing visual layout thrashing.

**Action:** Cache the DOM element reference lazily outside the event callback, and attach the listener using `{ passive: true }` to allow the browser thread to scroll smoothly without waiting for event execution.
