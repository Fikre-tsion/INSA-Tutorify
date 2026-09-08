## 2025-09-08 - Accessible Forms and Dynamic Auth Feedback in Tutorify
**Learning:** Interactive form toggles and async buttons need explicit ARIA roles, tabindex, keydown handlers, and visual state indicators (e.g. disabled state with loading text) to ensure keyboard users and screen readers receive clear context during authentication transitions.
**Action:** Always include `.sr-only` labels for form controls, `tabindex="0"` on clickable non-button toggles, and async loading feedback on submit buttons.
