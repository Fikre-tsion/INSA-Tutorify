# Bolt's Performance Journal

## 2025-05-20 - Throttled Scroll Events
**Learning:** High-frequency events like 'scroll' can trigger excessive layout recalculations and main thread congestion, leading to UI "jank". Throttling the scroll listener ensures it only fires at a fixed interval (e.g., 100ms), which is sufficient for UI updates like navbar styling while significantly reducing CPU overhead.
**Action:** Always throttle or debounce frequent event listeners (scroll, resize, mousemove) in vanilla JS applications.

## 2025-05-20 - Async I/O for Database Operations
**Learning:** Using synchronous `fs` methods (like `readFileSync`) in a Node.js server blocks the entire event loop, preventing the server from handling other requests during the I/O operation.
**Action:** Use `fs.promises` or asynchronous callback-based methods for all file system operations in the backend to maintain high concurrency.

## 2025-05-20 - Image Lazy Loading
**Learning:** Loading all images on the page simultaneously increases initial payload size and delays the `load` event, especially on content-heavy pages like course listings.
**Action:** Apply `loading="lazy"` to images below the fold to prioritize critical assets and save bandwidth.
