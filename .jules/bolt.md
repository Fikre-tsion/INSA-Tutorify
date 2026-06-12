## 2026-06-12 - [Secure Dynamic Rendering]
**Learning:** Using `innerHTML` to inject data from the API introduces XSS risks.
**Action:** Use `textContent` and `document.createElement` for dynamic DOM updates.

## 2026-06-12 - [Throttling Scroll Events]
**Learning:** High-frequency scroll events can cause layout thrashing and high CPU usage.
**Action:** Implement a throttle function to limit the execution rate of scroll listeners.

## 2026-06-12 - [Async Backend I/O]
**Learning:** Synchronous file operations in Node.js block the event loop, reducing server throughput.
**Action:** Use `fs.promises` and a write queue to handle database operations asynchronously and safely.
