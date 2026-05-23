## 2025-05-14 - Initial Performance Observation
**Learning:** The backend in `server.js` currently uses `fs.readFileSync` and `fs.writeFileSync`, which are synchronous and block the event loop. In a tutoring platform where multiple users might be registering or logging in, this can lead to increased latency and reduced throughput.
**Action:** Transition all database I/O to asynchronous operations using `fs.promises` to improve concurrency and responsiveness.

## 2025-05-14 - Asynchronous I/O Performance Impact
**Learning:** While synchronous file operations might appear faster in a single-threaded benchmark for very small files, they block the event loop entirely, preventing Node.js from handling other incoming requests. Asynchronous I/O allows the event loop to remain responsive, which is critical for a web server handling concurrent users.
**Action:** Always prioritize `fs.promises` over synchronous counterparts in backend development to ensure scalability and responsiveness under load.
