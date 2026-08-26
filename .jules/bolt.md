# Bolt's Journal - Critical Learnings

## 2025-05-27 - In-Memory Caching & Non-blocking I/O in Express
**Learning:** Synchronous disk file operations (`fs.readFileSync`, `fs.writeFileSync`) on every HTTP request introduce severe latency and block the Node.js event loop under concurrent load. Implementing an in-memory database cache (`dbCache`) along with asynchronous `fs.promises` operations completely eliminates synchronous I/O blocking during API request handlers.
**Action:** Use in-memory state for fast reads and async disk writes (or background persistence) in micro-backends like `server.js`.
