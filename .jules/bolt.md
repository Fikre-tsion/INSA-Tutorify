# Bolt's Journal - Critical Learnings

## 2026-03-31 - Async I/O & In-Memory Caching for File DB
**Learning:** In lightweight Express applications using a local JSON file (`db.json`) as a storage layer, synchronous `fs.readFileSync` on every incoming API request blocks the single-threaded Event Loop, causing high response latency under concurrent traffic.
**Action:** Use an in-memory cache object (`dbCache`) for instant read access and non-blocking `fs.promises` for asynchronous disk writes.
