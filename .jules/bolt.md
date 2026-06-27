## 2025-05-14 - [In-memory JSON caching]
**Learning:** For small JSON-based databases, in-memory caching eliminates redundant disk I/O, providing a significant speedup for read-heavy operations like dashboard statistics and course listing.
**Action:** Always implement a simple caching layer for `fs.readFile` when the dataset is small and read frequency is high.

## 2025-05-14 - [Passive Event Listeners]
**Learning:** Using `{ passive: true }` for scroll event listeners allows the browser to perform scrolling immediately without waiting for the listener to finish, improving the frame rate during navigation.
**Action:** Register all non-canceling scroll, touch, and wheel event listeners as passive.
