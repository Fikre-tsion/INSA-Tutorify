## 2025-05-13 - [Accessibility: ARIA Labels for Icon-Only Elements]
**Learning:** Icon-only interactive elements (like the Unicons used for navigation and social links) are invisible to screen readers without explicit descriptive text. In this design system, many critical actions were inaccessible.
**Action:** Always audit for icon-only buttons and generic "Learn More" links, providing context via `aria-label` to ensure a navigable experience for all users.
