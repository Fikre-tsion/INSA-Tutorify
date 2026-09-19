## 2025-05-14 - Initial Performance Review
**Learning:** The application uses synchronous file system operations (fs.readFileSync/writeFileSync) in the backend which blocks the event loop, and the frontend scroll listener is not throttled, potentially causing junk during scroll.
**Action:** Replace sync I/O with async I/O in the backend and implement throttling for the scroll event in the frontend.

## 2026-05-30 - In-Memory DB Caching and Asynchronous Write Queueing
**Learning:** In standard Express applications backed by JSON files (`db.json`), synchronous `fs.readFileSync` and `fs.writeFileSync` calls per HTTP request block the Node.js event loop completely, degrading throughput under concurrent requests. Reading from disk on every API call introduces severe I/O latency.
**Action:** Implement an in-memory cache (`dbCache`) for instant reads and a Promise-chained write queue (`writeQueue`) using `fs.promises.writeFile` for serialized, non-blocking asynchronous persistence.
