# Palette Journal - Critical UX Learnings

## 2025-08-30 - Form Controls Accessibility & Keyboard Focus Navigation
**Learning:** Form inputs and interactive toggles without explicit screen reader `<label>` elements or `:focus-visible` styling impede assistive technology users and keyboard-only navigation. Adding `.sr-only` labels associated via `for` attributes preserves layout styling while supporting accessibility. Adding `tabindex="0"`, `role="button"`, and keydown triggers on clickable `<div>` toggles enables smooth keyboard operation.
**Action:** Always include associated accessible labels (`.sr-only` if visually unlabelled) and clear focus indicators (`:focus-visible`) on form elements and custom interactive controls.
