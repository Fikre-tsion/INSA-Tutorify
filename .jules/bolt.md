## 2026-05-12 - Passive Scroll Listener and DOM Cache

**Learning:** Un-throttled scroll listeners that perform DOM queries on every scroll tick cause layout thrashing and high main-thread activity during scrolling. Lazy-caching the DOM element and setting `{ passive: true }` avoids query overhead and enables smooth compositor-driven scrolling without blocking rendering.
**Action:** Always lazy-cache static DOM queries and pass `{ passive: true }` to high-frequency scroll or touch event listeners.
