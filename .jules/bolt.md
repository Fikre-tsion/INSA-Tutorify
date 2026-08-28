## 2026-05-12 - In-Memory DB Caching and Non-blocking Async I/O for File DBs

**Learning:** Synchronous file operations (`readFileSync` / `writeFileSync`) in Express route handlers block the Node.js event loop, creating heavy latency under concurrent requests. Adding a short TTL in-memory cache (1 second) alongside `fs.promises` reduces redundant file reads from disk and improves performance by ~75% (from ~15ms to ~3.8ms for 1k calls).

**Action:** For Node.js file-backed persistence layers, always use async `fs.promises` combined with in-memory caching for read operations, invalidating or updating the cache on writes.
