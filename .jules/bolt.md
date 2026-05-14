## 2025-05-14 - Backend Async & Frontend Throttling
**Learning:** Synchronous file I/O in Node.js blocks the event loop, severely degrading performance under load. Refactoring to `fs.promises` is a high-impact optimization. On the frontend, frequent events like `scroll` can cause excessive re-renders/layout recalculations; throttling these events preserves main thread availability.
**Action:** Always prefer `fs.promises` for disk I/O in backend scripts. Use `throttle` or `debounce` for continuous frontend events.

## 2025-05-14 - LCP vs. Lazy Loading
**Learning:** Applying `loading="lazy"` to all images indiscriminately can harm Largest Contentful Paint (LCP) if critical above-the-fold assets are delayed.
**Action:** Exclude the first few images or the largest above-the-fold image from lazy loading.
