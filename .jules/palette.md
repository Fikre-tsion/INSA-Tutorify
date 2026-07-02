# Palette's Journal - Tutorify UX & Accessibility

## 2025-05-15 - Improving Form Accessibility and Feedback
**Learning:** Placeholders are not a substitute for labels. Screen readers need explicit labels or aria-labels to provide context. Additionally, async operations without visual feedback (loading states) create uncertainty for users.
**Action:** Always provide `<label>` elements (using `.sr-only` if visual design excludes them) and implement `disabled` states with "Loading..." text during fetch calls.

## 2025-05-15 - Centralized Auth UI Pattern
**Learning:** Managing authentication state across multiple static HTML pages is error-prone. A centralized `updateAuthUI` function in a shared `main.js` ensures consistency and reduces code duplication.
**Action:** Use a consistent `id="auth-link"` across all pages to target the authentication toggle.
