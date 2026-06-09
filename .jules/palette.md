## 2026-06-09 - Secure Dynamic Rendering for Authentication State
**Learning:** Using `innerHTML` to display server-provided user data (like names) creates a Stored XSS vulnerability. Even if the data currently seems "safe", future users or malicious actors could exploit this.
**Action:** Always use `textContent` or `document.createElement` when rendering user-controllable data into the DOM.

## 2026-06-09 - Accessible Keyboard Navigation for Non-Button Toggles
**Learning:** Interactive elements like FAQ articles that aren't natively focusable (like `<article>`) require `tabindex="0"` and explicit `keydown` listeners for 'Enter' and 'Space' to be accessible to keyboard users.
**Action:** Ensure all custom interactive elements are in the tab order and handle keyboard activation.
