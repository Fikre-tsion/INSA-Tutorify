## 2026-09-29 - Inline Form Feedback & Accessible Toggle Navigation
**Learning:** Replacing disruptive `alert()` modals with live region containers (`<div id="authStatus" aria-live="polite">`) and providing visual focus indicators (`:focus-visible`) on form controls and interactive toggles significantly improves screen-reader compatibility and keyboard navigation context in dark-themed interfaces.
**Action:** Always include ARIA live regions and keyboard event handlers (`keydown` for Enter/Space) when converting standard text elements into interactive form toggles.
