## 2025-06-06 - [In-memory Database Cache]
**Learning:** For small JSON-based databases, an in-memory cache significantly improves read performance and reduces redundant disk I/O. Using a write queue ensures data consistency and prevents file corruption during concurrent write operations.
**Action:** Always implement a simple caching layer and a serialized write mechanism when using flat-file storage for state.
