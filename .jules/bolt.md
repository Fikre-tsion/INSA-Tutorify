## 2025-05-15 - In-memory caching for database reads
**Learning:** Disk I/O was a bottleneck for concurrent requests to the JSON database. By implementing a simple in-memory cache in `server.js`, we reduced read latency significantly.
**Action:** Always implement a read-cache for file-based databases, ensuring the cache is invalidated or updated on every write operation.

## 2025-05-15 - Surgical Asset Replacement
**Learning:** Bulk replacing all broken assets with a large PNG placeholder harms performance (LCP) and visual variety.
**Action:** Use CSS-based placeholders or smaller, specialized assets where possible, and only use large images for content-critical areas like course thumbnails.
