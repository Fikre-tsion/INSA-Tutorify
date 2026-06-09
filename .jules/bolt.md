## 2026-06-09 - [Fullstack Transformation & Optimization]
**Learning:** Transitioning a static application to full-stack requires balancing architectural changes with security and performance. Using `createElement` and `textContent` is essential to prevent XSS when rendering dynamic data. Throttling frequent events like scroll significantly reduces main thread load.
**Action:** Always prefer secure DOM APIs over `innerHTML`. Ensure sensitive backend configurations like JWT secrets are strictly enforced via environment variables.
