## 2025-06-18 - Backend Cache Implementation
**Learning:** File-based databases like `db.json` can become a significant bottleneck as the application scales due to repeated disk I/O for every request.
**Action:** Implement in-memory caching in `server.js` to serve GET requests instantly after the first load, and ensure the cache is invalidated/updated only on write operations.

## 2025-06-18 - Secure Static Serving
**Learning:** Using `express.static(__dirname)` is a critical security risk as it exposes sensitive files like `db.json` and `server.js`.
**Action:** Always whitelist specific directories (CSS, images) and serve HTML files explicitly or via a controlled router.
