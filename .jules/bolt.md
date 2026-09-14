## 2026-05-12 - Async DB I/O & Memory Caching for JSON DB
**Learning:** Synchronous file operations (`fs.readFileSync`/`writeFileSync`) block the Node.js event loop on every HTTP request when reading `db.json`. Replacing them with `fs.promises` combined with in-memory caching (`dbCache`) reduces read times by ~66% (from ~13ms to ~4ms over 1000 reads) while avoiding event loop blocking.
**Action:** Always prefer async I/O with in-memory read caching for JSON file-backed databases in Express backend services.
