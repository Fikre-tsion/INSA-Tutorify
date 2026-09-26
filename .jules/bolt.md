## 2026-09-26 - Async File Read Cache and Write Queue in Express Backend
**Learning:** High-concurrency Express endpoints that read and write JSON files synchronously cause event-loop blocking and disk write race conditions under load.
**Action:** Always wrap file operations in `fs.promises`, maintain an in-memory database cache (`dbCache`), and serialize disk writes using a chained Promise queue (`writeQueue`) in Node.js backends.
