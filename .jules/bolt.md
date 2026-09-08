# Bolt's Performance Journal - Tutorify

## Codebase Performance Patterns

- **Scroll Event Listeners (`main.js`)**: Caching DOM queries like `document.querySelector('nav')` outside high-frequency event handlers (`scroll`) and attaching `{ passive: true }` prevents unnecessary main thread layout thrashing and DOM querying per frame.
