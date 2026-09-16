# Palette's Journal - UX & Accessibility Learnings

## 2026-05-12 - Centralized Auth Link and Accessibility Guards
**Learning:** In a multi-page vanilla HTML/JS application, auth navigation state requires a single well-defined DOM target (`#auth-link`) across all navigation headers to ensure `main.js` can cleanly update user session display without DOM query race conditions or silent failures. Furthermore, interactive toggles (like form mode switches) must explicitly implement `tabindex="0"`, `role="button"`, and keydown event handlers (`Enter`/`Space`) to support keyboard navigation.
**Action:** Always verify that navigation items share consistent IDs across template pages and attach keyboard handlers (`Enter`/`Space`) alongside click handlers for interactive non-button elements.
