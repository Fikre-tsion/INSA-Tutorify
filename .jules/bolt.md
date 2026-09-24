# Bolt's Performance Journal

## 2025-05-20 - DOM Query Overhead in Scroll Event Handlers
**Learning:** Re-querying the DOM using `document.querySelector('nav')` on every scroll event frame introduces unnecessary layout/rendering overhead. Lazy-caching the element reference and marking the event listener as `{ passive: true }` prevents main-thread blocking and eliminates DOM lookup per scroll frame.
**Action:** Always lazy-cache DOM references and use `{ passive: true }` on scroll/touch listeners in main UI scripts.
