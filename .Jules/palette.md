## 2026-05-12 - Centralized Nav Auth and Form Feedback States
**Learning:** In hybrid static/dynamic navigation bars, assigning a dedicated ID (`#auth-link`) specifically within the `.nav__menu` unordered list ensures smooth client-side auth state toggles without displacing mobile toggle controls or breaking screen-reader tab flow.
**Action:** Always wrap dynamic auth elements in designated container elements with explicit ARIA context and focus styles.
