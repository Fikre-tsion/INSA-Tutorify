## 2026-05-12 - Custom Interactive Form Toggles Accessibility
**Learning:** In simple authentication single-page forms, custom interactive elements (`<div class="toggle">`) often lack standard button semantics. Simply attaching an `onclick` listener leaves keyboard and screen reader users unable to discover or trigger form switching.
**Action:** Always assign `role="button"`, `tabindex="0"`, descriptive `aria-label`, and a keydown handler (`Enter` or `Space` key) when making custom non-button elements interactive.
