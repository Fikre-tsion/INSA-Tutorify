## 2025-05-15 - Accessibility for icon-only components
**Learning:** In a design system like Tutorify that relies heavily on third-party icon libraries (Unicons, Ionicons) for navigation and social links, accessibility is often overlooked. Screen readers cannot interpret these icons without explicit text or aria-labels.
**Action:** Always verify that every `<button>` and `<a>` tag containing only an `<i>` or `<ion-icon>` has a descriptive `aria-label` attribute.

## 2025-05-15 - Enhancing asynchronous interaction feedback
**Learning:** Replacing browser `alert()` calls with inline status messages significantly improves the UX by maintaining the user's context and visual flow. Providing immediate "Sending..." feedback on buttons manages user expectations during network latency.
**Action:** Use a dedicated status `div` and toggle button `disabled` states with descriptive text during `fetch` operations.
