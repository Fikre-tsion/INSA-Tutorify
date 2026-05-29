## 2025-05-29 - CSS Specificity in Status Messages
**Learning:** When using an ID selector for a container that is hidden by default (`#formStatus { display: none; }`), applying a simple class to show it (e.g., `.status-error { display: block; }`) will fail because the ID selector has higher specificity than the class selector.
**Action:** Use combined selectors (e.g., `#formStatus.status-error`) to ensure that state-specific visibility and styling correctly override the base element's styles.
