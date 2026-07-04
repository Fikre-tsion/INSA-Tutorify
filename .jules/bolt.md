## 2025-07-04 - Backend Synchronous I/O Anti-pattern
**Learning:** Using synchronous file operations (`fs.readFileSync`) in a Node.js Express server is a major performance bottleneck as it blocks the event loop, preventing concurrent request handling. Even with an in-memory cache, the initial read or any write operations will stall the entire process.
**Action:** Always use asynchronous file operations (`fs.promises` or similar) for database interactions in the backend to ensure the event loop remains non-blocking.
