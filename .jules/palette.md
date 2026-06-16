## 2025-06-16 - [Keyboard Accessibility for FAQ]
**Learning:** FAQ sections often rely on click events which are not accessible to keyboard-only users. Adding `tabindex="0"`, `role="button"`, and explicit `keydown` listeners for 'Enter' and 'Space' is essential for WCAG compliance.
**Action:** Always include keyboard event listeners when implementing custom interactive components.

## 2025-06-16 - [Full-Stack Micro-UX]
**Learning:** Transitioning to a dynamic backend can introduce "flash of unstyled content" (FOUC) or layout shifts if not handled carefully. Using loading indicators or preserving static content until the API responds improves perceived performance.
**Action:** Implement skeleton screens or loading states for all dynamic data fetches.
