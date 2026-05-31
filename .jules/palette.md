## 2025-05-15 - Micro-UX and Full-stack Integration
**Learning:** Transitioning from browser `alert()` calls to inline status messages significantly improves the perceived quality of the application. Using `aria-label` on icon-only buttons is crucial for screen reader accessibility in this design system, as many UI elements rely on Unicons/Ionicons.
**Action:** Always prefer inline feedback containers with semantic success/error classes over global alert boxes. Continue adding ARIA labels to all interactive icon elements.
