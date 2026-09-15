# Bolt's Journal - Critical Learnings

## 2026-05-13 - In-memory Database Caching & Async I/O for Express
**Learning:** `fs.readFileSync` and `fs.writeFileSync` in Express request handlers block the single-threaded Event Loop, bottlenecking concurrency. Caching DB reads in memory (`dbCache`) and performing non-blocking async `fs.promises` file operations with write serialization eliminates I/O wait during API requests.
**Action:** Always prefer non-blocking async operations and in-memory read caching for JSON file-backed Node.js servers.
