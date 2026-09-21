## 2025-02-21 - Fullstack Form UX & Dynamic Navbar Sanitization
**Learning:** Directly interpolating user names or dynamic text into DOM elements using `innerHTML` can introduce Stored XSS vulnerabilities or render broken markup if special characters exist. Sanitizing or dynamically creating DOM elements with `textContent` protects against XSS while ensuring clean micro-UX.
**Action:** Always construct dynamic user-facing DOM nodes using `document.createElement` and `textContent` rather than `innerHTML` template strings.
