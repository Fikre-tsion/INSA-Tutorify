# Palette's Journal - Critical Learnings

## 2025-02-23 - Inline ARIA Live Notifications vs Blocking Browser Alerts
**Learning:** Browser `alert()` dialogs disrupt key focus flows and are invisible to non-screen-reader keyboard users in embedded views. Using an inline element with `aria-live="polite"` provides immediate, non-disruptive feedback while ensuring screen reader compatibility.
**Action:** Replace `alert()` popups with inline notification elements using `aria-live="polite"` across form authentication interfaces.

## 2025-02-23 - Interactive Form Toggles Accessibility
**Learning:** Custom clickable elements like `.toggle` DIVs used to switch between form modes (Login/Register) are unreachable by default keyboard navigation.
**Action:** Always complement `onclick` with `role="button"`, `tabindex="0"`, focus styles (`:focus-visible`), and keydown handlers listening for `Enter` and `Space`.
