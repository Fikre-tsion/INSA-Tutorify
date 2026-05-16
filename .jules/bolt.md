## 2025-05-15 - Async File I/O for Performance
**Learning:** In a Node.js/Express environment using a JSON file as a database, synchronous file operations (`fs.readFileSync`, `fs.writeFileSync`) can severely degrade performance by blocking the event loop, especially as the number of concurrent users grows.
**Action:** Always prioritize `fs.promises` or other asynchronous methods for I/O operations to maintain non-blocking behavior.

## 2025-05-15 - Throttling Scroll Events
**Learning:** Frequent events like 'scroll' can fire hundreds of times per second, causing layout thrashing if not handled efficiently.
**Action:** Use a `throttle` function to limit the execution rate of scroll-dependent logic (e.g., toggling a navbar class).

## 2025-05-15 - Lazy Loading Images
**Learning:** Loading all images on a page simultaneously increases initial bandwidth usage and delays LCP.
**Action:** Add `loading="lazy"` to images below the fold to prioritize critical above-the-fold assets.
