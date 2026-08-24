# Bolt's Journal - Critical Learnings

## 2025-05-15 - In-Memory DB Caching and Passive Scroll Event Listener
**Learning:** `server.js` synchronous file access (`readFileSync` / `writeFileSync`) on database endpoints blocks the node event loop under load. Implementing in-memory caching for `readDB` and async `fs.promises` operations reduces IO latency dramatically. On the frontend, scroll listeners without `{ passive: true }` block smooth compositing.
**Action:** Always verify `readDB`/`writeDB` use async/caching patterns in express backend APIs and scroll event listeners use passive flags.
