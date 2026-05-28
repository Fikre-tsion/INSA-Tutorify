## 2025-05-28 - Async I/O & Event Throttling
**Learning:** In simple Node.js backends using JSON files as databases, synchronous I/O (`readFileSync`) blocks the event loop, which can cause significant latency as the database grows. Similarly, unthrottled scroll listeners can degrade frontend FPS by triggering frequent DOM lookups and style updates.
**Action:** Always use `fs.promises` for file-based DBs and implement a throttle/debounce utility for high-frequency frontend events.
