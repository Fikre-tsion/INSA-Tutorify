## 2026-05-12 - Screen Reader Styles and Fullstack Route Guarding
**Learning:** Adding screen reader accessible labels (`.sr-only`) requires ensuring `.sr-only` utility rules exist in local page styles if global CSS does not include them, preventing flex/grid layout shifts.
**Action:** Always include inline `.sr-only` class definitions or verify CSS imports when introducing accessible label elements in legacy static HTML pages.
