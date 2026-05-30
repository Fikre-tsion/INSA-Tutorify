## 2025-05-15 - Improving Feedback States in Tutorify

**Learning:** Replacing browser `alert()` with inline status messages significantly improves the flow of the application and keeps users in the context of their task. Visual feedback like disabling buttons during async operations prevents duplicate submissions and manages user expectations.

**Action:** Always prefer inline status containers (e.g., `#formStatus`) over `alert()` for better UX and accessibility. Ensure all interactive elements have appropriate `aria-label` attributes when their purpose isn't immediately clear to screen readers.
