## 2025-02-24 - Async I/O for Database Access
**Learning:** Using synchronous `fs.readFileSync` in an Express backend blocks the Node.js event loop, preventing other requests from being processed and severely degrading performance under load.
**Action:** Always use `fs.promises` (or `fs/promises`) with `async/await` for all file system operations in the backend to ensure non-blocking I/O.

## 2025-02-24 - Throttling Scroll Events
**Learning:** Scroll events can fire at a very high frequency (dozens of times per second). Updating the DOM or calculating styles on every scroll event causes layout thrashing and jitters.
**Action:** Implement a throttle function to limit the execution rate of scroll-dependent logic (e.g., once every 100ms) to maintain 60fps responsiveness.

## 2025-02-24 - Lazy Loading Images
**Learning:** Loading all images on initial page load increases the total payload and blocks critical rendering paths, especially for images below the fold.
**Action:** Use `loading="lazy"` on all non-critical images to defer their loading until they are about to enter the viewport.
