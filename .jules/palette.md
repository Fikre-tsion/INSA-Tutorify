## 2025-05-22 - Contact Form Micro-UX
**Learning:** Users prefer immediate visual feedback when submitting forms. Changing button text to "Sending..." and disabling it prevents double submissions and manages expectations during network latency.
**Action:** Always implement loading states for asynchronous form submissions in future projects.

## 2025-05-22 - Accessibility for Navigation
**Learning:** Icon-only buttons (like menu toggles) are inaccessible to screen reader users without explicit labels.
**Action:** Ensure all `button` elements that only contain an `i` or `img` tag have an `aria-label` attribute.
