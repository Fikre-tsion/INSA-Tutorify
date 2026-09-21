# Bolt's Journal - Critical Learnings

## 2025-09-21 - Scroll Listener DOM Querying & Passive Listener Optimization
**Learning:** Re-querying `document.querySelector('nav')` inside a `scroll` event listener forces continuous DOM tree traversal on every scroll frame (60-120 fps). Lazy-caching the DOM element on the first event fires and passing `{ passive: true }` prevents blocking the main browser compositor thread during scrolling.
**Action:** Always lazy-cache DOM elements inside high-frequency event handlers (scroll, resize, mousemove) and add `{ passive: true }` option when `preventDefault()` is not required.
