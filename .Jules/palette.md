# Palette's UX & Accessibility Journal

## 2025-02-18 - Inline Form Feedback vs Disruptive Alerts
**Learning:** Browser `alert()` popups disrupt user workflow and are inaccessible to screen readers because they lose focus context and lack live region announcements. Using an inline status element with `aria-live="polite"` provides clear, screen-reader-friendly validation feedback without interrupting interaction flow.
**Action:** Replace all `alert()` calls in authentication and form handlers with dedicated `#authStatus` or `#contactStatus` live region elements.
