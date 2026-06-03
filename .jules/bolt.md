## 2025-06-02 - Async I/O for File Persistence
**Learning:** Using synchronous `fs` methods in a high-concurrency Node.js environment blocks the event loop, leading to increased latency. Transitioning to `fs.promises` improves throughput.
**Action:** Always prefer asynchronous I/O for file-based persistence layers and use a promise-based queue to prevent race conditions during concurrent writes.

## 2025-06-02 - Scrolling Performance Optimization
**Learning:** Scroll events can fire at extremely high frequencies, causing "jank" if DOM updates aren't throttled.
**Action:** Implement a throttle function (e.g., 100ms limit) for scroll listeners to maintain 60FPS while still providing responsive UI updates.

## 2025-06-02 - Image Lazy Loading
**Learning:** Loading all images upfront increases the Largest Contentful Paint (LCP) and consumes unnecessary bandwidth for below-the-fold content.
**Action:** Apply `loading="lazy"` to all non-critical images to prioritize viewport assets.
