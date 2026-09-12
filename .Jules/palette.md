## 2026-05-12 - Interactive Toggle Elements in Modal/Form Headers
**Learning:** Custom toggle elements (like `<div>` switches between Login and Register) lack native keyboard focusability and key event handling unless explicitly given `role="button"`, `tabindex="0"`, and keydown event handlers for `Enter` and `Space`.
**Action:** When building interactive toggle text/elements without `<button>` or `<a>` tags, always include `role="button"`, `tabindex="0"`, and a keydown listener that prevents default page scroll on Space/Enter.
