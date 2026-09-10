## 2026-03-10 - Lazy DOM Caching & Passive Scroll Event Listeners

**Learning:** Un-cached DOM queries like `document.querySelector('nav')` inside un-throttled scroll listeners trigger repeated selector lookups on every single scroll frame (60-120Hz). Adding `{ passive: true }` informs the browser's compositor thread that `preventDefault()` will not be called, preventing main thread scroll latency and jank.

**Action:** Always lazy-cache DOM element references in high-frequency event handlers (e.g., scroll, resize, mousemove) and pass `{ passive: true }` to non-blocking scroll/touch event listeners.
