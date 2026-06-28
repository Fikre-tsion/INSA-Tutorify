## 2025-05-15 - In-memory Caching for JSON Database
**Learning:** In a small application using a JSON file as a database, disk I/O becomes the primary bottleneck as traffic grows. Implementing a simple in-memory cache for `db.json` eliminated redundant `fs.readFile` calls, reducing read operations from ~450ms (disk latency) to ~0.3ms (RAM access) in benchmarks.
**Action:** Always implement a caching layer for static or slow-changing data sources, and ensure the cache is invalidated or updated on every write.
