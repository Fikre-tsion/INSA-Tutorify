# Bolt's Performance Journal

## 2025-09-04 - Async Non-Blocking DB I/O with Write Queueing & In-Memory Cache
**Learning:** In Node.js Express file-based databases (`db.json`), synchronous file operations (`readFileSync`/`writeFileSync`) block the event loop, causing high request latency and thread blocking under concurrent traffic. Furthermore, concurrent async writes without queueing lead to file truncation and JSON parse errors.
**Action:** Implement an in-memory database cache (`dbCache`) for sub-millisecond read responses, combined with an asynchronous `fs.promises` write queue (`writeQueue`) using Promise chaining to serialize disk persistence without blocking HTTP request execution or risking file corruption.
