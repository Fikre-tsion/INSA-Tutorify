## 2025-05-31 - Initial Performance Strategy
**Learning:** The current application uses synchronous file I/O in the backend and lacks optimization on the frontend (no scroll throttling, no lazy loading, static content that could be dynamic). These are low-hanging fruits that can significantly improve perceived and actual performance.
**Action:**
1. Convert backend to asynchronous I/O using `fs.promises` to prevent blocking the event loop.
2. Implement throttling on high-frequency scroll events in the frontend.
3. Use `loading="lazy"` for below-the-fold images to improve FCP/LCP.
4. Move static course data to the backend to reduce initial HTML size and allow for future scalability without increasing payload.
