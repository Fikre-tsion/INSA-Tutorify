## 2026-08-27 - Passive Event Listener for Window Scroll

**Learning:** Unthrottled and non-passive scroll event listeners on `window` can block compositor thread rendering and cause layout jank on scrolling, especially on mobile or lower-end devices. Adding `{ passive: true }` allows the browser to perform scrolling immediately without waiting for JavaScript execution.
**Action:** Always mark scroll event listeners as passive (`{ passive: true }`) when `preventDefault()` is not called within the listener.
