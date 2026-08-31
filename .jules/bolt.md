## 2025-05-18 - Synchronous JSON DB File I/O Bottleneck
**Learning:** Performing `fs.readFileSync` and `fs.writeFileSync` in Express route handlers blocks the single-threaded Node.js event loop on every request, creating severe latency and throughput bottlenecks.
**Action:** Always use an in-memory cache warmed at startup along with non-blocking `fs.promises` file operations and serialized async write queues for simple file-backed JSON databases.
