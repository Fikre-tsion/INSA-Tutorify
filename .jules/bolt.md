## 2026-06-17 - [In-memory Database Caching]
**Learning:** Reading from disk on every request is a major bottleneck as the database grows. In-memory caching with serialized writes provides a significant speedup for GET requests.
**Action:** Implement a cached variable for the database state and ensure all writes update this cache while maintaining data integrity on disk.
