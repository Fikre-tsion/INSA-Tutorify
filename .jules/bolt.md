## 2025-09-03 - Event Loop Non-Blocking I/O & In-Memory Database Caching

**Learning:** Synchronous JSON file reads (`fs.readFileSync`) on every incoming HTTP endpoint in Express block the single-threaded Node.js event loop completely during disk I/O, creating server response latency bottlenecks under concurrent traffic. By serving read operations directly from an in-memory database cache (`dbCache`) and queueing asynchronous disk writes (`fs.promises.writeFile`) with serialized promise chaining (`writeQueue`), endpoint latency is reduced to O(1) memory lookup speeds while avoiding file corruption.

**Action:** Always maintain an in-memory cache for file-backed JSON data stores in Express backends, and serialize asynchronous disk persistence using a write queue promise chain.
