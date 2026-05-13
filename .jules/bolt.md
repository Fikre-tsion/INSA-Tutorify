## 2025-05-22 - [Optimizing I/O and Event Listeners]
**Learning:** Synchronous file operations in Node.js block the entire event loop, severely limiting the server's ability to handle concurrent requests. Similarly, high-frequency frontend events like 'scroll' can cause performance degradation if not throttled, as they trigger excessive DOM updates.
**Action:** Always prefer `fs.promises` for file I/O and implement throttling/debouncing for expensive or high-frequency event listeners.
