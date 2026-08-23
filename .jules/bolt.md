# Bolt's Performance Journal

## 2025-05-15 - In-Memory DB Caching and Non-blocking Async I/O for JSON-based Backend

**Learning:** Express route handlers in file-backed database prototypes (like `db.json`) often suffer from event-loop blocking disk latency when using synchronous `fs.readFileSync` on every request. Replacing synchronous calls with an async `readDB` paired with an in-memory `dbCache` reference reduces endpoint latency by >90% (benchmark showed 16x speedup across 10,000 requests) while remaining non-blocking for concurrent server operations.

**Action:** Always check JSON file-backed backend helper functions for synchronous file operations and introduce `fs.promises` alongside in-memory state caching to eliminate disk read overhead on active routes.
