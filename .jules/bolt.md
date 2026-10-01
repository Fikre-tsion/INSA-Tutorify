## 2026-05-12 - In-Memory DB Caching and Serialized Async Write Queue
**Learning:** Synchronous disk file operations (`readFileSync`/`writeFileSync`) block the Express event loop under concurrent requests, reducing server throughput and risking corrupt JSON files when multiple requests write to disk at the same time. Using an in-memory cache (`dbCache`) for reads paired with a promise-chained write queue (`writeQueue`) provides sub-millisecond read responses while guaranteeing safe, serialized file updates without event loop blocking.
**Action:** For lightweight JSON file-backed Node.js/Express applications, implement an in-memory cache initialized at startup and serialize all mutations through an asynchronous promise queue.

## 2026-05-12 - DOM Query Overhead Reduction in Scroll Event Listeners
**Learning:** Querying the DOM inside scroll event listeners (such as `document.querySelector('nav')`) causes unnecessary DOM tree traversals on every scroll frame, degrading scroll performance and triggering layout thrashing.
**Action:** Lazy-cache DOM element references on the first scroll event and attach scroll listeners with `{ passive: true }` to ensure butter-smooth 60fps scrolling without DOM lookup overhead per frame.
