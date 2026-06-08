## 2025-06-08 - [Scroll Performance & XSS Prevention]
**Learning:** Throttling scroll events in vanilla JS is essential for performance on low-end devices to prevent layout thrashing from continuous class toggling. Additionally, replacing innerHTML with a secure DOM creation pattern (createElement/textContent) is critical for security even when the data source is currently trusted.
**Action:** Always implement throttle/debounce for high-frequency events and prefer DOM APIs over innerHTML for dynamic content rendering.
