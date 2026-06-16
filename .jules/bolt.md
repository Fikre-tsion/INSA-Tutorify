## 2025-05-15 - Security-First Backend Caching
**Learning:** While in-memory caching for `db.json` significantly reduces disk I/O latency, it must be combined with strict static file whitelisting. Using `express.static(__dirname)` is a major performance shortcut that leads to critical security vulnerabilities (exposing database and source files).
**Action:** Always use specific route handlers for root-level HTML/JS files and reserved directories (`CSS/`, `images/`) to maintain the "security through exclusion" principle.

## 2025-05-15 - Safe Dynamic UI Rendering
**Learning:** Using `innerHTML` for dynamic content rendering from APIs is a performance-neutral but high-risk pattern for XSS. `textContent` and `createElement` provide a safer alternative with negligible performance overhead.
**Action:** Standardize on `createElement` and `textContent` for all data-driven UI components to ensure security without sacrificing speed.
