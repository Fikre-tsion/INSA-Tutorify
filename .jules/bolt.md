# ⚡ Bolt's Journal - Critical Learnings

## 2025-05-18 - Initialization
**Learning:** Initializing the performance journal for Tutorify. The goal is to prioritize measurable speed gains (e.g., throttle, lazy loading, async I/O).
**Action:** Always follow the 'Measure first, optimize second' philosophy and document critical performance findings here.

## 2025-05-18 - Backend Async I/O
**Learning:** Using synchronous `fs.readFileSync` in an Express handler blocks the entire event loop, preventing the server from handling other requests concurrently.
**Action:** Always use `fs.promises` or asynchronous callbacks for file I/O in Node.js backend services.

## 2025-05-18 - Scroll Event Throttling
**Learning:** Scroll events fire at a high frequency (often 60+ times per second), and executing heavy DOM logic or recalculations on every event can cause "jank" and high CPU usage.
**Action:** Use a throttle or debounce function to limit the execution frequency of scroll-based logic to ~10-100ms.
