## 2025-07-01 - [Async Form Feedback]
**Learning:** Transitioning from full-page redirects (like Formspree default) to async `fetch` with inline loading and success states significantly reduces user friction and perceived latency.
**Action:** Always prefer `fetch` for contact forms and provide immediate visual feedback (e.g., "Sending...") to acknowledge user action.

## 2025-07-01 - [Centralized Auth State]
**Learning:** Managing auth UI (Login/Logout buttons) in a single `main.js` function ensures consistency across all pages and prevents layout bugs when navigation links are updated.
**Action:** Use a DOM-ready listener to trigger UI updates based on `localStorage` tokens.

## 2025-07-01 - [Safe JSON Parsing]
**Learning:** Directly parsing `localStorage` items without null checks can lead to runtime crashes (e.g., `user.role` when `user` is null).
**Action:** Implement defensive checks like `(user && user.role !== 'admin')` when handling client-side session data.
