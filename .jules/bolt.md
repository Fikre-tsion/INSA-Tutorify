## 2026-05-12 - Non-blocking Async File I/O and In-Memory Caching in Express

**Learning:** Synchronous file system calls (`fs.readFileSync` and `fs.writeFileSync`) in Node/Express request handlers block the single-threaded Event Loop, causing high latency under concurrent traffic. Adding an in-memory cache (`dbCache`) for reads and serializing disk writes via an asynchronous Promise queue (`writeQueue`) eliminates disk read bottlenecks while ensuring thread-safe persistence.

**Action:** Always wrap JSON database access in async/await functions with in-memory caching and queued async writes in lightweight Node file-backed architectures.
