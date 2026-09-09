# Bolt Performance Journal

## 2026-05-12 - Non-blocking In-Memory Caching & Serialized Queueing for File Datastores
**Learning:** Synchronous JSON file reads (`fs.readFileSync`) block Node.js's single-threaded event loop on every incoming HTTP request, severely limiting throughput and response latency under concurrency. However, naive un-queued asynchronous writes create file corruption race conditions when multiple POST requests execute simultaneously.
**Action:** Utilize an in-memory cache (`dbCache`) for $O(1)$ instantaneous HTTP read operations, paired with a Promise-chained serialized write queue (`writeQueue`) using `fs.promises` to maintain datastore consistency without stalling request processing.
