## 2025-06-02 - Optimized scroll events and backend I/O

**Learning:** Synchronous I/O in Node.js handles small traffic fine but blocks the event loop, causing latency spikes under load. Unthrottled scroll listeners can cause "jank" in the UI thread.

**Action:** Always use `fs.promises` for database operations even in small apps. Throttle heavy DOM events like `scroll` or `resize` to ~50ms to maintain 60fps feel without excessive CPU usage.
