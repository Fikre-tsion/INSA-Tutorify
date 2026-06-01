## 2026-06-01 - Async I/O and Lazy Loading Implementation
**Learning:** Transitioning from synchronous `fs` calls to `fs.promises` significantly improves the server's ability to handle concurrent requests without blocking the event loop. Additionally, adding `loading="lazy"` to below-the-fold images is a low-effort, high-impact optimization for LCP and bandwidth savings in image-heavy pages like the course grid.
**Action:** Always prioritize asynchronous file operations and ensure non-critical media assets are lazy-loaded by default.
