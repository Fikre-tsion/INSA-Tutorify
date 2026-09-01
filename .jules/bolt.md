## 2026-03-01 - Asynchronous File I/O & Caching in Express DB
**Learning:** Synchronous file operations (`readFileSync`/`writeFileSync`) block Node's single-threaded event loop, creating latency spikes under concurrent request loads.
**Action:** Always prefer `fs.promises` with in-memory caching and queued async writes for file-backed storage in API routes.
