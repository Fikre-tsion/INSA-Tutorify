## 2026-05-12 - Keyboard Accessibility for FAQ
**Learning:** FAQ sections often rely solely on click events, making them inaccessible to keyboard users. Adding `tabindex="0"` and listening for `Enter` or `Space` keys is a simple but high-impact accessibility win.
**Action:** Always check interactive custom elements for keyboard focus and event triggers.

## 2026-05-12 - Meaningful Button State
**Learning:** Users often click submit buttons multiple times if there's no immediate visual feedback during async operations.
**Action:** Implement "Sending..." or disabled states for buttons during API calls to prevent duplicate submissions and provide clarity.

## 2026-05-12 - ARIA for Icon Buttons
**Learning:** Modern UI often uses icon-only buttons (like hamburger menus or close buttons) which are invisible to screen readers without ARIA labels.
**Action:** Add `aria-label` to all icon-only interactive elements.
