# Bolt's Journal - Tutorify Performance

## 2026-06-05 - Initial Performance Audit
**Learning:** The current codebase uses synchronous file I/O in the backend and unthrottled scroll events in the frontend. Both are common performance anti-patterns that can lead to event loop blocking and jank.
**Action:** Implement asynchronous database operations using `fs.promises` and a throttle function for high-frequency DOM events.

## 2026-06-05 - Asset Management
**Learning:** Missing CSS and images are causing 404s, which are technically "slow" because they trigger failed requests.
**Action:** Restored CSS from Git history. For images, I will use placeholders if original assets are missing, ensuring they use `loading="lazy"` where appropriate.
