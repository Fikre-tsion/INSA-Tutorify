## 2025-06-21 - [A11y/UX] Skip-to-content and Centralized Auth
**Learning:** For multi-page applications, centralizing authentication UI logic in a single `main.js` script ensures consistency and reduces code duplication across pages. Additionally, providing a 'Skip to main content' link is a critical accessibility requirement for keyboard-only users to bypass repeated navigation menus.
**Action:** Always implement a centralized `updateAuthUI` function and include `.skip-link` in the site-wide stylesheet and every HTML entry point.
