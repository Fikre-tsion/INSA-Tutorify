# Bolt's Journal - Critical Performance Learnings ⚡

## 2025-05-15 - Initial Journal Setup
**Learning:** Initializing the performance journal to track critical architectural optimizations.
**Action:** Follow the Bolt philosophy: Measure first, optimize second.

## 2025-05-15 - In-memory Database Caching
**Learning:** For small-scale applications using a JSON file as a database, frequent disk I/O can become a bottleneck as the file grows. Implementing a simple in-memory cache (`dbCache`) drastically reduces read latency and avoids redundant `fs.readFileSync` calls on every request.
**Action:** Always implement a read-through/write-behind or synchronous write cache for file-based persistence layers to maintain high throughput.

## 2025-05-15 - Passive Event Listeners for Scrolling
**Learning:** Browser performance during scrolling can be significantly improved by using `{ passive: true }` in scroll event listeners. This tells the browser that the listener will not call `preventDefault()`, allowing the browser to scroll the page immediately without waiting for the JS execution.
**Action:** Use passive listeners for non-blocking UI interactions like scroll and touch events to maintain 60 FPS.
