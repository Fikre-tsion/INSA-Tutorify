## 2025-05-15 - In-Memory Caching for JSON Databases
**Learning:** For small applications using a JSON file as a database, disk I/O becomes a significant bottleneck during high-frequency read operations. Implementing a simple in-memory cache that synchronizes with writes can improve read performance by over 1000x (~450ms down to ~0.3ms for 1000 reads).
**Action:** Always implement a caching layer when using file-based persistence for metadata or small datasets that fit in memory.

## 2025-05-15 - Passive Event Listeners for Scroll Performance
**Learning:** Browser main thread can be blocked by scroll listeners that don't declare themselves as passive, as the browser waits to see if the listener will call `preventDefault()`.
**Action:** Use `{ passive: true }` for scroll and touch listeners where `preventDefault()` is not required to ensure smooth UI performance.
