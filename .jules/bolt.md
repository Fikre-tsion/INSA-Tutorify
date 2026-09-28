# Bolt's Journal - Critical Learnings

## 2025-05-20 - Non-blocking Asynchronous DB Operations and Caching in Express
**Learning:** Synchronous file system calls (`fs.readFileSync`, `fs.writeFileSync`) in Node.js/Express route handlers block the main single-threaded event loop, severely degrading throughput and response time under concurrent requests. Replacing these calls with `fs.promises` and an in-memory cache (`dbCache`) eliminates disk I/O bottlenecks for read operations while ensuring non-blocking persistence.
**Action:** Always prefer `fs.promises` with async/await and in-memory read caching over synchronous file I/O functions in Express servers.
