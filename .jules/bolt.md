## 2025-06-29 - [In-memory JSON Caching]
**Learning:** Implementing in-memory caching for a JSON-based database significantly reduces latency by eliminating redundant disk I/O. For this small-scale app, read operations dropped from ~450ms to <1ms.
**Action:** Always implement a simple caching layer for file-based data storage to prevent event loop blocking on the backend.
