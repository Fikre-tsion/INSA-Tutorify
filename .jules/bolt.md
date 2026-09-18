## 2026-09-18 - Passive Scroll Listener and DOM Query Caching
**Learning:** Frequent window scroll listeners without `{ passive: true }` and lazy DOM element caching trigger repeated `document.querySelector` DOM queries on every scroll frame (60-120fps), causing unnecessary main thread overhead and potential jank during scrolling.
**Action:** Always lazy-cache DOM references outside or on first invocation of event handlers and add `{ passive: true }` to scroll/touch listeners.
