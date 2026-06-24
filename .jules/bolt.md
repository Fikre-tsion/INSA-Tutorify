## 2025-06-24 - [Backend Optimization and Security]
**Learning:** Exposing the root directory with `express.static(__dirname)` is a major security risk as it leaks source code and data files (like `db.json`). In-memory caching significantly improves read performance for small JSON databases.
**Action:** Always use specific subdirectories for static serving (e.g., `CSS`, `images`) and explicitly route HTML files or use a dedicated `public` folder.
