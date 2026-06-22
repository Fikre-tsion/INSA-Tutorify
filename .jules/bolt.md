## 2025-05-15 - [Disk I/O Optimization]
**Learning:** In a small JSON-based database architecture, repeated synchronous disk reads on every API call create a significant performance bottleneck as the concurrent request count grows.
**Action:** Implement in-memory caching for read operations and asynchronous persistence for writes to keep the event loop responsive and reduce latency from ~10ms to <1ms per read.
